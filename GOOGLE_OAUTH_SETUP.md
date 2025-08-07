# 🔐 Google OAuth Setup Guide

Follow these steps to enable Google OAuth authentication in your Football Analytics Pro application.

## 📋 Prerequisites

- Google account
- Access to Google Cloud Console
- Your application domain (for production)

## 🚀 Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Enter project name: `Football Analytics Pro`
4. Click "Create"

### 2. Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on "Google+ API" and click "Enable"
4. Also enable "Google OAuth2 API" if available

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (unless you have a Google Workspace)
3. Fill in the required information:
   - **App name**: `Football Analytics Pro`
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Add test users (for development):
   - Add your email and any other test accounts
6. Click "Save and Continue"

### 4. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Configure the client:
   - **Name**: `Football Analytics Pro Web Client`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://your-domain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/google/callback` (development)
     - `https://your-domain.com/auth/google/callback` (production)
5. Click "Create"

### 5. Get Your Credentials

1. After creating, you'll see a modal with:
   - **Client ID**: `your-client-id.apps.googleusercontent.com`
   - **Client Secret**: `your-client-secret`
2. Copy these values - you'll need them for your environment variables

### 6. Configure Environment Variables

Add these to your `.env` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# For production, use your actual domain:
# GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback
```

### 7. Update Frontend Configuration (Optional)

If you want to use Google's JavaScript SDK for client-side authentication, add this to your HTML:

```html
<script src="https://apis.google.com/js/platform.js" async defer></script>
<meta name="google-signin-client_id" content="your-client-id.apps.googleusercontent.com">
```

## 🔧 Development vs Production

### Development Setup
- Use `http://localhost:3000` for origins and redirects
- Test with your personal Google account
- OAuth consent screen can remain in "Testing" mode

### Production Setup
- Use your actual domain `https://your-domain.com`
- Submit OAuth consent screen for verification (if needed)
- Add production redirect URIs
- Update environment variables

## 🧪 Testing Your Setup

1. Start your application:
   ```bash
   node demo-server.js
   ```

2. Open `http://localhost:3000`

3. Click "Sign in with Google"

4. You should be redirected to Google's OAuth page

5. After authorization, you should be redirected back to your app

## 🚨 Security Best Practices

### Environment Variables
- Never commit `.env` files to version control
- Use different credentials for development and production
- Rotate secrets regularly

### OAuth Configuration
- Only add necessary scopes
- Use HTTPS in production
- Validate redirect URIs carefully
- Monitor OAuth usage in Google Cloud Console

### Application Security
- Validate tokens server-side
- Implement proper session management
- Use secure cookies in production
- Add rate limiting to auth endpoints

## 🔍 Troubleshooting

### Common Issues

**"redirect_uri_mismatch" error:**
- Check that your redirect URI exactly matches what's configured in Google Cloud Console
- Ensure you're using the correct protocol (http vs https)

**"invalid_client" error:**
- Verify your Client ID and Client Secret are correct
- Check that the OAuth consent screen is properly configured

**"access_denied" error:**
- User declined authorization
- Check that your app is added to test users (in development)

**Token verification fails:**
- Ensure your server time is synchronized
- Check that you're using the correct Client ID for verification

### Debug Steps

1. **Check Google Cloud Console logs:**
   - Go to "APIs & Services" → "Credentials"
   - Check usage statistics

2. **Verify environment variables:**
   ```bash
   echo $GOOGLE_CLIENT_ID
   echo $GOOGLE_CLIENT_SECRET
   ```

3. **Test OAuth flow manually:**
   - Visit the OAuth URL directly
   - Check network requests in browser dev tools

4. **Check server logs:**
   - Look for authentication errors
   - Verify token validation

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

## 🆘 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review Google Cloud Console error logs
3. Verify all configuration steps
4. Test with a fresh browser session (incognito mode)

---

**🎉 Once configured, your users will be able to sign in with their Google accounts seamlessly!**