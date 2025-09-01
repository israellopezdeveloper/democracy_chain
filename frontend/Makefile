SHELL      = /bin/bash
WAIT_KEY  = . ~/.local/lib/bash/utils.sh && wait_key || read -p "Continue? "
CLS        = PRINTF '\033C'

check:
	@npm run lint \
		&& printf "\033[0;32m      - LINT\033[0m\n" \
		|| printf "\033[0;31m      - LINT\033[0m\n"
	@npm run format:fix \
		&& printf "\033[0;32m      - FORMAT\033[0m\n" \
		|| printf "\033[0;31m      - FORMAT\033[0m\n"
	@npm run deadcode >/dev/null \
		&& printf "\033[0;32m      - DEADCODE\033[0m\n" \
		|| printf "\033[0;31m      - DEADCODE\033[0m\n"
	@npm run exports:unused \
		&& printf "\033[0;32m      - UNUSED EXPORTS\033[0m\n" \
		|| printf "\033[0;31m      - UNUSED EXPORTS\033[0m\n"
	@npm run deps:unused \
		&& printf "\033[0;32m      - DEPS UNUSED\033[0m\n" \
		|| printf "\033[0;31m      - DEPS UNUSED\033[0m\n"
	@$(WAIT_KEY)
