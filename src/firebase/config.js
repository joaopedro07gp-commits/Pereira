import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBoBKlwfJy3osa0G-tC9lnv2HsqRo7mgm0",
  authDomain: "encurtador-links-senai-jp.firebaseapp.com",
  projectId: "encurtador-links-senai-jp",
  storageBucket: "encurtador-links-senai-jp.firebasestorage.app",
  messagingSenderId: "308881822159",
  appId: "1:308881822159:web:e27f715da4f46f7c02c2ba"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
