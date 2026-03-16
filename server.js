const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3458;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Data directory
const DATA_DIR = path.join(__dirname, 'data');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PREFERENCES_FILE = path.join(DATA_DIR, 'preferences.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const ACTIVITY_FILE = path.join(DATA_DIR, 'activity.json');
const JWT_SECRET_FILE = path.join(DATA_DIR, 'jwt_secret.txt');
const REDDIT_DIR = path.join(DATA_DIR, 'reddit-recon');

// Store data
const STORES = [
  { id: '1250', name: 'Novi, MI', address: '21061 Haggerty Rd, Novi, MI 48375', platform: 'uschedule', alias: 'pgatsnovi' },
  { id: '1270', name: 'Roseville, MN', address: 'Roseville, MN', platform: 'uschedule', alias: 'pgatsroseville' },
  { id: '1280', name: 'Kennesaw, GA', address: 'Kennesaw, GA', platform: 'uschedule', alias: 'pgatskennesaw' },
  { id: '1290', name: 'Myrtle Beach, SC', address: 'Myrtle Beach, SC', platform: 'uschedule', alias: 'pgatsmyrtlebeach' },
  { id: '1300', name: 'Orlando, FL', address: 'Orlando, FL', platform: 'uschedule', alias: 'pgatsorlando' },
  { id: '1310', name: 'Scottsdale, AZ', address: 'Scottsdale, AZ', platform: 'uschedule', alias: 'pgatsscottsdale' },
  { id: '1320', name: 'Frisco, TX', address: 'Frisco, TX', platform: 'uschedule', alias: 'pgatsfrisco' },
  { id: '1330', name: 'Westminster, CO', address: 'Westminster, CO', platform: 'uschedule', alias: 'pgatswestminster' }
];

// Ensure data files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(WAITLIST_FILE)) {
  fs.writeFileSync(WAITLIST_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(PREFERENCES_FILE)) {
  fs.writeFileSync(PREFERENCES_FILE, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(ACTIVITY_FILE)) {
  fs.writeFileSync(ACTIVITY_FILE, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(REDDIT_DIR)) {
  fs.mkdirSync(REDDIT_DIR, { recursive: true });
}

// JWT Secret - generate or load
function getJwtSecret() {
  if (fs.existsSync(JWT_SECRET_FILE)) {
    return fs.readFileSync(JWT_SECRET_FILE, 'utf8').trim();
  }
  const secret = require('crypto').randomBytes(64).toString('hex');
  fs.writeFileSync(JWT_SECRET_FILE, secret);
  return secret;
}

const JWT_SECRET = getJwtSecret();

// Helper functions
function readJsonFile(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return {};
  }
}

function writeJsonFile(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// JWT Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ============ AUTH ROUTES ============

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  try {
    const users = readJsonFile(USERS_FILE);
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check for existing user
    const existingUser = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      tier: 'free',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    writeJsonFile(USERS_FILE, users);
    
    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        tier: newUser.tier
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  try {
    const users = readJsonFile(USERS_FILE);
    const normalizedEmail = email.toLowerCase().trim();
    
    const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tier: user.tier || 'free'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in. Please try again.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req, res) => {
  try {
    const users = readJsonFile(USERS_FILE);
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      tier: user.tier || 'free',
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  
  try {
    const users = readJsonFile(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[userIndex];
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    users[userIndex].password = await bcrypt.hash(newPassword, 10);
    writeJsonFile(USERS_FILE, users);
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ============ APP API ROUTES ============

// GET /api/stores
app.get('/api/stores', (req, res) => {
  res.json(STORES);
});

// GET /api/preferences
app.get('/api/preferences', authMiddleware, (req, res) => {
  try {
    const preferences = readJsonFile(PREFERENCES_FILE);
    const userPrefs = preferences[req.user.id] || {
      stores: [],
      days: [],
      times: [],
      backToBack: false,
      alertMethod: 'both'
    };
    res.json(userPrefs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// POST /api/preferences
app.post('/api/preferences', authMiddleware, (req, res) => {
  try {
    const preferences = readJsonFile(PREFERENCES_FILE);
    preferences[req.user.id] = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    writeJsonFile(PREFERENCES_FILE, preferences);
    
    // Log activity
    addActivity(req.user.id, 'preferences_updated', 'Updated monitoring preferences');
    
    res.json({ success: true, message: 'Preferences saved' });
  } catch (err) {
    console.error('Save preferences error:', err);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// GET /api/bookings
app.get('/api/bookings', authMiddleware, (req, res) => {
  try {
    const bookings = readJsonFile(BOOKINGS_FILE);
    const userBookings = bookings[req.user.id] || [];
    res.json(userBookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// POST /api/bookings/:id/cancel
app.post('/api/bookings/:id/cancel', authMiddleware, (req, res) => {
  try {
    const bookings = readJsonFile(BOOKINGS_FILE);
    const userBookings = bookings[req.user.id] || [];
    const bookingIndex = userBookings.findIndex(b => b.id === req.params.id);
    
    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    userBookings[bookingIndex].status = 'cancelled';
    userBookings[bookingIndex].cancelledAt = new Date().toISOString();
    bookings[req.user.id] = userBookings;
    writeJsonFile(BOOKINGS_FILE, bookings);
    
    // Log activity
    addActivity(req.user.id, 'booking_cancelled', `Cancelled booking at ${userBookings[bookingIndex].storeName}`);
    
    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// GET /api/activity
app.get('/api/activity', authMiddleware, (req, res) => {
  try {
    const activity = readJsonFile(ACTIVITY_FILE);
    const userActivity = activity[req.user.id] || [];
    res.json(userActivity.slice(0, 20)); // Return last 20 activities
  } catch (err) {
    res.status(500).json({ error: 'Failed to get activity' });
  }
});

// Helper: Add activity log
function addActivity(userId, type, message) {
  try {
    const activity = readJsonFile(ACTIVITY_FILE);
    if (!activity[userId]) {
      activity[userId] = [];
    }
    activity[userId].unshift({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
      type,
      message,
      timestamp: new Date().toISOString()
    });
    // Keep only last 50 activities
    activity[userId] = activity[userId].slice(0, 50);
    writeJsonFile(ACTIVITY_FILE, activity);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// ============ LEGACY WAITLIST ROUTES ============

// API: Get waitlist (admin only - simple token auth)
app.get('/api/waitlist', (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  
  // Simple admin check - in production, use proper auth
  if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const waitlist = JSON.parse(fs.readFileSync(WAITLIST_FILE, 'utf8'));
    res.json(waitlist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read waitlist' });
  }
});

// API: Add to waitlist
app.post('/api/waitlist', (req, res) => {
  const { email } = req.body;
  
  // Validate email
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }
  
  try {
    const waitlist = JSON.parse(fs.readFileSync(WAITLIST_FILE, 'utf8'));
    
    // Check for duplicate
    const normalizedEmail = email.toLowerCase().trim();
    const isDuplicate = waitlist.some(entry => entry.email.toLowerCase() === normalizedEmail);
    
    if (isDuplicate) {
      return res.status(409).json({ error: 'This email is already on the waitlist' });
    }
    
    // Add new entry
    const newEntry = {
      email: normalizedEmail,
      timestamp: new Date().toISOString(),
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
    };
    
    waitlist.push(newEntry);
    fs.writeFileSync(WAITLIST_FILE, JSON.stringify(waitlist, null, 2));
    
    res.json({ 
      success: true, 
      message: "You're on the list! We'll notify you when OpenTee launches." 
    });
  } catch (err) {
    console.error('Waitlist error:', err);
    res.status(500).json({ error: 'Failed to join waitlist. Please try again.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`OpenTee server running on http://localhost:${PORT}`);
});
