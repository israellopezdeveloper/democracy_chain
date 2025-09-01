SHELL      = /bin/bash
WAIT_KEY  = . ~/.local/lib/bash/utils.sh && wait_key || read -p "Continue? "
CLS        = PRINTF '\033C'

check:
	@poetry run black . \
		&& printf "\033[0;32m      - BLACK\033[0m\n" \
		|| printf "\033[0;31m      - BLACK\033[0m\n"
	@poetry run ruff check --fix \
		&& printf "\033[0;32m      - RUFF\033[0m\n" \
		|| printf "\033[0;31m      - RUFF\033[0m\n"
	@poetry run isort . \
		&& printf "\033[0;32m      - ISORT\033[0m\n" \
		|| printf "\033[0;31m      - ISORT\033[0m\n"
	@poetry run mypy . \
		&& printf "\033[0;32m      - MYPY\033[0m\n" \
		|| printf "\033[0;31m      - MYPY\033[0m\n"
	@$(WAIT_KEY)
