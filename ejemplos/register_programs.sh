#!/bin/bash

FOLDER="."
RPC_URL="http://localhost:8545"
CONTRACT="0x5fbdb2315678afecb367f032d93F642f64180aa3"
FUNDER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
BASE_URL="http://localhost:8000/api/v1"
OUTPUT="wallets.csv"

echo "dni,name,wallet,private_key" > "$OUTPUT"

i=1
for file in "$FOLDER"/*.txt; do
  [[ -f "$file" ]] || continue

  NAME=$(basename "$file" .txt | tr '_' ' ')
  DNI="dni${i}"

  echo ""
  echo "╭──────────────────────────────────────────────────────────────────────────────╮"
  echo "📦 Procesando: $file"
  echo "🪪 Generando wallet y registrando $NAME con DNI $DNI..."

  # Llamar al script JS y capturar JSON de salida
  JSON=$(node register_candidate.js "$FUNDER_KEY" "$DNI" "$NAME")
  ADDRESS=$(echo "$JSON" | jq -r .wallet)
  PRIVATE_KEY=$(echo "$JSON" | jq -r .private_key)

  echo "✅ Registrado: $NAME ($ADDRESS)"

  # Subir programa al backend
  curl -s -X POST "$BASE_URL/${ADDRESS}/program" \
    -F "file=@${file}" \
    -F "overwrite=false"

  # Guardar en CSV
  echo "$DNI,$NAME,$ADDRESS,$PRIVATE_KEY" >> "$OUTPUT"
  echo "╰──────────────────────────────────────────────────────────────────────────────╯"

  ((i++))
done

echo ""
echo "╭──────────────────────────────────────────────────────────────────────────────╮"
echo "🧾 Guardado en $OUTPUT"
echo "✅ Todos los programas fueron cargados y registrados."
echo "╰──────────────────────────────────────────────────────────────────────────────╯"

