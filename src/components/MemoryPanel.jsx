import React, { useState, useEffect } from 'react';
import {
  getAllMemories,
  getMemoriesByType,
  searchMemories,
  deleteMemory,
  resetMemory,
  MEMORY_TYPES
} from '../services/memoryService';

const MemoryPanel = () => {
  const [memories, setMemories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isOpen, setIsOpen] = useState(false);

  // Load memories
  useEffect(() => {
    loadMemories();
  }, [activeFilter]);

  // Load memories based on active filter
  const loadMemories = () => {
    let filteredMemories;

    if (searchQuery.trim()) {
      filteredMemories = searchMemories(searchQuery);
    } else if (activeFilter === 'all') {
      filteredMemories = getAllMemories();
    } else {
      filteredMemories = getMemoriesByType(activeFilter);
    }

    setMemories(filteredMemories);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) {
      setMemories(searchMemories(e.target.value));
    } else {
      loadMemories();
    }
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setSearchQuery('');
  };

  // Handle memory deletion
  const handleDeleteMemory = (id) => {
    if (window.confirm('Are you sure you want to delete this memory?')) {
      deleteMemory(id);
      loadMemories();
    }
  };

  // Handle resetting all memories
  const handleResetMemories = () => {
    if (window.confirm('Are you sure you want to reset all memories? This cannot be undone.')) {
      resetMemory();
      loadMemories();
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get memory type label
  const getMemoryTypeLabel = (type) => {
    switch (type) {
      case MEMORY_TYPES.LEARNED_FACT:
        return 'Fact';
      case MEMORY_TYPES.USER_PREFERENCE:
        return 'Preference';
      case MEMORY_TYPES.CONTEXT:
        return 'Context';
      case MEMORY_TYPES.IMPORTANT:
        return 'Important';
      default:
        return type;
    }
  };

  return (
    <div className={`memory-panel ${isOpen ? 'open' : 'closed'}`}>
      <div className="memory-panel-toggle" onClick={() => setIsOpen(!isOpen)}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 3.5C4 3.5 2 7.5 2 9.5C2 11.5 3 12.5 4 13.5C5 14.5 6 15.5 7 16.5C8 17.5 9 18.5 9 20.5C9 21.5 8 21.5 8 21.5C8 21.5 16 21.5 16 21.5C16 21.5 15 21.5 15 20.5C15 18.5 16 17.5 17 16.5C18 15.5 19 14.5 20 13.5C21 12.5 22 11.5 22 9.5C22 7.5 20 3.5 15 3.5C13 3.5 12 5 12 5C12 5 11 3.5 9 3.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {isOpen && (
        <div className="memory-panel-content">
          <div className="memory-panel-header">
            <h3>Apployd's Memory</h3>
            <div className="memory-search">
              <input
                type="text"
                placeholder="Search memories..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <button
              className="memory-reset-button"
              onClick={handleResetMemories}
              title="Reset all memories"
            >
              Reset All Memories
            </button>
          </div>

          <div className="memory-filters">
            <button
              className={`memory-filter ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All
            </button>
            <button
              className={`memory-filter ${activeFilter === MEMORY_TYPES.LEARNED_FACT ? 'active' : ''}`}
              onClick={() => handleFilterChange(MEMORY_TYPES.LEARNED_FACT)}
            >
              Facts
            </button>
            <button
              className={`memory-filter ${activeFilter === MEMORY_TYPES.USER_PREFERENCE ? 'active' : ''}`}
              onClick={() => handleFilterChange(MEMORY_TYPES.USER_PREFERENCE)}
            >
              Preferences
            </button>
            <button
              className={`memory-filter ${activeFilter === MEMORY_TYPES.IMPORTANT ? 'active' : ''}`}
              onClick={() => handleFilterChange(MEMORY_TYPES.IMPORTANT)}
            >
              Important
            </button>
          </div>

          <div className="memories-list">
            {memories.length === 0 ? (
              <div className="no-memories">
                {searchQuery
                  ? `No memories found for "${searchQuery}"`
                  : 'No memories stored yet. Apployd will remember important information as you chat.'}
              </div>
            ) : (
              memories.map(memory => (
                <div key={memory.id} className={`memory-item ${memory.type}`}>
                  <div className="memory-content">
                    <div className="memory-text">{memory.text}</div>
                    <div className="memory-meta">
                      <span className="memory-type">{getMemoryTypeLabel(memory.type)}</span>
                      <span className="memory-date">{formatDate(memory.createdAt)}</span>
                      <span className="memory-access-count">Accessed: {memory.accessCount} times</span>
                    </div>
                  </div>
                  <button
                    className="memory-delete"
                    onClick={() => handleDeleteMemory(memory.id)}
                    title="Delete this memory"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryPanel;
