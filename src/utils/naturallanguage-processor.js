/**
 * Enhanced Natural Language Processor for Version Navigation
 * This module handles the parsing and interpretation of natural language commands
 * related to navigating through version history
 */

const gitHandler = require('../git/gitHandler');

/**
 * Common phrases that indicate a version navigation request
 */
const NAVIGATION_PATTERNS = {
  revert: [
    /go back to/i,
    /revert to/i,
    /restore/i,
    /undo/i,
    /previous version/i,
    /earlier version/i
  ],
  
  feature: [
    /when (we|I|you) (added|created|implemented) the ([a-z0-9\\s]+) (feature|functionality)/i,
    /before (we|I|you) (added|created|implemented) the ([a-z0-9\\s]+)/i,
    /the version with the ([a-z0-9\\s]+) feature/i
  ],
  
  time: [
    /(\d+) (commit|version)s? ago/i,
    /yesterday('s)?/i,
    /last (week|month)/i,
    /before the last change/i
  ],

  specific: [
    /version (\d+)/i,
    /commit ([a-f0-9]{7,40})/i
  ]
};

/**
 * Parses a natural language history navigation command
 * @param {string} command - Natural language command from the user
 * @param {string} projectPath - Path to the project repository
 * @returns {Object} Parsed command with navigation intent
 */
async function parseNavigationCommand(command, projectPath) {
  // Initialize the result object
  const result = {
    type: null,
    target: null,
    projectPath,
    originalCommand: command
  };
  
  // Check if this is a revert/navigation command
  const isRevertCommand = NAVIGATION_PATTERNS.revert.some(pattern => 
    pattern.test(command)
  );
  
  if (!isRevertCommand) {
    return result; // Not a navigation command
  }
  
  result.type = 'revert';
  
  // Check for feature-based navigation
  for (const pattern of NAVIGATION_PATTERNS.feature) {
    const match = command.match(pattern);
    if (match) {
      // Extract the feature name from the capture group
      const featureName = match[3] ? match[3].trim() : match[1].trim();
      result.target = {
        type: 'feature',
        name: featureName
      };
      break;
    }
  }
  
  // Check for time-based navigation
  if (!result.target) {
    for (const pattern of NAVIGATION_PATTERNS.time) {
      const match = command.match(pattern);
      if (match) {
        result.target = {
          type: 'time',
          reference: match[0].trim()
        };
        
        // Handle specific number of commits ago
        if (match[1] && !isNaN(parseInt(match[1]))) {
          result.target.count = parseInt(match[1]);
        }
        break;
      }
    }
  }
  
  // Check for specific version references
  if (!result.target) {
    for (const pattern of NAVIGATION_PATTERNS.specific) {
      const match = command.match(pattern);
      if (match) {
        if (match[0].toLowerCase().includes('version')) {
          result.target = {
            type: 'version_number',
            number: parseInt(match[1])
          };
        } else {
          result.target = {
            type: 'commit_hash',
            hash: match[1]
          };
        }
        break;
      }
    }
  }
  
  // If we still don't have a target, default to 'last commit'
  if (!result.target) {
    result.target = {
      type: 'time',
      reference: 'last commit'
    };
  }
  
  return result;
}

/**
 * Finds the appropriate commit based on the parsed navigation command
 * @param {Object} parsedCommand - The parsed navigation command
 * @returns {Promise<Object>} The target commit object
 */
async function findTargetCommit(parsedCommand) {
  if (!parsedCommand.type || parsedCommand.type !== 'revert') {
    throw new Error('Not a valid navigation command');
  }
  
  // Get commit history
  const commits = await gitHandler.getCommitHistory(parsedCommand.projectPath);
  
  if (commits.length === 0) {
    throw new Error('No commit history found');
  }
  
  const target = parsedCommand.target;
  
  switch (target.type) {
    case 'feature':
      return findCommitByFeature(commits, target.name);
    
    case 'time':
      return findCommitByTimeReference(commits, target.reference, target.count);
    
    case 'version_number':
      // Version numbers are 1-indexed, array is 0-indexed
      const index = commits.length - target.number;
      return index >= 0 && index < commits.length ? commits[index] : null;
    
    case 'commit_hash':
      return commits.find(commit => commit.hash.startsWith(target.hash));
    
    default:
      return null;
  }
}

/**
 * Finds a commit related to a specific feature
 * @param {Array} commits - List of commit objects
 * @param {string} featureName - Name of the feature to find
 * @returns {Object} Matching commit or null
 */
function findCommitByFeature(commits, featureName) {
  // Search in commit messages for feature references
  const featureKeywords = featureName.toLowerCase().split(/\s+/);
  
  for (const commit of commits) {
    const message = commit.message.toLowerCase();
    
    // Check for explicit feature label
    if (message.includes('[new feature]') || message.includes('feature:')) {
      // Check if the feature name matches
      if (featureKeywords.every(keyword => message.includes(keyword))) {
        return commit;
      }
    }
  }
  
  // If no exact feature match, look for commits with the keywords
  for (const commit of commits) {
    const message = commit.message.toLowerCase();
    
    if (featureKeywords.every(keyword => message.includes(keyword))) {
      return commit;
    }
  }
  
  return null;
}

/**
 * Finds a commit based on a time reference
 * @param {Array} commits - List of commit objects
 * @param {string} timeReference - Time reference string
 * @param {number} count - Optional count for "X commits ago"
 * @returns {Object} Matching commit or null
 */
function findCommitByTimeReference(commits, timeReference, count) {
  // Handle specific count of commits ago
  if (count && !isNaN(count)) {
    const index = Math.min(count - 1, commits.length - 1);
    return index >= 0 ? commits[index] : commits[0];
  }
  
  // Handle other time references
  const reference = timeReference.toLowerCase();
  
  if (reference.includes('last commit') || reference.includes('before the last change')) {
    return commits.length > 1 ? commits[1] : commits[0];
  }
  
  if (reference.includes('yesterday')) {
    // Find commits from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    return commits.find(commit => {
      const commitDate = new Date(commit.date);
      return commitDate >= yesterday && commitDate < new Date(yesterday.getTime() + 24 * 60 * 60 * 1000);
    });
  }
  
  if (reference.includes('last week')) {
    // Find commits from last week
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);
    
    return commits.find(commit => {
      const commitDate = new Date(commit.date);
      return commitDate >= lastWeekStart;
    });
  }
  
  if (reference.includes('last month')) {
    // Find commits from last month
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setHours(0, 0, 0, 0);
    
    return commits.find(commit => {
      const commitDate = new Date(commit.date);
      return commitDate >= lastMonthStart;
    });
  }
  
  // Default to first commit if no match
  return commits[0];
}

/**
 * Generates a user-friendly description of what changed between commits
 * @param {Object} fromCommit - The source commit
 * @param {Object} toCommit - The target commit
 * @returns {string} Human-readable description of changes
 */
async function generateChangeDescription(fromCommit, toCommit) {
  // This is a placeholder for a more sophisticated implementation
  // In the future, this could analyze file differences, extract meaningful changes, etc.
  
  const fromDate = new Date(fromCommit.date).toLocaleString();
  const toDate = new Date(toCommit.date).toLocaleString();
  
  return `Changes between ${fromDate} and ${toDate}:\n\n` +
         `✓ From: "${fromCommit.message}"\n` +
         `✓ To: "${toCommit.message}"`;
}

/**
 * Executes a navigation command and returns user-friendly status
 * @param {string} command - Natural language navigation command
 * @param {string} projectPath - Path to the project repository
 * @returns {Promise<Object>} Result of the navigation operation
 */
async function executeNavigationCommand(command, projectPath) {
  const parsedCommand = await parseNavigationCommand(command, projectPath);
  
  if (!parsedCommand.type || parsedCommand.type !== 'revert') {
    return {
      success: false,
      message: "I didn't recognize that as a version navigation command. Try phrases like 'go back to when we added the login feature' or 'revert to 2 commits ago'."
    };
  }
  
  try {
    const targetCommit = await findTargetCommit(parsedCommand);
    
    if (!targetCommit) {
      return {
        success: false,
        message: `I couldn't find a version matching "${parsedCommand.originalCommand}". Try being more specific or using a different description.`
      };
    }
    
    // Get current commit for comparison
    const currentCommits = await gitHandler.getCommitHistory(projectPath);
    const currentCommit = currentCommits[0];
    
    // Revert to the target commit
    await gitHandler.revertToCommit(projectPath, targetCommit.hash);
    
    // Generate a description of what changed
    const changeDescription = await generateChangeDescription(currentCommit, targetCommit);
    
    return {
      success: true,
      message: `Successfully reverted to ${targetCommit.hash.substring(0, 7)} from ${new Date(targetCommit.date).toLocaleString()}.\n\n${changeDescription}`,
      from: currentCommit,
      to: targetCommit
    };
  } catch (error) {
    return {
      success: false,
      message: `Error navigating version history: ${error.message}`,
      error
    };
  }
}

module.exports = {
  parseNavigationCommand,
  findTargetCommit,
  executeNavigationCommand,
  generateChangeDescription
};
