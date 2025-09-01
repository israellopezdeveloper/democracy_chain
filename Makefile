SHELL      = /bin/bash
BANNER     = . ~/.local/lib/bash/utils.sh && banner
SUBBANNER  = . ~/.local/lib/bash/utils.sh && subbanner
CLS        = printf '\033c'
COMPOSE    = podman-compose
PROJECT   ?= $(shell basename $(CURDIR))     # nombre de proyecto que usará el label de compose
WAIT_TIMEOUT ?= 180

# Espera a que todos los contenedores del proyecto estén healthy (si tienen healthcheck) o al menos "running".
define wait_healthy
	echo "⏳ Esperando hasta $(WAIT_TIMEOUT)s a que los servicios estén listos..."
	end=$$(( $$(date +%s) + $(WAIT_TIMEOUT) )); \
	while true; do \
	  cids=$$(podman ps -q --filter label=io.podman.compose.project=$(PROJECT)); \
	  if [ -z "$$cids" ]; then \
	    sleep 2; \
	    if [ $$(date +%s) -ge $$end ]; then echo "❌ Timeout sin contenedores"; exit 1; fi; \
	    continue; \
	  fi; \
	  all_ok=1; \
	  for id in $$cids; do \
	    st=$$(podman inspect $$id --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}'); \
	    case "$$st" in \
	      healthy|running) ;; \
	      starting|created|configured) all_ok=0 ;; \
	      *) echo "⚠️  $$id -> $$st"; all_ok=0 ;; \
	    esac; \
	  done; \
	  if [ $$all_ok -eq 1 ]; then echo "✅ Servicios listos"; break; fi; \
	  if [ $$(date +%s) -ge $$end ]; then echo "❌ Timeout esperando health/running"; podman ps --filter label=io.podman.compose.project=$(PROJECT); exit 1; fi; \
	  sleep 2; \
	done
endef

.PHONY: clean run build programs hh-console backend-console create-zip up down logs wait-healthy check

wait-healthy:
	@$(call wait_healthy) > /dev/null 2>&1 && \
	printf "\033[0;32m   - Waiting pods to be ready\033[0m\n" || \
	printf "\033[0;31m   - Waiting pods to be ready\033[0m\n"

up:
	@$(BANNER) "🚀 Up" "rainbow"
	@$(COMPOSE) up -d >/dev/null 2>&1 && \
	  $(call wait_healthy) >/dev/null 2>&1 && \
	  printf "\033[0;32m   - Run & wait for running\033[0m\n" || \
	  printf "\033[0;31m   - Run & wait for running\033[0m\n"
	$(call wait_healthy) >/dev/null 2>&1 && \
	  printf "\033[0;32m   - Run & wait for running\033[0m\n" || \
	  printf "\033[0;31m   - Run & wait for running\033[0m\n"

down:
	@$(BANNER) "🛑 Down" "rainbow"
	@$(COMPOSE) down --remove-orphans >/dev/null 2>&1 && \
	  printf "\033[0;32m   - Stop & remove images\033[0m\n" || \
	  printf "\033[0;31m   - Stop & remove images\033[0m\n"

logs:
	@$(COMPOSE) logs -f

clean:
	@$(BANNER) "🧽 Clean" "rainbow"
	-@$(COMPOSE) up -d >/dev/null 2>&1 && \
	  $(call wait_healthy) >/dev/null 2>&1 && \
	  printf "\033[0;32m   - Run & wait for running\033[0m\n" || \
	  printf "\033[0;31m   - Run & wait for running\033[0m\n"
	-@podman system prune --all --force >/dev/null 2>&1 && \
	  printf "\033[0;32m   - Unused pods cleaned\033[0m\n" || \
	  printf "\033[0;31m   - Unused pods cleaned\033[0m\n"
	-@podman volume prune --force >/dev/null 2>&1 && \
	  printf "\033[0;32m   - Unused volumes cleaned\033[0m\n" || \
	  printf "\033[0;31m   - Unused volumes cleaned\033[0m\n"
	-@$(COMPOSE) down --remove-orphans >/dev/null 2>&1 && \
	  printf "\033[0;32m   - Stop & remove images\033[0m\n" || \
	  printf "\033[0;31m   - Stop & remove images\033[0m\n"
	-@podman volume rm democracy_chain_mysql_data democracy_chain_qdrant_data >/dev/null 2>&1 && \
	  printf "\033[0;32m   - Remove volumes\033[0m\n" || \
	  printf "\033[0;31m   - Remove volumes\033[0m\n"
	-@rm -rf data/uploads examples/programs/* examples/wallets.csv && \
	  printf "\033[0;32m   - Clean files\033[0m\n" || \
	  printf "\033[0;31m   - Clean files\033[0m\n"

run:
	@$(BANNER) "🍻 Run application" "rainbow"
	@$(COMPOSE) up -d >/dev/null 2>&1 && $(call wait_healthy) >/dev/null 2>&1 && \
	  printf "\033[0;32m   - Run & wait for running\033[0m\n" || \
	  printf "\033[0;31m   - Run & wait for running\033[0m\n"
	@while true; do \
	  $(CLS); \
	  $(BANNER) "🍻 Run application" "rainbow"; \
	  services="$$( $(COMPOSE) config --services )"; \
	  selection="$$(printf "0 - exit\n1 - all\n2 - rebuild\n3 - rerun\n4 - clean\n5 - check\n$$services" | fzf --prompt="🔍 Selecciona un servicio para ver logs: ")"; \
	  if [ "$$selection" = "0 - exit" ]; then \
	    $(SUBBANNER) "🛑 Finalizando servicios..."; \
	    $(COMPOSE) down --remove-orphans > /dev/null 2>&1 && \
	    printf "\033[0;32m   - Closing & removing orphans\033[0m\n" || \
	    printf "\033[0;31m   - Closing & removing orphans\033[0m\n"; \
	    break; \
	  elif [ "$$selection" = "1 - all" ]; then \
	    $(SUBBANNER) "🟢 All logs."; \
	    $(COMPOSE) logs -f; \
	  elif [ "$$selection" = "2 - rebuild" ]; then \
	    $(SUBBANNER) "🟢 Rebuild."; \
	    $(MAKE) build; \
	    $(COMPOSE) up -d > /dev/null 2>&1; \
	    $(MAKE) wait_healthy && \
	    printf "\033[0;32m   - Wait till ready\033[0m\n" || \
	    printf "\033[0;31m   - Wait till ready\033[0m\n"; \
	  elif [ "$$selection" = "3 - rerun" ]; then \
	    $(SUBBANNER) "🟢 Rerun."; \
	    $(COMPOSE) down --remove-orphans > /dev/null 2>&1 && \
	    printf "\033[0;32m   - Shuting down pods & remove orphans\033[0m\n" || \
	    printf "\033[0;31m   - Shuting down pods & remove orphans\033[0m\n"; \
	    $(COMPOSE) up -d > /dev/null 2>&1 && \
	    printf "\033[0;32m   - Running pods\033[0m\n" || \
	    printf "\033[0;31m   - Running pods\033[0m\n"; \
	    $(MAKE) wait_healthy; \
	  elif [ "$$selection" = "4 - clean" ]; then \
	    $(SUBBANNER) "🟢 Clean."; \
	    $(MAKE) clean; \
	    $(COMPOSE) up -d > /dev/null 2>&1 && \
	    printf "\033[0;32m   - Running pods\033[0m\n" || \
	    printf "\033[0;31m   - Running pods\033[0m\n"; \
	    $(MAKE) wait_healthy; \
	  elif [ "$$selection" = "5 - check" ]; then \
	    $(SUBBANNER) "🟢 Check."; \
	    $(MAKE) check; \
	    $(COMPOSE) up -d > /dev/null 2>&1 && \
	    printf "\033[0;32m   - Running pods\033[0m\n" || \
	    printf "\033[0;31m   - Running pods\033[0m\n"; \
	    $(MAKE) wait_healthy; \
	  elif echo "$$services" | grep -q -w "$$selection"; then \
	    $(SUBBANNER) "🟢 $$selection logs."; \
	    $(COMPOSE) logs -f "$$selection"; \
	  else \
	    $(SUBBANNER) "❌ Selección inválida."; \
	  fi; \
	done

build:
	@$(BANNER) "🔨 Build application" "rainbow"
	@services="$$( $(COMPOSE) config --services )"; \
	selection="$$(printf "0 - exit\n1 - all\n$$services" | fzf --prompt="🔨 Selecciona servicio a reconstruir: ")"; \
	if [ "$$selection" = "0 - exit" ] || [ -z "$$selection" ]; then \
	  printf "\033[0;33m   - Build cancelado\033[0m\n"; \
	  exit 0; \
	elif [ "$$selection" = "1 - all" ]; then \
	  read -r -p "¿Forzar --no-cache? [y/N] " yn; \
	  if [[ "$$yn" =~ ^[Yy]$$ ]]; then nocache="--no-cache"; else nocache=""; fi; \
	  if $(COMPOSE) build $$nocache; then \
	    printf "\033[0;32m   - Rebuild (all) OK\033[0m\n"; \
	  else \
	    printf "\033[0;31m   - Rebuild (all) FAIL\033[0m\n"; \
	  fi; \
	else \
	  svc="$$selection"; \
	  read -r -p "¿Forzar --no-cache? [y/N] " yn; \
	  if [[ "$$yn" =~ ^[Yy]$$ ]]; then nocache="--no-cache"; else nocache=""; fi; \
	  if $(COMPOSE) build $$nocache "$$svc"; then \
	    printf "\033[0;32m   - Rebuild (\033[1m$$svc\033[0;32m) OK\033[0m\n"; \
	  else \
	    printf "\033[0;31m   - Rebuild (\033[1m$$svc\033[0;31m) FAIL\033[0m\n"; \
	  fi; \
	fi

check:
	@$(BANNER) "🧪 Check (subproyectos)" "rainbow"
	@set -e; \
	dirs="$$( \
	  find . -mindepth 1 -maxdepth 2 -type f \( -name Makefile -o -name makefile \) \
	    -not -path './.git/*' -not -path './node_modules/*' \
	    -exec dirname {} \; | sed 's|^\./||' | sed 's|^\.||' | sed '/^$$/d' | sort -u \
	)"; \
	if [ -z "$$dirs" ]; then \
	  printf "\033[0;33m   - No se encontraron Makefiles en subcarpetas directas\033[0m\n"; \
	  exit 0; \
	fi; \
	selection="$$( printf "0 - exit\n1 - all\n%s\n" "$$dirs" | fzf --prompt="🧪 Selecciona dir para 'make check': " )"; \
	if [ -z "$$selection" ] || [ "$$selection" = "0 - exit" ]; then \
	  printf "\033[0;33m   - Check cancelado\033[0m\n"; exit 0; \
	fi; \
	if [ "$$selection" = "1 - all" ]; then \
	  ok_list=""; fail_list=""; \
	  for d in $$dirs; do \
	    $(SUBBANNER) "🔎 $$d"; \
	    if $(MAKE) -C "$$d" check; then \
	      printf "\033[0;32m   ✓ $$d\033[0m\n"; \
	      ok_list="$$ok_list $$d"; \
	    else \
	      printf "\033[0;31m   ✗ $$d\033[0m\n"; \
	      fail_list="$$fail_list $$d"; \
	      exit 1; \
	    fi; \
	    echo -e "\n\n"; \
	  done; \
	  printf "\n"; \
	  [ -n "$$ok_list" ] && printf "\033[0;32mOK:\033[0m%s\n" "$$ok_list" || true; \
	  [ -n "$$fail_list" ] && printf "\033[0;31mFAIL:\033[0m%s\n" "$$fail_list" || true; \
	  [ -z "$$fail_list" ]; \
	else \
	  d="$$selection"; \
	  $(SUBBANNER) "🔎 $$d"; \
	  if $(MAKE) -C "$$d" check; then \
	    printf "\033[0;32m   ✓ $$d\033[0m\n"; \
	  else \
	    printf "\033[0;31m   ✗ $$d\033[0m\n"; exit 1; \
	  fi; \
	fi
check-ci:
	@set -e; \
	dirs="$$( \
	  find . -mindepth 1 -maxdepth 2 -type f \( -name Makefile -o -name makefile \) \
	    -not -path './.git/*' -not -path './node_modules/*' \
	    -exec dirname {} \; | sed 's|^\./||' | sed 's|^\.||' | sed '/^$$/d' | sort -u \
	)"; \
	if [ -z "$$dirs" ]; then \
	  printf "\033[0;33m   - No se encontraron Makefiles en subcarpetas directas\033[0m\n"; \
	  exit 0; \
	fi; \
	ok_list=""; fail_list=""; \
	for d in $$dirs; do \
	  if $(MAKE) -C "$$d" check-ci; then \
	    printf "\033[0;32m   ✓ $$d\033[0m\n"; \
	    ok_list="$$ok_list $$d"; \
	  else \
	    printf "\033[0;31m   ✗ $$d\033[0m\n"; \
	    fail_list="$$fail_list $$d"; \
	    exit 1; \
	  fi; \
	  echo -e "\n\n"; \
	done; \
	printf "\n"; \
	[ -n "$$ok_list" ] && printf "\033[0;32mOK:\033[0m%s\n" "$$ok_list" || true; \
	[ -n "$$fail_list" ] && printf "\033[0;31mFAIL:\033[0m%s\n" "$$fail_list" || true; \
	[ -z "$$fail_list" ]

programs:
	@$(BANNER) "📰 Mock programs" "rainbow"
	@cd examples && ./scripts/register_programs.sh

hh-console:
	@$(BANNER) "  Hardhat console"
	@podman attach democracy-deployer-interactor

backend-console:
	@$(BANNER) "  Backend console"
	@./backend_client.sh

create-zip:
	@$(BANNER) "  Create zip file"
	@rm -f democracy_chain.zip
	@zip -r democracy_chain.zip . \
	  -x ".git/*" \
	  -x "*.bin" \
	  -x "*/node_modules/*" \
	  -x "*/__pycache__/*" \
	  -x "*/__init__.py" \
	  -x ".scaffold/*" \
	  -x ".github/*" \
	  -x "*/coverage/*" \
	  -x "*/typechain-types/*" \
	  -x "*/cache/*" \
	  -x "*/dist/*" \
	  -x "*/artifacts/*" \
	  -x "*/test/*" \
	  -x "*/scripts/*" \
	  -x "*/deployments/*" \
	  -x "*/public/*" \
	  -x "*/*.md" \
	  -x "*.md" \
	  -x "*/.*" \
	  -x "commands.txt" \
	  -x "test_wallet.txt" \
	  -x "*/*.sh" \
	  -x "*.sh" \
	  -x "*.txt" \
	  -x "*/*.lock" \
	  -x "*/*-lock.json" \
	  -x "*/*coverage*" \
	  -x "*/*deployed-address*" \
	  -x "*/*gas-report*" \
	  -x ".*"

