# Project Management System - cPanel Deployment Guide

## Prerequisites

- cPanel hosting account with:
  - PHP 7.4 or higher
  - MySQL 5.7 or higher
  - File Manager or FTP access

## Step-by-Step Deployment

### 1. Create MySQL Database

1. Log into your cPanel
2. Go to **MySQL® Databases**
3. Create a new database:
   - Database name: `project_manager` (or your choice)
   - Click "Create Database"
4. Create a database user:
   - Username: `pm_user` (or your choice)
   - Password: Generate a strong password
   - Click "Create User"
5. Add user to database:
   - Select the user and database
   - Grant **ALL PRIVILEGES**
   - Click "Make Changes"

### 2. Import Database Schema

1. Go to **phpMyAdmin** in cPanel
2. Select your database from the left sidebar
3. Click the **Import** tab
4. Click "Choose File" and select `database.sql`
5. Click "Go" to import
6. Verify that tables `users`, `projects`, and `tasks` were created

### 3. Configure Database Connection

1. Open `api/config.php` in File Manager or via FTP
2. Update the following lines with your database credentials:

   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'your_database_name');  // Change this
   define('DB_USER', 'your_database_user');  // Change this
   define('DB_PASS', 'your_database_password');  // Change this
   ```

3. Save the file

### 4. Upload Files to cPanel

#### Option A: Using File Manager

1. Go to **File Manager** in cPanel
2. Navigate to `public_html` (or your domain's root directory)
3. Upload all project files:
   - `index.html`
   - `assets/` folder (with all CSS/JS files)
   - `api/` folder (with all PHP files)
   - `.htaccess`
4. Set file permissions:
   - Files: 644
   - Directories: 755

#### Option B: Using FTP

1. Connect to your server via FTP (use FileZilla or similar)
2. Navigate to `public_html`
3. Upload all files maintaining the directory structure
4. Set permissions as above

### 5. Verify Installation

1. Visit your website: `https://yourdomain.com`
2. You should see the Project Management System dashboard
3. Check that projects are loading (you should see 12 active projects)
4. Click "Upcoming" to see 11 upcoming projects

### 6. Test API Endpoints

Test that the API is working:

- `https://yourdomain.com/api/projects.php` - Should return JSON with all projects
- `https://yourdomain.com/api/users.php` - Should return JSON with 4 users

## Troubleshooting

### "Database connection failed"

- Check `api/config.php` credentials
- Verify database exists in phpMyAdmin
- Ensure user has privileges

### "500 Internal Server Error"

- Check `.htaccess` file is uploaded
- Verify PHP version is 7.4+
- Check error logs in cPanel

### Projects not loading

- Open browser console (F12)
- Check for JavaScript errors
- Verify API endpoints return JSON

### Permission Denied

- Set correct file permissions (644 for files, 755 for directories)
- Ensure `api/` folder is readable

## Security Recommendations

1. **Change default database credentials** in `api/config.php`
2. **Enable HTTPS** - Get a free SSL certificate from cPanel
3. **Backup regularly** - Use cPanel backup tools
4. **Update PHP** - Keep PHP version up to date

## File Structure

```
public_html/
├── index.html
├── .htaccess
├── assets/
│   ├── app.js
│   ├── style.css
│   ├── media-handler.js
│   └── stats-updater.js
└── api/
    ├── config.php
    ├── projects.php
    ├── users.php
    └── tasks.php
```

## Support

If you encounter issues:

1. Check cPanel error logs
2. Enable PHP error reporting temporarily
3. Verify all files uploaded correctly
4. Test database connection in phpMyAdmin

---

**Your app is now live on cPanel!** 🚀
