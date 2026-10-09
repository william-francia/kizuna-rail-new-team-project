import "dotenv/config";
import app from "./app.js";
import connectDB from "./src/models/db.js";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

if (process.env.DNS_SERVERS) {
  const servers = process.env.DNS_SERVERS.split(",").map((s) => s.trim());
  dns.setServers(servers);
}

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || "production";

/**
 * Start WebSocket Server in Development Mode
 */

if (NODE_ENV.includes("dev")) {
  const ws = await import("ws");

  try {
    const wsPort = parseInt(PORT) + 1;
    const wsServer = new ws.WebSocketServer({ port: wsPort });

    wsServer.on("listening", () => {
      console.log(`WebSocket server is running on port ${wsPort}`);
    });

    wsServer.on("error", (error) => {
      console.error("WebSocket server error:", error);
    });
  } catch (error) {
    console.error("Failed to start WebSocket server:", error);
  }
}

/**
 * Start Server
 */

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on http://127.0.0.1:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();