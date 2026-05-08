// assets/js/auth.js
// Firebase v8
"use strict";

console.log("auth.js loaded ✅");

// =======================
// Elements
// =======================
const authTitle = document.getElementById("authTitle");

const signInForm = document.getElementById("signInForm");
const signUpForm = document.getElementById("signUpForm");

const toggleAuthMode = document.getElementById("toggleAuthMode");
const toggleAuthModeBack = document.getElementById("toggleAuthModeBack");

const loginError = document.getElementById("loginError");

// Inputs - Sign In
const signInEmail = document.getElementById("signInEmail");
const signInPassword = document.getElementById("signInPassword");

// Inputs - Sign Up
const fullName = document.getElementById("fullName");
const signUpEmail = document.getElementById("signUpEmail");
const signUpPassword = document.getElementById("signUpPassword");
const phoneNumber = document.getElementById("phoneNumber");

// =======================
// Helpers
// =======================
function setError(msg) {
    if (loginError) loginError.textContent = msg || "";
}

function toSignUpMode() {
    setError("");
    if (authTitle) authTitle.textContent = "הרשמה";
    if (signInForm) signInForm.classList.add("d-none");
    if (signUpForm) signUpForm.classList.remove("d-none");
}

function toSignInMode() {
    setError("");
    if (authTitle) authTitle.textContent = "התחברות";
    if (signUpForm) signUpForm.classList.add("d-none");
    if (signInForm) signInForm.classList.remove("d-none");
}

function firebaseErrorToHebrew(err) {
    if (!err || !err.code) return "אירעה שגיאה. נסי שוב.";

    switch (err.code) {
        case "auth/invalid-email":
            return "כתובת האימייל לא תקינה.";
        case "auth/user-not-found":
            return "לא נמצא משתמש עם האימייל הזה.";
        case "auth/wrong-password":
            return "סיסמה שגויה.";
        case "auth/email-already-in-use":
            return "האימייל כבר רשום במערכת.";
        case "auth/weak-password":
            return "הסיסמה חלשה מדי (לפחות 6 תווים).";
        default:
            return "אירעה שגיאה. נסי שוב.";
    }
}

function sanitizePhone(p) {
    return String(p || "").replace(/[^\d]/g, "").trim();
}

// =======================
// Toggle events
// =======================
if (toggleAuthMode) {
    toggleAuthMode.addEventListener("click", (e) => {
        e.preventDefault();
        toSignUpMode();
    });
}

if (toggleAuthModeBack) {
    toggleAuthModeBack.addEventListener("click", (e) => {
        e.preventDefault();
        toSignInMode();
    });
}

// =======================
// Sign In
// =======================
if (signInForm) {
    signInForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        setError("");

        const email = (signInEmail?.value || "").trim();
        const password = (signInPassword?.value || "").trim();

        if (!email || !password) {
            setError("יש להזין אימייל וסיסמה");
            return;
        }

        try {
            await firebase.auth().setPersistence(
                firebase.auth.Auth.Persistence.LOCAL
            );

            await firebase.auth().signInWithEmailAndPassword(email, password);

            console.log("Login success ✅");
            window.location.assign("./practice.html");
        } catch (err) {
            console.error(err);
            setError(firebaseErrorToHebrew(err));
        }
    });
}

// =======================
// Sign Up
// =======================
if (signUpForm) {
    signUpForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        setError("");

        const name = (fullName?.value || "").trim();
        const email = (signUpEmail?.value || "").trim();
        const password = signUpPassword?.value || "";
        const phone = sanitizePhone(phoneNumber?.value || "");

        if (!name || !email || !password) {
            setError("נא למלא את כל השדות");
            return;
        }

        try {
            const cred = await firebase
                .auth()
                .createUserWithEmailAndPassword(email, password);

            await cred.user.updateProfile({ displayName: name });

            // שמירה ב-Realtime Database
            if (firebase.database) {
                await firebase.database().ref("users/" + cred.user.uid).set({
                    fullName: name,
                    email: email,
                    phone: phone,
                    createdAt: new Date().toISOString(),
                });
            }

            console.log("Signup success ✅");
            window.location.assign("./practice.html");

        } catch (err) {
            console.error(err);
            setError(firebaseErrorToHebrew(err));
        }
    });
}

// =======================
// Default mode
// =======================
toSignInMode();