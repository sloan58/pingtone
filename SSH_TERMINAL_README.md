# SSH Terminal Integration

This document describes the SSH terminal functionality that allows users to connect to UCM servers directly from the web interface.

## Overview

The SSH terminal integration consists of:

1. **SSH WebSocket Proxy Server** - A Node.js server that bridges WebSocket connections to SSH
2. **SSH Terminal React Component** - A web-based terminal using xterm.js
3. **Tabbed Interface** - UCM edit page with "Server Details" and "Remote Connection" tabs

## Components

### SSH Proxy Server (`docker/websockets/`)

- **ssh-proxy.js** - WebSocket to SSH bridge server
- **package.json** - Node.js dependencies (ws, ssh2)
- **Dockerfile** - Container configuration

### React Components

- **SSHTerminal.tsx** - Terminal component with connection management
- **UCM Edit Page** - Modified to include tabbed interface

## Usage

### Starting the SSH Proxy Server

#### Using Docker Compose

```bash
docker-compose -f docker-compose.ssh.yml up -d
```

#### Manual Start

```bash
cd docker/websockets
npm install
npm start
```

The proxy server will run on port 8080 by default.

### Using the SSH Terminal

1. Navigate to UCM → Edit UCM Server
2. Click the "Remote Connection" tab
3. Click "Connect" to establish SSH connection
4. Use the terminal to interact with the UCM server

## Configuration

### Environment Variables

- `SSH_PROXY_PORT` - Port for the WebSocket proxy server (default: 8080)

### Security Considerations

- The SSH proxy server runs locally and bridges WebSocket connections to SSH
- UCM credentials are used for SSH authentication
- Connections are established on-demand and closed when the browser tab is closed
- The proxy server should only be accessible from the application server

## Technical Details

### WebSocket Protocol

The SSH proxy uses a simple JSON message protocol:

```javascript
// Connect to SSH server
{
  "type": "connect",
  "host": "ucm.example.com",
  "port": 22,
  "username": "admin",
  "password": "password"
}

// Send terminal input
{
  "type": "data",
  "data": "ls -la\n"
}

// Resize terminal
{
  "type": "resize",
  "cols": 80,
  "rows": 24
}
```

### Terminal Features

- Full terminal emulation with xterm.js
- Scrollback buffer (1000 lines)
- Proper terminal resizing
- Connection status indicators
- Theater mode for full-screen terminal

## Troubleshooting

### Connection Issues

1. Ensure the SSH proxy server is running on port 8080
2. Check UCM server SSH access and credentials
3. Verify network connectivity between proxy and UCM server
4. Check browser console for WebSocket connection errors

### Terminal Display Issues

1. Refresh the page to reset terminal state
2. Check browser compatibility (modern browsers required)
3. Verify xterm.js dependencies are loaded

## Dependencies

### Node.js (SSH Proxy)

- ws: WebSocket server
- ssh2: SSH client library

### React (Frontend)

- @xterm/xterm: Terminal emulator
- @xterm/addon-fit: Terminal fitting addon
