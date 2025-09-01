SHELL      = /bin/bash
WAIT_KEY  = . ~/.local/lib/bash/utils.sh && wait_key || read -p "Continue? "
CLS        = PRINTF '\033C'

check:
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

check-ci:
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
