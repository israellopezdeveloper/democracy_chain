SHELL       := /bin/bash
WAIT_KEY    := . ~/.local/lib/bash/utils.sh && wait_key || read -rp "Continue? "
CLS         := printf '\033c'

# Detecta archivos
PY_SRCS     := $(shell ls scripts/*.py 2>/dev/null || true)
JS_SRCS     := $(shell ls scripts/*.js 2>/dev/null || true)
SH_SRCS     := $(shell ls scripts/*.sh 2>/dev/null || true)
MD_SRCS     := $(shell ls *.md 2>/dev/null || true)

# Helpers de color
GREEN       := \033[0;32m
RED         := \033[0;31m
YELLOW      := \033[0;33m
RESET       := \033[0m

# Macro: ejecuta comando si hay archivos y existe la herramienta
# $(call run, <desc>, <cmd>, <files>)
define run
	@if [ -n "$(3)" ]; then \
	  if command -v $$(echo '$(2)' | awk '{print $$1}') >/dev/null 2>&1 || poetry run true >/dev/null 2>&1; then \
	    if $(2); then \
	      printf "$(GREEN)      - $(1)$(RESET)\n"; \
	    else \
	      printf "$(RED)      - $(1)$(RESET)\n"; read -p "Continue? "; exit 1; \
	    fi; \
	  else \
	    printf "$(YELLOW)      - $(1) (tool not found)$(RESET)\n"; read -p "Continue? "; exit 1; \
	  fi; \
	else \
	  printf "$(YELLOW)      - $(1) (no files)$(RESET)\n"; \
	fi
endef

# Macro: ejecuta comando si hay archivos y existe la herramienta
# $(call run, <desc>, <cmd>, <files>)
define run-ci
	@if [ -n "$(3)" ]; then \
	  if command -v $$(echo '$(2)' | awk '{print $$1}') >/dev/null 2>&1 || poetry run true >/dev/null 2>&1; then \
	    if $(2) > /dev/null 2>&1; then \
	      printf "$(GREEN)      - $(1)$(RESET)\n"; \
	    else \
	      printf "$(RED)      - $(1)$(RESET)\n"; exit 1; \
	    fi; \
	  else \
	    printf "$(YELLOW)      - $(1) (tool not found)$(RESET)\n"; exit 1; \
	  fi; \
	else \
	  printf "$(YELLOW)      - $(1) (no files)$(RESET)\n"; \
	fi
endef

.PHONY: check check-sh check-md check-ci check-sh-ci check-md-ci

check: check-py check-js check-sh check-md
	@$(WAIT_KEY)

# -------- Python (usa Poetry) --------
check-py:
	@$(call run,MYPY,poetry run mypy $(PY_SRCS),$(PY_SRCS))
	@$(call run,BLACK (fix),poetry run black $(PY_SRCS),$(PY_SRCS))
	@$(call run,BLACK,poetry run black --check $(PY_SRCS),$(PY_SRCS))
	@$(call run,RUFF (fix),poetry run ruff check --fix $(PY_SRCS),$(PY_SRCS))
	@$(call run,RUFF,poetry run ruff check $(PY_SRCS),$(PY_SRCS))
	@$(call run,ISORT (fix),poetry run isort $(PY_SRCS),$(PY_SRCS))
	@$(call run,ISORT,poetry run isort --check-only $(PY_SRCS),$(PY_SRCS))

# -------- JavaScript --------
check-js:
	@$(call run,PRETTIER (write),npx --yes prettier --write $(JS_SRCS),$(JS_SRCS))
	@$(call run,PRETTIER (check),npx --yes prettier --check $(JS_SRCS),$(JS_SRCS))
	@$(call run,ESLINT (fix),npx --yes eslint --fix $(JS_SRCS),$(JS_SRCS))
	@$(call run,ESLINT,npx --yes eslint $(JS_SRCS),$(JS_SRCS))

# -------- Shell --------
check-sh:
	@$(call run,SHELLCHECK,shellcheck $(SH_SRCS),$(SH_SRCS))

# -------- Markdown (en raíz) --------
check-md:
	@prettier --write *.md > /dev/null 2>&1 && markdownlint *.md --fix \
		&& printf "$(GREEN)      - MARKDOWN LINT$(RESET)\n" \
		|| { printf "$(RED)      - MARKDOWN LINT$(RESET)\n"; read -p "Continue? "; exit 1; }; \

check-ci: check-py-ci check-js-ci check-sh-ci check-md-ci

# -------- Python (usa Poetry) --------
check-py-ci:
	@$(call run-ci,MYPY,poetry run mypy $(PY_SRCS),$(PY_SRCS))
	@$(call run-ci,BLACK (fix),poetry run black $(PY_SRCS),$(PY_SRCS))
	@$(call run-ci,BLACK,poetry run black --check $(PY_SRCS),$(PY_SRCS))
	@$(call run-ci,RUFF (fix),poetry run ruff check --fix $(PY_SRCS),$(PY_SRCS))
	@$(call run-ci,RUFF,poetry run ruff check $(PY_SRCS),$(PY_SRCS))
	@$(call run-ci,ISORT (fix),poetry run isort $(PY_SRCS),$(PY_SRCS))
	@$(call run-ci,ISORT,poetry run isort --check-only $(PY_SRCS),$(PY_SRCS))

# -------- JavaScript --------
check-js-ci:
	@$(call run-ci,PRETTIER (write),npx --yes prettier --write $(JS_SRCS),$(JS_SRCS))
	@$(call run-ci,PRETTIER (check),npx --yes prettier --check $(JS_SRCS),$(JS_SRCS))
	@$(call run-ci,ESLINT (fix),npx --yes eslint --fix $(JS_SRCS),$(JS_SRCS))
	@$(call run-ci,ESLINT,npx --yes eslint $(JS_SRCS),$(JS_SRCS))

# -------- Shell --------
check-sh-ci:
	@$(call run-ci,SHELLCHECK,shellcheck $(SH_SRCS),$(SH_SRCS))

# -------- Markdown (en raíz) --------
check-md-ci:
	@prettier --write *.md > /dev/null 2>&1 && markdownlint *.md --fix \
		&& printf "$(GREEN)      - MARKDOWN LINT$(RESET)\n" \
		|| { printf "$(RED)      - MARKDOWN LINT$(RESET)\n"; exit 1; }; \
