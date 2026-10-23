"""Inject a small native-graph extension into the generated V2 JavaScript."""
from __future__ import annotations


def patch(source: str, native_snippet: str) -> str:
    """Patch only the generated copy; fail closed if the V2 source shape changes."""
    def replace(old: str, new: str) -> None:
        nonlocal source
        count = source.count(old)
        if count != 1:
            raise ValueError(f'Expected exactly one graph patch anchor ({count} found): {old[:110]}')
        source = source.replace(old, new, 1)

    replace('  function basePositions(){', native_snippet.rstrip() + '\n  function basePositions(){')
    replace('const neighbors=id=>adjacent.get(id)||[];', 'const neighbors=id=>(adjacent.get(id)||[]).filter(({node})=>storyVisible(node));')
    replace('window.OakbaseFirmLayout.build(data,connections,graphWidth,graphHeight)', 'window.OakbaseFirmLayout.build(storyOriginalNodes,storyOriginalConnections,graphWidth,graphHeight)')
    replace('data.forEach(n=>n.button.style.setProperty(\'--firm-dot\'', 'storyOriginalNodes.forEach(n=>n.button.style.setProperty(\'--firm-dot\'')
    replace("if(state.memoryView==='client'){\n    const center=points.get(state.memoryClient)", "if(state.memoryView==='client'&&!storyState.active&&!storyState.returning){\n    const center=points.get(state.memoryClient)")
    replace('   return points;\n  }\n  function positions(){', '   return storyState.active||storyState.returning?storyWorldPoints(points):points;\n  }\n  function positions(){')
    replace("if(compact&&state.memoryView==='client'){\n    points=new Map", "if(compact&&state.memoryView==='client'&&!storyState.active&&!storyState.returning){\n    points=new Map")
    replace("visible=p&&(!detail||inside)&&p.x", "visible=p&&storyVisible(n)&&(storyState.active||storyState.returning||!detail||inside)&&p.x")
    replace('    n.button.hidden=!visible;if(!visible)return;', '    storyNodeFrame(n,visible);n.button.hidden=!visible;if(!visible)return;')
    replace("    e.path.style.display=visible?'':'none';", "    storyEdgeArrival(e,visible);e.path.style.display=visible?'':'none';")
    replace("    if(active){const t=.56", "    storyEdgeFrame(e);if(active||(e.storyOnly&&e.storyPrimary)){const t=.56")
    replace("root.querySelector('[data-graph-zoom=\"in\"]').disabled=compact&&detail||zoom>=12;", "root.querySelector('[data-graph-zoom=\"in\"]').disabled=compact&&detail||zoom>=12;storyFrame();")
    replace("  function targetCamera(){\n   if(state.memoryView", "  function targetCamera(){\n   if(storyState.active)return storyCameraTarget();\n   if(state.memoryView")
    replace('cluster=data.filter(inClient).map(n=>points.get(n.id))', 'cluster=data.filter(n=>!n.storyOnly&&inClient(n)).map(n=>points.get(n.id))')
    replace("  function stopFlight(){if(flight)", "  function stopFlight(){storyCancelCamera();if(flight)")
    replace('records:data.length', 'records:storyOriginalNodes.length')
    replace("svg.setAttribute('viewBox',`0 0 ${w} ${h}`);updateChrome();moveCamera(targetCamera(),false);", "svg.setAttribute('viewBox',`0 0 ${w} ${h}`);updateChrome();if(storyState.timeline&&storyState.active){storyState.visualKey='';storySeek(storyState.time,{reducedMotion:storyState.reducedMotion,force:true});}else moveCamera(targetCamera(),false);")
    replace('  return {select,refreshLanguage,restore:', '  return {story,select,refreshLanguage,restore:')
    # Let manual camera controls remain untouched outside the illustration.
    replace("viewport.addEventListener('pointerdown',e=>{if(e.target.closest('button')", "viewport.addEventListener('pointerdown',e=>{if(storyState.active||storyState.returning)return;if(e.target.closest('button')")
    return source
