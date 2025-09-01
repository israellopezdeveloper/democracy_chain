#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env"
BLUE_COLOR="\033[0;34m"
NC="\033[0m"

now_ms() { echo $(( $(date +%s) * 1000 )); }
is_int()  { [[ "${1:-}" =~ ^[0-9]+$ ]]; }

NOW_MS=$(now_ms)

# Por defecto: +2 días y +4 días en milisegundos
NEW_REGISTRATION_DEADLINE=$(( NOW_MS + 2*24*60*60*1000 ))
NEW_VOTING_DEADLINE=$(( NOW_MS + 4*24*60*60*1000 ))

# Carga previa (si existe)
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

# Normaliza un timestamp esperado en ms: si no es int o es pasado, usa default
normalize_ms() {
  local val="${1:-}" default_ms="$2"
  if is_int "$val"; then
    # si vino en segundos por error (10 dígitos aprox), súbelo a ms
    if (( ${#val} <= 10 )); then
      val=$(( val * 1000 ))
    fi
    # futuro razonable
    if (( val > NOW_MS )); then
      echo "$val"
      return 0
    fi
  fi
  echo "$default_ms"
}

FINAL_REGISTRATION_DEADLINE="$(normalize_ms "${REGISTRATION_DEADLINE:-}" "$NEW_REGISTRATION_DEADLINE")"
FINAL_VOTING_DEADLINE="$(normalize_ms "${VOTING_DEADLINE:-}"       "$NEW_VOTING_DEADLINE")"

# Impresión humana (divide a segundos sólo para 'date -d @segundos')
print_human() {
  local ms="$1"
  local sec=$(( ms / 1000 ))
  date --date "@${sec}"
}

echo -e "📅 ${BLUE_COLOR}REGISTRATION_DEADLINE: $(print_human "$FINAL_REGISTRATION_DEADLINE")${NC}"
echo -e "📅 ${BLUE_COLOR}VOTING_DEADLINE:       $(print_human "$FINAL_VOTING_DEADLINE")${NC}"

# Reescribe .env (sin sed)
cat > "$ENV_FILE" <<EOF
REGISTRATION_DEADLINE=$FINAL_REGISTRATION_DEADLINE
VOTING_DEADLINE=$FINAL_VOTING_DEADLINE
EOF

echo "✅ $ENV_FILE actualizado:"
cat "$ENV_FILE"
echo "👉 Ejecuta: direnv allow"

