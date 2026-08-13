import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBJGg6noIYaNImmM7VDYD58WhkRTqh8q2M",
  authDomain: "villa-flor-del-peru.firebaseapp.com",
  projectId: "villa-flor-del-peru",
  storageBucket: "villa-flor-del-peru.firebasestorage.app",
  messagingSenderId: "979987696824",
  appId: "1:979987696824:web:4efcf348ca1ded2929384d"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };