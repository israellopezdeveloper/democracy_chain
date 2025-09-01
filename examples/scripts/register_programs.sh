#!/bin/bash

# Ejecutar script Python para generar los programas HTML
echo "⚙️ Generando archivos HTML desde programas.md..."
python3 scripts/create_programs.py || {
  echo "❌ Error generando los programas"
  exit 1
}

FOLDER="./programs"
FUNDER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
BASE_URL="http://localhost:8000/api/v1"
OUTPUT="wallets.csv"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "dni,name,wallet,private_key" > "$OUTPUT"

i=1
for file in "$FOLDER"/*.html; do
  [[ -f "$file" ]] || continue

  NAME="name${i}"
  DNI="dni${i}"

  echo ""
  echo "╭──────────────────────────────────────────────────────────────────────────────╮"
  echo "📦 Procesando: $file"
  echo "🪪 Generando wallet y registrando $NAME con DNI $DNI..."

  # Llamar al script JS y capturar JSON de salida
  JSON=$(node "$SCRIPT_DIR/register_candidate.js" "$FUNDER_KEY" "$DNI" "$NAME")
  ADDRESS=$(echo "$JSON" | jq -r .wallet)
  PRIVATE_KEY=$(echo "$JSON" | jq -r .private_key)

  echo "✅ Registrado: $NAME ($ADDRESS)"

  # Subir programa al backend
  curl -s -X POST "$BASE_URL/${ADDRESS}/program" \
    -F "file=@${file}" \
    -F "overwrite=false"

  # Guardar en CSV
  echo "$DNI,$NAME,$ADDRESS,$PRIVATE_KEY" >> "$OUTPUT"
  echo ""
  echo "╰──────────────────────────────────────────────────────────────────────────────╯"

  ((i++))
done

echo ""
echo "╭──────────────────────────────────────────────────────────────────────────────╮"
echo "🧾 Guardado en $OUTPUT"
echo "✅ Todos los programas fueron cargados y registrados."
echo "╰──────────────────────────────────────────────────────────────────────────────╯"

