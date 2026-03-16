const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3458;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Data directory
const DATA_DIR = path.join(__dirname, 'data');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');
const REDDIT_DIR = path.join(DATA_DIR, 'reddit-recon');

// Ensure data files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(WAITLIST_FILE)) {
  fs.writeFileSync(WAITLIST_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(REDDIT_DIR)) {
  fs.mkdirSync(REDDIT_DIR, { recursive: true });
}

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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
