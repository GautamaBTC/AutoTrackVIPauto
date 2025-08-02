/*────────────────────────────────────────────
  assets/js/storage.js | ЛОКАЛЬНОЕ ХРАНИЛИЩЕ С ДАННЫМИ
─────────────────────────────────────────────*/

// --- Константы для ключей localStorage ---
const STORAGE_KEYS = {
    ENTRIES: 'vipauto_entries',
    MASTERS: 'vipauto_masters',
    BONUSES: 'vipauto_bonuses',
    SETTINGS: 'vipauto_settings',
    BACKUP: 'vipauto_last_backup'
};

// --- Вспомогательные функции для безопасной работы с localStorage ---
function safeGetItem(key) {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch (e) {
        console.error(`Ошибка при получении данных из localStorage по ключу ${key}:`, e);
        return null;
    }
}

function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error(`Ошибка при сохранении данных в localStorage по ключу ${key}:`, e);
        // TODO: Обработать переполнение localStorage
        return false;
    }
}

// --- Работа с записями (entries) ---
export function getAllEntries() {
    return safeGetItem(STORAGE_KEYS.ENTRIES) || [];
}

export function saveEntry(entry) {
    const entries = getAllEntries();
    const existingIndex = entries.findIndex(e => e.id === entry.id);

    if (existingIndex !== -1) {
        // Обновляем существующую запись
        entries[existingIndex] = { ...entries[existingIndex], ...entry, timestamp: new Date().toISOString() };
    } else {
        // Добавляем новую запись
        const newEntry = {
            id: entry.id || Date.now().toString(),
            date: entry.date,
            car: entry.car,
            client: entry.client || '',
            services: entry.services || [],
            workCost: parseFloat(entry.workCost) || 0,
            partsCost: parseFloat(entry.partsCost) || 0,
            notes: entry.notes || '',
            master: entry.master, // Имя мастера
            timestamp: entry.timestamp || new Date().toISOString()
        };
        entries.push(newEntry);
    }

    const success = safeSetItem(STORAGE_KEYS.ENTRIES, entries);
    if (success) {
        // Обновляем данные мастера
        updateMasterData(entry.master, entry);
    }
    return success;
}

export function deleteEntry(id) {
    const entries = getAllEntries();
    const entryToDelete = entries.find(e => e.id === id);
    if (!entryToDelete) return false;

    const filteredEntries = entries.filter(e => e.id !== id);
    const success = safeSetItem(STORAGE_KEYS.ENTRIES, filteredEntries);
    if (success) {
        // Обновляем данные мастера (удаление)
        updateMasterData(entryToDelete.master, entryToDelete, true);
    }
    return success;
}

// --- Работа с данными мастеров (masters) ---
export function getMasterData(masterName) {
    const masters = safeGetItem(STORAGE_KEYS.MASTERS) || {};
    return masters[masterName] || {
        name: masterName,
        totalRevenue: 0,
        totalJobs: 0,
        currentBonusLevel: 0,
        bonusHistory: []
    };
}

export function updateMasterData(masterName, entry, isDeletion = false) {
    const masters = safeGetItem(STORAGE_KEYS.MASTERS) || {};
    let masterData = masters[masterName];

    if (!masterData) {
        masterData = {
            name: masterName,
            totalRevenue: 0,
            totalJobs: 0,
            currentBonusLevel: 0,
            bonusHistory: []
        };
    }

    const entryValue = (parseFloat(entry.workCost) || 0) + (parseFloat(entry.partsCost) || 0);

    if (isDeletion) {
        masterData.totalRevenue -= entryValue;
        masterData.totalJobs -= 1;
    } else {
        masterData.totalRevenue += entryValue;
        masterData.totalJobs += 1;
    }

    // Пересчитываем бонус
    const newBonusLevel = calculateAndUpdateBonus(masterName, masterData);
    if (newBonusLevel !== masterData.currentBonusLevel) {
        masterData.currentBonusLevel = newBonusLevel;
        // Добавляем в историю
        masterData.bonusHistory.push({
            level: newBonusLevel,
            timestamp: new Date().toISOString()
        });
        // Ограничиваем историю
        if (masterData.bonusHistory.length > 50) {
            masterData.bonusHistory = masterData.bonusHistory.slice(-50);
        }
        // Сохраняем историю бонусов отдельно для графика
        safeSetItem(`vipauto_bonus_history_${masterName}`, masterData.bonusHistory);
    }

    masters[masterName] = masterData;
    safeSetItem(STORAGE_KEYS.MASTERS, masters);
}

export function getAllMastersData() {
    return safeGetItem(STORAGE_KEYS.MASTERS) || {};
}

export function getMasterBonusHistory(masterName) {
    const masterData = getMasterData(masterName);
    return masterData.bonusHistory || [];
}

// --- Работа с бонусами (bonuses) ---
// Критерии для автоматического расчета бонуса
const BONUS_CRITERIA = {
    jobs: { min: 50, bonus: 2 },
    revenue: { min: 100000, bonus: 3 },
    servicesVariety: { min: 20, bonus: 1 } // From stats
};

export function calculateAndUpdateBonus(masterName, masterData = null) {
    if (!masterData) {
        masterData = getMasterData(masterName);
    }

    let bonusLevel = 0;

    // Критерий 1: Количество работ
    if (masterData.totalJobs >= BONUS_CRITERIA.jobs.min) {
        bonusLevel += BONUS_CRITERIA.jobs.bonus;
    }

    // Критерий 2: Общая выручка
    if (masterData.totalRevenue >= BONUS_CRITERIA.revenue.min) {
        bonusLevel += BONUS_CRITERIA.revenue.bonus;
    }

    // TODO: Критерий 3: Разнообразие услуг (нужно собирать статистику)
    // if (servicesVariety >= BONUS_CRITERIA.servicesVariety.min) {
    //     bonusLevel += BONUS_CRITERIA.servicesVariety.bonus;
    // }

    // Ограничиваем максимальный уровень
    bonusLevel = Math.min(bonusLevel, 10);

    return bonusLevel;
}

export function getBonusLevel(masterName, date = null) {
    const masterData = getMasterData(masterName);
    return masterData.currentBonusLevel || 0;
}

export function setBonusLevel(masterName, level, date = null) {
    const masters = safeGetItem(STORAGE_KEYS.MASTERS) || {};
    if (!masters[masterName]) {
        masters[masterName] = {
            name: masterName,
            totalRevenue: 0,
            totalJobs: 0,
            currentBonusLevel: 0,
            bonusHistory: []
        };
    }

    const oldLevel = masters[masterName].currentBonusLevel;
    masters[masterName].currentBonusLevel = level;

    // Добавляем в историю
    masters[masterName].bonusHistory.push({
        level: level,
        timestamp: new Date().toISOString()
    });

    // Ограничиваем историю
    if (masters[masterName].bonusHistory.length > 50) {
        masters[masterName].bonusHistory = masters[masterName].bonusHistory.slice(-50);
    }

    // Сохраняем историю бонусов отдельно для графика
    safeSetItem(`vipauto_bonus_history_${masterName}`, masters[masterName].bonusHistory);

    safeSetItem(STORAGE_KEYS.MASTERS, masters);
    return oldLevel !== level;
}

// --- Настройки (settings) ---
export function getSettings() {
    return safeGetItem(STORAGE_KEYS.SETTINGS) || {};
}

export function updateSettings(newSettings) {
    const settings = getSettings();
    const updatedSettings = { ...settings, ...newSettings };
    return safeSetItem(STORAGE_KEYS.SETTINGS, updatedSettings);
}

// --- Резервное копирование (backup) ---
export function createBackup() {
    // Заглушка для создания резервной копии
    const backupData = {
        entries: getAllEntries(),
        masters: getAllMastersData(),
        settings: getSettings(),
        timestamp: new Date().toISOString()
    };
    // В реальном приложении здесь будет отправка на сервер
    console.log('Backup created (stub):', backupData);
    safeSetItem(STORAGE_KEYS.BACKUP, backupData);
    return backupData;
}

export function restoreBackup(backupData) {
    // Заглушка для восстановления из резервной копии
    if (backupData.entries) safeSetItem(STORAGE_KEYS.ENTRIES, backupData.entries);
    if (backupData.masters) safeSetItem(STORAGE_KEYS.MASTERS, backupData.masters);
    if (backupData.settings) safeSetItem(STORAGE_KEYS.SETTINGS, backupData.settings);
    console.log('Backup restored (stub)');
    return true;
}

// --- Инициализация хранилища при импорте модуля ---
console.log('Storage module initialized');