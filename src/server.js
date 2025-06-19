import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

import { resolvers } from './resolvers/index.js';
import { createContext } from './context.js';
import { initDb } from './db/db.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read GraphQL schema
const typeDefs = readFileSync(path.join(__dirname, '../schema/schema.gql'), 'utf8');

async function startServer() {
  // Initialize database
  await initDb();

  // Create Express app
  const app = express();

  // Create HTTP server
  const httpServer = http.createServer(app);

  // Security middleware (disable CSP for GraphQL in development)
  if (process.env.NODE_ENV === 'production') {
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://apollo-server-landing-page.cdn.apollographql.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://apollo-server-landing-page.cdn.apollographql.com"],
          imgSrc: ["'self'", "data:", "https:", "https://apollo-server-landing-page.cdn.apollographql.com"],
          connectSrc: ["'self'", "https://apollo-server-landing-page.cdn.apollographql.com"],
          manifestSrc: ["'self'", "https://apollo-server-landing-page.cdn.apollographql.com"],
          fontSrc: ["'self'", "https://apollo-server-landing-page.cdn.apollographql.com"],
          frameSrc: ["'self'", "https://apollo-server-landing-page.cdn.apollographql.com"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));
  } else {
    // In development, disable CSP for GraphQL routes
    app.use((req, res, next) => {
      if (req.path.startsWith('/graphql')) {
        return next();
      }
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      })(req, res, next);
    });
  }

  // Rate limiting - Increased for testing
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs (increased from 100)
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/graphql', limiter);

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: process.env.NODE_ENV !== 'production',
    playground: process.env.NODE_ENV !== 'production',
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      
      // Don't expose internal errors in production
      if (process.env.NODE_ENV === 'production') {
        // Only expose safe error messages
        if (error.extensions?.code === 'INTERNAL_ERROR') {
          return new Error('Internal server error');
        }
      }
      
      return error;
    }
  });

  // Start the server
  await server.start();

  // CORS configuration
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.ALLOWED_ORIGINS?.split(',') || []
      : true, // Allow all origins in development
    credentials: true,
  };

  // Apply GraphQL middleware
  app.use(
    '/graphql',
    cors(corsOptions),
    express.json({ limit: '10mb' }),
    expressMiddleware(server, {
      context: createContext,
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      message: 'GraphQL server is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Serve GraphQL Playground in development
  if (process.env.NODE_ENV !== 'production') {
    app.get('/', (req, res) => {
      res.redirect('/graphql');
    });
  }

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Express Error:', err.stack);
    res.status(500).json({
      error: 'Something went wrong!',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found'
    });
  });

  const PORT = process.env.PORT || 4000;

  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));

  console.log(`🚀 GraphQL server ready at http://localhost:${PORT}/graphql`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🎮 GraphQL Playground available at http://localhost:${PORT}/graphql`);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
