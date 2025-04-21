import { useState, useEffect } from 'react';
import GitHubConfig from './GitHubConfig';
import DatabaseConfig from './DatabaseConfig';
import { loadGitHubCredentials, isGitHubAuthenticated } from '../services/githubService';
import { loadDatabaseConnections, isDatabaseConnected } from '../services/databaseService';
import './AdvancedFeatures.css';

const AdvancedFeatures = () => {
  const [activeTab, setActiveTab] = useState('github');
  const [githubConnected, setGithubConnected] = useState(false);
  const [databaseConnected, setDatabaseConnected] = useState(false);

  // Load connection status on component mount
  useEffect(() => {
    // Load GitHub credentials
    loadGitHubCredentials();
    setGithubConnected(isGitHubAuthenticated());
    
    // Load database connections
    loadDatabaseConnections();
    setDatabaseConnected(isDatabaseConnected());
  }, []);

  return (
    <div className="advanced-features">
      <h3>Advanced Features</h3>
      
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'github' ? 'active' : ''}`}
          onClick={() => setActiveTab('github')}
        >
          GitHub {githubConnected && '✓'}
        </div>
        <div 
          className={`tab ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          Database {databaseConnected && '✓'}
        </div>
      </div>
      
      {activeTab === 'github' && <GitHubConfig />}
      {activeTab === 'database' && <DatabaseConfig />}
    </div>
  );
};

export default AdvancedFeatures;
