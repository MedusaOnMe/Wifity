import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Add global unhandled exception handlers to prevent crashes
process.on('uncaughtException', (err) => {
  log(`UNCAUGHT EXCEPTION: ${err.name}: ${err.message}\n${err.stack || ''}`);
  // Note: Not exiting process to keep server alive, but this should be monitored
});

process.on('unhandledRejection', (reason, promise) => {
  log(`UNHANDLED REJECTION: ${reason instanceof Error ? reason.stack : String(reason)}`);
  // Note: Not exiting process to keep server alive, but this should be monitored
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set longer default timeouts
const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes
app.use((req, res, next) => {
  req.setTimeout(DEFAULT_TIMEOUT);
  res.setTimeout(DEFAULT_TIMEOUT);
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      // Log the error details for debugging
      log(`EXPRESS ERROR: ${err.name}: ${err.message}\n${err.stack || ''}`);
      
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
      // Don't throw the error again, handle it here
      // throw err;  <- Removing this line to prevent crashing
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
      const address = server.address();
      const url = address && typeof address === 'object' ? 
        `http://${address.address === '0.0.0.0' ? 'localhost' : address.address}:${address.port}` :
        `http://localhost:${port}`;
      
    log(`serving on port ${port}`);
  });
  } catch (err: any) {
    log(`SERVER STARTUP ERROR: ${err.name}: ${err.message}\n${err.stack || ''}`);
  }
})();
