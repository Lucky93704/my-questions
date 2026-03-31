// ==========================================
// GUEST MODE PURGE (48-HOUR TIMEOUT)
// ==========================================
function checkGuestExpiry() {
const lastActive = parseInt(localStorage.getItem('guestLastActive') || '0');
if (lastActive && (Date.now() - lastActive > 48 * 60 * 60 * 1000)) {
['guestTargets', 'guestNotes', 'guestHistory', 'guestXP', 'guestLastActive'].forEach(k => localStorage.removeItem(k));
}
}
checkGuestExpiry();

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================
function showToast(message, type = 'info') {
const container = document.getElementById('toast-container');
const toast = document.createElement('div');
toast.className = `toast ${type}`;

let iconSvg = '';
if (type === 'error') {
iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
} else if (type === 'success') {
iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
} else {
iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
}

toast.innerHTML = `${iconSvg} <span>${message}</span>`;
container.appendChild(toast);

setTimeout(() => { if(toast.parentElement) toast.remove(); }, 3400);
}

// ==========================================
// CUSTOM CONFIRM MODAL LOGIC
// ==========================================
function showCustomConfirm(message, title = "Confirm Action", isDanger = true) {
return new Promise((resolve) => {
const modal = document.getElementById('custom-confirm-modal');
const titleEl = document.getElementById('confirm-title');
const msgEl = document.getElementById('confirm-message');
const okBtn = document.getElementById('confirm-ok-btn');
const cancelBtn = document.getElementById('confirm-cancel-btn');

msgEl.innerText = message;

if (isDanger) {
titleEl.style.color = 'var(--error)';
okBtn.className = 'btn-confirm-danger';
titleEl.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> ${title}`;
okBtn.innerText = 'Yes, Delete';
} else {
titleEl.style.color = 'var(--primary)';
okBtn.style.background = 'var(--primary)';
titleEl.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> ${title}`;
okBtn.innerText = 'Confirm';
}

modal.style.display = 'flex';

const cleanup = () => {
modal.style.display = 'none';
okBtn.removeEventListener('click', handleOk);
cancelBtn.removeEventListener('click', handleCancel);
};

const handleOk = () => { cleanup(); resolve(true); };
const handleCancel = () => { cleanup(); resolve(false); };

okBtn.addEventListener('click', handleOk);
cancelBtn.addEventListener('click', handleCancel);
});
}

// ==========================================
// FIREBASE CONFIGURATION & INIT
// ==========================================
const firebaseConfig = {
apiKey: "AIzaSyCAw1Eozvog8hUdZW7THJQBlgze79sCkGk",
authDomain: "my-site-7fd99.firebaseapp.com",
projectId: "my-site-7fd99",
storageBucket: "my-site-7fd99.firebasestorage.app",
messagingSenderId: "1024490010463",
appId: "1:1024490010463:web:130447b333eaa7a5f468ea",
measurementId: "G-WS0G17WRE9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function getLocalISOString(date) {
const offset = date.getTimezoneOffset() * 60000;
return (new Date(date - offset)).toISOString().split('T')[0];
}

// Global state
let isGuestMode = sessionStorage.getItem('isGuest') === 'true';
let currentSessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
let activeSessionsArray = [];
let isLoggingOut = false;

// ==========================================
// SESSION MANAGEMENT (LINKED DEVICES)
// ==========================================
function getDeviceName() {
const ua = navigator.userAgent;
let browser = "Unknown Browser";
if(ua.includes("Firefox")) browser = "Firefox";
else if(ua.includes("SamsungBrowser")) browser = "Samsung Internet";
else if(ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
else if(ua.includes("Trident") || ua.includes("MSIE")) browser = "Internet Explorer";
else if(ua.includes("Edge") || ua.includes("Edg/")) browser = "Edge";
else if(ua.includes("Chrome")) browser = "Chrome";
else if(ua.includes("Safari")) browser = "Safari";

let os = "Unknown OS";
if(ua.includes("Win")) os = "Windows";
else if(ua.includes("Mac")) os = "MacOS";
else if(ua.includes("X11")) os = "UNIX";
else if(ua.includes("Linux") && !ua.includes("Android")) os = "Linux";
else if(ua.includes("Android")) os = "Android";
else if(ua.includes("like Mac")) os = "iOS";

return `${browser} on ${os}`;
}

function initSession() {
if (isGuestMode) return;
if (!currentSessionId) {
currentSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
if (localStorage.getItem('isUnlocked') === 'true') {
localStorage.setItem('sessionId', currentSessionId);
} else {
sessionStorage.setItem('sessionId', currentSessionId);
}

const newSession = {
id: currentSessionId,
name: getDeviceName(),
time: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
};

db.collection('portalData').doc('activeSessions').set({
sessions: firebase.firestore.FieldValue.arrayUnion(newSession)
}, { merge: true });
}
}

function listenToSessions() {
if (isGuestMode) return;

db.collection('portalData').doc('activeSessions').onSnapshot((doc) => {
if (doc.exists) {
activeSessionsArray = doc.data().sessions || [];
if (currentSessionId && !isLoggingOut) {
const stillActive = activeSessionsArray.find(s => s.id === currentSessionId);
if (!stillActive) { handleLogout('remote'); }
}

const modal = document.getElementById('linked-devices-modal');
if(modal && modal.style.display === 'flex') {
renderLinkedDevices();
}
} else {
db.collection('portalData').doc('activeSessions').set({ sessions: [] });
}
});
}

async function removeSession(idToRemove) {
try {
const sessionObj = activeSessionsArray.find(s => s.id === idToRemove);

if (sessionObj) {
activeSessionsArray = activeSessionsArray.filter(s => s.id !== idToRemove);
const modal = document.getElementById('linked-devices-modal');
if (modal && modal.style.display === 'flex') {
renderLinkedDevices();
}

await db.collection('portalData').doc('activeSessions').set({
sessions: firebase.firestore.FieldValue.arrayRemove(sessionObj)
}, { merge: true });

showToast("Device logged out successfully.", "success");
}
} catch(e) {
console.error("Error removing session", e);
showToast("Failed to remove device.", "error");
}
}

function renderLinkedDevices() {
const list = document.getElementById('devices-list');
list.innerHTML = '';

if (activeSessionsArray.length === 0) {
list.innerHTML = '<p style="color: #64748b; font-size: 0.9rem;">No active sessions found.</p>';
return;
}

const sortedSessions = [...activeSessionsArray].sort((a, b) => {
if(a.id === currentSessionId) return -1;
if(b.id === currentSessionId) return 1;
return 0;
});

sortedSessions.forEach(session => {
const isCurrent = session.id === currentSessionId;
const div = document.createElement('div');
div.className = 'device-item';

const isMobile = session.name.includes("Android") || session.name.includes("iOS");
const iconSvg = isMobile
? `<svg class="device-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`
: `<svg class="device-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;

div.innerHTML = `
<div class="device-info">
${iconSvg}
<div class="device-details">
<div class="device-name">
${session.name}
${isCurrent ? '<span class="device-current-badge">Current</span>' : ''}
</div>
<div class="device-time">Logged in: ${session.time}</div>
</div>
</div>
${!isCurrent ? `<button class="device-logout-btn" onclick="removeSession('${session.id}')">Logout</button>` : ''}
`;
list.appendChild(div);
});
}

// ==========================================
// XP SYSTEM INIT
// ==========================================
let currentXP = 0;
const xpRef = db.collection("userStats").doc("global");

function initXP() {
if (isGuestMode) {
currentXP = parseInt(localStorage.getItem('guestXP') || '0');
renderXP();
return;
}

xpRef.onSnapshot((doc) => {
if(doc.exists) {
currentXP = doc.data().xp || 0;
} else {
xpRef.set({ xp: 0 });
}
renderXP();
});
}

function renderXP() {
const level = Math.floor(currentXP / 100) + 1;
const titles = ["Aspirant", "Beginner", "Novice", "Scholar", "Achiever", "Expert", "Master", "Grandmaster", "Inspector"];
const title = titles[Math.min(level - 1, titles.length - 1)];

const xpBadge = document.getElementById('xp-counter');
if(xpBadge) {
xpBadge.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg> Lvl ${level}: ${title} (${currentXP} XP)`;
xpBadge.style.display = "inline-flex";
}
}

// --- AT A GLANCE LOGIC ---
async function loadGlanceData() {
try {
const todayStr = getLocalISOString(new Date());
const startLimit = new Date(); startLimit.setDate(startLimit.getDate() - 90);
const startLimitStr = getLocalISOString(startLimit);

let todayTargets = [];
let streakTargets = [];

if (isGuestMode) {
const allGuestTargets = JSON.parse(localStorage.getItem('guestTargets') || '[]');
todayTargets = allGuestTargets.filter(t => t.date === todayStr);
streakTargets = allGuestTargets.filter(t => t.date >= startLimitStr && t.date <= todayStr);
} else {
const todaySnap = await db.collection("dailyTargets").where("date", "==", todayStr).get();
todaySnap.forEach(doc => todayTargets.push(doc.data()));

const streakSnap = await db.collection("dailyTargets").where("date", ">=", startLimitStr).where("date", "<=", todayStr).get();
streakSnap.forEach(doc => streakTargets.push(doc.data()));
}

let totalTasks = 0; let completedTasks = 0; let isHoliday = false;

todayTargets.forEach(data => {
if (data.isHoliday || data.subject === "Holiday" || (data.task && data.task.startsWith("Holiday:"))) {
isHoliday = true;
} else {
totalTasks++;
if (data.completed) completedTasks++;
}
});

const targetEl = document.getElementById('glance-targets');
const targetSubEl = document.getElementById('glance-targets-subtext');

if (isHoliday) {
targetEl.innerHTML = `🌴 Rest Day`; targetSubEl.innerHTML = `Holiday mode active.`; targetEl.style.color = '#f59e0b';
} else if (totalTasks === 0) {
targetEl.innerHTML = `0 / 0`; targetSubEl.innerHTML = `No tasks scheduled yet.`;
} else {
const pct = Math.round((completedTasks/totalTasks)*100);
targetEl.innerHTML = `${completedTasks} / ${totalTasks}`; targetSubEl.innerHTML = `${pct}% Completion`;
if (pct === 100) targetEl.style.color = 'var(--success)';
}

// --- NEW FLEXIBLE STREAK LOGIC ---
const daysData = {};
streakTargets.forEach(data => {
if (!daysData[data.date]) daysData[data.date] = { total: 0, completed: 0, isHoliday: false };

if (data.isHoliday || data.subject === "Holiday" || (data.task && data.task.startsWith("Holiday:"))) {
daysData[data.date].isHoliday = true;
} else {
daysData[data.date].total++;
if (data.completed) daysData[data.date].completed++;
}
});

let currentStreak = 0;
let checkDate = new Date();

// THE FIX: Grace period for today!
if (daysData[todayStr] && daysData[todayStr].total > 0 && daysData[todayStr].completed === 0) {
checkDate.setDate(checkDate.getDate() - 1);
}

for (let i = 0; i < 90; i++) {
const dateStr = getLocalISOString(checkDate);
const day = daysData[dateStr];

// It ONLY breaks if it's a Holiday, or if tasks are scheduled but 0 are completed.
if (day && day.isHoliday) {
break;
} else if (day && day.total > 0) {
if (day.completed === 0) {
break;
} else {
currentStreak++;
}
}
checkDate.setDate(checkDate.getDate() - 1);
}

// --- MAX STREAK LOGIC ---
let maxStreak = 0;
let tempStreak = 0;
let iterDate = new Date(startLimit);

for (let i = 0; i <= 90; i++) {
const dStr = getLocalISOString(iterDate);
const day = daysData[dStr];

if (day && day.isHoliday) {
tempStreak = 0;
} else if (day && day.total > 0) {
if (day.completed === 0) {
tempStreak = 0;
} else {
tempStreak++;
if (tempStreak > maxStreak) { maxStreak = tempStreak; }
}
}
iterDate.setDate(iterDate.getDate() + 1);
}

maxStreak = Math.max(maxStreak, currentStreak);

document.getElementById('glance-streak').innerText = `${currentStreak} Days`;
document.getElementById('glance-streak-subtext').innerHTML = `Personal Best: <strong>${maxStreak} Days</strong>`;

} catch (e) { console.error("Failed to load glance data:", e); }
}

// --- DYNAMIC GREETING ---
function setGreetingAndQuote() {
const greetingElement = document.getElementById('greeting-text');
const quoteElement = document.getElementById('daily-quote');
const hour = new Date().getHours();
let greeting = "Hello";
if (hour >= 5 && hour < 12) greeting = "Good Morning";
else if (hour >= 12 && hour < 17) greeting = "Good Afternoon";
else if (hour >= 17 && hour < 22) greeting = "Good Evening";
else greeting = "Late Night Study";

if (isGuestMode) greeting += " Guest";

greetingElement.innerText = `${greeting}`;
const quotes = [
"Discipline is choosing between what you want now and what you want most.",
"Success is the sum of small efforts, repeated day in and day out.",
"100% accuracy isn't a gift, it's a skill.",
"Don't stop when you're tired. Stop when you're done."
];
quoteElement.innerText = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
}

// ==========================================
// PERSISTENT 15-MINUTE INACTIVITY TIMER
// ==========================================
let inactivityTimer;
const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 Minutes

function resetInactivityTimer() {
clearTimeout(inactivityTimer);

// Check if we are currently unlocked
if (localStorage.getItem('isUnlocked') === 'true' || isGuestMode) {

if (isGuestMode) {
localStorage.setItem('guestLastActive', Date.now().toString());
} else {
// Update the "Last Action" timestamp in permanent storage
localStorage.setItem('lastActionTimestamp', Date.now().toString());
}

// Set the timer to lock if no more actions happen
inactivityTimer = setTimeout(() => {
handleLogout('auto');
}, INACTIVITY_LIMIT);
}
}

// Reset the clock on any interaction
['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
document.addEventListener(evt, resetInactivityTimer);
});

document.addEventListener('keydown', function(e) {
if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
e.preventDefault();
if (localStorage.getItem('isUnlocked') === 'true' || isGuestMode) {
handleLogout('manual');
}
}
});

function launchPortal() {
document.getElementById('pin-screen').style.display = 'none';
document.getElementById('main-content').style.display = 'block';
document.getElementById('action-buttons-wrapper').style.display = 'flex';

document.getElementById('main-content').classList.add('anim-fade-in');
document.getElementById('action-buttons-wrapper').classList.add('anim-fade-in');

setGreetingAndQuote(); loadGlanceData(); renderCalendar(); loadNotepad(); initXP();

if (!isGuestMode) {
document.getElementById('linked-devices-btn').style.display = 'inline-flex';
initSession();
listenToSessions();
} else {
document.getElementById('linked-devices-btn').style.display = 'none';
}
}

function attemptUnlock() {
if (document.getElementById('pin-input').value === "24122009") {
document.getElementById('unlock-btn').innerHTML = '<span class="spinner"></span> Unlocking...';

// Set the keys in localStorage so they survive a browser close
localStorage.setItem('isUnlocked', 'true');
localStorage.setItem('lastActionTimestamp', Date.now().toString());

isGuestMode = false;
showToast('Access Granted!', 'success');
resetInactivityTimer();

setTimeout(launchPortal, 800);
} else {
showToast('Incorrect PIN.', 'error');
document.getElementById('pin-input').value = '';
}
}

document.getElementById('guest-btn').addEventListener('click', () => {
isGuestMode = true;
sessionStorage.setItem('isGuest', 'true');
localStorage.setItem('guestLastActive', Date.now().toString());
showToast('Logged in as Guest', 'info');
setTimeout(launchPortal, 300);
});

function handleLogout(type = 'manual') {
isLoggingOut = true;
document.getElementById('logout-btn').innerHTML = '<span class="spinner" style="border-top-color: var(--error);"></span> Locking...';

if (currentSessionId && !isGuestMode && type !== 'remote') {
removeSession(currentSessionId);
}

sessionStorage.removeItem('isGuest');
sessionStorage.removeItem('sessionId');
localStorage.removeItem('isUnlocked');
localStorage.removeItem('lastActionTimestamp');
localStorage.removeItem('sessionId');

isGuestMode = false;
currentSessionId = null;
clearTimeout(inactivityTimer);

if (type === 'remote') {
showToast('Logged out remotely from another device.', 'error');
} else if (type === 'auto') {
showToast('Portal auto-locked due to 15m inactivity.', 'info');
} else {
showToast('Portal Locked Successfully.', 'info');
}

setTimeout(() => { window.location.reload(); }, 1200);
}

document.getElementById('unlock-btn').addEventListener('click', attemptUnlock);
document.getElementById('pin-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') attemptUnlock(); });
document.getElementById('logout-btn').addEventListener('click', () => handleLogout('manual'));


// ==========================================
// QUICK ADD LOGIC
// ==========================================
let quickAddTargetDate = "";

function openQuickAddModal(dateStr) {
quickAddTargetDate = dateStr;
const dateObj = new Date(dateStr);
const displayDate = dateObj.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

document.getElementById('quick-add-date-text').innerText = `Planning for: ${displayDate}`;
document.getElementById('quick-task-text').value = "";

const modal = document.getElementById('quick-add-modal');
modal.style.display = 'flex';
setTimeout(() => document.getElementById('quick-task-text').focus(), 100);
}

document.getElementById('quick-task-text').addEventListener('keypress', function(e) {
if (e.key === 'Enter') submitQuickTask();
});

async function submitQuickTask() {
const taskText = document.getElementById('quick-task-text').value.trim();
const subject = document.getElementById('quick-task-subject').value;
const btn = document.getElementById('quick-add-submit');

if (!taskText) {
document.getElementById('quick-task-text').style.borderColor = 'var(--error)';
setTimeout(() => document.getElementById('quick-task-text').style.borderColor = 'var(--border)', 1500);
return;
}

if (isGuestMode) {
const allGuestTargets = JSON.parse(localStorage.getItem('guestTargets') || '[]');
allGuestTargets.push({
task: taskText, subject: subject, date: quickAddTargetDate, completed: false, isRecurring: false, timestamp: Date.now()
});
localStorage.setItem('guestTargets', JSON.stringify(allGuestTargets));
showToast("Task scheduled locally (Guest)!", "success");
document.getElementById('quick-add-modal').style.display = 'none';
loadGlanceData(); renderCalendar();
return;
}

btn.innerHTML = '<span class="spinner"></span>';
btn.disabled = true;

try {
await db.collection("dailyTargets").add({
task: taskText, subject: subject, date: quickAddTargetDate, completed: false, isRecurring: false, timestamp: firebase.firestore.FieldValue.serverTimestamp()
});
showToast("Task scheduled successfully!", "success");
document.getElementById('quick-add-modal').style.display = 'none';

loadGlanceData(); renderCalendar();
} catch (error) {
console.error("Error adding task:", error); showToast("Failed to add task.", "error");
} finally {
btn.innerHTML = 'Add'; btn.disabled = false;
}
}

// ==========================================
// UPGRADED ANIMATED CALENDAR WITH FIREBASE
// ==========================================
const currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function jumpToToday() {
currentMonth = currentDate.getMonth();
currentYear = currentDate.getFullYear();
renderCalendar();
}

async function renderCalendar() {
const daysContainer = document.getElementById("calendar-days");
const monthYearText = document.getElementById("calendar-month-year");
const btnToday = document.getElementById("btn-today");

if (currentMonth === currentDate.getMonth() && currentYear === currentDate.getFullYear()) {
btnToday.classList.remove("visible");
} else {
btnToday.classList.add("visible");
}

daysContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px;"><span class="spinner" style="border-top-color: var(--primary);"></span></div>';

const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
monthYearText.innerText = `${monthNames[currentMonth]} ${currentYear}`;

const startStr = getLocalISOString(new Date(currentYear, currentMonth, 1));
const endStr = getLocalISOString(new Date(currentYear, currentMonth + 1, 0));

let calendarTargets = [];
if (isGuestMode) {
const allGuestTargets = JSON.parse(localStorage.getItem('guestTargets') || '[]');
calendarTargets = allGuestTargets.filter(t => t.date >= startStr && t.date <= endStr);
} else {
try {
const snapshot = await db.collection("dailyTargets").where("date", ">=", startStr).where("date", "<=", endStr).get();
snapshot.forEach(doc => calendarTargets.push(doc.data()));
} catch (e) { console.error("Error fetching calendar data:", e); }
}

const dayStatus = {};
calendarTargets.forEach(data => {
const dateStr = data.date;
if (!dayStatus[dateStr]) {
dayStatus[dateStr] = { total: 0, completed: 0, isHoliday: false, reason: "", doneTasks: [], missedTasks: [] };
}

if (data.isHoliday || data.subject === "Holiday" || (data.task && data.task.startsWith("Holiday:"))) {
dayStatus[dateStr].isHoliday = true;
dayStatus[dateStr].reason = data.task ? data.task.replace("Holiday: ", "") : "Rest Day";
} else {
dayStatus[dateStr].total++;
if (data.completed) {
dayStatus[dateStr].completed++;
dayStatus[dateStr].doneTasks.push(data.subject);
} else {
dayStatus[dateStr].missedTasks.push(data.subject);
}
}
});

const isStreakActiveDay = (dStatus) => dStatus && dStatus.total > 0 && dStatus.completed > 0;

daysContainer.innerHTML = "";
let animationDelay = 0;

for (let i = 0; i < firstDayOfMonth; i++) {
const emptyDiv = document.createElement("div");
emptyDiv.classList.add("cal-day", "empty");
daysContainer.appendChild(emptyDiv);
}

for (let i = 1; i <= daysInMonth; i++) {
const dayDiv = document.createElement("div");
dayDiv.classList.add("cal-day");
dayDiv.innerText = i;

const checkDate = new Date(currentYear, currentMonth, i);
const checkDateStr = getLocalISOString(checkDate);
const status = dayStatus[checkDateStr];

let clickTimer = null;
dayDiv.addEventListener('click', (e) => {
if (clickTimer) {
clearTimeout(clickTimer);
clickTimer = null;
openQuickAddModal(checkDateStr);
} else {
clickTimer = setTimeout(() => {
clickTimer = null;
window.location.href = `studydashboard.html?date=${checkDateStr}`;
}, 250);
}
});

const tooltip = document.createElement('div');
tooltip.className = 'cal-tooltip';

if (status) {
if (status.isHoliday) {
dayDiv.classList.add("holiday-day");
tooltip.innerHTML = `<div class="tooltip-title holiday">🌴 Holiday</div><div class="tooltip-row"><span>Reason:</span> ${status.reason}</div><div class="tooltip-hint">Click to jump to this date</div>`;
} else if (status.total > 0 && status.completed > 0) {

dayDiv.classList.add("completed-day");

const uniqueDone = status.doneTasks.length > 0 ? [...new Set(status.doneTasks)].join(', ') : 'None';
const uniqueMissed = status.missedTasks.length > 0 ? [...new Set(status.missedTasks)].join(', ') : 'None';

if (status.completed === status.total) {
tooltip.innerHTML = `<div class="tooltip-title success"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> 100% Completed!</div>
<div class="tooltip-row"><span>Finished:</span> ${uniqueDone}</div>
<div class="tooltip-hint">Click to jump to this date</div>`;
} else {
dayDiv.classList.add("incomplete-day");
tooltip.innerHTML = `<div class="tooltip-title error"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> ${status.completed}/${status.total} Completed</div>
<div class="tooltip-row"><span>Done:</span> <span style="color:var(--success); font-weight:normal;">${uniqueDone}</span></div>
<div class="tooltip-row"><span>Missed:</span> <span style="color:var(--error); font-weight:normal;">${uniqueMissed}</span></div>
<div class="tooltip-hint">Click to jump to this date</div>`;
}

const tomorrow = new Date(checkDate); tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStatus = dayStatus[getLocalISOString(tomorrow)];
if (checkDate.getDay() !== 6 && isStreakActiveDay(tomorrowStatus)) {
dayDiv.classList.add("streak-next");
}

const yesterday = new Date(checkDate); yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStatus = dayStatus[getLocalISOString(yesterday)];
if (checkDate.getDay() !== 0 && isStreakActiveDay(yesterdayStatus)) {
dayDiv.classList.add("streak-prev");
}

} else if (status.total > 0 && status.completed === 0) {
dayDiv.classList.add("incomplete-day");

const uniqueMissed = [...new Set(status.missedTasks)].join(', ');
tooltip.innerHTML = `<div class="tooltip-title error"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> 0/${status.total} Completed</div>
<div class="tooltip-row"><span>Missed:</span> <span style="color:var(--error); font-weight:normal;">${uniqueMissed}</span></div>
<div class="tooltip-hint">Click to jump to this date</div>`;
}
} else {
tooltip.innerHTML = `<div class="tooltip-title" style="color: #64748b;">📅 No Data</div>
<div class="tooltip-row" style="margin-top:0;">No targets were set for this day.</div>
<div class="tooltip-hint">Double-click to quick add</div>`;
}

dayDiv.appendChild(tooltip);
dayDiv.style.animationDelay = `${animationDelay}s`;
animationDelay += 0.015;

if (i === currentDate.getDate() && currentMonth === currentDate.getMonth() && currentYear === currentDate.getFullYear()) {
dayDiv.classList.add("today");
}

daysContainer.appendChild(dayDiv);
}
}

document.getElementById("prev-month").addEventListener("click", () => { currentMonth--; if(currentMonth<0){currentMonth=11;currentYear--;} renderCalendar(); });
document.getElementById("next-month").addEventListener("click", () => { currentMonth++; if(currentMonth>11){currentMonth=0;currentYear++;} renderCalendar(); });

// ==========================================
// NOTEPAD LOGIC (FIREBASE SYNC & UTILITIES)
// ==========================================
const quickNotepad = document.getElementById('quick-notepad');
const syncStatus = document.getElementById('sync-status');
let noteSaveTimeout;
let deletedNotesHistory = [];

const iconCloudCheck = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16.2A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path><polyline points="9 16 12 19 16 14"></polyline></svg> Saved`;
const iconCloudSync = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16.2A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path><polyline points="8 14 12 18 16 14"></polyline><line x1="12" y1="18" x2="12" y2="10"></line></svg> Saving...`;
const iconCloudError = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16.2A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path><line x1="12" y1="17" x2="12" y2="17.01"></line><line x1="12" y1="13" x2="12" y2="15"></line></svg> Error`;

function updateNoteStats() {
const text = quickNotepad.value;
const character = text.length;
const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
document.getElementById('note-stats').innerText = `${words} words | ${character} character`;
}

function loadHistory() {
if (isGuestMode) {
deletedNotesHistory = JSON.parse(localStorage.getItem('guestHistory') || '[]');
return;
}
db.collection('portalData').doc('noteHistory').onSnapshot((doc) => {
if (doc.exists) {
deletedNotesHistory = doc.data().history || [];
}
}, (e) => { console.error("History sync error", e); });
}

async function saveHistory(noteContent) {
if(!noteContent.trim()) return;
const timestamp = new Date().toLocaleString('en-IN');
deletedNotesHistory.unshift({ text: noteContent, time: timestamp });
if(deletedNotesHistory.length > 5) deletedNotesHistory.pop();

if (isGuestMode) {
localStorage.setItem('guestHistory', JSON.stringify(deletedNotesHistory));
return;
}

try {
await db.collection('portalData').doc('noteHistory').set({ history: deletedNotesHistory });
} catch(e) { console.error("History save error", e); }
}

function loadNotepad() {
if (isGuestMode) {
quickNotepad.value = localStorage.getItem('guestNotes') || '';
syncStatus.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg> Saved Locally (Guest)`;
syncStatus.className = 'sync-status saved';
updateNoteStats();
loadHistory();
return;
}

db.collection('portalData').doc('quickNotes').onSnapshot((doc) => {
const serverText = doc.exists ? (doc.data().content || '') : '';

if (quickNotepad.value !== serverText) {
const start = quickNotepad.selectionStart;
const end = quickNotepad.selectionEnd;

quickNotepad.value = serverText;

if (document.activeElement === quickNotepad) {
quickNotepad.setSelectionRange(start, end);
}
updateNoteStats();
}

syncStatus.innerHTML = iconCloudCheck;
syncStatus.className = 'sync-status saved';
}, (error) => {
console.error("Error syncing notes:", error);
syncStatus.innerHTML = iconCloudError;
syncStatus.className = 'sync-status error';
});

loadHistory();
}

async function saveNotepadToFirebase() {
if (isGuestMode) {
localStorage.setItem('guestNotes', quickNotepad.value);
syncStatus.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg> Saved Locally (Guest)`;
syncStatus.className = 'sync-status saved';
return;
}

try {
syncStatus.innerHTML = iconCloudSync;
syncStatus.className = 'sync-status saving';

await db.collection('portalData').doc('quickNotes').set({
content: quickNotepad.value,
lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
}, { merge: true });

syncStatus.innerHTML = iconCloudCheck;
syncStatus.className = 'sync-status saved';
} catch (e) {
console.error("Error saving notes:", e);
syncStatus.innerHTML = iconCloudError;
syncStatus.className = 'sync-status error';
showToast("Failed to sync notes to cloud.", "error");
}
}

if (quickNotepad) {
quickNotepad.addEventListener('input', () => {
updateNoteStats();

if (!isGuestMode) {
syncStatus.innerHTML = `<span class="spinner" style="width:12px; height:12px; border-width: 2px; margin-right: 4px;"></span> Saving...`;
syncStatus.className = 'sync-status saving';
} else {
syncStatus.innerHTML = `<span class="spinner" style="width:12px; height:12px; border-width: 2px; margin-right: 4px;"></span> Saving locally...`;
syncStatus.className = 'sync-status saving';
}

clearTimeout(noteSaveTimeout);
noteSaveTimeout = setTimeout(() => {
saveNotepadToFirebase();
}, 1500);
});
}

// Action Bar Utilities
let spellCheckActive = false;
let spellCheckActive = false;
function toggleSpellCheck() {
    spellCheckActive = !spellCheckActive;
    quickNotepad.setAttribute('spellcheck', spellCheckActive.toString());
    
    // Force the browser to re-scan existing text for spelling errors
    const currentText = quickNotepad.value;
    quickNotepad.value = '';
    quickNotepad.value = currentText;

    const btn = document.getElementById('btn-spellcheck');
    if(spellCheckActive) {
        btn.style.color = 'var(--primary)';
        showToast("Spell check & grammar suggestions enabled.", "success");
        quickNotepad.focus(); 
    } else {
        btn.style.color = '#64748b';
        showToast("Spell check disabled.", "info");
    }
}

function toggleSearchReplace() {
const ui = document.getElementById('search-replace-ui');
ui.style.display = ui.style.display === 'none' ? 'flex' : 'none';
if(ui.style.display === 'flex') document.getElementById('search-input').focus();
}

function performReplace() {
const searchStr = document.getElementById('search-input').value;
const replaceStr = document.getElementById('replace-input').value;
if (!searchStr) return;

const originalText = quickNotepad.value;
const newText = originalText.split(searchStr).join(replaceStr);

if (originalText !== newText) {
quickNotepad.value = newText;
updateNoteStats();
clearTimeout(noteSaveTimeout);
saveNotepadToFirebase();
showToast("Text replaced successfully.", "success");
} else {
showToast("Text not found.", "info");
}
}

function copyNotepad() {
if (!quickNotepad.value.trim()) {
showToast("Notepad is empty!", "info");
return;
}
navigator.clipboard.writeText(quickNotepad.value).then(() => {
showToast("Notes copied to clipboard!", "success");
}).catch(err => {
console.error("Copy failed", err);
showToast("Failed to copy notes.", "error");
});
}

async function clearNotepad() {
if (!quickNotepad.value.trim()) {
showToast("Notepad is already empty.", "info");
return;
}
const confirmed = await showCustomConfirm("Are you sure you want to clear your notes? This action cannot be undone.", "Clear Notes");
if (confirmed) {
await saveHistory(quickNotepad.value);
quickNotepad.value = "";
updateNoteStats();
clearTimeout(noteSaveTimeout);
saveNotepadToFirebase();
showToast("Notes cleared and saved to history.", "success");
}
}

function showHistoryModal() {
const list = document.getElementById('history-list');
list.innerHTML = '';
if(deletedNotesHistory.length === 0) {
list.innerHTML = '<p style="color: #64748b; font-size: 0.9rem;">No removed notes history yet.</p>';
} else {
deletedNotesHistory.forEach((item, index) => {
const div = document.createElement('div');
div.className = 'history-item';

const safeText = item.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

div.innerHTML = `
<div class="history-item-time">${item.time}</div>
<div class="history-item-text">${safeText}</div>
<button class="history-restore-btn" onclick="restoreHistory(${index})">Restore</button>
`;
list.appendChild(div);
});
}
document.getElementById('history-modal').style.display = 'flex';
}

function restoreHistory(index) {
const item = deletedNotesHistory[index];
if(quickNotepad.value.trim() !== "") {
saveHistory(quickNotepad.value);
}
quickNotepad.value = item.text;
updateNoteStats();
clearTimeout(noteSaveTimeout);
saveNotepadToFirebase();
document.getElementById('history-modal').style.display = 'none';
showToast("Note restored successfully.", "success");
}

// ==========================================
// ON PAGE LOAD: CHECK IF SESSION IS VALID
// ==========================================
function checkSessionValidity() {
const isLocalUnlocked = localStorage.getItem('isUnlocked') === 'true';
const isGuestSession = sessionStorage.getItem('isGuest') === 'true';

if (isLocalUnlocked || isGuestSession) {
if (isGuestSession) {
launchPortal();
} else {
const lastActive = parseInt(localStorage.getItem('lastActionTimestamp') || '0');
const now = Date.now();

// Check if 15 minutes have passed since the last tracked action
if (now - lastActive > INACTIVITY_LIMIT) {
localStorage.removeItem('isUnlocked');
localStorage.removeItem('lastActionTimestamp');
setTimeout(() => showToast('Session expired due to inactivity. Please log in again.', 'info'), 500);
} else {
// Update timestamp for safety on a fresh page load
localStorage.setItem('lastActionTimestamp', now.toString());
launchPortal();
resetInactivityTimer();
}
}
}
}

// Run the session check immediately on script load
checkSessionValidity();

// ==========================================
// THEME LOGIC
// ==========================================
const themeBtn = document.getElementById('theme-btn');
const themeIcon = document.getElementById('theme-icon');
const body = document.body;
const sunPath = "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z";
const moonPath = "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z";

if (localStorage.getItem('theme') === 'dark') { body.setAttribute('data-theme', 'dark'); themeIcon.innerHTML = `<path d="${moonPath}" />`; } else { themeIcon.innerHTML = `<path d="${sunPath}" />`; }

themeBtn.addEventListener('click', () => {
themeIcon.classList.add('rotate');
setTimeout(() => {
if (body.getAttribute('data-theme') === 'dark') {
body.removeAttribute('data-theme'); localStorage.setItem('theme', 'light');
themeIcon.innerHTML = `<path d="${sunPath}" />`; showToast('Light mode activated', 'info');
} else {
body.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark');
themeIcon.innerHTML = `<path d="${moonPath}" />`; showToast('Dark mode activated', 'info');
}
}, 250);
setTimeout(() => { themeIcon.classList.remove('rotate'); }, 500);
});
