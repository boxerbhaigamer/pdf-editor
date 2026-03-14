# Tournament PDF Header Automation System - Deployment Guide

## Deploying to Render

### 1. Update Environment Variables

Before deploying to Render, you need to update the environment variables in your `.env` file:

```
# Database Configuration - UPDATE THESE VALUES WITH YOUR RENDER POSTGRESQL CREDENTIALS
DB_USER=your_render_db_user
DB_HOST=your_render_db_host
DB_NAME=your_render_db_name
DB_PASSWORD=your_render_db_password
DB_PORT=5432
```

### 2. Set Up Render Services

#### PostgreSQL Database
1. Create a new PostgreSQL database on Render
2. Note the connection credentials (host, user, password, database name, port)

#### Web Service (Backend)
1. Connect your GitHub repository to Render
2. Set the build command to: `npm install` (if you have a package.json in the server directory)
3. Set the start command to: `node server.js`
4. Add environment variables in the Render dashboard:
   - DB_USER: [your database user]
   - DB_HOST: [your database host]
   - DB_NAME: [your database name]
   - DB_PASSWORD: [your database password]
   - DB_PORT: 5432
   - JWT_SECRET: [your JWT secret - can be any random string]

### 3. Initialize Database

After deploying, you need to initialize the database schema:

1. SSH into your Render web service or use the Render console
2. Navigate to the server directory
3. Run: `node scripts/init-db.js`

Alternatively, you can manually run the SQL commands from `database/schema.sql` in your Render PostgreSQL database.

### 4. Default Admin User

The system includes a default admin user:
- Email: admin@example.com
- Password: admin123

You should change this password after first login.

### 5. Frontend Configuration

If your frontend is hosted separately, make sure to update the API endpoint URLs to point to your Render backend URL instead of localhost:5000.

## Troubleshooting

### Login Issues
If you're getting "failed to login" errors:
1. Verify database connection settings
2. Ensure the users table exists with proper schema
3. Check that the default admin user was created
4. Verify the backend logs for any error messages

### Database Connection Issues
1. Double-check all database environment variables
2. Ensure your Render PostgreSQL database allows connections from your web service
3. Check that you're using the correct port (usually 5432 for PostgreSQL)