import 'dotenv/config';
import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import { aiRoutes } from "./routes/ai.routes";
import { datasetRoutes } from "./routes/dataset.routes";

const app = express();

// Trust reverse proxy for rate limiter
app.set('trust proxy', 1);

// Robust CORS & Preflight middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin']
}));

app.use(helmet({ contentSecurityPolicy: false })); // Disabled CSP for development/vite
app.use(express.json({ limit: "50mb" })); // To handle potentially large context
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// API routes FIRST
const healthHandler = (req: express.Request, res: express.Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
};

app.get("/api/health", healthHandler);
app.get("/health", healthHandler);

// Serve local uploads (only works effectively locally, on Vercel this is read-only except /tmp)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/ai", aiRoutes);
app.use("/ai", aiRoutes);

app.use("/api/datasets", datasetRoutes);
app.use("/datasets", datasetRoutes);

// API 404 handler: Never return HTML for unhandled API requests
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

export default app;
