#!/usr/bin/env bash
# Use this script to test if a given TCP host/port are available

set -o errexit
set -o nounset
set -o pipefail

WAITFORIT_cmdname=${0##*/}

# Defaults
WAITFORIT_TIMEOUT=${WAITFORIT_TIMEOUT:-15}
WAITFORIT_STRICT=${WAITFORIT_STRICT:-0}
WAITFORIT_CHILD=${WAITFORIT_CHILD:-0}
WAITFORIT_QUIET=${WAITFORIT_QUIET:-0}

echoerr() {
  if [[ "${WAITFORIT_QUIET}" -ne 1 ]]; then
    echo "$@" 1>&2
  fi
}

usage() {
  cat << USAGE >&2
Usage:
  $WAITFORIT_cmdname host:port [-s] [-t timeout] [-- command args]
  -h HOST | --host=HOST       Host or IP under test
  -p PORT | --port=PORT       TCP port under test
                              Alternatively, you specify the host and port as host:port
  -s | --strict               Only execute subcommand if the test succeeds
  -q | --quiet                Don't output any status messages
  -t TIMEOUT | --timeout=TIMEOUT
                              Timeout in seconds, zero for no timeout
  -- COMMAND ARGS             Execute command with args after the test finishes
USAGE
  exit 1
}

wait_for() {
  if [[ "${WAITFORIT_TIMEOUT}" -gt 0 ]]; then
    echoerr "$WAITFORIT_cmdname: waiting ${WAITFORIT_TIMEOUT} seconds for ${WAITFORIT_HOST}:${WAITFORIT_PORT}"
  else
    echoerr "$WAITFORIT_cmdname: waiting for ${WAITFORIT_HOST}:${WAITFORIT_PORT} without a timeout"
  fi

  WAITFORIT_start_ts=$(date +%s)

  while :; do
    if [[ "${WAITFORIT_ISBUSY}" -eq 1 ]]; then
      # Busybox netcat
      nc -z "$WAITFORIT_HOST" "$WAITFORIT_PORT"
      WAITFORIT_result=$?
    else
      # Bash /dev/tcp
      (echo -n > "/dev/tcp/${WAITFORIT_HOST}/${WAITFORIT_PORT}") >/dev/null 2>&1
      WAITFORIT_result=$?
    fi

    if [[ "${WAITFORIT_result}" -eq 0 ]]; then
      WAITFORIT_end_ts=$(date +%s)
      echoerr "$WAITFORIT_cmdname: ${WAITFORIT_HOST}:${WAITFORIT_PORT} is available after $((WAITFORIT_end_ts - WAITFORIT_start_ts)) seconds"
      break
    fi

    sleep 1
  done

  # return expects an int; quoting is harmless and silences SC2086
  return "${WAITFORIT_result}"
}

wait_for_wrapper() {
  # In order to support SIGINT during timeout: http://unix.stackexchange.com/a/57692
  if [[ "${WAITFORIT_QUIET}" -eq 1 ]]; then
    timeout ${WAITFORIT_BUSYTIMEFLAG} "${WAITFORIT_TIMEOUT}" "$0" --quiet --child --host="${WAITFORIT_HOST}" --port="${WAITFORIT_PORT}" --timeout="${WAITFORIT_TIMEOUT}" &
  else
    timeout ${WAITFORIT_BUSYTIMEFLAG} "${WAITFORIT_TIMEOUT}" "$0" --child --host="${WAITFORIT_HOST}" --port="${WAITFORIT_PORT}" --timeout="${WAITFORIT_TIMEOUT}" &
  fi
  WAITFORIT_PID=$!
  # Use single quotes so the variable is expanded at signal time, not now (SC2064)
  trap 'kill -INT -'"$WAITFORIT_PID" INT
  wait "$WAITFORIT_PID" || true
  WAITFORIT_RESULT=$?
  if [[ "${WAITFORIT_RESULT}" -ne 0 ]]; then
    echoerr "$WAITFORIT_cmdname: timeout occurred after waiting ${WAITFORIT_TIMEOUT} seconds for ${WAITFORIT_HOST}:${WAITFORIT_PORT}"
  fi
  return "${WAITFORIT_RESULT}"
}

# process arguments
WAITFORIT_HOST=""
WAITFORIT_PORT=""
WAITFORIT_CLI=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    *:*)
      IFS=':' read -r WAITFORIT_HOST WAITFORIT_PORT <<< "$1"
      shift
      ;;
    --child)
      WAITFORIT_CHILD=1
      shift
      ;;
    -q|--quiet)
      WAITFORIT_QUIET=1
      shift
      ;;
    -s|--strict)
      WAITFORIT_STRICT=1
      shift
      ;;
    -h)
      WAITFORIT_HOST="${2-}"
      [[ -z "${WAITFORIT_HOST}" ]] && break
      shift 2
      ;;
    --host=*)
      WAITFORIT_HOST="${1#*=}"
      shift
      ;;
    -p)
      WAITFORIT_PORT="${2-}"
      [[ -z "${WAITFORIT_PORT}" ]] && break
      shift 2
      ;;
    --port=*)
      WAITFORIT_PORT="${1#*=}"
      shift
      ;;
    -t)
      WAITFORIT_TIMEOUT="${2-}"
      [[ -z "${WAITFORIT_TIMEOUT}" ]] && break
      shift 2
      ;;
    --timeout=*)
      WAITFORIT_TIMEOUT="${1#*=}"
      shift
      ;;
    --)
      shift
      # Resto de argumentos a array (evita SC2128)
      WAITFORIT_CLI=("$@")
      break
      ;;
    --help)
      usage
      ;;
    *)
      echoerr "Unknown argument: $1"
      usage
      ;;
  esac
done

if [[ -z "${WAITFORIT_HOST}" || -z "${WAITFORIT_PORT}" ]]; then
  echoerr "Error: you need to provide a host and port to test."
  usage
fi

# Check to see if timeout is from busybox
WAITFORIT_TIMEOUT_PATH="$(type -p timeout || true)"
if [[ -n "${WAITFORIT_TIMEOUT_PATH}" ]]; then
  WAITFORIT_TIMEOUT_PATH="$(realpath "${WAITFORIT_TIMEOUT_PATH}" 2>/dev/null || readlink -f "${WAITFORIT_TIMEOUT_PATH}" || echo "${WAITFORIT_TIMEOUT_PATH}")"
else
  WAITFORIT_TIMEOUT_PATH=""
fi

WAITFORIT_BUSYTIMEFLAG=""
if [[ "${WAITFORIT_TIMEOUT_PATH}" == *"busybox"* ]]; then
  WAITFORIT_ISBUSY=1
  # Detecta si busybox timeout usa -t (SC2260 fixed: no &> with pipe)
  if timeout 2>&1 | grep -q -- '-t '; then
    WAITFORIT_BUSYTIMEFLAG="-t"
  fi
else
  WAITFORIT_ISBUSY=0
fi

if [[ "${WAITFORIT_CHILD}" -gt 0 ]]; then
  wait_for
  WAITFORIT_RESULT=$?
  exit "${WAITFORIT_RESULT}"
else
  if [[ "${WAITFORIT_TIMEOUT}" -gt 0 ]]; then
    wait_for_wrapper
    WAITFORIT_RESULT=$?
  else
    wait_for
    WAITFORIT_RESULT=$?
  fi
fi

if [[ ${#WAITFORIT_CLI[@]} -gt 0 ]]; then
  if [[ "${WAITFORIT_RESULT}" -ne 0 && "${WAITFORIT_STRICT}" -eq 1 ]]; then
    echoerr "$WAITFORIT_cmdname: strict mode, refusing to execute subprocess"
    exit "${WAITFORIT_RESULT}"
  fi
  exec "${WAITFORIT_CLI[@]}"
else
  exit "${WAITFORIT_RESULT}"
fi

