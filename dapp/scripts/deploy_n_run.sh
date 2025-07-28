#!/usr/bin/env bash

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

draw_bottom() {
  local width=0
  width=$(tput cols 2>/dev/null)
  width=${width:-0}
  if [ "$width" -le 0 ]; then
    width=60
  fi
  width=$((width - 2))
  local bottom_left='╰'
  local bottom_right='╯'
  local horizontal='─'
  local horizontal_line=""
  for (( i=0; i<${width}; i++ )); do
    horizontal_line="${horizontal_line}─"
  done
  echo -e "\n${bottom_left}${horizontal_line}${bottom_right}"
}

draw_top() {
  local width=0
  width=$(tput cols 2>/dev/null)
  width=${width:-0}
  if [ "$width" -le 0 ]; then
    width=60
  fi
  width=$((width - 2))
  local top_left='╭'
  local top_right='╮'
  local horizontal='─'
  local horizontal_line=""
  for (( i=0; i<${width}; i++ )); do
    horizontal_line="${horizontal_line}─"
  done
  echo -e "\n${top_left}${horizontal_line}${top_right}"
}

echo -e "${GREEN}🚀 Hardhat Ignition Deployment Script${NC}"

draw_top
echo -e "${GREEN}🔧 Running preconditions...${NC}"
./scripts/preconditions.sh
draw_bottom

# Argument parsing
for arg in "$@"; do
  case $arg in
    --network=*)
      NETWORK="${arg#*=}"
      shift
      ;;
    --contract=*)
      CONTRACT_NAME="${arg#*=}"
      shift
      ;;
    *)
      echo -e "${RED}❌ Unknown argument: $arg${NC}"
      exit 1
      ;;
  esac
done

draw_top
echo -e "${GREEN}🔧 Running Hardhat compile...${NC}"
npx hardhat clean
npx hardhat compile
draw_bottom

# Selección de red si no se pasó por parámetro
if [ -z "$NETWORK" ]; then
  NETWORK=$(printf "localhost\nsepolia\nmainnet" | fzf --prompt "Network > ")
fi

draw_top
echo -e "${GREEN}Selected network: $NETWORK${NC}"

# Selección de contrato si no se pasó por parámetro
if [ -z "$CONTRACT_NAME" ]; then
  CONTRACTS=$(ls ./contracts/*.sol | xargs -n1 basename | sed 's/\.sol//')
  CONTRACT_NAME=$(printf "$CONTRACTS" | fzf --prompt "Contract > ")
fi

echo -e "${GREEN}Selected contract: $CONTRACT_NAME${NC}"

MODULE_PATH="./ignition/modules/${CONTRACT_NAME}Module.mjs"

if [[ ! -f "$MODULE_PATH" ]]; then
  echo -e "${RED}❌ Module file not found: $MODULE_PATH${NC}"
  draw_bottom
  exit 1
fi
draw_bottom

draw_top
echo -e "${GREEN}Deploying contract...${NC}"

VERIFY_FLAG=""
if [[ "$NETWORK" != "localhost" && "$NETWORK" != "hardhat" ]]; then
  VERIFY_FLAG="--verify"
fi

npx hardhat ignition deploy "$MODULE_PATH" --network "$NETWORK" --reset $VERIFY_FLAG | tee deploy.log

ADDRESS=$(grep -Eo '0x[a-fA-F0-9]{40}' deploy.log | tail -1)
rm deploy.log

if [ -z "$ADDRESS" ]; then
  echo -e "${RED}❌ Could not extract deployed address.${NC}"
  draw_bottom
  exit 1
fi

# Guardar en archivo JSON
cat <<EOF > deployed-address.json
{
  "address": "$ADDRESS",
  "network": "$NETWORK"
}
EOF

echo -e "\n${GREEN}✅ Contract deployed at: $ADDRESS${NC}"
draw_bottom

draw_top
echo -e "${GREEN}Launching Node.js interactive script...${NC}"

NETWORK="$NETWORK" \
CONTRACT_NAME="$CONTRACT_NAME" \
ADDRESS="$ADDRESS" \
npx hardhat run ./scripts/interact.mjs --network "$NETWORK"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}🎉 All done!${NC}"
else
  echo -e "${RED}❌ Node.js script failed.${NC}"
fi

draw_bottom

