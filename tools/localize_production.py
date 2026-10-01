"""Generate language-specific HTML from the same copy used by the interactive site."""
from __future__ import annotations

from dataclasses import dataclass, field
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path
import posixpath
import subprocess
from urllib.parse import urljoin, urlsplit, urlunsplit

ORIGIN = 'https://oakbase.ai'
ROUTES = ('/', '/legal/', '/terms/', '/privacy/', '/security/', '/security/reporting/', '/subprocessors/')
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
LEGAL_DESCRIPTIONS = {
    '/legal/': 'Legal notice identifying Oakbase SL and the conditions for using its website.',
    '/terms/': 'Terms of service for Oakbase’s B2B context engine and Operations Agents.',
    '/privacy/': 'How Oakbase handles personal data, persistent firm memory and connected services.',
    '/security/': 'Oakbase security measures, encryption, EU residency and access controls.',
    '/security/reporting/': 'How to report a security vulnerability to Oakbase responsibly.',
    '/subprocessors/': 'Service providers and subprocessors used by Oakbase.',
}


@dataclass
class Element:
    tag: str
    attrs: dict = field(default_factory=dict)
    children: list = field(default_factory=list)

    def walk(self):
        yield self
        for child in self.children:
            if isinstance(child, Element):
                yield from child.walk()

    def html(self):
        attrs = ''.join(f' {k}' if v is None else f' {k}="{escape(v, quote=True)}"' for k, v in self.attrs.items())
        content = ''.join(c.html() if isinstance(c, Element) else c if self.tag in ('script', 'style') else escape(c, quote=False) for c in self.children)
        if not self.tag:
            return content
        return f'<{self.tag}{attrs}>' + ('' if self.tag in VOID else content + f'</{self.tag}>')


class Tree(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = Element('')
        self.stack = [self.root]
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        node = Element(tag, dict(attrs))
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]
                return

    def handle_data(self, value):
        self.stack[-1].children.append(value)


def site_data(root: Path) -> dict:
    # These are authored local copy dictionaries and a data-only array. No DOM,
    # network, animation or browser code is evaluated during static generation.
    script = r"""
const fs = require('node:fs'), vm = require('node:vm');
const root = process.argv[1], context = {window:{}};
for (const file of ['i18n-static.js','i18n-dynamic.js','firm-graph.js'])
  vm.runInNewContext(fs.readFileSync(root+'/v2/'+file,'utf8'),context,{timeout:1000});
const source=fs.readFileSync(root+'/v2/v2.js','utf8');
const roles=source.match(/const roles=(\[[\s\S]*?\]);\s*const skillNames/);
const skills=source.match(/const skillNames=(\[[^;]+\]);/);
if(!roles || !skills) throw new Error('Role data not found');
process.stdout.write(JSON.stringify({copy:context.window.OakbaseStaticCopy,dynamic:context.window.OakbaseDynamicCopy,
roles:vm.runInNewContext('('+roles[1]+')',{}, {timeout:1000}),skills:vm.runInNewContext('('+skills[1]+')',{}, {timeout:1000})}));
"""
    return json.loads(subprocess.check_output(['node', '-e', script, str(root)], text=True))


def localized_html(content: str, route: str, lang: str, data: dict) -> str:
    tree = Tree(content).root
    copy, dynamic = data['copy'][lang], data['dynamic'][lang]
    output_route = f'/{lang}{route}'
    canonical = ORIGIN + output_route

    def translate_text(node):
        # Keep only the requested legal language: no hidden duplicate document.
        node.children = [c for c in node.children if not isinstance(c, Element) or c.attrs.get('data-lang', lang) == lang]
        if node.attrs.get('data-lang') == lang:
            node.attrs.pop('hidden', None)
        for attribute in ('aria-label', 'title', 'alt'):
            if node.attrs.get(attribute) in dynamic:
                node.attrs[attribute] = dynamic[node.attrs[attribute]]
        for key, attribute in [('data-i18n-content', 'content'), ('data-i18n-aria-label', 'aria-label'), ('data-i18n-title', 'title'), ('data-i18n-alt', 'alt'), ('data-i18n-placeholder', 'placeholder')]:
            if key in node.attrs:
                node.attrs[attribute] = copy[node.attrs[key]]
        if 'data-i18n' in node.attrs:
            node.children = [copy[node.attrs['data-i18n']]]
        elif 'data-i18n-html' in node.attrs:
            node.children = Tree(copy[node.attrs['data-i18n-html']]).root.children
        else:
            for i, child in enumerate(node.children):
                if isinstance(child, str) and child.strip() in dynamic:
                    node.children[i] = child.replace(child.strip(), dynamic[child.strip()])
        for child in node.children:
            if isinstance(child, Element):
                translate_text(child)

    translate_text(tree)
    for node in list(tree.walk()):
        a = node.attrs
        if node.tag == 'html':
            a['lang'] = lang
        if node.tag == 'title' and 'data-title-' + lang in a:
            node.children = [a['data-title-' + lang]]
        if node.tag == 'meta' and a.get('name') == 'description' and route != '/' and lang == 'en':
            a['content'] = LEGAL_DESCRIPTIONS[route]
        if a.get('rel') == 'canonical':
            a['href'] = canonical
        if a.get('property') == 'og:url':
            a['content'] = canonical
        language_key = next((k for k in ('data-home-lang', 'data-legal-lang') if k in a), None)
        if language_key:
            choice = a[language_key]
            node.tag = 'a'
            a.pop('type', None)
            a.pop('aria-pressed', None)
            a['aria-current'] = str(choice == lang).lower()
            a['href'] = posixpath.relpath(f'/{choice}{route}', output_route) + '/'
            a['hreflang'] = choice
            a['lang'] = choice
        if a.get('class') == 'legal-skip-link':
            node.children = ['Saltar al contenido' if lang == 'es' else 'Skip to content']
        if a.get('class') == 'legal-brand':
            a['aria-label'] = 'Inicio de Oakbase' if lang == 'es' else 'Oakbase home'
        if 'data-oakbase' in a:
            a['src'] = '/assets/favicon.svg'
        if 'data-brand' in a:
            a['src'] = f'/assets/firm-knowledge/{a["data-brand"]}.svg'
        for key in ('href', 'src'):
            value = a.get(key, '')
            if not value or value.startswith('#') or a.get('rel') == 'canonical' or 'hreflang' in a:
                continue
            target = urlsplit(urljoin(ORIGIN + route, value))
            if target.netloc != 'oakbase.ai' or target.scheme != 'https':
                continue
            target_path = f'/{lang}{target.path}' if target.path in ROUTES else target.path
            relative = posixpath.relpath(target_path, output_route)
            if target_path.endswith('/'):
                relative += '/'
            a[key] = urlunsplit(('', '', relative, target.query, target.fragment))

    if route == '/':
        tbody = next(n for n in tree.walk() if 'data-role-rows' in n.attrs)
        for i, role in enumerate(data['roles']):
            t = lambda key: dynamic.get(key, key)
            cells = ''.join(f'<td aria-label="{escape(t(data["skills"][k]) + ": " + t(["Not a default skill", "Supporting skill", "Core skill"][level]), quote=True)}"><span aria-hidden="true" class="{("oa-skill-mark" + (" oa-support" if level == 1 else "")) if level else "oa-skill-empty"}">{"" if level else "—"}</span><span class="oa-sr">{escape(t(["Not a default skill", "Supporting skill", "Core skill"][level]))}</span></td>' for k, level in enumerate(role['skills']))
            row = f'<tr data-selected="{str(i == 1).lower()}"><th scope="row"><button type="button" class="oa-role-select" data-role="{i}" aria-pressed="{str(i == 1).lower()}">{escape(t(role["name"]))}</button></th>{cells}</tr>'
            tbody.children.extend(Tree(row).root.children)
        for attribute, key in [('data-role-name', 'label'), ('data-role-quote', 'quote'), ('data-role-context', 'context')]:
            node = next(n for n in tree.walk() if attribute in n.attrs)
            node.children = [t(data['roles'][1][key])]

    head = next(n for n in tree.walk() if n.tag == 'head')
    head.children = [n for n in head.children if not isinstance(n, Element) or not (n.tag == 'meta' and n.attrs.get('name') == 'robots')]
    for language in ('es', 'en', 'x-default'):
        head.children.append(Element('link', {'rel': 'alternate', 'hreflang': language, 'href': ORIGIN + f'/{"en" if language == "x-default" else language}{route}'}))
    head.children.append(Element('meta', {'property': 'og:locale', 'content': 'es_ES' if lang == 'es' else 'en_GB'}))
    if route == '/':
        schema = {'@context': 'https://schema.org', '@graph': [
            {'@type': 'Organization', '@id': ORIGIN + '/#organization', 'name': 'Oakbase', 'legalName': 'Oakbase SL', 'taxID': 'B05693742', 'url': ORIGIN + '/', 'logo': ORIGIN + '/assets/favicon.svg', 'email': 'hello@oakbase.ai'},
            {'@type': 'WebSite', '@id': ORIGIN + '/#website', 'name': 'Oakbase', 'url': ORIGIN + '/', 'inLanguage': ['es', 'en'], 'publisher': {'@id': ORIGIN + '/#organization'}}
        ]}
        head.children.append(Element('script', {'type': 'application/ld+json'}, [json.dumps(schema, ensure_ascii=False).replace('<', '\\u003c')]))
    return '<!doctype html>\n' + tree.html()


def generate(destination: Path, root: Path) -> None:
    data = site_data(root)
    for route in ROUTES:
        original = (destination / route.lstrip('/') / 'index.html').read_text(encoding='utf-8')
        for lang in ('es', 'en'):
            target = destination / lang / route.lstrip('/') / 'index.html'
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(localized_html(original, route, lang, data), encoding='utf-8')
