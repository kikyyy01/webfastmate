import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Ganti dengan konfigurasi Firebase Anda
// Anda bisa mendapatkan ini dari Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
  apiKey: "AIzaSyBa0xnsDfwmGp0sQuuj90CgTVT4ErV4Z24",
  authDomain: "webaplikasitrackeriftar.firebaseapp.com",
  databaseURL: "https://webaplikasitrackeriftar-default-rtdb.firebaseio.com",
  projectId: "webaplikasitrackeriftar",
  storageBucket: "webaplikasitrackeriftar.firebasestorage.app",
  messagingSenderId: "809790333500",
  appId: "1:809790333500:web:9a54d95504ed1f52f15939"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
