const WebSocket = require("ws");

// Update the WebSocket server URL with the appropriate protocol and port provided by cyclic.sh
const wsServerUrl = "wss://websocket.cyclic.app:8080"; // Update with your cyclic.sh URL and port

const wss = new WebSocket.Server({ noServer: true });

wss.on("listening", () => {
    console.log(`WebSocket server started at ${wsServerUrl}`);
});

let connectedUsersCount = 0;

wss.on("connection", (ws) => {
    console.log("WebSocket client connected.");

    // Increment connected users count
    connectedUsersCount++;

    // Send initial count to the newly connected client
    ws.send(JSON.stringify({
        type: 'connected_users_count',
        count: connectedUsersCount,
    }));

    ws.on("message", (message) => {
        console.log("Received message:", message);

        // Handle the received message, if needed

        // For example, you can broadcast the cursor position to other clients:
        const data = JSON.parse(message);
        const x = data.x;
        const y = data.y;

        broadcastCursorPosition(ws, x, y);
    });

    ws.on("close", () => {
        console.log("WebSocket client disconnected.");

        // Decrement connected users count
        connectedUsersCount--;

        // Broadcast the updated count to all connected clients
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'connected_users_count',
                    count: connectedUsersCount,
                }));
            }
        });

        // Cleanup cursor element on client disconnect
        broadcastCursorPosition(ws, 0, 0);
    });
});

function broadcastCursorPosition(ws, x, y) {
    const data = {
        type: "cursor_position",
        userId: ws._socket.remoteAddress,
        x,
        y,
    };

    wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// In case cyclic.sh requires a custom HTTP server, you need to create an HTTP server and upgrade the connection to WebSocket
const http = require('http');

const server = http.createServer((req, res) => {
    // You may handle HTTP requests here if necessary
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// Start the HTTP server
server.listen(process.env.PORT || 8080); // Use the provided port by cyclic.sh or fallback to port 8080 if not provided
