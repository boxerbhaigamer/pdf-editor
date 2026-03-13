const { google } = require('googleapis');
const stream = require('stream');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Google Auth client
const getAuthClient = () => {
  const credentials = {
    client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
    client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    redirect_uris: [process.env.GOOGLE_DRIVE_REDIRECT_URI]
  };

  const oAuth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris[0]
  );

  // In a real multi-user system, you would store and retrieve user-specific tokens.
  // For this application, we require the admin to set a REFRESH_TOKEN in .env
  // to authorize the app to access the specific Google Drive.
  if (process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
    oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
  }

  return oAuth2Client;
};

// Initialize Google Drive API client
const drive = google.drive({ version: 'v3', auth: getAuthClient() });

const uploadToGoogleDrive = async (fileBuffer, fileName, folderId) => {
  try {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const fileMetadata = {
      name: fileName,
      parents: folderId ? [folderId] : undefined
    };

    const media = {
      mimeType: 'application/pdf',
      body: bufferStream,
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    // Make the file accessible to anyone with the link
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    console.log(`Successfully uploaded ${fileName} to Google Drive (ID: ${response.data.id})`);
    return response.data; // Returns { id, webViewLink, webContentLink }
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error(`Failed to upload to Google Drive: ${error.message}`);
  }
};

const createFolderInGoogleDrive = async (folderName, parentFolderId = null) => {
  try {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    });

    console.log(`Created folder "${folderName}" in Google Drive (ID: ${response.data.id})`);
    return response.data.id;
  } catch (error) {
    console.error('Error creating Google Drive folder:', error);
    throw new Error(`Failed to create Google Drive folder: ${error.message}`);
  }
};

const createTournamentFolders = async (tournamentName, parentFolderId) => {
  try {
    console.log(`Creating Google Drive folder structure for tournament: ${tournamentName}`);
    const mainFolderId = await createFolderInGoogleDrive(tournamentName, parentFolderId);
    const originalFolderId = await createFolderInGoogleDrive('Original', mainFolderId);
    const editedFolderId = await createFolderInGoogleDrive('Edited', mainFolderId);
    
    return {
      mainFolderId,
      originalFolderId,
      editedFolderId
    };
  } catch (error) {
    console.error('Error creating tournament folder structure in Google Drive:', error);
    throw error;
  }
};

module.exports = {
  uploadToGoogleDrive,
  createFolderInGoogleDrive,
  createTournamentFolders
};