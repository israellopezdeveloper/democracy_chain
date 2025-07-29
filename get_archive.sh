#!/bin/bash

rm democracy_chain.zip

zip  \
  -r democracy_chain.zip \
  . \
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
