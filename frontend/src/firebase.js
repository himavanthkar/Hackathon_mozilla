// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Import getFirestore

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB-yNcQoCGV1iPLvdakpPyw-rZfuOouYzc",
  authDomain: "mozilla-53a89.firebaseapp.com",
  projectId: "mozilla-53a89",
  storageBucket: "mozilla-53a89.appspot.com", // Fixed typo in storage bucket domain
  messagingSenderId: "1049297665629",
  appId: "1:1049297665629:web:87e09c972841d237a317b4",
  measurementId: "G-YTTHRHTG1S",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); // Initialize Firestore

export { app, db };
