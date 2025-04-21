import { useState, useEffect } from 'react';
import { setGitHubCredentials, loadGitHubCredentials, isGitHubAuthenticated, getGitHubUser } from '../services/githubService';

const GitHubConfig = () => {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showToken, setShowToken] = useState(false);

  // Load GitHub credentials on component mount
  useEffect(() => {
    const isAuthenticated = loadGitHubCredentials();
    setAuthenticated(isAuthenticated);
    
    if (isAuthenticated) {
      fetchUserInfo();
    }
  }, []);

  // Fetch GitHub user information
  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await getGitHubUser();
      setUserInfo(user);
      setUsername(user.login);
    } catch (error) {
      console.error('Error fetching GitHub user:', error);
      setError('Failed to fetch GitHub user information. Please check your token.');
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Set GitHub credentials
      const isAuthenticated = setGitHubCredentials({ token, username });
      setAuthenticated(isAuthenticated);
      
      if (isAuthenticated) {
        await fetchUserInfo();
      }
    } catch (error) {
      console.error('Error setting GitHub credentials:', error);
      setError('Failed to authenticate with GitHub. Please check your token.');
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    setGitHubCredentials({ token: null, username: null });
    setAuthenticated(false);
    setUserInfo(null);
    setToken('');
    setUsername('');
  };

  return (
    <div className="github-config">
      <h3>GitHub Configuration</h3>
      
      {authenticated && userInfo ? (
        <div className="github-connected">
          <div className="github-user-info">
            <img 
              src={userInfo.avatar_url} 
              alt={`${userInfo.login}'s avatar`} 
              className="github-avatar" 
            />
            <div>
              <p><strong>Connected as:</strong> {userInfo.name || userInfo.login}</p>
              <p><strong>Username:</strong> {userInfo.login}</p>
              {userInfo.email && <p><strong>Email:</strong> {userInfo.email}</p>}
              <p><strong>Repositories:</strong> {userInfo.public_repos}</p>
            </div>
          </div>
          
          <button 
            className="disconnect-button"
            onClick={handleDisconnect}
          >
            Disconnect from GitHub
          </button>
          
          <div className="github-usage-info">
            <h4>Using GitHub in Chat</h4>
            <p>You can now use GitHub commands in the chat. Try these examples:</p>
            <ul>
              <li><code>list repos</code> - List your repositories</li>
              <li><code>repo owner/name</code> - Show repository details</li>
              <li><code>issues owner/name</code> - List issues for a repository</li>
              <li><code>pull requests owner/name</code> - List pull requests</li>
              <li><code>commits owner/name</code> - Show commit history</li>
            </ul>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="github-form">
          <div className="form-group">
            <label htmlFor="github-token">GitHub Personal Access Token</label>
            <div className="token-input-container">
              <input
                id="github-token"
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                required
              />
              <button
                type="button"
                className="toggle-token-visibility"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? "Hide" : "Show"}
              </button>
            </div>
            <p className="help-text">
              Create a token with <code>repo</code> and <code>user</code> scopes at{" "}
              <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">
                GitHub Settings &gt; Developer settings &gt; Personal access tokens
              </a>
            </p>
          </div>
          
          <div className="form-group">
            <label htmlFor="github-username">GitHub Username (optional)</label>
            <input
              id="github-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your GitHub username"
            />
            <p className="help-text">
              If provided, this will be used for certain operations. Otherwise, it will be detected automatically.
            </p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="connect-button"
            disabled={loading || !token}
          >
            {loading ? "Connecting..." : "Connect to GitHub"}
          </button>
        </form>
      )}
    </div>
  );
};

export default GitHubConfig;
