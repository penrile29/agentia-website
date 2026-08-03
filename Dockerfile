FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html industries.html styles.css agentic.css site.js robots.txt sitemap.xml /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets

# Public legal routes only. Private drafts, evidence and contractual files are
# intentionally excluded by this allowlist and by .dockerignore.
COPY legal/index.html legal/legal.css legal/legal.js /usr/share/nginx/html/legal/
COPY terms /usr/share/nginx/html/terms
COPY privacy /usr/share/nginx/html/privacy
COPY security /usr/share/nginx/html/security
COPY subprocessors /usr/share/nginx/html/subprocessors
COPY .well-known /usr/share/nginx/html/.well-known

RUN printf "ok\n" > /usr/share/nginx/html/health

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD wget -q --spider http://127.0.0.1/health || exit 1
