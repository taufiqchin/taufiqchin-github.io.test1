const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Storage paths
const publicDir = path.join(__dirname, 'public');
const momentDir = path.join(publicDir, 'moment');
const jsonPath = path.join(__dirname, 'moments.json');

// Ensure folders exist
if (!fs.existsSync(momentDir)) {
  fs.mkdirSync(momentDir, { recursive: true });
}
if (!fs.existsSync(jsonPath)) {
  fs.writeFileSync(jsonPath, JSON.stringify({ moments: [] }, null, 2));
}

// Middleware
app.use(express.json({ limit: '10mb' })); // Handle base64 images
app.use(express.static(publicDir));

// API: Save new moment
app.post('/save-moment', (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'No image data' });

  const base64Data = image.replace(/^data:image\/png;base64,/, '');
  const filename = `moment_${Date.now()}.png`;
  const filepath = path.join(momentDir, filename);

  fs.writeFileSync(filepath, base64Data, 'base64');

  const newMoment = {
    path: `moment/${filename}`, // served from /public
    date: new Date().toISOString()
  };

  // Save to JSON (fixed: added utf8)
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  data.moments.push(newMoment);
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

  res.json(newMoment);
});

// API: Get all moments
app.get('/moments', (req, res) => {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  res.json(data.moments);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
