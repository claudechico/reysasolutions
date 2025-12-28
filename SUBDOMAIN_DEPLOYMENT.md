# Subdomain Deployment Guide

## Your Setup
- **Subdomain**: `web.reysasolutions.co.tz`
- **Issue**: 404 errors when reloading pages like `/admin/users`

## Solution

### For Apache (with .htaccess)

The `.htaccess` file is now configured to work with subdomain deployment. It should work if:
1. Your app is deployed to the **root** of the subdomain (not in a subdirectory)
2. `mod_rewrite` is enabled on your server
3. `.htaccess` files are allowed

### If Your App is in a Subdirectory

If your app is NOT in the root (e.g., it's in `/web/` or `/app/`), you need to:

1. **Update `.htaccess` RewriteBase**:
   ```apache
   RewriteBase /your-subdirectory/
   ```

2. **OR configure Vite base path** in `vite.config.ts`:
   ```typescript
   export default defineConfig({
     base: '/your-subdirectory/',
     // ... rest of config
   });
   ```

3. **Update BrowserRouter** in `App.tsx`:
   ```tsx
   <BrowserRouter basename="/your-subdirectory">
   ```

## Current Configuration

- **Vite base**: `/` (root - works for subdomain root)
- **BrowserRouter**: No basename (works for root deployment)
- **.htaccess RewriteBase**: `/` (works for root deployment)

## Testing

1. Build: `npm run build`
2. Upload `dist` folder to your subdomain root
3. Test: Visit `web.reysasolutions.co.tz/admin/users` and reload

If it still doesn't work, check:
- Is the app in the root of the subdomain or in a subdirectory?
- Is `mod_rewrite` enabled?
- Are `.htaccess` files allowed?

