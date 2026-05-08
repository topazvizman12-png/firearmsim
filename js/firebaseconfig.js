// assets/js/firebaseconfig.js
"use strict";

const firebaseConfig = {
  apiKey: "AIzaSyCwkHMoW0YnMBDKkKJHC5WgMB3U0Bd7wnc",
  authDomain: "liam-e6568.firebaseapp.com",
  databaseURL: "https://liam-e6568-default-rtdb.firebaseio.com",
  projectId: "liam-e6568",
  storageBucket: "liam-e6568.firebasestorage.app",
  messagingSenderId: "918455760430",
  appId: "1:918455760430:web:f9305a054a324b3f3491bf",
  measurementId: "G-KJHFG009FE"
};

if (!firebase.apps.length) {
   firebase.initializeApp(firebaseConfig);
}

window.auth = firebase.auth();
window.db = firebase.database();

window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => console.log("Firebase initialized ✅"))
    .catch((e) => console.error("Persistence error:", e));