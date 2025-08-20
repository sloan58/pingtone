#!/bin/bash

# Start SSH WebSocket Proxy Server for Pingtone
# This script starts the SSH proxy server required for the SSH terminal functionality

echo "Starting SSH WebSocket Proxy Server..."

# shellcheck disable=SC2164
cd docker/websockets

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the server
echo "Starting server on port 8080..."
npm start
