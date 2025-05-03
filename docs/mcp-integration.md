# Model Context Protocol Integration

This document explains how the Vibe Coder's Git Assistant integrates with Claude Desktop using the Model Context Protocol (MCP).

## What is MCP?

The Model Context Protocol (MCP) is a standardized communication protocol that enables third-party applications to integrate with Claude Desktop. It allows our Git Assistant to:

1. Receive notifications when Claude generates or modifies code
2. Access the context of the conversation (prompts and responses)
3. Perform actions based on the user's interactions with Claude

## Integration Architecture

```
+----------------+        +-------------------+       +----------------+
|                |        |                   |       |                |
| Claude Desktop |<------>| MCP Server (Node) |<----->| GitHub API     |
|                |        |                   |       |                |
+----------------+        +-------------------+       +----------------+
                                   |
                                   |
                                   v
                          +------------------+
                          |                  |
                          | Local Git Repo   |
                          |                  |
                          +------------------+
```

## Event Types

Our MCP integration handles these key event types:

1. **Code Generation**: When Claude generates new code
2. **Code Edit**: When Claude modifies existing code
3. **History Navigation**: When the user asks to navigate through version history

## Implementation Details

### MCP Server Setup

The MCP server is implemented as an Express.js application that listens for webhook events from Claude Desktop:

```javascript
const app = express();
app.use(express.json());

// Define routes for MCP events
app.post('/mcp/events', mcpHandler.handleMcpEvent);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Vibe Coder's Git Assistant running on port ${PORT}`);
});
```

### Event Processing

Each MCP event is processed by specialized handlers:

```javascript
async function handleMcpEvent(req, res) {
  const event = req.body;
  
  switch (event.type) {
    case 'code_generation':
      await handleCodeGeneration(event);
      break;
    case 'code_edit':
      await handleCodeEdit(event);
      break;
    case 'history_navigation':
      await handleHistoryNavigation(event.command);
      break;
  }
  
  res.status(200).json({ success: true });
}
```

### Authentication and Configuration

The MCP server requires:

1. GitHub authentication token for repository operations
2. Claude Desktop API credentials
3. Configuration for default project settings

These are stored in environment variables:

```
GITHUB_TOKEN=your_github_personal_access_token
CLAUDE_API_KEY=your_claude_api_key
DEFAULT_PROJECT_PATH=./workspace
```

## Natural Language Processing for Version Control

A key feature of our implementation is the ability to interpret natural language commands for version navigation:

```javascript
function parseHistoryCommand(command) {
  // Pattern matching for version control commands
  if (command.match(/go back|revert|undo|previous version/i)) {
    // Extract feature references, time references, etc.
    // Map these to specific commits in the repository
  }
}
```

## Automatic Commit Categories

The system automatically categorizes code changes based on patterns in the Claude prompt and response:

- **New Feature**: When new functionality is added
- **Bug Fix**: When existing code is corrected
- **UI Changes**: When user interface elements are modified
- **Refactoring**: When code is restructured without behavior changes
- **Documentation**: When comments or documentation are added/updated

## Security Considerations

1. **GitHub Token Security**: Tokens are stored securely in environment variables
2. **Permission Scopes**: Minimal required GitHub permissions are used
3. **Local File Access**: Proper permission management for file system operations
4. **Error Handling**: Graceful handling of authentication failures

## Future Enhancements

1. **Advanced NLP**: More sophisticated natural language understanding for version navigation
2. **Conflict Resolution**: Smarter handling of merge conflicts
3. **Multi-User Support**: Collaborative coding with proper version control
4. **Educational Feedback**: Explanations of Git operations to help users learn version control
