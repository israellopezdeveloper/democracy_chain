SHELL     := /bin/bash
WAIT_KEY  := . ~/.local/lib/bash/utils.sh && wait_key || read -p "Continue? "
CLS       := printf '\033C'

check:
	@prettier --write *.md > /dev/null 2>&1 && markdownlint *.md --fix \
		&& printf "\033[0;32m      - LINT\033[0m\n" \
		|| { printf "\033[0;31m      - LINT\033[0m\n"; read -p "Continue? "; exit 1; }
	@$(WAIT_KEY)

check-ci:
	@prettier --write *.md > /dev/null 2>&1 && markdownlint *.md --fix > /dev/null 2>&1 \
		&& printf "\033[0;32m      - LINT\033[0m\n" \
		|| { printf "\033[0;31m      - LINT\033[0m\n"; exit 1; }
