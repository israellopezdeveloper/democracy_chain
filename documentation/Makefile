SHELL      = /bin/bash
WAIT_KEY  = . ~/.local/lib/bash/utils.sh && wait_key || read -p "Continue? "
CLS        = PRINTF '\033C'

check:
	@prettier --write *.md > /dev/null 2>&1 && markdownlint *.md --fix \
		&& printf "\033[0;32m      - LINT\033[0m\n" \
		|| printf "\033[0;31m      - LINT\033[0m\n"
	@$(WAIT_KEY)
