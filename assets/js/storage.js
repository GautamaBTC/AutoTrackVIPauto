//────────────────────────────────────────────────────────────────────────
// storage.js — работа с пользователями и записями через localStorage
//────────────────────────────────────────────────────────────────────────

const USERS_KEY   = 'vipautojournal_users';
const ENTRIES_KEY = 'vipautojournal_entries';

// 1) Инициализация списка пользователей
function initUsers() {
  let users = JSON.parse(localStorage.getItem(USERS_KEY) || 'null');
  if (!users) {
    users = {
      admin:    'admin009',
      vladimir: 'vlad123',
      andrey:   'andr456',
      danila:   'dan789',
      maxim:    'max123',
      artyom:   'art987'
    };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  return users;
}

// 2) Аутентификация
export function authUser(login, password) {
  const users = initUsers();
  return users[login] === password;
}

// 3) Получить всех мастеров (список логинов)
export function getUsers() {
  const users = initUsers();
  return Object.keys(users);
}

// 4) Записи журнала
function loadEntries() {
  return JSON.parse(localStorage.getItem(ENTRIES_KEY) || '[]');
}
function saveEntries(list) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(list));
}

// 5) CRUD для записей
export function getAllEntries() {
  return loadEntries();
}

/**
 * Добавить новую запись
 * @param {{ id?: number, date: string, master: string, car: string, services: string[],
 *            workCost: number, partsMarkup: number }} entry
 */
export function addEntry(entry) {
  const list = loadEntries();
  const newEntry = { id: Date.now(), ...entry };
  list.push(newEntry);
  saveEntries(list);
  return newEntry;
}

/**
 * Обновить запись по id
 * @param {number} id
 * @param {object} data — обновлённые поля
 */
export function updateEntry(id, data) {
  const list = loadEntries();
  const idx  = list.findIndex(e => e.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...data };
    saveEntries(list);
    return true;
  }
  return false;
}

/**
 * Удалить запись
 * @param {number} id
 */
export function deleteEntry(id) {
  let list = loadEntries();
  list = list.filter(e => e.id !== id);
  saveEntries(list);
}

// 6) Очистить все записи (для отладки)
export function clearAllEntries() {
  localStorage.removeItem(ENTRIES_KEY);
}