apiKey: "AIzaSyAKaeQc1lySxRpkpM6VcKQFxKfPncVB508",
    authDomain: "question-paper-gen-566c3.firebaseapp.com",
        projectId: "question-paper-gen-566c3",
    // Import the functions you need from the SDKs you need
    import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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