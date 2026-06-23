/**
 * server.js — Express server for Azir Azrai's Portfolio
 * Serves the static frontend and provides a /api/contact endpoint
 * for the contact form so messages can be handled server-side.
 */

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve three.js from node_modules so the frontend can use it
app.get('/three.js', (req, res) => {
  const threeFile = path.join(__dirname, 'node_modules', 'three', 'build', 'three.core.min.js');
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(threeFile);
});

// Serve every file inside /public as a static asset
app.use(express.static(path.join(__dirname, 'public')));

// Serve local browser modules used by the Hyperspeed background
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// ─── Visitor Counter Data Persistence ─────────────────────────────────────────
const fs = require('fs');
const STATS_FILE = path.join(__dirname, 'stats.json');
let visitorCount = 0;

try {
  if (fs.existsSync(STATS_FILE)) {
    const data = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    visitorCount = Number(data.visitorCount) || 0;
  } else {
    fs.writeFileSync(STATS_FILE, JSON.stringify({ visitorCount: 0 }), 'utf8');
  }
} catch (err) {
  console.error('⚠️ Visitor counter error reading stats.json:', err);
}

// GET /api/visitor-count
app.get('/api/visitor-count', (req, res) => {
  const increment = req.query.inc === 'true';
  if (increment) {
    visitorCount++;
    fs.writeFile(STATS_FILE, JSON.stringify({ visitorCount }), 'utf8', (err) => {
      if (err) console.error('⚠️ Error writing stats.json:', err);
    });
  }
  res.json({ count: visitorCount });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

/**
 * POST /api/contact
 * Receives { name, email, message } from the contact form.
 * Currently logs the submission; swap in nodemailer or a DB call here.
 */
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  // ── Log to console (replace this with email/DB logic as needed) ──
  console.log('\n📩 New Contact Form Submission');
  console.log('─────────────────────────────');
  console.log(`Name   : ${name}`);
  console.log(`Email  : ${email}`);
  console.log(`Message: ${message}`);
  console.log('─────────────────────────────\n');

  res.json({ success: true, message: 'Message received! I\'ll get back to you soon.' });
});

// ─── Catch-all: serve index.html for page routes (not assets) ───────────────
app.get('*', (req, res) => {
  // Don't catch asset requests — only HTML page navigations
  if (req.path.match(/\.(js|css|png|jpg|webp|glb|pdf|ico|woff|woff2)$/)) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Portfolio server running at http://localhost:${PORT}`);
  console.log(`    Press Ctrl+C to stop.\n`);
});
