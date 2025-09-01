SHELL      := /bin/bash
WAIT_KEY   := . ~/.local/lib/bash/utils.sh && wait_key || read -p "Continue? "
CLS        := printf '\033C'

# Detecta archivos
SH_SRCS     := $(shell ls *.sh 2>/dev/null || true)
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

check: check-sh check-md
	@poetry run black . \
		&& printf "\033[0;32m      - BLACK\033[0m\n" \
		|| { printf "\033[0;31m      - BLACK\033[0m\n"; read -p "Continue? "; exit 1; }; \
	poetry run ruff check --fix \
		&& printf "\033[0;32m      - RUFF\033[0m\n" \
		|| { printf "\033[0;31m      - RUFF\033[0m\n"; read -p "Continue? "; exit 1; }; \
	poetry run isort . \
	        && printf "\033[0;32m      - ISORT\033[0m\n" \
	        || { printf "\033[0;31m      - ISORT\033[0m\n"; read -p "Continue? "; exit 1; }; \
	poetry run mypy . \
		&& printf "\033[0;32m      - MYPY\033[0m\n" \
		|| { printf "\033[0;31m      - MYPY\033[0m\n"; read -p "Continue? "; exit 1; }
	@$(WAIT_KEY)

# -------- Shell --------
check-sh:
	@$(call run,SHELLCHECK,shellcheck $(SH_SRCS),$(SH_SRCS))

check-sh-ci:
	@$(call run-ci,SHELLCHECK,shellcheck $(SH_SRCS),$(SH_SRCS))

# -------- Markdown (en raíz) --------
check-md:
	@prettier --write *.md > /dev/null 2>&1 && markdownlint *.md --fix \
		&& printf "$(GREEN)      - MARKDOWN LINT$(RESET)\n" \
		|| { printf "$(RED)      - MARKDOWN LINT$(RESET)\n"; read -p "Continue? "; exit 1; }; \

check-md-ci:
	@prettier --write *.md > /dev/null 2>&1 && markdownlint *.md --fix > /dev/null 2>&1 \
		&& printf "$(GREEN)      - MARKDOWN LINT$(RESET)\n" \
		|| { printf "$(RED)      - MARKDOWN LINT$(RESET)\n"; exit 1; }; \

check-ci: check-sh-ci check-md-ci
	@poetry run black . > /dev/null 2>&1 \
		&& printf "\033[0;32m      - BLACK\033[0m\n" \
		|| { printf "\033[0;31m      - BLACK\033[0m\n"; exit 1; }; \
	poetry run ruff check --fix > /dev/null 2>&1 \
		&& printf "\033[0;32m      - RUFF\033[0m\n" \
		|| { printf "\033[0;31m      - RUFF\033[0m\n"; exit 1; }; \
	poetry run isort . > /dev/null 2>&1 \
	        && printf "\033[0;32m      - ISORT\033[0m\n" \
	        || { printf "\033[0;31m      - ISORT\033[0m\n"; exit 1; }; \
	poetry run mypy . > /dev/null 2>&1 \
		&& printf "\033[0;32m      - MYPY\033[0m\n" \
		|| { printf "\033[0;31m      - MYPY\033[0m\n"; exit 1; }
