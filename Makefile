# Canlı güncelleme (NPM arkasındaki VDS). Geliştirme makinesinde çalıştırma.
# down yok, volume silinmez, dolu veritabanında seed atlanır.

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
COMPOSE := docker compose --project-directory $(ROOT) -f $(ROOT)/docker-compose.yml -f $(ROOT)/docker-compose.behind-npm.yml
OWNER := $(shell stat -c '%U' $(ROOT) 2>/dev/null || stat -f '%Su' $(ROOT))

.PHONY: deploy pull web api

deploy: pull web api

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
