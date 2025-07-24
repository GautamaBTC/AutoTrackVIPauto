//────────────────────────────────────────────────────────────────────────
// utils.js — вспомогательные функции форматирования и дебаунса
//────────────────────────────────────────────────────────────────────────

/**
 * Преобразует Date в строку для <input type="date"> — "YYYY-MM-DD"
 * @param {Date} date
 * @returns {string}
 */
export function formatDateInput(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

/**
 * Отображает дату в человекочитаемом формате «12 июля 2025»
 * @param {string|Date} dateValue
 * @returns {string}
 */
export function formatDateDisplay(dateValue) {
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return d.toLocaleDateString('ru-RU', {
    day:   'numeric',
    month: 'long',
    year:  'numeric'
  });
}

/**
 * Проверка, является ли дата сегодня
 * @param {string|Date} dateValue
 * @returns {boolean}
 */
export function isToday(dateValue) {
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

/**
 * Функция для дебаунса (удерживает вызов до конца паузы)
 * @param {Function} fn
 * @param {number}   ms
 * @returns {Function}
 */
export function debounce(fn, ms = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Генерирует массив дат между двумя датами включительно (формат "YYYY-MM-DD")
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {string[]}
 */
export function getDateRange(startDate, endDate) {
  const arr = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    arr.push(formatDateInput(new Date(d)));
  }
  return arr;
}