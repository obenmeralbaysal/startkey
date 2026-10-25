# Canlı güncelleme (NPM arkasındaki VDS). Geliştirme makinesinde çalıştırma.
# down yok, volume silinmez, dolu veritabanında seed atlanır.

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
COMPOSE := docker compose --project-directory $(ROOT) -f $(ROOT)/docker-compose.yml -f $(ROOT)/docker-compose.behind-npm.yml
OWNER := $(shell stat -c '%U' $(ROOT) 2>/dev/null || stat -f '%Su' $(ROOT))

.PHONY: deploy pull web api nginx-reload

deploy: pull web api nginx-reload

pull:
	git -C $(ROOT) -c safe.directory=$(ROOT) pull --ff-only
	@if [ "$$(id -u)" -eq 0 ]; then \
		find "$(ROOT)" -path "$(ROOT)/web/public/media" -prune -o -exec chown --no-dereference "$(OWNER)":"$(OWNER)" {} +; \
	fi

web:
	$(COMPOSE) build web
	$(COMPOSE) up -d --no-deps web

api:
	$(COMPOSE) up -d --no-deps --force-recreate api

# Recreating api gives it a new container IP; nginx caches the old upstream
# until reloaded (pages 500). Validate config first, then reload in place.
nginx-reload:
	@if [ -n "$$($(COMPOSE) ps -q --status running nginx)" ]; then \
		$(COMPOSE) exec -T nginx nginx -t && $(COMPOSE) exec -T nginx nginx -s reload; \
	else \
		echo "nginx is not running; skipping reload"; \
	fi
