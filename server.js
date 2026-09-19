import express from "express";
import globalMiddleware from "./src/middleware/global.js";
import Path from "path";
import routes from "./src/routes/router.js";
import pkg from "./package.json" with { type: "json" };
import { fileURLToPath } from "url";
import connectDB from "./src/models/db.js";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);
const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || "production";
const PORT = process.env.PORT || 3000;

const app = express();

app.use((req, res, next) => {
  res.locals.appVersion = pkg.version;
  next();
});

app.use(express.static(Path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", Path.join(__dirname, "src/views"));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(globalMiddleware);

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Kizuna Rail API",
      version: pkg.version,
      description: "API documentation for Kizuna Rail",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ["./src/routes/*.js"],
});

app.get("/test-api", (req, res) => {
  res.json({
    message: "API works",
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/", routes);

app.use((req, res, next) => {
  const err = new Error("Page Not Found");
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const template = status === 404 ? "404" : "500";

  const context = {
    title: status === 404 ? "Page Not Found" : "Server Error",
    error: err.message,
    stack: err.stack,
  };

  res.status(status).render(`errors/${template}`, context);
});

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
