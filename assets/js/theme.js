/*────────────────────────────────────────────
  assets/js/theme.js
  Управление темами оформления и инициализация хедера.
─────────────────────────────────────────────*/

// --- Константы ---
const STORAGE_KEY = 'vipautologin_theme';
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

/**
 * Применяет выбранную тему к документу и уведомляет другие модули.
 * @param {string} theme - 'light' или 'dark'
 */
function applyTheme(theme) {
  const htmlEl = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');

  if (htmlEl) {
    htmlEl.setAttribute('data-theme', theme);
  }

  if (themeToggle) {
    themeToggle.checked = (theme === THEMES.LIGHT);
  }

  localStorage.setItem(STORAGE_KEY, theme);

  // Создаем и отправляем кастомное событие, чтобы другие модули (например, графики)
  // могли на него отреагировать и обновить свои цвета.
  window.dispatchEvent(new CustomEvent('themechange', {
    detail: { theme: theme }
  }));
}

/**
 * Получает текущую сохраненную тему из localStorage.
 * @returns {string} - 'light' или 'dark'. По умолчанию 'dark'.
 */
export function getCurrentTheme() {
  return localStorage.getItem(STORAGE_KEY) || THEMES.DARK;
}

/**
 * Инициализирует хедер: устанавливает текущую дату и время,
 * настраивает переключатель тем.
 */
export function initHeader() {
  const dateEl = document.getElementById('current-date');
  const timeEl = document.getElementById('current-time');
  const themeToggle = document.getElementById('theme-toggle');

  if (!dateEl || !timeEl || !themeToggle) {
    console.error('Header elements (date, time, or theme-toggle) not found in the DOM.');
    return;
  }

  // Функция для обновления даты и времени
  function updateDateTime() {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    const [h, m, s] = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(n => String(n).padStart(2, '0'));
    timeEl.textContent = `${h}:${m}:${s}`;
  }

  // Немедленный вызов и запуск интервала
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // Обработчик для переключателя тем
  themeToggle.addEventListener('change', () => {
    const newTheme = themeToggle.checked ? THEMES.LIGHT : THEMES.DARK;
    applyTheme(newTheme);
  });

  // Применяем сохраненную тему при первой загрузке страницы
  applyTheme(getCurrentTheme());
}
