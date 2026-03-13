# Final Setup Guide — Tournament PDF Header Automation System

Complete step-by-step guide to set up and run the entire system from scratch.

---

## Prerequisites

Install the following before starting:

| Software | Version | Download |
|---|---|---|
| **Node.js** | v18 or higher | https://nodejs.org/ |
| **PostgreSQL** | v12 or higher | https://www.postgresql.org/download/ |
| **Git** | Latest | https://git-scm.com/ |

Verify installations:
```bash
node -v
npm -v
psql --version
```

---

## Step 1 — Database Setup

### 1.1 Start PostgreSQL

Make sure the PostgreSQL service is running.

**Windows:** Open Services (`services.msc`) → find **postgresql** → Start

**Or via command line:**
```bash
pg_ctl -D "C:\Program Files\PostgreSQL\16\data" start
```

### 1.2 Create the Database

Open a terminal and connect to PostgreSQL:
```bash
psql -U postgres
```
Enter your PostgreSQL password when prompted.

Then run:
```sql
CREATE DATABASE tournament_pdf_system;
\q
```

### 1.3 Run the Schema

From the project root directory:
```bash
psql -U postgres -d tournament_pdf_system -f database/schema.sql
```

This creates all 4 tables (`users`, `tournaments`, `templates`, `files`) and inserts sample data.

> **Note:** The sample users have placeholder password hashes. You'll register real users through the app.

---

## Step 2 — Backend Setup

### 2.1 Navigate to Server Directory

```bash
cd pdf-editor-system/server
```

### 2.2 Install Dependencies

```bash
npm install
```

This installs: `express`, `cors`, `pg`, `bcryptjs`, `jsonwebtoken`, `multer`, `pdf-lib`, `dotenv`, `nodemon`

### 2.3 Create the `.env` File

If the `.env` file doesn't exist, create it:

```bash
copy .env.example .env
```

Then open `.env` and update these values:

```env
# Server Configuration
PORT=5000

# Database Configuration — UPDATE THESE TO MATCH YOUR PostgreSQL SETUP
DB_USER=postgres
DB_HOST=localhost
DB_NAME=tournament_pdf_system
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
DB_PORT=5432

# JWT Configuration — USE A STRONG SECRET IN PRODUCTION
JWT_SECRET=tournament_pdf_system_jwt_secret_2026

# Google Drive API Configuration (optional — see Step 4)
GOOGLE_DRIVE_CLIENT_ID=your_google_drive_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_google_drive_client_secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:5000/oauth/callback
```

> **IMPORTANT:** Replace `YOUR_POSTGRES_PASSWORD_HERE` with the actual password you set when installing PostgreSQL.

### 2.4 Start the Backend Server

For development (auto-restarts on file changes):
```bash
npm run dev
```

For production:
```bash
npm start
```

You should see:
```
Server running on port 5000
```

### 2.5 Verify Backend is Running

Open a browser and go to: `http://localhost:5000`

You should see:
```json
{"message": "Tournament PDF Header Automation System API"}
```

---

## Step 3 — Frontend Setup

### 3.1 Open a New Terminal and Navigate to Client Directory

```bash
cd pdf-editor-system/client
```

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Create the `.env.local` File

Create a file called `.env.local` in the `client` directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

### 3.4 Start the Frontend Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 16.x.x
- Local: http://localhost:3000
```

### 3.5 Open the App

Go to: **http://localhost:3000**

You will be redirected to the login page.

---

## Step 4 — Register Your First User

Since the sample data in `schema.sql` has placeholder password hashes (they won't work for login), you need to register a new user.

### Option A — Via API (Recommended)

Using **Postman**, **curl**, or any HTTP client:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"admin@tournament.com\", \"password\": \"admin123\", \"role\": \"admin\"}"
```

**PowerShell equivalent:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -ContentType "application/json" -Body '{"email": "admin@tournament.com", "password": "admin123", "role": "admin"}'
```

### Option B — Add a Register Page (Optional)

The auth system supports registration via `POST /api/auth/register`. You can also add a register page in the frontend if needed.

### After Registration

Use the registered email and password to log in at `http://localhost:3000/login`.

---

## Step 5 — Google Drive API Setup (Optional)

Google Drive integration is **optional** for development. The system stores files locally in the `server/uploads/` directory by default. Only set this up if you want cloud storage in production.

### 5.1 Create a Google Cloud Project

1. Go to **[Google Cloud Console](https://console.cloud.google.com/)**
2. Click the project dropdown at the top → **New Project**
3. Enter project name: `Tournament PDF System`
4. Click **Create**
5. Make sure the new project is selected in the dropdown

### 5.2 Enable the Google Drive API

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for **"Google Drive API"**
3. Click on **Google Drive API**
4. Click **Enable**

### 5.3 Configure the OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type → **Create**
3. Fill in the required fields:
   - **App name:** `Tournament PDF System`
   - **User support email:** Your email
   - **Developer contact email:** Your email
4. Click **Save and Continue**
5. On the **Scopes** page, click **Add or Remove Scopes**
6. Search and select:
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/drive`
7. Click **Update** → **Save and Continue**
8. On **Test Users**, add your email → **Save and Continue**
9. Click **Back to Dashboard**

### 5.4 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Tournament PDF System Web Client`
5. Under **Authorized redirect URIs**, click **+ Add URI**:
   ```
   http://localhost:5000/oauth/callback
   ```
6. Click **Create**
7. A dialog will show your **Client ID** and **Client Secret** — **copy both**

### 5.5 Add Credentials to `.env`

Open `server/.env` and update:

```env
GOOGLE_DRIVE_CLIENT_ID=paste_your_client_id_here
GOOGLE_DRIVE_CLIENT_SECRET=paste_your_client_secret_here
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:5000/oauth/callback
```

### 5.6 Create a Google Drive Folder for Storage

1. Go to **[Google Drive](https://drive.google.com/)**
2. Create a folder called: `Tournament PDFs`
3. Inside it, create two subfolders:
   - `Original` — for uploaded PDFs
   - `Edited` — for processed PDFs
4. Right-click the `Tournament PDFs` folder → **Share** → set permissions as needed

> **Note:** The current implementation uses local file storage. To switch to Google Drive, you would need to integrate the `server/utils/googleDrive.js` utility with the actual Google Drive API client library (`googleapis` npm package).

---

## Step 6 — Using the System

### Complete User Flow

```
1. Login         →  http://localhost:3000/login
2. Dashboard     →  Create a tournament (e.g., "Rana Sanga 2026")
3. Templates     →  Click "Templates" tab → Create a header template
                     - Add tournament title, subtitle, venue, dates
                     - Upload left and right logos
4. Tournament    →  Click on your tournament
5. Upload        →  Drag & drop or click to upload PDF files
6. Edit Single   →  Click "Edit" on any file → Select template → Apply
7. Batch Edit    →  Select multiple files → "Apply Template to Selected"
8. Download      →  Download individual files or from the editor
9. Print         →  Use the Print button in the editor
```

---

## Quick Start Summary

```bash
# Terminal 1 — Database
psql -U postgres -c "CREATE DATABASE tournament_pdf_system;"
psql -U postgres -d tournament_pdf_system -f database/schema.sql

# Terminal 2 — Backend
cd pdf-editor-system/server
npm install
# Edit .env with your DB password
npm run dev

# Terminal 3 — Frontend
cd pdf-editor-system/client
npm install
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api" > .env.local
npm run dev

# Register first user (Terminal 4 or Postman)
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"admin@test.com\",\"password\":\"admin123\",\"role\":\"admin\"}"

# Open http://localhost:3000 and login
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| `ECONNREFUSED` on port 5432 | PostgreSQL service is not running. Start it. |
| `password authentication failed` | Wrong DB password in `.env`. Check your PostgreSQL password. |
| `relation "users" does not exist` | Schema not loaded. Run `psql -U postgres -d tournament_pdf_system -f database/schema.sql` |
| Frontend shows blank page | Check browser console. Ensure `.env.local` has the correct API URL. |
| `CORS` errors | Backend must be running on port 5000. Check `server.js` CORS config. |
| Upload fails | Check that `server/uploads/` directory is writable. |
| `Cannot find module` | Run `npm install` in both `server/` and `client/` directories. |

---

## Port Reference

| Service | Port | URL |
|---|---|---|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| Backend (Express) | 5000 | http://localhost:5000 |
| PostgreSQL | 5432 | localhost:5432 |
