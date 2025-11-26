# Troubleshooting Guide - Login Issues

## Common Login Issues and Solutions

### Issue: Cannot Login Even Though Backend is Working

#### 1. **Check API URL Configuration**

The frontend needs to know where your backend is hosted. 

**For Vercel Deployment:**
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add a new variable:
   - **Name:** `VITE_API_URL`
   - **Value:** Your backend URL (e.g., `https://your-backend.onrender.com` or `https://your-backend.railway.app`)
   - **Environment:** Production, Preview, Development (select all)
4. Redeploy your frontend

**For Local Development:**
- The frontend will automatically use `http://localhost:5000` if running locally
- Make sure your backend is running on port 5000

#### 2. **Check CORS Configuration**

Your backend needs to allow requests from your frontend domain.

**In `backend/server.js`:**
- Make sure your frontend URL is in the `allowedOrigins` array
- For Vercel: Add `https://question-paper-generator-sigma.vercel.app`
- For local: `http://localhost:3000` or `http://localhost:5173`

#### 3. **Check Browser Console**

Open browser DevTools (F12) and check:
- **Console tab:** Look for error messages
- **Network tab:** Check if the login request is being made and what the response is
- Look for CORS errors, network errors, or 401/403 errors

#### 4. **Verify Backend is Running**

Test your backend directly:
```bash
# Test health endpoint
curl http://localhost:5000/healthz

# Test login endpoint (replace with your credentials)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

#### 5. **Check Environment Variables**

**Backend (.env file):**
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `GEMINI_API_KEY` - Google Gemini API key
- `FRONTEND_URL` - Your frontend URL (for CORS)
- `PORT` - Backend port (default: 5000)

**Frontend (Vercel Environment Variables):**
- `VITE_API_URL` - Your backend URL

#### 6. **Common Error Messages**

**"Cannot connect to server"**
- Backend is not running
- Wrong API URL
- Network/firewall blocking connection

**"Invalid credentials"**
- Wrong email/password
- User doesn't exist
- Password hash mismatch

**"CORS error"**
- Backend CORS not configured for your frontend domain
- Check `backend/server.js` CORS settings

**"401 Unauthorized"**
- Token expired
- Invalid token
- JWT_SECRET mismatch

#### 7. **Debug Steps**

1. **Check API URL in console:**
   - Open browser console
   - Look for: `🔧 API URL configured: [URL]`
   - Verify it's pointing to your backend

2. **Check login request:**
   - Open Network tab in DevTools
   - Try to login
   - Check the `/api/auth/login` request
   - Look at Request URL, Status Code, and Response

3. **Check backend logs:**
   - Look at your backend console/logs
   - Check if the login request is reaching the backend
   - Check for any error messages

#### 8. **Quick Fixes**

**If using Vercel for frontend:**
```bash
# Set environment variable in Vercel dashboard
VITE_API_URL=https://your-backend-url.com
```

**If backend is on Render/Railway:**
- Make sure backend is publicly accessible
- Copy the backend URL
- Set it as VITE_API_URL in Vercel

**If both are local:**
- Frontend: `http://localhost:3000` or `http://localhost:5173`
- Backend: `http://localhost:5000`
- No environment variable needed

## Still Having Issues?

1. Check browser console for specific error messages
2. Check backend logs for incoming requests
3. Verify all environment variables are set correctly
4. Test backend endpoints directly with curl/Postman
5. Check network connectivity between frontend and backend


