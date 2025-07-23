#!/usr/bin/env bash
host="$1"
port="$2"
shift 2

timeout=30
start_ts=$(date +%s)
while :
do
    (echo > /dev/tcp/$host/$port) >/dev/null 2>&1 && break
    now_ts=$(date +%s)
    if [[ $((now_ts - start_ts)) -ge $timeout ]]; then
        echo "Timeout waiting for $host:$port"
        exit 1
    fi
    sleep 1
done

exec "$@"

