import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import apiService from '../../services/apiService';
const { authAPI } = apiService;

const Profile = () => {
  const { user, updateUser } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Load user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setProfilePicture(user.profilePicture || '');
    }
  }, [user]);

  // Load user stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const userStats = await authAPI.getStats();
        setStats(userStats);
      } catch (error) {
        console.error('Error loading user stats:', error);
      }
    };

    if (user) {
      loadStats();
    }
  }, [user]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!name || !email) {
      setError('Name and email are required');
      return;
    }

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password && password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      // Prepare update data
      const updateData = {
        name,
        email,
        profilePicture
      };

      // Only include password if it's provided
      if (password) {
        updateData.password = password;
      }

      // Update profile
      const updatedUser = await authAPI.updateProfile(updateData);

      // Update user context
      updateUser({
        ...user,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture
      });

      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle profile picture change
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Profile picture must be less than 2MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfilePicture(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account information</p>
      </div>

      {error && <div className="profile-error">{error}</div>}
      {success && <div className="profile-success">{success}</div>}

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-picture-section">
            <div className="profile-picture-container">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt={name}
                  className="profile-picture"
                />
              ) : (
                <div className="profile-picture-placeholder">
                  {name ? name.charAt(0).toUpperCase() : '?'}
                </div>
              )}

              {isEditing && (
                <label className="profile-picture-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    hidden
                  />
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V5C19 3.89543 18.1046 3 17 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Change
                </label>
              )}
            </div>

            <div className="profile-info">
              <h2>{user?.name}</h2>
              <p>{user?.email}</p>
              <p className="profile-joined">Joined on {new Date(user?.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {!isEditing ? (
            <button
              className="profile-edit-button"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          ) : (
            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={!password}
                />
              </div>

              <div className="profile-form-actions">
                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={() => {
                    setIsEditing(false);
                    setPassword('');
                    setConfirmPassword('');
                    setName(user?.name || '');
                    setEmail(user?.email || '');
                    setProfilePicture(user?.profilePicture || '');
                    setError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-save-button"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {stats && (
          <div className="profile-stats-card">
            <h2>Your Activity</h2>

            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.counts.documents}</div>
                <div className="stat-label">Documents</div>
              </div>

              <div className="stat-item">
                <div className="stat-value">{stats.counts.conversations}</div>
                <div className="stat-label">Conversations</div>
              </div>

              <div className="stat-item">
                <div className="stat-value">{stats.counts.messages}</div>
                <div className="stat-label">Messages</div>
              </div>

              <div className="stat-item">
                <div className="stat-value">{stats.counts.memories}</div>
                <div className="stat-label">Memories</div>
              </div>
            </div>

            {stats.recent.documents.length > 0 && (
              <div className="recent-activity">
                <h3>Recent Documents</h3>
                <ul className="recent-list">
                  {stats.recent.documents.map(doc => (
                    <li key={doc.id} className="recent-item">
                      <span className="recent-title">{doc.title}</span>
                      <span className="recent-date">{new Date(doc.updatedAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {stats.recent.conversations.length > 0 && (
              <div className="recent-activity">
                <h3>Recent Conversations</h3>
                <ul className="recent-list">
                  {stats.recent.conversations.map(conv => (
                    <li key={conv.id} className="recent-item">
                      <span className="recent-title">{conv.title || 'Untitled Conversation'}</span>
                      <span className="recent-date">{new Date(conv.updatedAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
