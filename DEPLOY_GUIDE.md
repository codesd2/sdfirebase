# Deployment Guide for Hostinger

## 1. Fixing the "Plain Page" (White Screen) Issue
If your domain shows a blank or plain page, it is because you uploaded the **source code** instead of the **build output**.

### The Solution:
1.  **Build the app**: In your terminal, run: `npm run build`
2.  **Locate the output**: This creates a folder named `dist` in your project.
3.  **Upload to Hostinger**: 
    *   Open Hostinger **File Manager**.
    *   Go to `public_html`.
    *   **Delete** any existing files you uploaded (like `src`, `public`, `package.json`).
    *   **Upload the CONTENTS of the `dist` folder** directly into `public_html`.
    *   Your `public_html` should contain `index.html`, `assets/`, etc., at the top level.

---

## 2. Finding Authentication in Firebase Console (2025 UI)
If you don't see "Authentication" in your sidebar:
1.  Look for the **"Build"** or **"Security"** category in the left sidebar and click the arrow to expand it.
2.  If it's still missing, click on **"All products"** (often at the bottom of the list) and search for **Authentication**.
3.  **CRITICAL**: Once inside Authentication, go to the **Sign-in method** tab.
4.  Click **Add new provider** -> **Email/Password** -> **Enable** -> **Save**. (This fixes the `auth/operation-not-allowed` error).

---

## 3. Firebase Authorized Domains
1.  In Firebase Console: **Authentication** > **Settings** > **Authorized domains**.
2.  Click **Add domain**.
3.  Add exactly: `wildtourinkaziranga.in` (and also `om.wildtourinkaziranga.in` if you use that).
4.  **Note**: Do not include `https://` or `/`.

---

## 4. Routing Fix (Refreshing 404)
I have added a `.htaccess` file in the `public` folder. When you run `npm run build`, it will be moved to the `dist` folder. Make sure this file is uploaded to your Hostinger root alongside your `index.html`. This ensures that when you refresh a page like `/cart`, it doesn't show a 404 error.
