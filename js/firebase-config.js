import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAzsy8RIJ8i43C9MWj5L03vuIwou_BgoS0",
  authDomain: "reaper-mc-store-001.firebaseapp.com",
  projectId: "reaper-mc-store-001",
  storageBucket: "reaper-mc-store-001.firebasestorage.app",
  messagingSenderId: "584523884174",
  appId: "1:584523884174:web:f90a88639e536ded758bdf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
