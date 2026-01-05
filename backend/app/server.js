import './config/dotenv.js';
import app from './app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeSocketHandlers } from './socketHandler.js';

const PORT = process.env.PORT || 5000; // Get the port from .env or use 5000

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io with CORS
export const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:2000'],
    credentials: true,
  },
});

// Initialize Socket.io event handlers
initializeSocketHandlers(io);

// Start server
httpServer.listen(PORT, () => {
  console.log(`HTTP Server running on http://localhost:${PORT}`);
  console.log(`WebSocket Server ready for connections`);
});
