/**
 * Model Context Protocol (MCP) Server
 * 
 * This module implements a server that communicates with Claude Desktop
 * through the Model Context Protocol (MCP).
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mcpHandler = require('./mcpHandler');
const logger = require('../utils/logger');

class McpServer {
  constructor(options = {}) {
    this.port = options.port || process.env.PORT || 3000;
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
  }

  /**
   * Configure Express middleware
   */
  configureMiddleware() {
    this.app.use(bodyParser.json({ limit: '10mb' }));
    this.app.use(cors());
    this.app.use(this.logRequests);
  }

  /**
   * Middleware for logging requests
   */
  logRequests(req, res, next) {
    logger.info(`${req.method} ${req.url}`);
    next();
  }

  /**
   * Configure server routes
   */
  configureRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });

    // MCP protocol endpoints
    this.app.post('/mcp/events', mcpHandler.handleMcpEvent);
    this.app.post('/mcp/register', mcpHandler.registerClient);
    this.app.get('/mcp/status', mcpHandler.getStatus);

    // Error handler
    this.app.use(this.errorHandler);
  }

  /**
   * Global error handler
   */
  errorHandler(err, req, res, next) {
    logger.error(`Error: ${err.message}`);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  /**
   * Start the MCP server
   * @returns {Promise} Promise that resolves when the server starts
   */
  start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        logger.info(`MCP Server running on port ${this.port}`);
        resolve(this);
      });
    });
  }

  /**
   * Stop the MCP server
   * @returns {Promise} Promise that resolves when the server stops
   */
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('MCP Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = McpServer;
