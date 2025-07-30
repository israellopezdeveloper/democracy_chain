BANNER=. ~/.local/lib/bash/utils.sh; banner
SUBBANNER=. ~/.local/lib/bash/utils.sh; subbanner
CLS=printf '\033c'

clean:
	@$(BANNER) "🧽 Clean" "rainbow"
	@docker compose up --detach && docker compose up --wait
	@docker system prune --all --force
	@docker volume prune --all --force
	@docker compose stop && docker compose rm --force
	@docker volume rm democracy_chain_mysql_data democracy_chain_qdrant_data
	@rm -rf data/uploads
	@rm -rf examples/programs/*

run:
	@$(BANNER) "🍻 Run application" "rainbow"
	@docker compose up -d --wait
	@while true; do \
		$(CLS); \
		$(BANNER) "🍻 Run application" "rainbow"; \
		services="$$(docker compose config --services)"; \
		selection="$$(printf "$$services\nall\nexit\nrebuild" | fzf --prompt="🔍 Selecciona un servicio para ver logs: ")"; \
		if [ "$$selection" = "exit" ]; then \
			$(SUBBANNER) "🛑 Finalizando servicios..."; \
			docker compose down; \
			break; \
		elif [ "$$selection" = "all" ]; then \
			$(SUBBANNER) "🟢 All logs."; \
			docker compose logs -f; \
		elif [ "$$selection" = "rebuild" ]; then \
			$(SUBBANNER) "🟢 Rebuild."; \
			make build clean; \
			docker compose up -d --wait; \
		elif echo "$$services" | grep -q -w "$$selection"; then \
			$(SUBBANNER) "🟢 $$selection logs."; \
			docker compose logs -f "$$selection"; \
		else \
			$(SUBBANNER) "❌ Selección inválida."; \
		fi; \
	done

build:
	@$(BANNER) "⚒️ Build application" "rainbow"
	@docker compose build

programs:
	@$(BANNER) "📰 Mock programs" "rainbow"
	@cd examples && \
		./scripts/register_programs.sh

sc-console:
	@$(BANNER) "  Hardhat console"
	@docker attach democracy-deployer-interactor

