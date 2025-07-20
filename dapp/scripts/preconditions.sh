#!/usr/bin/env bash

# preconditions.sh

ENV_FILE=".env"
BLUE_COLOR="\033[0;34m"
NC="\033[0m"

# Timestamp actual en milisegundos
NOW_MS=$(($(date +%s%N)/1000000))

# Función para validar timestamp
is_valid_timestamp() {
  local val="$(($1 / 1000))"
  [[ "$val" =~ ^[0-9]+$ ]] && [ "$val" -gt "$NOW_MS" ]
}

# Calcular nuevos valores
NEW_REGISTRATION_DEADLINE=$((NOW_MS + 2 * 24 * 60 * 60 * 1000))
NEW_VOTING_DEADLINE=$((NOW_MS + 4 * 24 * 60 * 60 * 1000))

# Variables para almacenar qué poner
FINAL_REGISTRATION_DEADLINE=""
FINAL_VOTING_DEADLINE=""

# Inicializar si existe archivo
if [[ -f "$ENV_FILE" ]]; then
  # Cargar las variables actuales
  source "$ENV_FILE"
fi

# Evaluar REGISTRATION_DEADLINE
if is_valid_timestamp "$REGISTRATION_DEADLINE"; then
  FINAL_REGISTRATION_DEADLINE="$REGISTRATION_DEADLINE"
else
  FINAL_REGISTRATION_DEADLINE="$NEW_REGISTRATION_DEADLINE"
fi
echo -e "📅 ${BLUE_COLOR}REGISTRATION_DEADLINE: $(date --date "@$((${FINAL_REGISTRATION_DEADLINE} / 1000))")${NC}"

# Evaluar VOTING_DEADLINE
if is_valid_timestamp "$VOTING_DEADLINE"; then
  FINAL_VOTING_DEADLINE="$VOTING_DEADLINE"
else
  FINAL_VOTING_DEADLINE="$NEW_VOTING_DEADLINE"
fi
echo -e "📅 ${BLUE_COLOR}VOTING_DEADLINE:       $(date --date "@$((${FINAL_VOTING_DEADLINE} / 1000))")${NC}"

# Crear archivo si no existe
if [[ ! -f "$ENV_FILE" ]]; then
  echo "✅ Creando nuevo archivo $ENV_FILE..."
  cat > "$ENV_FILE" <<EOF
REGISTRATION_DEADLINE=$FINAL_REGISTRATION_DEADLINE
VOTING_DEADLINE=$FINAL_VOTING_DEADLINE
EOF
  echo "👉 Ejecuta: direnv allow"
  exit 0
fi

# Si existe, editar o añadir líneas

update_or_add() { local var="$1"
  local value="$2"

  if grep -q "^$var=" "$ENV_FILE"; then
    sed -i.bak "s|^$var=.*|$var=$value|" "$ENV_FILE"
  else
    echo "$var=$value" >> "$ENV_FILE"
  fi
}

update_or_add "REGISTRATION_DEADLINE" "$FINAL_REGISTRATION_DEADLINE"
update_or_add "VOTING_DEADLINE" "$FINAL_VOTING_DEADLINE"

# Eliminar backup intermedio
rm -f "${ENV_FILE}.bak"

echo "✅ $ENV_FILE actualizado:"
cat "$ENV_FILE"
echo "👉 Ejecuta: direnv allow"

