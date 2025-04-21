import { useState, useEffect } from 'react';
import { 
  setDatabaseConnection, 
  loadDatabaseConnections, 
  getDatabaseConnections,
  getCurrentDatabaseConnection,
  isDatabaseConnected
} from '../services/databaseService';

const DatabaseConfig = () => {
  const [connections, setConnections] = useState([]);
  const [currentConnection, setCurrentConnection] = useState(null);
  const [connected, setConnected] = useState(false);
  
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load database connections on component mount
  useEffect(() => {
    const isConnected = loadDatabaseConnections();
    setConnected(isConnected);
    
    if (isConnected) {
      const connections = getDatabaseConnections();
      const current = getCurrentDatabaseConnection();
      
      setConnections(connections);
      setCurrentConnection(current);
    }
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Create connection object
      const connection = {
        name,
        host,
        port: parseInt(port, 10),
        database,
        username,
        password
      };
      
      // Set database connection
      const isConnected = setDatabaseConnection(connection);
      setConnected(isConnected);
      
      if (isConnected) {
        // Refresh connections list
        const connections = getDatabaseConnections();
        const current = getCurrentDatabaseConnection();
        
        setConnections(connections);
        setCurrentConnection(current);
        
        // Reset form if not editing
        if (!isEditing) {
          resetForm();
        } else {
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Error setting database connection:', error);
      setError('Failed to connect to database. Please check your connection details.');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setName('');
    setHost('');
    setPort('5432');
    setDatabase('');
    setUsername('');
    setPassword('');
    setIsEditing(false);
  };

  // Handle edit connection
  const handleEditConnection = (connection) => {
    setName(connection.name);
    setHost(connection.host);
    setPort(connection.port.toString());
    setDatabase(connection.database);
    setUsername(connection.username);
    setPassword(connection.password);
    setIsEditing(true);
  };

  // Handle select connection
  const handleSelectConnection = (connection) => {
    try {
      setDatabaseConnection(connection);
      setCurrentConnection(connection);
    } catch (error) {
      console.error('Error selecting database connection:', error);
      setError('Failed to select database connection.');
    }
  };

  return (
    <div className="database-config">
      <h3>Database Configuration</h3>
      
      {/* Connection Form */}
      <form onSubmit={handleSubmit} className="database-form">
        <div className="form-group">
          <label htmlFor="db-name">Connection Name</label>
          <input
            id="db-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My PostgreSQL Database"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="db-host">Host</label>
          <input
            id="db-host"
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="localhost or db.example.com"
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="db-port">Port</label>
            <input
              id="db-port"
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="5432"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="db-name">Database Name</label>
            <input
              id="db-database"
              type="text"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              placeholder="postgres"
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="db-username">Username</label>
          <input
            id="db-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="postgres"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="db-password">Password</label>
          <div className="password-input-container">
            <input
              id="db-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your database password"
              required
            />
            <button
              type="button"
              className="toggle-password-visibility"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="connect-button"
            disabled={loading || !name || !host || !port || !database || !username || !password}
          >
            {loading ? "Connecting..." : isEditing ? "Update Connection" : "Add Connection"}
          </button>
          
          {isEditing && (
            <button 
              type="button" 
              className="cancel-button"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      
      {/* Saved Connections */}
      {connections.length > 0 && (
        <div className="saved-connections">
          <h4>Saved Connections</h4>
          <ul className="connections-list">
            {connections.map((conn) => (
              <li 
                key={conn.name}
                className={currentConnection && currentConnection.name === conn.name ? 'active' : ''}
              >
                <div className="connection-info">
                  <strong>{conn.name}</strong>
                  <span>{conn.username}@{conn.host}:{conn.port}/{conn.database}</span>
                </div>
                <div className="connection-actions">
                  <button 
                    onClick={() => handleSelectConnection(conn)}
                    disabled={currentConnection && currentConnection.name === conn.name}
                  >
                    {currentConnection && currentConnection.name === conn.name ? 'Connected' : 'Connect'}
                  </button>
                  <button onClick={() => handleEditConnection(conn)}>
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Usage Information */}
      {connected && currentConnection && (
        <div className="database-usage-info">
          <h4>Using Database in Chat</h4>
          <p>You can now use database commands in the chat. Try these examples:</p>
          <ul>
            <li><code>query SELECT * FROM users LIMIT 5</code> - Run a SQL query</li>
            <li><code>schema</code> - Show database schema</li>
            <li><code>tables</code> - List all tables</li>
            <li><code>describe users</code> - Show table structure</li>
          </ul>
          <p className="note">Note: For this demo, database operations are simulated and will return mock data.</p>
        </div>
      )}
    </div>
  );
};

export default DatabaseConfig;
