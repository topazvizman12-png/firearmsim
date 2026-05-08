"use strict";

console.log("practice.js loaded ✅");

document.addEventListener("DOMContentLoaded", () => {

    const startBtn = document.getElementById("startPracticeBtn");
    const trainingBtn = document.getElementById("trainingTimeBtn");
    const endBtn = document.getElementById("endPracticeBtn");
    const resetBtn = document.getElementById("resetBtn");
    const resetTableBtn = document.getElementById("resetTableBtn");

    const statusText = document.getElementById("practiceStatusText");
    const timerText = document.getElementById("practiceLiveTimerText");
    const reactionText = document.getElementById("practiceReactionText");
    const hitsText = document.getElementById("hitsText");
    const magazineText = document.getElementById("magazineText");
    const sessionsTbody = document.getElementById("sessionsTbody");

    const reactionCanvas = document.getElementById("reactionChart");
    const hitsCanvas = document.getElementById("hitsChart");
    const accuracyCanvas = document.getElementById("accuracyChart");

    const maxBullets = 9;

    let hits = 0;
    let bulletsLeft = maxBullets;
    let trainingNumber = 0;

    let practiceStarted = false;
    let trainingRunning = false;
    let startTimeMs = null;
    let timerInterval = null;

    let reactionChart, hitsChart, accuracyChart;

    function setStatus() {
        if (statusText) {
            statusText.textContent = "אימון מספר " + trainingNumber;
        }
    }

    function setTimer(sec) {
        if (timerText) {
            timerText.textContent = Number(sec || 0).toFixed(3);
        }
    }

    function setReaction(sec) {
        if (!reactionText) return;

        if (sec == null) {
            reactionText.textContent = "—";
        } else {
            reactionText.textContent = Number(sec).toFixed(3) + "s";
        }
    }

    function setHits(value) {
        hits = Number(value || 0);
        if (hitsText) hitsText.textContent = hits;
    }

    function setBullets(value) {
        bulletsLeft = Math.max(0, Number(value || 0));
        if (magazineText) magazineText.textContent = bulletsLeft;
    }

    function enable(btn, on) {
        if (btn) btn.disabled = !on;
    }

    function startTimer() {
        stopTimer();

        startTimeMs = performance.now();

        timerInterval = setInterval(() => {
            const elapsed = (performance.now() - startTimeMs) / 1000;
            setTimer(elapsed);
        }, 50);
    }

    function stopTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
    }

    function sendToAltera(value) {
        firebase.database().ref("toAltera").set(value);
    }

    function resetScreenOnly() {
        practiceStarted = false;
        trainingRunning = false;

        stopTimer();

        setHits(0);
        setBullets(maxBullets);
        setTimer(0);
        setReaction(null);
        setStatus();

        enable(trainingBtn, false);
        enable(endBtn, false);

        sendToAltera(0);
        firebase.database().ref("fromAltera/B").set(0);
        firebase.database().ref("fromAltera/shotsFired").set(0);

        console.log("Reset screen ✅");
    }

    async function resetTable() {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const ok = confirm("האם למחוק את כל טבלת האימונים?");
        if (!ok) return;

        await firebase.database().ref(`trainings/${user.uid}`).remove();

        trainingNumber = 0;
        setStatus();

        if (sessionsTbody) sessionsTbody.innerHTML = "";

        renderCharts([]);

        console.log("Table reset ✅");
    }

    function listenFromAltera() {
        firebase.database().ref("fromAltera/B").on("value", (snap) => {
            setHits(snap.val());
        });

        firebase.database().ref("fromAltera/shotsFired").on("value", (snap) => {
            const shotsFired = Number(snap.val() || 0);
            setBullets(maxBullets - shotsFired);
        });
    }

    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            listenFromAltera();
            await loadTrainings();
            console.log("Firebase user connected ✅");
        } else {
            window.location.href = "login.html";
        }
    });

    enable(trainingBtn, false);
    enable(endBtn, false);
    setTimer(0);
    setReaction(null);
    setBullets(maxBullets);
    setStatus();

    startBtn.addEventListener("click", () => {
        trainingNumber++;

        practiceStarted = true;
        trainingRunning = false;

        setHits(0);
        setBullets(maxBullets);
        setTimer(0);
        setReaction(null);
        setStatus();

        enable(trainingBtn, true);
        enable(endBtn, true);

        sendToAltera(0);
        firebase.database().ref("fromAltera/B").set(0);
        firebase.database().ref("fromAltera/shotsFired").set(0);

        console.log("Start Practice ✅");
    });

    trainingBtn.addEventListener("click", () => {
        if (!practiceStarted) return;

        trainingRunning = true;
        startTimer();

        sendToAltera(1);

        console.log("Training Time ✅");
    });

    endBtn.addEventListener("click", async () => {
        if (!practiceStarted) return;

        let elapsedSec = 0;

        if (trainingRunning && startTimeMs !== null) {
            elapsedSec = (performance.now() - startTimeMs) / 1000;
        }

        stopTimer();

        trainingRunning = false;
        practiceStarted = false;

        sendToAltera(0);
        setReaction(elapsedSec);

        await saveTraining({
            trainingNumber,
            hits,
            reactionSeconds: elapsedSec
        });

        await loadTrainings();

        enable(trainingBtn, false);
        enable(endBtn, false);

        console.log("Practice saved ✅");
    });

    resetBtn.addEventListener("click", resetScreenOnly);
    resetTableBtn.addEventListener("click", resetTable);

    async function saveTraining({ trainingNumber, hits, reactionSeconds }) {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error("No user logged in");

        const accuracy = maxBullets ? (hits / maxBullets) * 100 : 0;
        const now = new Date();
        const dateKey = now.toISOString().slice(0, 10);

        const ref = firebase.database()
            .ref(`trainings/${user.uid}/${dateKey}`)
            .push();

        await ref.set({
            trainingNumber,
            hits,
            bulletsInMagazine: maxBullets,
            accuracy: Number(accuracy.toFixed(2)),
            reactionSeconds: Number(reactionSeconds.toFixed(3)),
            dateISO: now.toISOString(),
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
    }

    async function loadTrainings() {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const snap = await firebase.database()
            .ref(`trainings/${user.uid}`)
            .once("value");

        const data = snap.val() || {};
        const rows = [];

        Object.keys(data).sort().forEach(date => {
            const sessions = Object.values(data[date] || {});
            sessions.forEach(session => rows.push(session));
        });

        trainingNumber = rows.length;
        setStatus();

        if (sessionsTbody) {
            sessionsTbody.innerHTML = "";

            rows.forEach((session, index) => {
                const tr = document.createElement("tr");

                tr.innerHTML = `
                    <td>${session.trainingNumber || index + 1}</td>
                    <td>${session.hits || 0}</td>
                    <td>${session.reactionSeconds || 0}s</td>
                `;

                sessionsTbody.appendChild(tr);
            });
        }

        renderCharts(rows);
    }

    function renderCharts(rows) {
        const labels = rows.map((_, i) => i + 1);
        const reactionData = rows.map(r => Number(r.reactionSeconds || 0));
        const hitsData = rows.map(r => Number(r.hits || 0));
        const accuracyData = rows.map(r => Number(r.accuracy || 0));

        if (reactionChart) reactionChart.destroy();
        if (hitsChart) hitsChart.destroy();
        if (accuracyChart) accuracyChart.destroy();

        reactionChart = buildChart(reactionCanvas, "זמן תגובה", labels, reactionData, "line");
        hitsChart = buildChart(hitsCanvas, "פגיעות", labels, hitsData, "bar");
        accuracyChart = buildChart(accuracyCanvas, "דיוק", labels, accuracyData, "line");
    }

    function buildChart(canvas, label, labels, data, type) {
        if (!canvas || typeof Chart === "undefined") return null;

        return new Chart(canvas, {
            type: type,
            data: {
                labels,
                datasets: [{
                    label: label,
                    data: data,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

});