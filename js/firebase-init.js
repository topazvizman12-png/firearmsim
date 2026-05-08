"use strict";

const firebaseConfig = {
    apiKey: "xxxx",
    authDomain: "xxxx.firebaseapp.com",
    databaseURL: "https://xxxx-default-rtdb.firebaseio.com",
    projectId: "xxxx",
    storageBucket: "xxxx.appspot.com",
    messagingSenderId: "xxxx",
    appId: "xxxx"
};

// למנוע אתחול כפול אם נטען בכמה עמודים
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}