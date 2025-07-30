/*────────────────────────────────────────────
  assets/js/storage.js | УЛУЧШЕННАЯ ВЕРСИЯ С FIREBASE
─────────────────────────────────────────────*/

import { safeGetItem, safeSetItem, generateId } from './utils.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

// Firebase config (paste your from console)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Константы
const STORAGE_KEYS = {
    USERS: 'vipauto_users',
    ENTRIES: 'entries', // Firestore collection
    BONUSES: 'bonuses',
    SETTINGS: 'vipauto_settings',
    BACKUP: 'vipauto_last_backup'
};

// Начальные пользователи (for local fallback, but use Auth for real)
const INITIAL_USERS = { /* as before */ };

// Инициализация (with cloud check)
function initStorage() {
    // Local init as fallback
    if (!safeGetItem(STORAGE_KEYS.USERS)) safeSetItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    // ... (other local)

    // Cloud init (e.g., check connection)
    console.log('Storage init with Firebase');
}

// Init on import
initStorage();

// Users with Auth
export async function getUsers() {
    // Use Firebase Auth listUsers if admin, but for simple - local fallback
    return Object.values(safeGetItem(STORAGE_KEYS.USERS));
}

export async function getUserByLogin(login) {
    return safeGetItem(STORAGE_KEYS.USERS)[login];
}

export async function authenticateUser(login, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, login, password);
        return userCredential.user; // Return user object
    } catch (error) {
        console.error('Auth error:', error);
        return null;
    }
}

// Entries with Firestore
export async function getAllEntries() {
    const q = query(collection(db, STORAGE_KEYS.ENTRIES));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ... (other get functions with queries, e.g., byMaster: add where("master", "==", masterName))

export async function addEntry(entry) {
    const newEntry = {
        timestamp: Date.now(),
        ...entry
    };
    const docRef = await addDoc(collection(db, STORAGE_KEYS.ENTRIES), newEntry);
    return { id: docRef.id, ...newEntry };
}

export async function updateEntry(id, data) {
    const entryRef = doc(db, STORAGE_KEYS.ENTRIES, id);
    await updateDoc(entryRef, { ...data, lastModified: Date.now() });
    return true;
}

export async function deleteEntry(id) {
    const entryRef = doc(db, STORAGE_KEYS.ENTRIES, id);
    await deleteDoc(entryRef);
    return true;
}

// Bonuses similar with Firestore
// ... (adapt get/set as above)

// Settings local or cloud
// ...

// Backup to cloud
async function createBackup() {
    // Adapt to Firestore snapshot
}

// Export all with cloud adaptations

// Entries with Firestore (async)
export async function getAllEntries() {
    try {
        const q = query(collection(db, STORAGE_KEYS.ENTRIES));
        const snapshot = await getDocs(q);
        console.log('Got entries from cloud'); // Debug
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Cloud get entries error:', error);
        // Fallback to local
        return safeGetItem(STORAGE_KEYS.ENTRIES) || [];
    }
}

export async function getEntriesByMaster(masterName) {
    try {
        const q = query(collection(db, STORAGE_KEYS.ENTRIES), where("master", "==", masterName));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting by master:', error);
        return getAllEntries().filter(e => e.master === masterName);
    }
}

export async function getEntriesByDateRange(startDate, endDate) {
    try {
        const q = query(collection(db, STORAGE_KEYS.ENTRIES), 
            where("date", ">=", startDate.toISOString().slice(0,10)),
            where("date", "<=", endDate.toISOString().slice(0,10)));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting by date:', error);
        return getAllEntries().filter(e => {
            const entryDate = new Date(e.date);
            return entryDate >= startDate && entryDate <= endDate;
        });
    }
}

export async function addEntry(entry) {
    try {
        const newEntry = {
            timestamp: Date.now(),
            ...entry
        };
        const docRef = await addDoc(collection(db, STORAGE_KEYS.ENTRIES), newEntry);
        console.log('Added entry to cloud'); // Debug
        return { id: docRef.id, ...newEntry };
    } catch (error) {
        console.error('Add entry error:', error);
        // Local fallback
        const entries = getAllEntries();
        const localEntry = { id: generateId(), ...entry, timestamp: Date.now() };
        entries.push(localEntry);
        safeSetItem(STORAGE_KEYS.ENTRIES, entries);
        return localEntry;
    }
}

export async function updateEntry(id, data) {
    try {
        const entryRef = doc(db, STORAGE_KEYS.ENTRIES, id);
        await updateDoc(entryRef, { ...data, lastModified: Date.now() });
        console.log('Updated entry in cloud'); // Debug
        return true;
    } catch (error) {
        console.error('Update entry error:', error);
        // Local fallback
        const entries = getAllEntries();
        const index = entries.findIndex(e => e.id === id);
        if (index !== -1) {
            entries[index] = { ...entries[index], ...data, lastModified: Date.now() };
            safeSetItem(STORAGE_KEYS.ENTRIES, entries);
            return true;
        }
        return false;
    }
}

export async function deleteEntry(id) {
    try {
        const entryRef = doc(db, STORAGE_KEYS.ENTRIES, id);
        await deleteDoc(entryRef);
        console.log('Deleted entry from cloud'); // Debug
        return true;
    } catch (error) {
        console.error('Delete entry error:', error);
        // Local fallback
        const entries = getAllEntries();
        const filtered = entries.filter(e => e.id !== id);
        if (filtered.length !== entries.length) {
            safeSetItem(STORAGE_KEYS.ENTRIES, filtered);
            return true;
        }
        return false;
    }
}

// Bonuses with Firestore
export async function getBonuses(masterName, date) {
    try {
        const q = query(collection(db, STORAGE_KEYS.BONUSES), where("master", "==", masterName), where("date", "==", date));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data())[0] || { score: 0, amount: 0 };
    } catch (error) {
        console.error('Get bonuses error:', error);
        const bonuses = safeGetItem(STORAGE_KEYS.BONUSES) || {};
        const key = `${date}_${masterName}`;
        return bonuses[key] || { score: 0, amount: 0 };
    }
}

export async function setBonuses(masterName, date, data) {
    try {
        const bonusRef = doc(db, STORAGE_KEYS.BONUSES, `${date}_${masterName}`);
        await setDoc(bonusRef, { ...data, timestamp: Date.now(), master: masterName, date });
        console.log('Set bonuses in cloud'); // Debug
    } catch (error) {
        console.error('Set bonuses error:', error);
        // Local fallback
        const bonuses = safeGetItem(STORAGE_KEYS.BONUSES) || {};
        const key = `${date}_${masterName}`;
        bonuses[key] = { ...data, timestamp: Date.now() };
        safeSetItem(STORAGE_KEYS.BONUSES, bonuses);
    }
}

// Settings (local for now, add cloud if needed)
export function getSettings() {
    return safeGetItem(STORAGE_KEYS.SETTINGS);
}

export function updateSettings(newSettings) {
    const settings = getSettings();
    safeSetItem(STORAGE_KEYS.SETTINGS, { ...settings, ...newSettings });
}

// Backup (to cloud)
async function createBackup() {
    const settings = getSettings();
    if (!settings.autoBackup) return;

    const lastBackup = safeGetItem(STORAGE_KEYS.BACKUP);
    const now = Date.now();

    if (!lastBackup || (now - lastBackup.timestamp) > settings.backupInterval * 3600000) {
        const backup = {
            timestamp: now,
            entries: await getAllEntries(),
            bonuses: await getAllBonuses(), // Assume function
            settings
        };
        // Save to cloud
        await setDoc(doc(db, 'backups', now.toString()), backup);
        safeSetItem(STORAGE_KEYS.BACKUP, { timestamp: now });
    }
}

export async function restoreFromBackup() {
    // Get latest backup from cloud
    const q = query(collection(db, 'backups'), orderBy('timestamp', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    const backup = snapshot.docs[0]?.data();

    if (backup) {
        // Restore to cloud/local
        // For example, batch add entries
        const batch = writeBatch(db);
        backup.entries.forEach(e => {
            const ref = doc(db, STORAGE_KEYS.ENTRIES, e.id);
            batch.set(ref, e);
        });
        await batch.commit();

        safeSetItem(STORAGE_KEYS.ENTRIES, backup.entries);
        safeSetItem(STORAGE_KEYS.BONUSES, backup.bonuses);
        safeSetItem(STORAGE_KEYS.SETTINGS, backup.settings);
        return true;
    }
    return false;
}

// Export/Import (with cloud)
export async function exportData() {
    const data = {
        entries: await getAllEntries(),
        bonuses: await getAllBonuses(),
        settings: getSettings(),
        exportDate: new Date().toISOString()
    };
    return JSON.stringify(data);
}

export async function importData(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        // Import to cloud (batch)
        const batch = writeBatch(db);
        data.entries.forEach(e => {
            const ref = doc(db, STORAGE_KEYS.ENTRIES, e.id);
            batch.set(ref, e);
        });
        // Similar for bonuses
        await batch.commit();

        safeSetItem(STORAGE_KEYS.ENTRIES, data.entries);
        safeSetItem(STORAGE_KEYS.BONUSES, data.bonuses);
        safeSetItem(STORAGE_KEYS.SETTINGS, data.settings);
        return true;
    } catch (error) {
        console.error('Import error:', error);
        return false;
    }
}
