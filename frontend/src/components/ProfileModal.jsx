import React, { useState, useEffect } from 'react';

export default function ProfileModal({ isOpen, onClose, user, setUser }) {
  // Mode can be: 'login', 'register', 'view', 'edit'
  const [mode, setMode] = useState('login');

  // Form states for login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Form states for registration / editing profile
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    avatarUrl: ''
  });

  const [message, setMessage] = useState('');

  // When modal opens or user changes, set appropriate mode
  useEffect(() => {
    if (user) {
      setMode('view');
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: user.password || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        postalCode: user.postalCode || '',
        avatarUrl: user.avatarUrl || ''
      });
    } else {
      setMode('login');
    }
    setMessage('');
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Login
  const handleLogin = (e) => {
    e.preventDefault();
    const storedUsers = JSON.parse(localStorage.getItem('exotic_users') || '[]');
    const foundUser = storedUsers.find(
      (u) => u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === loginPassword
    );

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('exotic_current_user', JSON.stringify(foundUser));
      setMessage('Successfully logged in!');
      setMode('view');
    } else {
      setMessage('Invalid email or password. Please try again.');
    }
  };

  // Handle Register
  const handleRegister = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setMessage('Please fill in Name, Email, and Password.');
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem('exotic_users') || '[]');
    const existing = storedUsers.find((u) => u.email.toLowerCase() === formData.email.toLowerCase());

    if (existing) {
      setMessage('An account with this email already exists.');
      return;
    }

    const newUser = { ...formData, id: Date.now() };
    storedUsers.push(newUser);
    localStorage.setItem('exotic_users', JSON.stringify(storedUsers));
    localStorage.setItem('exotic_current_user', JSON.stringify(newUser));

    setUser(newUser);
    setMessage('Account created successfully!');
    setMode('view');
  };

  // Handle Edit & Save Profile
  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updatedUser = { ...user, ...formData };

    // Update in stored users list
    const storedUsers = JSON.parse(localStorage.getItem('exotic_users') || '[]');
    const newStoredUsers = storedUsers.map((u) => (u.id === user.id ? updatedUser : u));

    localStorage.setItem('exotic_users', JSON.stringify(newStoredUsers));
    localStorage.setItem('exotic_current_user', JSON.stringify(updatedUser));

    setUser(updatedUser);
    setMessage('Profile updated successfully!');
    setMode('view');
  };

  // Handle Logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('exotic_current_user');
    setLoginEmail('');
    setLoginPassword('');
    setMode('login');
    setMessage('Logged out successfully.');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>
            {mode === 'login' && 'Log In to Your Account'}
            {mode === 'register' && 'Create New Account'}
            {mode === 'view' && 'My Profile'}
            {mode === 'edit' && 'Edit Profile Data'}
          </h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="profile-body">
          {message && <div className="auth-alert">{message}</div>}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  className="search-input custom-input"
                  placeholder="your@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  required
                  className="search-input custom-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="checkout-btn">Log In</button>

              <div className="auth-switch-text">
                Don't have an account?{' '}
                <button type="button" className="link-btn" onClick={() => { setMode('register'); setMessage(''); }}>
                  Register here
                </button>
              </div>
            </form>
          )}

          {/* MODE: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="search-input custom-input"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="search-input custom-input"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  className="search-input custom-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  className="search-input custom-input"
                  placeholder="+49 170 1234567"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Shipping Street Address</label>
                <input
                  type="text"
                  name="address"
                  className="search-input custom-input"
                  placeholder="Hauptstraße 12"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    className="search-input custom-input"
                    placeholder="Berlin"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    className="search-input custom-input"
                    placeholder="10115"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <button type="submit" className="checkout-btn">Create Account</button>

              <div className="auth-switch-text">
                Already have an account?{' '}
                <button type="button" className="link-btn" onClick={() => { setMode('login'); setMessage(''); }}>
                  Log In
                </button>
              </div>
            </form>
          )}

          {/* MODE: VIEW PROFILE */}
          {mode === 'view' && user && (
            <div className="profile-view">
              <div className="avatar-circle">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="user-avatar-img" />
                ) : (
                  <span>{user.name ? user.name.charAt(0).toUpperCase() : '👤'}</span>
                )}
              </div>

              <h4>{user.name}</h4>
              <p className="profile-email">{user.email}</p>

              <div className="profile-details-box">
                <div className="detail-row">
                  <span>Phone:</span> <strong>{user.phone || 'Not set'}</strong>
                </div>
                <div className="detail-row">
                  <span>Address:</span> <strong>{user.address || 'Not set'}</strong>
                </div>
                <div className="detail-row">
                  <span>City / Postal:</span> <strong>{user.city ? `${user.city} (${user.postalCode || ''})` : 'Not set'}</strong>
                </div>
              </div>

              <div className="profile-action-buttons">
                <button className="add-btn" style={{ padding: '10px' }} onClick={() => setMode('edit')}>
                  ✏️ Edit Profile Data
                </button>
                <button className="remove-btn-outline" onClick={handleLogout}>
                  🚪 Log Out
                </button>
              </div>
            </div>
          )}

          {/* MODE: EDIT PROFILE */}
          {mode === 'edit' && user && (
            <form onSubmit={handleSaveProfile} className="auth-form">
              <div className="form-group">
                <label>Profile Image URL</label>
                <input
                  type="text"
                  name="avatarUrl"
                  className="search-input custom-input"
                  placeholder="https://example.com/photo.jpg"
                  value={formData.avatarUrl}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="search-input custom-input"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="search-input custom-input"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  className="search-input custom-input"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  className="search-input custom-input"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Street Address</label>
                <input
                  type="text"
                  name="address"
                  className="search-input custom-input"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    className="search-input custom-input"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    className="search-input custom-input"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="profile-action-buttons">
                <button type="submit" className="checkout-btn">Save Changes</button>
                <button type="button" className="remove-btn-outline" onClick={() => setMode('view')}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}