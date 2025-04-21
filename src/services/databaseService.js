// PostgreSQL database integration service
import { addMessageToConversation } from './memoryService';

// Store database connections
let databaseConnections = {
  current: null,
  connections: [],
  connected: false
};

/**
 * Set database connection
 * @param {Object} connection - Database connection details
 * @param {string} connection.name - Connection name
 * @param {string} connection.host - Database host
 * @param {number} connection.port - Database port
 * @param {string} connection.database - Database name
 * @param {string} connection.username - Database username
 * @param {string} connection.password - Database password
 */
export const setDatabaseConnection = (connection) => {
  // In a real implementation, we would establish a connection to the database
  // For this demo, we'll simulate the connection
  
  // Check if connection already exists
  const existingIndex = databaseConnections.connections.findIndex(conn => conn.name === connection.name);
  
  if (existingIndex >= 0) {
    // Update existing connection
    databaseConnections.connections[existingIndex] = connection;
  } else {
    // Add new connection
    databaseConnections.connections.push(connection);
  }
  
  // Set as current connection
  databaseConnections.current = connection.name;
  databaseConnections.connected = true;
  
  // Store in local storage for persistence
  localStorage.setItem('db_connections', JSON.stringify(databaseConnections.connections));
  localStorage.setItem('db_current', connection.name);
  
  return true;
};

/**
 * Load database connections from local storage
 */
export const loadDatabaseConnections = () => {
  const connections = localStorage.getItem('db_connections');
  const current = localStorage.getItem('db_current');
  
  if (connections) {
    try {
      databaseConnections.connections = JSON.parse(connections);
      databaseConnections.current = current;
      databaseConnections.connected = Boolean(current && databaseConnections.connections.find(conn => conn.name === current));
      return true;
    } catch (error) {
      console.error('Error loading database connections:', error);
    }
  }
  
  return false;
};

/**
 * Get all database connections
 */
export const getDatabaseConnections = () => {
  return databaseConnections.connections;
};

/**
 * Get current database connection
 */
export const getCurrentDatabaseConnection = () => {
  if (!databaseConnections.current) {
    return null;
  }
  
  return databaseConnections.connections.find(conn => conn.name === databaseConnections.current);
};

/**
 * Check if database is connected
 */
export const isDatabaseConnected = () => {
  return databaseConnections.connected;
};

/**
 * Execute SQL query
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 */
export const executeQuery = async (query, params = []) => {
  if (!isDatabaseConnected()) {
    throw new Error('Database is not connected. Please set up a database connection first.');
  }
  
  // In a real implementation, we would execute the query against the database
  // For this demo, we'll simulate the query execution
  
  // Log the query for debugging
  console.log('Executing query:', query, 'with params:', params);
  
  // Simulate query execution delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Parse the query to determine the type
  const queryType = getQueryType(query);
  
  // Generate mock results based on the query type
  return generateMockQueryResults(query, queryType);
};

/**
 * Get query type (SELECT, INSERT, UPDATE, DELETE, etc.)
 * @param {string} query - SQL query
 */
const getQueryType = (query) => {
  const normalizedQuery = query.trim().toUpperCase();
  
  if (normalizedQuery.startsWith('SELECT')) {
    return 'SELECT';
  } else if (normalizedQuery.startsWith('INSERT')) {
    return 'INSERT';
  } else if (normalizedQuery.startsWith('UPDATE')) {
    return 'UPDATE';
  } else if (normalizedQuery.startsWith('DELETE')) {
    return 'DELETE';
  } else if (normalizedQuery.startsWith('CREATE TABLE')) {
    return 'CREATE_TABLE';
  } else if (normalizedQuery.startsWith('ALTER TABLE')) {
    return 'ALTER_TABLE';
  } else if (normalizedQuery.startsWith('DROP TABLE')) {
    return 'DROP_TABLE';
  } else if (normalizedQuery.startsWith('TRUNCATE')) {
    return 'TRUNCATE';
  } else {
    return 'OTHER';
  }
};

/**
 * Generate mock query results
 * @param {string} query - SQL query
 * @param {string} queryType - Query type
 */
const generateMockQueryResults = (query, queryType) => {
  switch (queryType) {
    case 'SELECT':
      return generateMockSelectResults(query);
    case 'INSERT':
      return { rowCount: Math.floor(Math.random() * 5) + 1, command: 'INSERT' };
    case 'UPDATE':
      return { rowCount: Math.floor(Math.random() * 10) + 1, command: 'UPDATE' };
    case 'DELETE':
      return { rowCount: Math.floor(Math.random() * 5) + 1, command: 'DELETE' };
    case 'CREATE_TABLE':
    case 'ALTER_TABLE':
    case 'DROP_TABLE':
    case 'TRUNCATE':
      return { command: queryType.replace('_', ' ') };
    default:
      return { command: 'UNKNOWN' };
  }
};

/**
 * Generate mock SELECT query results
 * @param {string} query - SQL query
 */
const generateMockSelectResults = (query) => {
  // Extract table name from query
  const tableMatch = query.match(/FROM\s+([^\s,;()]+)/i);
  const tableName = tableMatch ? tableMatch[1] : 'unknown_table';
  
  // Generate mock columns based on the table name
  const columns = generateMockColumns(tableName);
  
  // Generate mock rows
  const rowCount = Math.floor(Math.random() * 10) + 1;
  const rows = [];
  
  for (let i = 0; i < rowCount; i++) {
    const row = {};
    columns.forEach(column => {
      row[column.name] = generateMockValue(column.type);
    });
    rows.push(row);
  }
  
  return {
    command: 'SELECT',
    rowCount,
    fields: columns,
    rows
  };
};

/**
 * Generate mock columns based on table name
 * @param {string} tableName - Table name
 */
const generateMockColumns = (tableName) => {
  // Define some common column sets based on table names
  const columnSets = {
    users: [
      { name: 'id', type: 'integer' },
      { name: 'username', type: 'string' },
      { name: 'email', type: 'string' },
      { name: 'created_at', type: 'timestamp' }
    ],
    products: [
      { name: 'id', type: 'integer' },
      { name: 'name', type: 'string' },
      { name: 'price', type: 'decimal' },
      { name: 'category', type: 'string' },
      { name: 'in_stock', type: 'boolean' }
    ],
    orders: [
      { name: 'id', type: 'integer' },
      { name: 'user_id', type: 'integer' },
      { name: 'total', type: 'decimal' },
      { name: 'status', type: 'string' },
      { name: 'order_date', type: 'timestamp' }
    ],
    posts: [
      { name: 'id', type: 'integer' },
      { name: 'title', type: 'string' },
      { name: 'content', type: 'string' },
      { name: 'author_id', type: 'integer' },
      { name: 'published', type: 'boolean' },
      { name: 'created_at', type: 'timestamp' }
    ]
  };
  
  // Check if we have a predefined column set for this table
  const normalizedTableName = tableName.toLowerCase().replace(/["`']/g, '');
  
  for (const [key, columns] of Object.entries(columnSets)) {
    if (normalizedTableName.includes(key)) {
      return columns;
    }
  }
  
  // Default columns if no match
  return [
    { name: 'id', type: 'integer' },
    { name: 'name', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'created_at', type: 'timestamp' }
  ];
};

/**
 * Generate mock value based on column type
 * @param {string} type - Column type
 */
const generateMockValue = (type) => {
  switch (type) {
    case 'integer':
      return Math.floor(Math.random() * 1000);
    case 'decimal':
      return parseFloat((Math.random() * 1000).toFixed(2));
    case 'string':
      return `Sample ${Math.random().toString(36).substring(2, 8)}`;
    case 'boolean':
      return Math.random() > 0.5;
    case 'timestamp':
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      return date.toISOString();
    default:
      return null;
  }
};

/**
 * Format query results for display in chat
 * @param {Object} results - Query results
 */
export const formatQueryResultsForChat = (results) => {
  if (!results) {
    return 'No results.';
  }
  
  if (results.command !== 'SELECT') {
    return `Query executed successfully. Command: ${results.command}. ${results.rowCount !== undefined ? `Rows affected: ${results.rowCount}` : ''}`;
  }
  
  if (!results.rows || results.rows.length === 0) {
    return 'Query executed successfully. No rows returned.';
  }
  
  // Format as a table
  const columns = results.fields.map(field => field.name);
  const rows = results.rows;
  
  // Calculate column widths
  const columnWidths = columns.map(column => {
    const values = [column, ...rows.map(row => String(row[column] !== null ? row[column] : 'NULL'))];
    return Math.max(...values.map(value => value.length));
  });
  
  // Create header row
  const header = columns.map((column, i) => column.padEnd(columnWidths[i])).join(' | ');
  const separator = columnWidths.map(width => '-'.repeat(width)).join('-+-');
  
  // Create data rows
  const dataRows = rows.map(row => {
    return columns.map((column, i) => {
      const value = row[column] !== null ? row[column] : 'NULL';
      return String(value).padEnd(columnWidths[i]);
    }).join(' | ');
  });
  
  return `Query executed successfully. ${rows.length} row(s) returned.\n\n\`\`\`\n${header}\n${separator}\n${dataRows.join('\n')}\n\`\`\``;
};

/**
 * Get database schema
 */
export const getDatabaseSchema = async () => {
  if (!isDatabaseConnected()) {
    throw new Error('Database is not connected. Please set up a database connection first.');
  }
  
  // In a real implementation, we would query the database for its schema
  // For this demo, we'll return mock schema information
  
  return [
    {
      table: 'users',
      columns: [
        { name: 'id', type: 'integer', nullable: false, primary: true },
        { name: 'username', type: 'varchar(50)', nullable: false, unique: true },
        { name: 'email', type: 'varchar(100)', nullable: false, unique: true },
        { name: 'password_hash', type: 'varchar(255)', nullable: false },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'CURRENT_TIMESTAMP' }
      ]
    },
    {
      table: 'products',
      columns: [
        { name: 'id', type: 'integer', nullable: false, primary: true },
        { name: 'name', type: 'varchar(100)', nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'price', type: 'decimal(10,2)', nullable: false },
        { name: 'category', type: 'varchar(50)', nullable: true },
        { name: 'in_stock', type: 'boolean', nullable: false, default: true },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'CURRENT_TIMESTAMP' }
      ]
    },
    {
      table: 'orders',
      columns: [
        { name: 'id', type: 'integer', nullable: false, primary: true },
        { name: 'user_id', type: 'integer', nullable: false, references: 'users(id)' },
        { name: 'total', type: 'decimal(10,2)', nullable: false },
        { name: 'status', type: 'varchar(20)', nullable: false, default: "'pending'" },
        { name: 'order_date', type: 'timestamp', nullable: false, default: 'CURRENT_TIMESTAMP' }
      ]
    },
    {
      table: 'order_items',
      columns: [
        { name: 'id', type: 'integer', nullable: false, primary: true },
        { name: 'order_id', type: 'integer', nullable: false, references: 'orders(id)' },
        { name: 'product_id', type: 'integer', nullable: false, references: 'products(id)' },
        { name: 'quantity', type: 'integer', nullable: false },
        { name: 'price', type: 'decimal(10,2)', nullable: false }
      ]
    }
  ];
};

/**
 * Format database schema for display in chat
 * @param {Array} schema - Database schema
 */
export const formatSchemaForChat = (schema) => {
  if (!schema || schema.length === 0) {
    return 'No schema information available.';
  }
  
  return schema.map(table => {
    const columns = table.columns.map(column => {
      let columnInfo = `${column.name} ${column.type}`;
      if (column.primary) columnInfo += ' PRIMARY KEY';
      if (column.nullable === false) columnInfo += ' NOT NULL';
      if (column.unique) columnInfo += ' UNIQUE';
      if (column.default) columnInfo += ` DEFAULT ${column.default}`;
      if (column.references) columnInfo += ` REFERENCES ${column.references}`;
      return columnInfo;
    });
    
    return `Table: ${table.table}\n${columns.map(col => `  ${col}`).join('\n')}`;
  }).join('\n\n');
};

/**
 * Process database command from chat
 * @param {string} command - Database command
 */
export const processDatabaseCommand = async (command) => {
  try {
    // Check if database is connected
    if (!isDatabaseConnected()) {
      return 'Database is not connected. Please set up a database connection first using the Database configuration panel.';
    }
    
    // Parse the command
    const commandLower = command.toLowerCase().trim();
    
    // Handle different commands
    if (commandLower.startsWith('query ') || commandLower.startsWith('sql ')) {
      // Extract SQL query
      const sql = command.replace(/^(query|sql)\s+/i, '');
      const results = await executeQuery(sql);
      return formatQueryResultsForChat(results);
    }
    
    if (commandLower === 'schema' || commandLower === 'show schema' || commandLower === 'database schema') {
      const schema = await getDatabaseSchema();
      return `Database Schema:\n\n${formatSchemaForChat(schema)}`;
    }
    
    if (commandLower === 'tables' || commandLower === 'show tables' || commandLower === 'list tables') {
      const schema = await getDatabaseSchema();
      return `Tables in database:\n\n${schema.map(table => table.table).join('\n')}`;
    }
    
    if (commandLower.startsWith('describe ') || commandLower.startsWith('desc ')) {
      // Extract table name
      const tableName = command.replace(/^(describe|desc)\s+/i, '').trim();
      const schema = await getDatabaseSchema();
      const table = schema.find(t => t.table.toLowerCase() === tableName.toLowerCase());
      
      if (!table) {
        return `Table '${tableName}' not found in the database.`;
      }
      
      return `Table: ${table.table}\n\n${formatSchemaForChat([table])}`;
    }
    
    // If it looks like a SQL query, try to execute it
    if (commandLower.includes('select ') || 
        commandLower.includes('insert ') || 
        commandLower.includes('update ') || 
        commandLower.includes('delete ') ||
        commandLower.includes('create table') ||
        commandLower.includes('alter table')) {
      const results = await executeQuery(command);
      return formatQueryResultsForChat(results);
    }
    
    // If no specific command matched
    return 'Database command not recognized. Try commands like "query SELECT * FROM users", "schema", "tables", or "describe users".';
    
  } catch (error) {
    console.error('Error processing database command:', error);
    return `Error processing database command: ${error.message}`;
  }
};

export default {
  setDatabaseConnection,
  loadDatabaseConnections,
  getDatabaseConnections,
  getCurrentDatabaseConnection,
  isDatabaseConnected,
  executeQuery,
  formatQueryResultsForChat,
  getDatabaseSchema,
  formatSchemaForChat,
  processDatabaseCommand
};
