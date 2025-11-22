# Firebase Authentication Integration Guide

This guide outlines the steps to integrate Firebase Authentication into the Question Paper Generator application, replacing the current JWT-based system.

## Phase 1: Firebase Setup

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Create a new project (e.g., `qpg-auth`).
    *   Navigate to **Build > Authentication**.
    *   Click **Get Started**.

2.  **Enable Sign-In Methods:**
    *   Enable **Email/Password**.
    *   Enable **Google** (requires setting up OAuth consent screen in Google Cloud Console).

3.  **Get Configuration:**
    *   Go to **Project Settings > General**.
    *   Scroll to **Your apps** and select **Web**.
    *   Register the app (e.g., `qpg-frontend`).
    *   Copy the `firebaseConfig` object.

## Phase 2: Frontend Integration

1.  **Install Firebase SDK:**
    ```bash
    cd frontend
    npm install firebase
    ```

2.  **Initialize Firebase:**
    *   Create `frontend/src/config/firebase.js`.
    *   Paste the `firebaseConfig` and export `auth`.
    ```javascript
    import { initializeApp } from "firebase/app";
    import { getAuth } from "firebase/auth";

    const firebaseConfig = {
      // ... your config keys
    };

    const app = initializeApp(firebaseConfig);
    export const auth = getAuth(app);
    ```

3.  **Update Auth Store (`authStore.js`):**
    *   Import `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signInWithPopup`, `GoogleAuthProvider` from `firebase/auth`.
    *   Replace `login` and `register` functions to use Firebase methods.
    *   Get the ID token from the user object: `const token = await user.getIdToken();`.
    *   Send this token to the backend instead of the custom JWT.

## Phase 3: Backend Integration

1.  **Install Firebase Admin SDK:**
    ```bash
    cd backend
    npm install firebase-admin
    ```

2.  **Initialize Admin SDK:**
    *   Go to Firebase Console > **Project Settings > Service accounts**.
    *   Generate a new private key (download the JSON file).
    *   Place it in `backend/config/serviceAccountKey.json` (ADD TO .GITIGNORE!).
    *   Initialize in `backend/config/firebaseAdmin.js`.

3.  **Create Middleware (`authMiddleware.js`):**
    *   Verify the ID token sent from the frontend.
    ```javascript
    const admin = require('../config/firebaseAdmin');

    const verifyToken = async (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            req.user = decodedToken;
            next();
        } catch (error) {
            res.status(401).send('Unauthorized');
        }
    };
    ```

4.  **Update Routes:**
    *   Apply the new middleware to protected routes.
    *   Update user creation logic to sync Firebase users with your MongoDB `User` model (optional, but recommended for storing roles and app-specific data).

## Phase 4: Role Management (Admin)

1.  **Set Custom Claims:**
    *   Use a script or a Cloud Function to set custom claims (e.g., `{ role: 'admin' }`) for admin users.
    *   Verify these claims in the backend middleware to enforce role-based access.

## Phase 5: Cleanup

1.  Remove `bcryptjs` and `jsonwebtoken` from backend dependencies if fully migrating.
2.  Remove local password hashing logic.
