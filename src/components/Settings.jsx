import { useState } from 'react';
import AdvancedFeatures from './AdvancedFeatures';
import './Settings.css';

const Settings = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('general');

  return (
    <div className="settings-overlay">
      <div className="settings-container">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-sidebar">
            <button
              className={`settings-nav-item ${activeSection === 'general' ? 'active' : ''}`}
              onClick={() => setActiveSection('general')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              General
            </button>
            <button
              className={`settings-nav-item ${activeSection === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveSection('appearance')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a10 10 0 0 0-6.88 17.23L12 12l6.88 7.23A10 10 0 0 0 12 2z"></path>
                <circle cx="12" cy="12" r="4"></circle>
              </svg>
              Appearance
            </button>
            <button
              className={`settings-nav-item ${activeSection === 'advanced' ? 'active' : ''}`}
              onClick={() => setActiveSection('advanced')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
              </svg>
              Advanced Features
            </button>
            <button
              className={`settings-nav-item ${activeSection === 'shortcuts' ? 'active' : ''}`}
              onClick={() => setActiveSection('shortcuts')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
              </svg>
              Shortcuts
            </button>
            <button
              className={`settings-nav-item ${activeSection === 'about' ? 'active' : ''}`}
              onClick={() => setActiveSection('about')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              About
            </button>
          </div>

          <div className="settings-main">
            {activeSection === 'general' && (
              <div className="settings-section">
                <h3>General Settings</h3>

                <div className="settings-group">
                  <h4>API Key</h4>
                  <div className="setting-item">
                    <label>ApploydAPI Key</label>
                    <input
                      type="password"
                      placeholder="Enter your ApploydAPI key"
                      value={localStorage.getItem('gemini_api_key') || ''}
                      onChange={(e) => localStorage.setItem('gemini_api_key', e.target.value)}
                    />
                    <p className="setting-description">
                      Your ApploydAPI key is stored locally and never sent to our servers.
                    </p>
                  </div>
                </div>

                <div className="settings-group">
                  <h4>Chat Behavior</h4>
                  <div className="setting-item">
                    <label>Auto-enable Features</label>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        id="auto-enable-features"
                        defaultChecked={localStorage.getItem('auto_enable_features') !== 'false'}
                        onChange={(e) => localStorage.setItem('auto_enable_features', e.target.checked)}
                      />
                      <label htmlFor="auto-enable-features"></label>
                    </div>
                    <p className="setting-description">
                      Automatically enable features like Web Search based on your queries.
                    </p>
                  </div>

                  <div className="setting-item">
                    <label>Response Style</label>
                    <select
                      defaultValue={localStorage.getItem('response_style') || 'balanced'}
                      onChange={(e) => localStorage.setItem('response_style', e.target.value)}
                    >
                      <option value="concise">Concise</option>
                      <option value="balanced">Balanced</option>
                      <option value="detailed">Detailed</option>
                    </select>
                    <p className="setting-description">
                      Controls how detailed Gemini's responses will be.
                    </p>
                  </div>

                  <div className="setting-item">
                    <label>Auto-save Conversations</label>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        id="auto-save-conversations"
                        defaultChecked={localStorage.getItem('auto_save_conversations') !== 'false'}
                        onChange={(e) => localStorage.setItem('auto_save_conversations', e.target.checked)}
                      />
                      <label htmlFor="auto-save-conversations"></label>
                    </div>
                    <p className="setting-description">
                      Automatically save conversations for future reference.
                    </p>
                  </div>
                </div>

                <div className="settings-group">
                  <h4>Privacy</h4>
                  <div className="setting-item">
                    <label>Memory System</label>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        id="enable-memory"
                        defaultChecked={localStorage.getItem('enable_memory') !== 'false'}
                        onChange={(e) => localStorage.setItem('enable_memory', e.target.checked)}
                      />
                      <label htmlFor="enable-memory"></label>
                    </div>
                    <p className="setting-description">
                      Allow Apploydto remember important information from your conversations.
                    </p>
                  </div>

                  <div className="setting-item">
                    <label>Data Collection</label>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        id="data-collection"
                        defaultChecked={localStorage.getItem('data_collection') === 'true'}
                        onChange={(e) => localStorage.setItem('data_collection', e.target.checked)}
                      />
                      <label htmlFor="data-collection"></label>
                    </div>
                    <p className="setting-description">
                      Allow anonymous usage data to be collected to improve the application.
                    </p>
                  </div>

                  <div className="setting-item">
                    <label>Clear All Data</label>
                    <button
                      className="danger-button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear all data? This will remove all conversations, memories, and settings.')) {
                          localStorage.clear();
                          window.location.reload();
                        }
                      }}
                    >
                      Clear All Data
                    </button>
                    <p className="setting-description">
                      Permanently delete all locally stored data including conversations and settings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="settings-section">
                <h3>Appearance Settings</h3>

                <div className="settings-group">
                  <h4>Theme</h4>
                  <div className="setting-item">
                    <label>Theme Mode</label>
                    <div className="theme-selector">
                      <button
                        className={`theme-option ${localStorage.getItem('theme_mode') === 'dark' || !localStorage.getItem('theme_mode') ? 'active' : ''}`}
                        onClick={() => {
                          localStorage.setItem('theme_mode', 'dark');
                          document.documentElement.setAttribute('data-theme', 'dark');
                        }}
                      >
                        <span className="theme-preview dark"></span>
                        Dark
                      </button>
                      <button
                        className={`theme-option ${localStorage.getItem('theme_mode') === 'light' ? 'active' : ''}`}
                        onClick={() => {
                          localStorage.setItem('theme_mode', 'light');
                          document.documentElement.setAttribute('data-theme', 'light');
                        }}
                      >
                        <span className="theme-preview light"></span>
                        Light
                      </button>
                      <button
                        className={`theme-option ${localStorage.getItem('theme_mode') === 'system' ? 'active' : ''}`}
                        onClick={() => {
                          localStorage.setItem('theme_mode', 'system');
                          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                          document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                        }}
                      >
                        <span className="theme-preview system"></span>
                        System
                      </button>
                    </div>
                  </div>

                  <div className="setting-item">
                    <label>Accent Color</label>
                    <div className="color-selector">
                      <button
                        className={`color-option purple ${localStorage.getItem('accent_color') === 'purple' || !localStorage.getItem('accent_color') ? 'active' : ''}`}
                        onClick={() => {
                          localStorage.setItem('accent_color', 'purple');
                          document.documentElement.style.setProperty('--gemini-primary', '#7c5dff');
                          document.documentElement.style.setProperty('--gemini-primary-light', '#9a85ff');
                        }}
                      ></button>
                      <button
                        className={`color-option blue ${localStorage.getItem('accent_color') === 'blue' ? 'active' : ''}`}
                        onClick={() => {
                          localStorage.setItem('accent_color', 'blue');
                          document.documentElement.style.setProperty('--gemini-primary', '#4285f4');
                          document.documentElement.style.setProperty('--gemini-primary-light', '#5e97f5');
                        }}
                      ></button>
                      <button
                        className={`color-option green ${localStorage.getItem('accent_color') === 'green' ? 'active' : ''}`}
                        onClick={() => {
                          localStorage.setItem('accent_color', 'green');
                          document.documentElement.style.setProperty('--gemini-primary', '#0f9d58');
                          document.documentElement.style.setProperty('--gemini-primary-light', '#1fb978');
                        }}
                      ></button>
                      <button
                        className={`color-option red ${localStorage.getItem('accent_color') === 'red' ? 'active' : ''}`}
                        onClick={() => {
                          localStorage.setItem('accent_color', 'red');
                          document.documentElement.style.setProperty('--gemini-primary', '#db4437');
                          document.documentElement.style.setProperty('--gemini-primary-light', '#e25a4e');
                        }}
                      ></button>
                    </div>
                    <p className="setting-description">
                      Choose the primary color for the interface.
                    </p>
                  </div>
                </div>

                <div className="settings-group">
                  <h4>Chat Display</h4>
                  <div className="setting-item">
                    <label>Message Density</label>
                    <select
                      defaultValue={localStorage.getItem('message_density') || 'comfortable'}
                      onChange={(e) => {
                        localStorage.setItem('message_density', e.target.value);
                        document.documentElement.setAttribute('data-density', e.target.value);
                      }}
                    >
                      <option value="compact">Compact</option>
                      <option value="comfortable">Comfortable</option>
                      <option value="spacious">Spacious</option>
                    </select>
                    <p className="setting-description">
                      Controls the spacing between messages in the chat.
                    </p>
                  </div>

                  <div className="setting-item">
                    <label>Font Size</label>
                    <div className="font-size-selector">
                      <button
                        className={`font-size-option ${localStorage.getItem('font_size') === 'small' ? 'active' : ''}`}
                        onClick={() => {
                          localStorage.setItem('font_size', 'small');
                          document.documentElement.style.setProperty('--base-font-size', '14px');
                        }}
                      >Small</button>
                      <button
                        className={`font-size-option ${localStorage.getItem('font_size') === 'medium' || !localStorage.getItem('font_size') ? 'active' : ''}`}
                        onClick={() => {
                          localStorage.setItem('font_size', 'medium');
                          document.documentElement.style.setProperty('--base-font-size', '16px');
                        }}
                      >Medium</button>
                      <button
                        className={`font-size-option ${localStorage.getItem('font_size') === 'large' ? 'active' : ''}`}
                        onClick={() => {
                          localStorage.setItem('font_size', 'large');
                          document.documentElement.style.setProperty('--base-font-size', '18px');
                        }}
                      >Large</button>
                    </div>
                    <p className="setting-description">
                      Adjust the text size throughout the application.
                    </p>
                  </div>
                </div>

                <div className="settings-group">
                  <h4>Accessibility</h4>
                  <div className="setting-item">
                    <label>Reduced Motion</label>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        id="reduced-motion"
                        defaultChecked={localStorage.getItem('reduced_motion') === 'true'}
                        onChange={(e) => {
                          localStorage.setItem('reduced_motion', e.target.checked);
                          if (e.target.checked) {
                            document.documentElement.classList.add('reduced-motion');
                          } else {
                            document.documentElement.classList.remove('reduced-motion');
                          }
                        }}
                      />
                      <label htmlFor="reduced-motion"></label>
                    </div>
                    <p className="setting-description">
                      Reduce or eliminate animations throughout the interface.
                    </p>
                  </div>

                  <div className="setting-item">
                    <label>High Contrast</label>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        id="high-contrast"
                        defaultChecked={localStorage.getItem('high_contrast') === 'true'}
                        onChange={(e) => {
                          localStorage.setItem('high_contrast', e.target.checked);
                          if (e.target.checked) {
                            document.documentElement.classList.add('high-contrast');
                          } else {
                            document.documentElement.classList.remove('high-contrast');
                          }
                        }}
                      />
                      <label htmlFor="high-contrast"></label>
                    </div>
                    <p className="setting-description">
                      Increase contrast for better readability.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'advanced' && (
              <div className="settings-section">
                <h3>Advanced Features</h3>
                <AdvancedFeatures />
              </div>
            )}

            {activeSection === 'shortcuts' && (
              <div className="settings-section">
                <h3>Keyboard Shortcuts</h3>

                <div className="settings-group">
                  <h4>General</h4>
                  <div className="shortcuts-list">
                    <div className="shortcut-item">
                      <div className="shortcut-keys">
                        <kbd>Ctrl</kbd> + <kbd>/</kbd>
                      </div>
                      <div className="shortcut-description">Open Settings</div>
                    </div>
                    <div className="shortcut-item">
                      <div className="shortcut-keys">
                        <kbd>Ctrl</kbd> + <kbd>H</kbd>
                      </div>
                      <div className="shortcut-description">Toggle Sidebar</div>
                    </div>
                    <div className="shortcut-item">
                      <div className="shortcut-keys">
                        <kbd>Ctrl</kbd> + <kbd>M</kbd>
                      </div>
                      <div className="shortcut-description">Toggle Memory Panel</div>
                    </div>
                    <div className="shortcut-item">
                      <div className="shortcut-keys">
                        <kbd>Esc</kbd>
                      </div>
                      <div className="shortcut-description">Close Modals / Cancel</div>
                    </div>
                  </div>
                </div>

                <div className="settings-group">
                  <h4>Chat</h4>
                  <div className="shortcuts-list">
                    <div className="shortcut-item">
                      <div className="shortcut-keys">
                        <kbd>Ctrl</kbd> + <kbd>N</kbd>
                      </div>
                      <div className="shortcut-description">New Chat</div>
                    </div>
                    <div className="shortcut-item">
                      <div className="shortcut-keys">
                        <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
                      </div>
                      <div className="shortcut-description">Send Message</div>
                    </div>
                    <div className="shortcut-item">
                      <div className="shortcut-keys">
                        <kbd>Ctrl</kbd> + <kbd>↑</kbd>
                      </div>
                      <div className="shortcut-description">Previous Message</div>
                    </div>
                    <div className="shortcut-item">
                      <div className="shortcut-keys">
                        <kbd>Ctrl</kbd> + <kbd>↓</kbd>
                      </div>
                      <div className="shortcut-description">Next Message</div>
                    </div>
                  </div>
                </div>

                <div className="settings-group">
                  <h4>Features</h4>
                  <div className="shortcuts-list">
                    <div className="shortcut-item">
                      <div className="shortcut-keys">
                        <kbd>Ctrl</kbd> + <kbd>S</kbd>
                      </div>
                      <div className="shortcut-description">Toggle Web Search</div>
                    </div>
                    <div className="shortcut-item">
                      <div className="shortcut-keys">
                        <kbd>Ctrl</kbd> + <kbd>R</kbd>
                      </div>
                      <div className="shortcut-description">Toggle Advanced Reasoning</div>
                    </div>
                    <div className="shortcut-item">
                      <div className="shortcut-keys">
                        <kbd>Ctrl</kbd> + <kbd>D</kbd>
                      </div>
                      <div className="shortcut-description">Toggle Document Generation</div>
                    </div>
                    <div className="shortcut-item">
                      <div className="shortcut-keys">
                        <kbd>Ctrl</kbd> + <kbd>U</kbd>
                      </div>
                      <div className="shortcut-description">Upload File</div>
                    </div>
                  </div>
                </div>

                <div className="settings-group">
                  <h4>Customize Shortcuts</h4>
                  <div className="setting-item">
                    <label>Enable Keyboard Shortcuts</label>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        id="enable-shortcuts"
                        defaultChecked={localStorage.getItem('enable_shortcuts') !== 'false'}
                        onChange={(e) => localStorage.setItem('enable_shortcuts', e.target.checked)}
                      />
                      <label htmlFor="enable-shortcuts"></label>
                    </div>
                    <p className="setting-description">
                      Enable or disable all keyboard shortcuts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'about' && (
              <div className="settings-section">
                <h3>About Apployd</h3>

                <div className="about-content">
                  <div className="app-logo">
                    <svg width="64" height="64" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="96" cy="96" r="96" fill="url(#paint0_linear)" />
                      <path d="M96 32L32 96L96 160L160 96L96 32Z" fill="url(#paint1_linear)" />
                      <defs>
                        <linearGradient id="paint0_linear" x1="0" y1="0" x2="192" y2="192" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#7C5DFF" />
                          <stop offset="1" stopColor="#4B3BBE" />
                        </linearGradient>
                        <linearGradient id="paint1_linear" x1="32" y1="32" x2="160" y2="160" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FFFFFF" />
                          <stop offset="1" stopColor="#E0E0FF" stopOpacity="0.8" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  <h2>Apployd</h2>
                  <p className="version">Version 1.0.0</p>

                  <p className="about-description">
                    An advanced AI assistant with powerful features including web search,
                    document/image upload, reasoning, memory system, document generation,
                    GitHub integration, and PostgreSQL database management.
                  </p>

                  <div className="about-links">
                    <a href="https://github.com/Adarshagupta/Useless-repo" target="_blank" rel="noopener noreferrer">
                      GitHub Repository
                    </a>
                    <a href="https://apployd.ai/docs" target="_blank" rel="noopener noreferrer">
                      Apployd Documentation
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
