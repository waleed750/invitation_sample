# Custom Caddy build with the per-IP rate-limit plugin.
# Build: docker build -t platform-caddy ./platform/infra/caddy
# (docker-compose.prod.yml does this automatically via `build: ./caddy`.)
#
# The stock `caddy:2` image does NOT include rate limiting, so we compile with:
#   xcaddy build --with github.com/mholt/caddy-ratelimit
# Verify the plugin version against https://github.com/mholt/caddy-ratelimit
# before building (pin a tag if you need reproducible builds).

FROM caddy:2-builder AS builder
RUN xcaddy build --with github.com/mholt/caddy-ratelimit

FROM caddy:2
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
