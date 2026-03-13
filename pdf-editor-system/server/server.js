const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const templateRoutes = require('./routes/templateRoutes');
const pdfRoutes = require('./routes/pdfRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes

// --- TEMPORARY OAUTH ROUTES FOR GOOGLE DRIVE SETUP ---
app.get('/auth/google', (req, res) => {
  const { google } = require('googleapis');
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    process.env.GOOGLE_DRIVE_REDIRECT_URI
  );
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force consent prompt to ensure we get a refresh token
    scope: ['https://www.googleapis.com/auth/drive.file']
  });
  res.redirect(authUrl);
});

app.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code provided');
  
  const { google } = require('googleapis');
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    process.env.GOOGLE_DRIVE_REDIRECT_URI
  );
  
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    res.send(`
      <div style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h1 style="color: #4f46e5;">Google Drive Authorized! 🎉</h1>
        <p>Your Refresh Token has been successfully generated:</p>
        <div style="background: #f4f4f5; padding: 15px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 16px; margin: 20px 0;">
          ${tokens.refresh_token || 'ERROR: No refresh token returned. Did you already authorize this app? Go to Google Account Permissions, remove this app, and try again.'}
        </div>
        <p><b>Next Steps:</b></p>
        <ol>
          <li>Copy the exact token above.</li>
          <li>Paste it into your <code>server/.env</code> file as <code>GOOGLE_DRIVE_REFRESH_TOKEN=...</code></li>
          <li>Save the .env file.</li>
          <li>You can now close this tab.</li>
        </ol>
      </div>
    `);
  } catch (error) {
    console.error('OAuth Error:', error);
    res.status(500).send('Error retrieving access token: ' + error.message);
  }
});
// -----------------------------------------------------

app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/pdf', pdfRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Tournament PDF Header Automation System API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});