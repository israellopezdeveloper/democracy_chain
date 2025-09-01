#!/bin/bash

if [ "$NODE_ENV" = "development" ]; then
  npm run dev -- --host
else
  npm run build > /dev/null
  npm run preview
fi
