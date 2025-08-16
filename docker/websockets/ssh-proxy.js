const WebSocket = require('ws');
const { Client } = require('ssh2');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    let sshClient = null;
    let sshStream = null;

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data.type);

            if (data.type === 'connect') {
                console.log('Connecting to SSH:', data.host);
                // Create SSH connection
                sshClient = new Client();

                sshClient.on('ready', () => {
                    console.log('SSH connection established');
                    ws.send(JSON.stringify({ type: 'connected' }));

                    // Create shell after connection is ready
                    sshClient.shell((err, stream) => {
                        if (err) {
                            console.error('Shell error:', err);
                            ws.send(JSON.stringify({ type: 'error', message: err.message }));
                            return;
                        }

                        console.log('SSH shell created');
                        sshStream = stream;

                        stream.on('data', (data) => {
                            console.log('SSH data received:', data.toString());
                            ws.send(JSON.stringify({ type: 'data', data: data.toString() }));
                        });

                        stream.on('close', () => {
                            console.log('SSH stream closed');
                            ws.send(JSON.stringify({ type: 'disconnected' }));
                        });

                        stream.on('error', (err) => {
                            console.error('SSH stream error:', err);
                            ws.send(JSON.stringify({ type: 'error', message: err.message }));
                        });
                    });
                });

                sshClient.on('error', (err) => {
                    console.error('SSH error:', err);
                    ws.send(JSON.stringify({ type: 'error', message: err.message }));
                });

                sshClient.on('close', () => {
                    console.log('SSH connection closed');
                    ws.send(JSON.stringify({ type: 'disconnected' }));
                });

                // Connect to SSH server
                sshClient.connect({
                    host: data.host,
                    port: data.port || 22,
                    // username: data.username,
                    // password: data.password
                    username: 'Administrator',
                    password: 'A$h8urn!'
                });

            } else if (data.type === 'data' && sshClient) {
                console.log('Sending data to SSH:', data.data);
                // Send data to SSH
                if (sshStream) {
                    sshStream.write(data.data);
                }
            } else if (data.type === 'resize' && sshStream) {
                console.log('Resizing terminal:', data.cols, 'x', data.rows);
                // Resize terminal
                sshStream.setWindow(data.rows, data.cols);
            }

        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        if (sshClient) {
            sshClient.end();
        }
    });


});

const PORT = process.env.SSH_PROXY_PORT || 8080;
server.listen(PORT, () => {
    console.log(`SSH WebSocket proxy listening on port ${PORT}`);
});
