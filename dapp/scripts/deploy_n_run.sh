#!/usr/bin/env bash

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

draw_bottom() {
  local width=$(tput cols)
  width=$((width - 2))  # Ajustar para bordes y márgenes
  
  # Caracteres para las esquinas y bordes
  local bottom_left='╰'
  local bottom_right='╯'
  local horizontal='─'
  
  # Crear la línea horizontal
  local horizontal_line=""
  for  (( i=0; i < $width; i++ )); do
    horizontal_line="$horizontal_line$horizontal"
  done
  
  # Imprimir el recuadro
  echo -e "\n${bottom_left}${horizontal_line}${bottom_right}"
}

draw_top() {
  local width=$(tput cols)
  width=$((width - 2))  # Ajustar para bordes y márgenes
  
  # Caracteres para las esquinas y bordes
  local top_left='╭'
  local top_right='╮'
  local horizontal='─'
  
  # Crear la línea horizontal
  local horizontal_line=""
  for  (( i=0; i < $width; i++ )); do
    horizontal_line="$horizontal_line$horizontal"
  done
  
  # Imprimir el recuadro
  echo -e "\n${top_left}${horizontal_line}${top_right}"
}

echo -e "${GREEN}🚀 Hardhat Ignition Deployment Script${NC}"

draw_top
echo -e "${GREEN}🔧 Running preconditions...${NC}"
./scripts/preconditions.sh
direnv allow
eval "$(direnv export bash)"
draw_bottom

NETWORK=$1
CONTRACT_NAME=$2

draw_top
echo -e "${GREEN}🔧 Running Hardhat compile...${NC}"
npx hardhat clean
npx hardhat compile
draw_bottom

if [ -z "$NETWORK" ]; then
  NETWORK=$(printf "localhost\nsepolia\nmainnet" | fzf --prompt "Network > ")
fi

draw_top
echo -e "${GREEN}Selected network: $NETWORK${NC}"

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

npx hardhat ignition deploy $MODULE_PATH --network $NETWORK --reset --verify | tee deploy.log

ADDRESS=$(cat deploy.log | grep -Eo '0x[a-fA-F0-9]{40}' | tail -1)
rm deploy.log

if [ -z "$ADDRESS" ]; then
  echo -e "${RED}❌ Could not extract deployed address.${NC}"
  draw_bottom
  exit 1
fi

echo -e "\n${GREEN}✅ Contract deployed at: $ADDRESS${NC}"
draw_bottom


draw_top

# Llamar script Node.js usando variables de entorno
echo -e "${GREEN}Launching Node.js interactive script...${NC}"

NETWORK=$NETWORK \
CONTRACT_NAME=$CONTRACT_NAME \
ADDRESS=$ADDRESS \
npx hardhat run ./scripts/interact.mjs --network $NETWORK

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}🎉 All done!${NC}"
else
  echo -e "${RED}❌ Node.js script failed.${NC}"
fi

draw_bottom
