# Deployment Guide - Fixing 404 Errors on Page Reload

## Problem
When you reload a page (e.g., `/admin/users`), you get a 404 error because the server doesn't know how to handle client-side routes.

## Solution

### For Apache Servers (Most Common)

1. **Ensure `.htaccess` file is in your `dist` folder**
   - The file should be at the root of your `dist` folder (same level as `index.html`)
   - After building, run: `cp public/.htaccess dist/.htaccess`

2. **Verify mod_rewrite is enabled**
   - Contact your hosting provider to ensure `mod_rewrite` is enabled
   - Most shared hosting providers have it enabled by default

3. **Check file permissions**
   - The `.htaccess` file should be readable (644 permissions)
   - Run: `chmod 644 dist/.htaccess`

4. **Verify the file is uploaded**
   - Make sure the `.htaccess` file is uploaded to your server
   - It should be in the same directory as your `index.html`

5. **Confirm Apache allows `.htaccess` overrides**
   - If your server does not apply the `.htaccess` rules, Apache may have `AllowOverride` set to `None` for the site root.
   - Ask your hosting provider to enable `AllowOverride All` for your site's document root, or, if you control Apache, add to your VirtualHost:

```apache
<Directory /var/www/your-site-root>
    AllowOverride All
    Require all granted
</Directory>
```

   - If `.htaccess` cannot be used on your hosting (some shared/managed panels restrict it), ask support to add the rewrite or add a server-level ErrorDocument:

```apache
ErrorDocument 404 /index.html
```

### For Nginx Servers

If you're using Nginx, add this to your server configuration:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Testing

1. Build your project: `npm run build`
2. Verify `.htaccess` is in `dist` folder: `ls -la dist/.htaccess`
3. Upload the entire `dist` folder to your server
4. Test by navigating to `/admin/users` and then refreshing the page

### SPA fallback for restrictive hosts

If your host ignores `.htaccess` or you cannot set server-level rewrites, this project includes a safe static fallback: `public/404.html`.

- Many static-hosting providers will serve `404.html` when a path isn't found; our `404.html` fetches and injects `index.html` so the client router can bootstrap and handle the route (preserves deep links).
- This means even if `.htaccess` is not applied on the server, a refresh on a client route should still load the app instead of a generic 404 page.

Tip: After deploying, verify `https://your-site/404.html` and that the file exists in your site's root on the server.

### Notes & Common Upload Pitfalls

- Some FTP clients and hosting panels hide or skip files that begin with a dot (e.g., `.htaccess`) during upload — verify the file is present on the server.
- If you're using cPanel / File Manager, enable viewing hidden files and confirm `.htaccess` exists under the site's document root.
- The `npm run build` command now verifies `.htaccess` is present in `dist` and will fail if it isn't copied.

### Common Issues

- **404 still occurs**: Check if `mod_rewrite` is enabled on your Apache server
- **403 Forbidden**: Check file permissions on `.htaccess`
- **500 Error**: Check Apache error logs for syntax errors in `.htaccess`

## Build Command

The build script now automatically copies `.htaccess`:
```bash
npm run build
```

This will:
1. Build your React app
2. Copy `.htaccess` to the `dist` folder automatically

