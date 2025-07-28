/*────────────────────────────────────────────
  assets/js/storage.js | УЛУЧШЕННАЯ ВЕРСИЯ
─────────────────────────────────────────────*/

import { safeGetItem, safeSetItem, generateId } from './utils.js';

// Константы для ключей хранилища
const STORAGE_KEYS = {
    USERS: 'vipauto_users',
    ENTRIES: 'vipauto_entries',
    BONUSES: 'vipauto_bonuses',
    SETTINGS: 'vipauto_settings',
    BACKUP: 'vipauto_last_backup'
};

// Начальные пользователи системы
const INITIAL_USERS = {
    'vladimir.orlov': {
        password: 'director2024',
        role: 'director',
        name: 'Владимир Орлов',
        position: 'Директор'
    },
    'admin': {
        password: 'admin2024',
        role: 'admin',
        name: 'Администратор',
        position: 'Администратор'
    },
    'vladimir.ch': {
        password: 'vlch2024',
        role: 'master',
        name: 'Владимир Ч.',
        position: 'Мастер'
    },
    'vladimir.a': {
        password: 'vla2024',
        role: 'master',
        name: 'Владимир А.',
        position: 'Мастер'
    },
    'andrey': {
        password: 'and2024',
        role: 'master',
        name: 'Андрей',
        position: 'Мастер'
    },
    'danila': {
        password: 'dan2024',
        role: 'master',
        name: 'Данила',
        position: 'Мастер'
    },
    'maxim': {
        password: 'max2024',
        role: 'master',
        name: 'Максим',
        position: 'Мастер'
    },
    'artyom': {
        password: 'art2024',
        role: 'master',
        name: 'Артём',
        position: 'Мастер'
    }
};

// Инициализация хранилища
function initStorage() {
    if (!safeGetItem(STORAGE_KEYS.USERS)) {
        safeSetItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!safeGetItem(STORAGE_KEYS.ENTRIES)) {
        safeSetItem(STORAGE_KEYS.ENTRIES, []);
    }
    if (!safeGetItem(STORAGE_KEYS.BONUSES)) {
        safeSetItem(STORAGE_KEYS.BONUSES, {});
    }
    if (!safeGetItem(STORAGE_KEYS.SETTINGS)) {
        safeSetItem(STORAGE_KEYS.SETTINGS, {
            defaultWorkDay: 8,
            autoBackup: true,
            backupInterval: 24 // часы
        });
    }
}

// Инициализируем при импорте модуля
initStorage();

// Работа с пользователями
export function getUsers() {
    return Object.values(safeGetItem(STORAGE_KEYS.USERS));
}

export function getUserByLogin(login) {
    const users = safeGetItem(STORAGE_KEYS.USERS);
    return users[login];
}

export function authenticateUser(login, password) {
    const user = getUserByLogin(login);
    return user && user.password === password ? user : null;
}

// Работа с записями
export function getAllEntries() {
    return safeGetItem(STORAGE_KEYS.ENTRIES) || [];
}

export function getEntriesByMaster(masterName) {
    return getAllEntries().filter(entry => entry.master === masterName);
}

export function getEntriesByDateRange(startDate, endDate) {
    return getAllEntries().filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
    });
}

export function addEntry(entry) {
    const entries = getAllEntries();
    const newEntry = {
        id: generateId(),
        timestamp: Date.now(),
        ...entry
    };
    entries.push(newEntry);
    safeSetItem(STORAGE_KEYS.ENTRIES, entries);
    createBackup();
    return newEntry;
}

export function updateEntry(id, data) {
    const entries = getAllEntries();
    const index = entries.findIndex(e => e.id === id);
    if (index !== -1) {
        entries[index] = {
            ...entries[index],
            ...data,
            lastModified: Date.now()
        };
        safeSetItem(STORAGE_KEYS.ENTRIES, entries);
        createBackup();
        return true;
    }
    return false;
}

export function deleteEntry(id) {
    const entries = getAllEntries();
    const filtered = entries.filter(e => e.id !== id);
    if (filtered.length !== entries.length) {
        safeSetItem(STORAGE_KEYS.ENTRIES, filtered);
        createBackup();
        return true;
    }
    return false;
}

// Работа с бонусами
export function getBonuses(masterName, date) {
    const bonuses = safeGetItem(STORAGE_KEYS.BONUSES) || {};
    const key = `${date}_${masterName}`;
    return bonuses[key] || { score: 0, amount: 0 };
}

export function setBonuses(masterName, date, data) {
    const bonuses = safeGetItem(STORAGE_KEYS.BONUSES) || {};
    const key = `${date}_${masterName}`;
    bonuses[key] = {
        ...data,
        timestamp: Date.now()
    };
    safeSetItem(STORAGE_KEYS.BONUSES, bonuses);
}

// Настройки
export function getSettings() {
    return safeGetItem(STORAGE_KEYS.SETTINGS);
}

export function updateSettings(newSettings) {
    const settings = getSettings();
    safeSetItem(STORAGE_KEYS.SETTINGS, { ...settings, ...newSettings });
}

// Система резервного копирования
function createBackup() {
    const settings = getSettings();
    if (!settings.autoBackup) return;

    const lastBackup = safeGetItem(STORAGE_KEYS.BACKUP);
    const now = Date.now();

    if (!lastBackup || (now - lastBackup.timestamp) > settings.backupInterval * 3600000) {
        const backup = {
            timestamp: now,
            entries: getAllEntries(),
            bonuses: safeGetItem(STORAGE_KEYS.BONUSES),
            settings: settings
        };
        safeSetItem(STORAGE_KEYS.BACKUP, backup);
    }
}

export function restoreFromBackup() {
    const backup = safeGetItem(STORAGE_KEYS.BACKUP);
    if (backup) {
        safeSetItem(STORAGE_KEYS.ENTRIES, backup.entries);
        safeSetItem(STORAGE_KEYS.BONUSES, backup.bonuses);
        safeSetItem(STORAGE_KEYS.SETTINGS, backup.settings);
        return true;
    }
    return false;
}

// Экспорт/импорт данных
export function exportData() {
    const data = {
        entries: getAllEntries(),
        bonuses: safeGetItem(STORAGE_KEYS.BONUSES),
        settings: getSettings(),
        exportDate: new Date().toISOString()
    };
    return JSON.stringify(data);
}

export function importData(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        safeSetItem(STORAGE_KEYS.ENTRIES, data.entries);
        safeSetItem(STORAGE_KEYS.BONUSES, data.bonuses);
        safeSetItem(STORAGE_KEYS.SETTINGS, data.settings);
        return true;
    } catch (error) {
        console.error('Ошибка импорта данных:', error);
        return false;
    }
}
