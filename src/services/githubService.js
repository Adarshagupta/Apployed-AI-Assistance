// GitHub integration service
import { addMessageToConversation } from './memoryService';

// GitHub API base URL
const GITHUB_API_BASE = 'https://api.github.com';

// Store GitHub credentials
let githubCredentials = {
  token: null,
  username: null,
  authenticated: false
};

/**
 * Set GitHub credentials
 * @param {Object} credentials - GitHub credentials
 * @param {string} credentials.token - GitHub personal access token
 * @param {string} credentials.username - GitHub username
 */
export const setGitHubCredentials = (credentials) => {
  githubCredentials = {
    ...credentials,
    authenticated: Boolean(credentials.token)
  };
  
  // Store in local storage for persistence
  if (credentials.token) {
    localStorage.setItem('github_token', credentials.token);
    localStorage.setItem('github_username', credentials.username || '');
  } else {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_username');
  }
  
  return githubCredentials.authenticated;
};

/**
 * Load GitHub credentials from local storage
 */
export const loadGitHubCredentials = () => {
  const token = localStorage.getItem('github_token');
  const username = localStorage.getItem('github_username');
  
  if (token) {
    githubCredentials = {
      token,
      username,
      authenticated: true
    };
    return true;
  }
  
  return false;
};

/**
 * Check if GitHub is authenticated
 */
export const isGitHubAuthenticated = () => {
  return githubCredentials.authenticated;
};

/**
 * Make a request to the GitHub API
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 */
const githubRequest = async (endpoint, options = {}) => {
  if (!githubCredentials.authenticated) {
    throw new Error('GitHub is not authenticated. Please set your GitHub token first.');
  }
  
  const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${githubCredentials.token}`,
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`GitHub API error: ${response.status} ${error.message || response.statusText}`);
  }
  
  return response.json();
};

/**
 * Get user information
 */
export const getGitHubUser = async () => {
  return githubRequest('/user');
};

/**
 * Get user repositories
 * @param {Object} options - Options
 * @param {number} options.page - Page number
 * @param {number} options.perPage - Items per page
 */
export const getUserRepositories = async (options = {}) => {
  const { page = 1, perPage = 10 } = options;
  return githubRequest(`/user/repos?page=${page}&per_page=${perPage}&sort=updated`);
};

/**
 * Get repository details
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 */
export const getRepository = async (owner, repo) => {
  return githubRequest(`/repos/${owner}/${repo}`);
};

/**
 * Get repository issues
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} options - Options
 * @param {number} options.page - Page number
 * @param {number} options.perPage - Items per page
 * @param {string} options.state - Issue state (open, closed, all)
 */
export const getRepositoryIssues = async (owner, repo, options = {}) => {
  const { page = 1, perPage = 10, state = 'open' } = options;
  return githubRequest(`/repos/${owner}/${repo}/issues?page=${page}&per_page=${perPage}&state=${state}`);
};

/**
 * Get repository pull requests
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} options - Options
 * @param {number} options.page - Page number
 * @param {number} options.perPage - Items per page
 * @param {string} options.state - PR state (open, closed, all)
 */
export const getRepositoryPullRequests = async (owner, repo, options = {}) => {
  const { page = 1, perPage = 10, state = 'open' } = options;
  return githubRequest(`/repos/${owner}/${repo}/pulls?page=${page}&per_page=${perPage}&state=${state}`);
};

/**
 * Create an issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} issueData - Issue data
 * @param {string} issueData.title - Issue title
 * @param {string} issueData.body - Issue body
 * @param {Array<string>} issueData.labels - Issue labels
 */
export const createIssue = async (owner, repo, issueData) => {
  return githubRequest(`/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    body: JSON.stringify(issueData)
  });
};

/**
 * Create a pull request
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} prData - Pull request data
 * @param {string} prData.title - PR title
 * @param {string} prData.body - PR body
 * @param {string} prData.head - Head branch
 * @param {string} prData.base - Base branch
 */
export const createPullRequest = async (owner, repo, prData) => {
  return githubRequest(`/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    body: JSON.stringify(prData)
  });
};

/**
 * Get repository commits
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} options - Options
 * @param {number} options.page - Page number
 * @param {number} options.perPage - Items per page
 */
export const getRepositoryCommits = async (owner, repo, options = {}) => {
  const { page = 1, perPage = 10 } = options;
  return githubRequest(`/repos/${owner}/${repo}/commits?page=${page}&per_page=${perPage}`);
};

/**
 * Format GitHub data for display in chat
 * @param {string} type - Data type
 * @param {Object} data - GitHub data
 */
export const formatGitHubDataForChat = (type, data) => {
  switch (type) {
    case 'repositories':
      return formatRepositoriesForChat(data);
    case 'issues':
      return formatIssuesForChat(data);
    case 'pullRequests':
      return formatPullRequestsForChat(data);
    case 'commits':
      return formatCommitsForChat(data);
    default:
      return JSON.stringify(data, null, 2);
  }
};

/**
 * Format repositories for chat display
 * @param {Array} repositories - List of repositories
 */
const formatRepositoriesForChat = (repositories) => {
  if (!repositories || repositories.length === 0) {
    return 'No repositories found.';
  }
  
  return repositories.map(repo => (
    `Repository: ${repo.full_name}
Description: ${repo.description || 'No description'}
Stars: ${repo.stargazers_count} | Forks: ${repo.forks_count}
Language: ${repo.language || 'Not specified'}
URL: ${repo.html_url}
`
  )).join('\n---\n');
};

/**
 * Format issues for chat display
 * @param {Array} issues - List of issues
 */
const formatIssuesForChat = (issues) => {
  if (!issues || issues.length === 0) {
    return 'No issues found.';
  }
  
  return issues.map(issue => (
    `Issue #${issue.number}: ${issue.title}
State: ${issue.state}
Created by: ${issue.user.login}
Created at: ${new Date(issue.created_at).toLocaleString()}
Comments: ${issue.comments}
URL: ${issue.html_url}
`
  )).join('\n---\n');
};

/**
 * Format pull requests for chat display
 * @param {Array} pullRequests - List of pull requests
 */
const formatPullRequestsForChat = (pullRequests) => {
  if (!pullRequests || pullRequests.length === 0) {
    return 'No pull requests found.';
  }
  
  return pullRequests.map(pr => (
    `PR #${pr.number}: ${pr.title}
State: ${pr.state}
Created by: ${pr.user.login}
Created at: ${new Date(pr.created_at).toLocaleString()}
Branch: ${pr.head.ref} → ${pr.base.ref}
URL: ${pr.html_url}
`
  )).join('\n---\n');
};

/**
 * Format commits for chat display
 * @param {Array} commits - List of commits
 */
const formatCommitsForChat = (commits) => {
  if (!commits || commits.length === 0) {
    return 'No commits found.';
  }
  
  return commits.map(commit => (
    `Commit: ${commit.sha.substring(0, 7)}
Author: ${commit.commit.author.name} <${commit.commit.author.email}>
Date: ${new Date(commit.commit.author.date).toLocaleString()}
Message: ${commit.commit.message}
URL: ${commit.html_url}
`
  )).join('\n---\n');
};

/**
 * Process GitHub command from chat
 * @param {string} command - GitHub command
 */
export const processGitHubCommand = async (command) => {
  try {
    // Check if GitHub is authenticated
    if (!isGitHubAuthenticated()) {
      return 'GitHub is not authenticated. Please set your GitHub token first using the GitHub configuration panel.';
    }
    
    // Parse the command
    const commandLower = command.toLowerCase().trim();
    
    // Handle different commands
    if (commandLower.startsWith('list repos') || commandLower.startsWith('show repos') || commandLower.startsWith('my repos')) {
      const repos = await getUserRepositories();
      return `Here are your GitHub repositories:\n\n${formatRepositoriesForChat(repos)}`;
    }
    
    if (commandLower.startsWith('repo ') || commandLower.includes(' repo ')) {
      // Extract repo name - format: "repo owner/name" or "show repo owner/name"
      const repoMatch = command.match(/repo\s+([^/\s]+\/[^/\s]+)/i) || command.match(/([^/\s]+\/[^/\s]+)\s+repo/i);
      
      if (repoMatch && repoMatch[1]) {
        const [owner, repo] = repoMatch[1].split('/');
        const repoDetails = await getRepository(owner, repo);
        return `Repository details for ${owner}/${repo}:\n\n${formatRepositoriesForChat([repoDetails])}`;
      }
    }
    
    if (commandLower.includes('issues') || commandLower.includes('issue list')) {
      // Extract repo name - format: "issues owner/name" or "list issues for owner/name"
      const repoMatch = command.match(/issues\s+([^/\s]+\/[^/\s]+)/i) || command.match(/([^/\s]+\/[^/\s]+)\s+issues/i);
      
      if (repoMatch && repoMatch[1]) {
        const [owner, repo] = repoMatch[1].split('/');
        const issues = await getRepositoryIssues(owner, repo);
        return `Issues for ${owner}/${repo}:\n\n${formatIssuesForChat(issues)}`;
      }
    }
    
    if (commandLower.includes('pull requests') || commandLower.includes('prs') || commandLower.includes('pr list')) {
      // Extract repo name
      const repoMatch = command.match(/(?:pull requests|prs)\s+([^/\s]+\/[^/\s]+)/i) || command.match(/([^/\s]+\/[^/\s]+)\s+(?:pull requests|prs)/i);
      
      if (repoMatch && repoMatch[1]) {
        const [owner, repo] = repoMatch[1].split('/');
        const prs = await getRepositoryPullRequests(owner, repo);
        return `Pull Requests for ${owner}/${repo}:\n\n${formatPullRequestsForChat(prs)}`;
      }
    }
    
    if (commandLower.includes('commits') || commandLower.includes('commit history')) {
      // Extract repo name
      const repoMatch = command.match(/commits\s+([^/\s]+\/[^/\s]+)/i) || command.match(/([^/\s]+\/[^/\s]+)\s+commits/i);
      
      if (repoMatch && repoMatch[1]) {
        const [owner, repo] = repoMatch[1].split('/');
        const commits = await getRepositoryCommits(owner, repo);
        return `Commits for ${owner}/${repo}:\n\n${formatCommitsForChat(commits)}`;
      }
    }
    
    // If no specific command matched
    return 'GitHub command not recognized. Try commands like "list repos", "repo owner/name", "issues owner/name", "pull requests owner/name", or "commits owner/name".';
    
  } catch (error) {
    console.error('Error processing GitHub command:', error);
    return `Error processing GitHub command: ${error.message}`;
  }
};

export default {
  setGitHubCredentials,
  loadGitHubCredentials,
  isGitHubAuthenticated,
  getGitHubUser,
  getUserRepositories,
  getRepository,
  getRepositoryIssues,
  getRepositoryPullRequests,
  createIssue,
  createPullRequest,
  getRepositoryCommits,
  formatGitHubDataForChat,
  processGitHubCommand
};
