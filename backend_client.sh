#!/bin/bash

BASE_URL="http://localhost:8000/api/v1"

upload_program_file() {
  local file="$1"
  local wallet="0x$(openssl rand -hex 20)"
  echo "📤 Subiendo $file con wallet: $wallet"

  RESPONSE=$(curl -s -X POST "$BASE_URL/${wallet}/program" \
    -F "file=@${file}" \
    -F "overwrite=false")

  echo "✅ $file subido con wallet $wallet"
  echo "$RESPONSE"
  echo
}

batch_upload_from_folder() {
  local folder="$1"

  if [[ ! -d "$folder" ]]; then
    echo "❌ La carpeta '$folder' no existe."
    exit 1
  fi

  mapfile -t FILES < <(find "$folder" -maxdepth 1 -type f -name "*.txt")

  if [[ ${#FILES[@]} -eq 0 ]]; then
    echo "📭 No se encontraron archivos .txt en '$folder'"
    exit 1
  fi

  echo "🚀 Subiendo ${#FILES[@]} archivos desde '$folder'..."

  for file in "${FILES[@]}"; do
    upload_program_file "$file"
  done

  echo "✅ Subida por lote completada."
  exit 0
}

# 👉 Procesar parámetro --folder
if [[ "$1" == "--folder" && -n "$2" ]]; then
  batch_upload_from_folder "$2"
fi

WALLET="0x$(openssl rand -hex 20)"  # 40 caracteres, estilo Ethereum

echo "🪪 Wallet generado: $WALLET"

select_local_file() {
  echo
  echo "📁 Archivos disponibles en el directorio actual:"
  mapfile -t FILES < <(find . -maxdepth 1 -type f | sed 's|^\./||')
  if [[ ${#FILES[@]} -eq 0 ]]; then
    echo "❌ No hay archivos en el directorio actual."
    return 1
  fi

  select FILE in "${FILES[@]}"; do
    if [[ -n "$FILE" ]]; then
      REPLY="$FILE"
      return 0
    else
      echo "❌ Selección inválida."
    fi
  done
}

upload_program() {
  select_local_file
  FILEPATH="${REPLY}"
  read -rp "¿Quieres sobrescribir si ya existe? (y/n): " OVER
  OVERWRITE=false
  [[ "$OVER" == "y" ]] && OVERWRITE=true

  RESPONSE=$(curl -s -X POST "$BASE_URL/${WALLET}/program" \
    -F "file=@${FILEPATH}" \
    -F "overwrite=${OVERWRITE}")

  echo "✅ Subido como:"
  echo "$RESPONSE"
}

delete_program() {
  RESPONSE=$(curl -s -X DELETE "$BASE_URL/${WALLET}/program")
  echo "🗑️ $RESPONSE"
}

read_main() {
  echo "📖 Leyendo archivo 'main' del wallet $WALLET..."
  RESPONSE=$(curl -s -X GET "$BASE_URL/${WALLET}/program")

  if [[ -z "$RESPONSE" ]]; then
    echo "❌ No se encontró el archivo 'main'."
  else
    echo
    echo "=== Contenido de 'main' ==="
    echo "$RESPONSE"
    echo "==========================="
  fi
}

upload_file() {
  select_local_file
  FILEPATH="${REPLY}"
  RESPONSE=$(curl -s -X POST "$BASE_URL/${WALLET}/file" \
    -F "file=@${FILEPATH}")
  echo "✅ Subido como:"
  echo "$RESPONSE"
}

list_files() {
  RESPONSE=$(curl -s -X GET "$BASE_URL/${WALLET}/file")
  if [[ "$RESPONSE" == "[]" ]]; then
    echo "📭 No hay archivos para $WALLET"
  else
    echo "$RESPONSE"  | jq 
  fi
}

delete_one() {
  RESPONSE=$(curl -s -X GET "$BASE_URL/${WALLET}/file")
  FILES=($(echo "$RESPONSE" | jq -r '.[].filename'))

  if [[ ${#FILES[@]} -eq 0 ]]; then
    echo "❌ No hay archivos para eliminar."
    return
  fi

  echo "🗑️ Elige el archivo a eliminar:"
  select FILENAME in "${FILES[@]}"; do
    if [[ -n "$FILENAME" ]]; then
      RESPONSE=$(curl -s -X DELETE "$BASE_URL/${WALLET}/file/${FILENAME}")
      echo "✅"
      echo "$RESPONSE" | jq
      return
    else
      echo "❌ Selección inválida."
    fi
  done
}

delete_all() {
  read -rp "⚠️ ¿Eliminar TODOS los archivos de $WALLET? (y/n): " CONFIRM
  if [[ "$CONFIRM" == "y" ]]; then
    RESPONSE=$(curl -s -X DELETE "$BASE_URL/${WALLET}/file")
    echo "✅"
    echo "$RESPONSE" | jq
  else
    echo "❎ Cancelado."
  fi
}

download_file() {
  RESPONSE=$(curl -s -X GET "$BASE_URL/${WALLET}/file")
  FILES=($(echo "$RESPONSE" | jq -r '.[].filename'))

  if [[ ${#FILES[@]} -eq 0 ]]; then
    echo "❌ No hay archivos para descargar."
    return
  fi

  echo "💾 Elige el archivo a descargar:"
  select FILENAME in "${FILES[@]}"; do
    if [[ -n "$FILENAME" ]]; then
      curl -s -X GET "$BASE_URL/${WALLET}/file/${FILENAME}/download" -o "$FILENAME"
      echo "✅ Descargado como $FILENAME"
      return
    else
      echo "❌ Selección inválida."
    fi
  done
}

list_wallets() {
  echo "📒 Carteras registradas:"
  RESPONSE=$(curl -s -X GET "$BASE_URL/wallets")
  if [[ "$RESPONSE" == "[]" ]]; then
    echo "📭 No hay carteras registradas aún."
  else
    echo "$RESPONSE"  | jq
  fi
}

delete_wallet() {
  echo "🗑️ Obteniendo carteras..."
  RESPONSE=$(curl -s -X GET "$BASE_URL/wallets")
  WALLETS=($(echo "$RESPONSE" | jq -r '.[].wallet_address'))

  if [[ ${#WALLETS[@]} -eq 0 ]]; then
    echo "📭 No hay carteras registradas."
    return
  fi

  echo "🧨 Elige la cartera a eliminar:"
  select WALLET_TO_DELETE in "${WALLETS[@]}"; do
    if [[ -n "$WALLET_TO_DELETE" ]]; then
      read -rp "⚠️ ¿Seguro que deseas eliminar la cartera $WALLET_TO_DELETE? (y/n): " CONFIRM
      if [[ "$CONFIRM" == "y" ]]; then
        RESPONSE=$(curl -s -X DELETE "$BASE_URL/$WALLET_TO_DELETE")
        echo "✅"
        echo "$RESPONSE" | jq
      else
        echo "❎ Cancelado."
      fi
      return
    else
      echo "❌ Selección inválida."
    fi
  done
}

print_menu() {
  echo
  echo "=== MENÚ (${WALLET}) ==="
  echo "------- Archivos -------"
  echo "1. Subir archivo"
  echo "2. Listar archivos"
  echo "3. Eliminar un archivo"
  echo "4. Eliminar todos los archivos"
  echo "5. Descargar archivo"
  echo "------- Programa -------"
  echo "6. Subir programa"
  echo "7. Leer programa"
  echo "8. Eliminar programa 'main'"
  echo "-------- Wallet --------"
  echo "9. Listar todas las carteras"
  echo "10. Eliminar una cartera"
  echo "0. Salir"
  echo
}

while true; do
  print_menu
  read -rp "Elige una opción: " OPTION
  printf '\033c'
  case $OPTION in
    1) upload_file ;;
    2) list_files ;;
    3) delete_one ;;
    4) delete_all ;;
    5) download_file ;;
    6) upload_program ;;
    7) read_main ;;
    8) delete_program ;;
    9) list_wallets ;;
    10) delete_wallet ;;
    0) echo "👋 Saliendo..."; break ;;
    *) echo "❌ Opción inválida." ;;
  esac
done
