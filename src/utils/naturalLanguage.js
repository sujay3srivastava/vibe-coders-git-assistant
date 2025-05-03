/**
 * Natural Language Processing utilities
 * Handles parsing natural language commands for version navigation
 */

/**
 * Parses a natural language history command
 * @param {string} command - The natural language command
 * @returns {object} - Parsed command information
 */
function parseHistoryCommand(command) {
  // Simple pattern matching implementation for MVP
  // Will be enhanced with more sophisticated NLP as needed
  
  const result = {
    type: null,
    projectPath: process.env.DEFAULT_PROJECT_PATH || '.',
    target: null
  };
  
  // Check for revert commands
  if (command.match(/go back|revert|undo|previous version/i)) {
    result.type = 'revert';
    
    // Look for feature references
    const featureMatch = command.match(/when we (added|created|implemented) the ([a-z0-9\s]+) feature/i);
    if (featureMatch) {
      result.target = {
        type: 'feature',
        name: featureMatch[2].trim()
      };
    }
    
    // Look for time-based references
    const timeMatch = command.match(/(last|previous|before) ([a-z0-9\s]+)/i);
    if (timeMatch) {
      result.target = {
        type: 'time',
        reference: timeMatch[0].trim()
      };
    }
  }
  
  return result;
}

/**
 * Generates a descriptive label for a commit
 * @param {string} message - The commit message
 * @param {string} category - The category of the change
 * @returns {string} - User-friendly description
 */
function generateCommitDescription(message, category) {
  // Create user-friendly descriptions based on commit metadata
  // This will be enhanced as needed
  
  const categoryDescriptions = {
    'New Feature': 'Added a new feature',
    'Bug Fix': 'Fixed a bug',
    'Code Improvement': 'Improved the code',
    'UI Changes': 'Updated the user interface',
    'Documentation': 'Updated documentation'
  };
  
  const categoryDescription = categoryDescriptions[category] || category;
  
  return `${categoryDescription}: ${message}`;
}

module.exports = {
  parseHistoryCommand,
  generateCommitDescription
};
