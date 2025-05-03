/**
 * Vibe Coder's Git Assistant
 * Main entry point for the MCP server
 */

const express = require('express');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
app.use(express.json());

// Import core modules
const gitHandler = require('./git/gitHandler');
const mcpHandler = require('./mcp/mcpHandler');

// Define routes
app.post('/mcp/events', mcpHandler.handleMcpEvent);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Vibe Coder's Git Assistant running on port ${PORT}`);
  console.log('Waiting for Claude MCP events...');
});
