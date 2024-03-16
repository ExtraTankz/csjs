const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080, host: "127.0.0.1" });

wss.on("listening", () => {
    const address = wss.address();
    console.log(`WebSocket server started at ws://${address.address}:${address.port}`);
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
            if (client.readyState === WebSocket.OPEN) {
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