import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/environment';
import { setupSwagger } from './config/swagger';
import { connectDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import routes from './routes';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API server is running and healthy
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-12-01T12:00:00.000Z"
 *                 environment:
 *                   type: string
 *                   example: "development"
 *             examples:
 *               healthy:
 *                 summary: Healthy server response
 *                 value:
 *                   status: "OK"
 *                   timestamp: "2023-12-01T12:00:00.000Z"
 *                   environment: "development"
 */
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// Mount API routes
app.use('/api', routes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API information endpoint
 *     description: Get basic information about the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Node.js TypeScript API Demo"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 documentation:
 *                   type: string
 *                   example: "http://localhost:3000/api-docs"
 *             examples:
 *               info:
 *                 summary: API information
 *                 value:
 *                   message: "Node.js TypeScript API Demo"
 *                   version: "1.0.0"
 *                   environment: "development"
 *                   documentation: "http://localhost:3000/api-docs"
 */
app.get('/', (_req, res) => {
  res.json({
    message: 'Node.js TypeScript API Demo',
    version: '1.0.0',
    environment: config.NODE_ENV,
    documentation: `http://localhost:${config.PORT}/api-docs`
  });
});

// Setup Swagger documentation
setupSwagger(app);

// Error handling middleware (must be after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Start server with database connection
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start HTTP server
    const PORT = config.PORT;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${config.NODE_ENV} mode`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start server only if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;