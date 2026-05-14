# Deployment Guide for Hostinger

To ensure your changes are reflected on your live site on Hostinger, follow these steps:

## 1. Firebase Authentication Setup (CRITICAL)
In order for your domain (e.g., `yourdomain.com`) to be allowed to sign in users:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Navigate to **Authentication** > **Settings** > **Authorized domains**.
4. Click **Add domain** and enter your EXACT domain: `om.wildtourinkaziranga.in`
   *   **Note**: Do not include `https://` or trailing slashes. Only the hostname.

## 2. Enable Email/Password Login (FIXES auth/operation-not-allowed)
If you see the error `auth/operation-not-allowed` when creating users, it means this provider is disabled.
1. In Firebase Console, go to **Authentication** > **Sign-in method**.
2. Click **Add new provider** > **Email/Password**.
3. Toggle it to **Enabled** and click **Save**.

## 3. How to Update Hostinger Directly

### Option A: Manual Upload (Easiest)
1. Run `npm run build` in your development environment.
2. This creates a `dist` folder.
3. Use Hostinger's **File Manager** or an **FTP client** (like FileZilla) to upload the contents of the `dist` folder to your site's root directory (usually `public_html`).

### Option B: Hostinger Git Integration (Recommended for "Direct" updates)
Hostinger supports deploying directly from a Git repository (like GitHub).
1. Push your code to a GitHub repository.
2. In Hostinger Panel, go to **Advanced** > **GIT**.
3. Create a new repository link.
4. Set the **Install Directory** to your site root.
5. Every time you push to GitHub, click **Deploy** in Hostinger to update your site.

### Note on Routing
If you find that refreshing a page (like `/cart`) gives a 404 error on Hostinger, ensure the `.htaccess` file (which I've added to the `/public` folder) is uploaded to your server's root.
