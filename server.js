import "dotenv/config";
import express from "express";
import globalMiddleware from "./src/middleware/global.js";
import Path from "path";
import routes from "./src/routes/router.js";
import pkg from "./package.json" with { type: "json" };
import { fileURLToPath } from "url";
import connectDB from "./src/models/db.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";

/**
 * Declare Important Variables
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);
const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || "production";
const PORT = process.env.PORT || 3000;

/**
 * Setup Express Server
 */
const app = express();

/**
 * Configure Express middleware
 */

app.use((req, res, next) => {
  res.locals.appVersion = pkg.version;
  next();
});

app.use(express.static(Path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", Path.join(__dirname, "src/views"));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * Global Middleware
 */

app.use(globalMiddleware);

/**
 * API Documentation
 */

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * Routes
 */

app.use("/", routes);

/**
 * Error Handling
 */

app.use((req, res, next) => {
  const err = new Error("Page Not Found");
  err.status = 404;
  next(err);
});

app.use((err, req, res) => {
  const status = err.status || 500;
  const template = status === 404 ? "404" : "500";

  const context = {
    title: status === 404 ? "Page Not Found" : "Server Error",
    error: err.message,
    stack: err.stack,
  };

  res.status(status).render(`errors/${template}`, context);
});

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
