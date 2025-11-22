// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAKaeQc1lySxRpkpM6VcKQFxKfPncVB508",
    authDomain: "question-paper-gen-566c3.firebaseapp.com",
    projectId: "question-paper-gen-566c3",
    storageBucket: "question-paper-gen-566c3.firebasestorage.app",
    messagingSenderId: "491225067162",
    appId: "1:491225067162:web:733a5fed08cac23edd3923",
    measurementId: "G-0J3MT8H59R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);