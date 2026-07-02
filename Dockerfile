FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html industries.html styles.css /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets

RUN printf "ok\n" > /usr/share/nginx/html/health

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD wget -q --spider http://127.0.0.1/health || exit 1
