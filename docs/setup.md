# Setup Guide for Vibe Coder's Git Assistant

## Prerequisites

1. Node.js (v14+) and npm installed
2. GitHub account
3. Claude Desktop application

## Installation

1. Clone this repository:
```bash
git clone https://github.com/sujay3srivastava/vibe-coders-git-assistant.git
cd vibe-coders-git-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Create a GitHub personal access token:
   - Go to GitHub.com → Settings → Developer settings → Personal access tokens
   - Generate a new token with `repo` scope permissions

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your GitHub token and other configuration

## Running the Application

1. Start the MCP server:
```bash
npm start
```

2. Configure Claude Desktop to connect to the local server
   - Open Claude Desktop
   - Go to Settings → Plugins
   - Add the Vibe Coder's Git Assistant plugin
   - Enter the URL of your local server (typically http://localhost:3000)

## Usage

1. Create a new project or open an existing one in Claude Desktop
2. Start coding with Claude
3. The Git Assistant will automatically:
   - Create a repository if needed
   - Commit changes after each Claude response
   - Track your progress through the project

4. Use natural language to navigate through versions:
   - Say "Go back to when we added the login feature" to revert to that point
   - Ask "Show me the timeline of changes" to see your project history

## Troubleshooting

If you encounter any issues:

1. Check the console output for error messages
2. Verify your GitHub token has the correct permissions
3. Ensure the MCP server is running and accessible to Claude Desktop
