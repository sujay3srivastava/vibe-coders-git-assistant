/**
 * Git operations handler
 * Manages all interactions with Git repositories
 */

const { Octokit } = require('octokit');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');

// Initialize GitHub API client
let octokit;
if (process.env.GITHUB_TOKEN) {
  octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
}

/**
 * Creates a new GitHub repository if one doesn't exist
 * @param {string} repoName - Name for the new repository
 * @returns {Promise<object>} - Repository information
 */
async function createRepository(repoName) {
  try {
    if (!octokit) {
      throw new Error('GitHub token not configured');
    }

    const response = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      private: true,
      description: 'Repository created by Vibe Coder\'s Git Assistant',
      auto_init: true
    });

    console.log(`Repository created: ${response.data.html_url}`);
    return response.data;
  } catch (error) {
    console.error('Error creating repository:', error.message);
    throw error;
  }
}

/**
 * Initializes a local git repository and connects it to a remote GitHub repo
 * @param {string} localPath - Path to the local directory
 * @param {string} remoteUrl - URL of the remote repository
 */
async function initLocalRepository(localPath, remoteUrl) {
  try {
    const git = simpleGit(localPath);
    
    // Check if git is already initialized
    const isRepo = await git.checkIsRepo();
    
    if (!isRepo) {
      await git.init();
      console.log('Initialized local git repository');
    }

    // Add remote if it doesn't exist
    const remotes = await git.getRemotes();
    if (!remotes.find(remote => remote.name === 'origin')) {
      await git.addRemote('origin', remoteUrl);
      console.log('Added remote origin');
    }
  } catch (error) {
    console.error('Error initializing local repository:', error.message);
    throw error;
  }
}

/**
 * Commits changes to the repository
 * @param {string} localPath - Path to the local repository
 * @param {string} message - Commit message
 * @param {string} category - Category of change (feature, bugfix, etc.)
 * @param {string} prompt - The Claude prompt that triggered the change
 */
async function commitChanges(localPath, message, category, prompt) {
  try {
    const git = simpleGit(localPath);
    
    // Add all changes
    await git.add('.');
    
    // Create commit message with metadata
    const fullMessage = `[${category}] ${message}\n\nPrompt: ${prompt}`;
    
    // Commit the changes
    const commitResult = await git.commit(fullMessage);
    console.log(`Changes committed: ${commitResult.commit}`);
    
    // Push to remote
    await git.push('origin', 'main');
    console.log('Changes pushed to remote');
    
    return commitResult;
  } catch (error) {
    console.error('Error committing changes:', error.message);
    throw error;
  }
}

/**
 * Gets commit history from the repository
 * @param {string} localPath - Path to the local repository
 * @returns {Promise<Array>} - Array of commit objects
 */
async function getCommitHistory(localPath) {
  try {
    const git = simpleGit(localPath);
    const log = await git.log();
    return log.all;
  } catch (error) {
    console.error('Error getting commit history:', error.message);
    throw error;
  }
}

/**
 * Reverts the repository to a specific commit
 * @param {string} localPath - Path to the local repository
 * @param {string} commitHash - Hash of the commit to revert to
 */
async function revertToCommit(localPath, commitHash) {
  try {
    const git = simpleGit(localPath);
    await git.reset(['--hard', commitHash]);
    console.log(`Reverted to commit: ${commitHash}`);
  } catch (error) {
    console.error('Error reverting to commit:', error.message);
    throw error;
  }
}

module.exports = {
  createRepository,
  initLocalRepository,
  commitChanges,
  getCommitHistory,
  revertToCommit
};
