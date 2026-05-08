"use strict";

/* ================================
   FirearmSim - main.js
   תפקיד: ניהול משתמש/אימות + כלים כלליים לכל האתר
================================ */

const auth = firebase.auth();
const db = firebase.database();

/* ================================
   UI (safe)
================================ */
const userNameEl = document.getElementById("userName");
const userEmailEl = document.getElementById("userEmail");

const nameEl = document.getElementById("userNameDisplay");
const emailEl = document.getElementById("userEmailDisplay");

const logoutBtn = document.getElementById("logoutBtn");

/* ================================
   Helpers
================================ */
function setUserUI(name, email) {
    if (userNameEl) userNameEl.textContent = name;
    if (userEmailEl) userEmailEl.textContent = email;

    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email;
}

function redirectToLoginIfRequired() {
    // אם יש ב-body data-auth="required" => חייבים התחברות בעמוד הזה
    const body = document.body;
    const requiresAuth = body && body.getAttribute("data-auth") === "required";

    if (!requiresAuth) return;

    // אם לא נמצאים כבר בעמוד login -> redirect
    const isLoginPage = location.pathname.toLowerCase().includes("login");
    if (!isLoginPage) {
        window.location.href = "login.html";
    }
}

/* ================================
   Auth state
================================ */
auth.onAuthStateChanged((user) => {
    if (user) {
        const name = user.displayName || "User";
        const email = user.email || "";
        setUserUI(name, email);
    } else {
        setUserUI("Guest", "Not signed in");
        redirectToLoginIfRequired();
    }
});

/* ================================
   Logout
================================ */
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await auth.signOut();
            window.location.href = "login.html";
        } catch (err) {
            console.error("Logout error:", err);
            alert("שגיאה בהתנתקות");
        }
    });
}

/* ================================
   RTDB helper API (optional)
   שימוש בעמודים אחרים:
   await FirearmSimDB.save("trainings/..", data)
   FirearmSimDB.listen("trainings/..", cb)
================================ */
const FirearmSimDB = {

    getUid() {
        const u = auth.currentUser;
        return u ? u.uid : null;
    },

    userPath(path) {
        const uid = this.getUid();
        if (!uid) throw new Error("No user logged in");
        return `/users/${uid}/${path}`.replace(/\/+/g, "/");
    },

    async save(path, data) {
        const fullPath = this.userPath(path);
        await db.ref(fullPath).set(data);
        return fullPath;
    },

    async push(path, data) {
        const fullPath = this.userPath(path);
        const ref = db.ref(fullPath).push();
        await ref.set(data);
        return ref.key;
    },

    listen(path, callback) {
        const fullPath = this.userPath(path);
        const ref = db.ref(fullPath);
        ref.off();
        ref.on("value", (snap) => callback(snap.val()));
        return ref;
    }
};

window.FirearmSimDB = FirearmSimDB;