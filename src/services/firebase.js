import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDpPrbA0EIYesjtjA-_lglN5CURR-w5FJA",
  authDomain: "valhalla-store-ff5f0.firebaseapp.com",
  projectId: "valhalla-store-ff5f0",
  storageBucket: "valhalla-store-ff5f0.firebasestorage.app",
  messagingSenderId: "165476949219",
  appId: "1:165476949219:web:ad67e6c13df7840091b9d6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);