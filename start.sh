#!/bin/bash
# OpenBay startup script

cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting OpenBay server..."
npm start
