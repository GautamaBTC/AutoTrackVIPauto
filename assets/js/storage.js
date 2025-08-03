/*────────────────────────────────────────────
  assets/js/storage.js
  Модуль для работы с localStorage. Обрабатывает все
  операции сохранения, чтения и обновления данных.
─────────────────────────────────────────────*/

// --- Константы для ключей localStorage ---
const STORAGE_KEYS = {
  ENTRIES: 'vipauto_entries', // Все записи о работах
  MASTERS: 'vipauto_masters', // Данные по мастерам (статистика, бонусы)
  SETTINGS: 'vipauto_settings'  // Настройки приложения
};

// --- Вспомогательные функции для безопасной работы с localStorage ---
function safeGetItem(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error(`Error getting item ${key} from localStorage`, e);
    return null;
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error setting item ${key} in localStorage`, e);
    // В будущем здесь можно добавить логику уведомления пользователя о переполнении хранилища.
  }
}

// --- РАБОТА С ЗАПИСЯМИ (ENTRIES) ---

/**
 * Получает все записи о работах.
 * @returns {Array<object>} Массив всех записей.
 */
export function getAllEntries() {
  return safeGetItem(STORAGE_KEYS.ENTRIES) || [];
}

/**
 * Сохраняет (добавляет или обновляет) запись о работе.
 * @param {object} entry - Объект записи для сохранения.
 */
export function saveEntry(entry) {
  const entries = getAllEntries();
  const existingIndex = entries.findIndex(e => e.id === entry.id);

  if (existingIndex !== -1) {
    // Обновляем существующую запись
    entries[existingIndex] = { ...entries[existingIndex], ...entry };
  } else {
    // Добавляем новую запись
    entries.push(entry);
  }

  safeSetItem(STORAGE_KEYS.ENTRIES, entries);
  // Обновляем статистику мастера после сохранения записи
  updateMasterData(entry, false);
}

/**
 * Удаляет запись по ее ID.
 * @param {string} id - ID записи для удаления.
 */
export function deleteEntry(id) {
  let entries = getAllEntries();
  const entryToDelete = entries.find(e => e.id === id);

  if (entryToDelete) {
    entries = entries.filter(e => e.id !== id);
    safeSetItem(STORAGE_KEYS.ENTRIES, entries);
    // Обновляем статистику мастера после удаления записи
    updateMasterData(entryToDelete, true);
  }
}

// --- РАБОТА С ДАННЫМИ МАСТЕРОВ (MASTERS) ---

/**
 * Получает все данные по всем мастерам.
 * @returns {object} Объект, где ключ - имя мастера, значение - его данные.
 */
export function getAllMastersData() {
  return safeGetItem(STORAGE_KEYS.MASTERS) || {};
}

/**
 * Получает данные конкретного мастера. Если мастера нет, создает его.
 * @param {string} masterName - Имя мастера.
 * @returns {object} Данные мастера.
 */
export function getMasterData(masterName) {
  const masters = getAllMastersData();
  return masters[masterName] || {
    name: masterName,
    totalRevenue: 0,
    totalJobs: 0,
    currentBonusLevel: 0,
    bonusHistory: []
  };
}

/**
 * Обновляет статистику мастера (выручку и количество работ) на основе записи.
 * @param {object} entry - Запись о работе.
 * @param {boolean} isDeletion - Флаг, указывающий, удаляется ли запись.
 */
function updateMasterData(entry, isDeletion) {
  const masters = getAllMastersData();
  const masterName = entry.master;

  if (!masters[masterName]) {
    masters[masterName] = {
      name: masterName,
      totalRevenue: 0,
      totalJobs: 0,
      currentBonusLevel: 0,
      bonusHistory: []
    };
  }

  const entryValue = (parseFloat(entry.workCost) || 0) + (parseFloat(entry.partsCost) || 0);
  const sign = isDeletion ? -1 : 1;

  masters[masterName].totalRevenue += entryValue * sign;
  masters[masterName].totalJobs += 1 * sign;

  safeSetItem(STORAGE_KEYS.MASTERS, masters);
}


// --- РАБОТА С БОНУСАМИ ---

/**
 * Получает историю изменения бонуса для мастера.
 * @param {string} masterName - Имя мастера.
 * @returns {Array<object>} История бонусов.
 */
export function getMasterBonusHistory(masterName) {
    const masterData = getMasterData(masterName);
    return masterData.bonusHistory || [];
}

/**
 * Получает текущий уровень бонуса мастера.
 * @param {string} masterName - Имя мастера.
 * @returns {number} Уровень бонуса.
 */
export function getBonusLevel(masterName) {
  const masterData = getMasterData(masterName);
  return masterData.currentBonusLevel || 0;
}

/**
 * Устанавливает новый уровень бонуса для мастера и сохраняет это в истории.
 * @param {string} masterName - Имя мастера.
 * @param {number} level - Новый уровень бонуса.
 */
export function setBonusLevel(masterName, level) {
  const masters = getAllMastersData();
  
  if (!masters[masterName]) {
    masters[masterName] = {
      name: masterName,
      totalRevenue: 0,
      totalJobs: 0,
      currentBonusLevel: 0,
      bonusHistory: []
    };
  }

  masters[masterName].currentBonusLevel = level;
  masters[masterName].bonusHistory.push({
    level: level,
    timestamp: new Date().toISOString()
  });

  // Ограничиваем историю, чтобы не засорять localStorage
  if (masters[masterName].bonusHistory.length > 50) {
    masters[masterName].bonusHistory.shift();
  }

  safeSetItem(STORAGE_KEYS.MASTERS, masters);
}

// --- РАБОТА С НАСТРОЙКАМИ ---

/**
 * Получает настройки приложения.
 * @returns {object}
 */
export function getSettings() {
    return safeGetItem(STORAGE_KEYS.SETTINGS) || {};
}

/**
 * Обновляет настройки приложения.
 * @param {object} newSettings - Новые настройки для слияния со старыми.
 */
export function updateSettings(newSettings) {
    const settings = getSettings();
    const updatedSettings = { ...settings, ...newSettings };
    safeSetItem(STORAGE_KEYS.SETTINGS, updatedSettings);
}
