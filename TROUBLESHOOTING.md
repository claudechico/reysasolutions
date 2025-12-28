# Troubleshooting 404 Errors on Page Reload

## Problem
When you reload a page like `/admin/users`, you get a 404 error from the server.

## Root Cause
This happens because:
1. React Router handles routes on the **client-side** (in the browser)
2. When you reload, the browser asks the **server** for `/admin/users`
3. The server doesn't have that file, so it returns 404
4. The `.htaccess` file tells the server to serve `index.html` instead

## Solution Checklist

### ✅ Step 1: Verify .htaccess is in dist folder
```bash
npm run build
ls -la dist/.htaccess
```
The file should exist and be readable.

### ✅ Step 2: Upload .htaccess to Server
- Make sure `.htaccess` is uploaded to your server
- It should be in the **same directory** as `index.html`
- Check file permissions: should be `644` or `rw-r--r--`

### ✅ Step 3: Verify Server Configuration

**For Apache:**
- `mod_rewrite` must be enabled
- `.htaccess` files must be allowed (usually `AllowOverride All`)

**Check if mod_rewrite is enabled:**
Create a file `phpinfo.php` in your dist folder:
```php
<?php phpinfo(); ?>
```
Visit `yourdomain.com/phpinfo.php` and search for "mod_rewrite"

### ✅ Step 4: Test the Configuration

1. **Test 1:** Visit `yourdomain.com/test-htaccess.txt`
   - If you see the test file, `.htaccess` is being read
   - If you get 404, `.htaccess` is not being read

2. **Test 2:** Visit `yourdomain.com/nonexistent-page`
   - Should show your React app (home page or 404 page)
   - If you get server 404, `.htaccess` rewrite is not working

3. **Test 3:** Visit `yourdomain.com/admin/users` and reload
   - Should load the admin users page
   - If you get 404, the rewrite rule is not working

## Alternative Solutions

### Option 1: Use HashRouter (Not Recommended)
Change `BrowserRouter` to `HashRouter` in `App.tsx`:
```tsx
import { HashRouter } from 'react-router-dom';
// Change BrowserRouter to HashRouter
<HashRouter>
```
This uses `#` in URLs (e.g., `/#/admin/users`) but works without server config.

### Option 2: Contact Hosting Provider
If `.htaccess` doesn't work, ask your hosting provider to:
1. Enable `mod_rewrite`
2. Allow `.htaccess` files
3. Configure the server to handle SPA routing

### Option 3: Use Nginx Configuration
If using Nginx, add this to your server block:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## Current Routes in App.tsx
All admin routes are correctly defined:
- `/admin` → AdminDashboard
- `/admin/users` → AdminManageUsers
- `/admin/properties` → AdminManageProperties
- `/admin/bookings` → AdminBookings
- etc.

The routes are correct - the issue is **server configuration**, not React Router.

## Still Not Working?

1. Check Apache error logs on your server
2. Verify `.htaccess` syntax is correct (no typos)
3. Try accessing `.htaccess` directly (should be blocked/403)
4. Contact your hosting provider for support

