//───────────────────────────────────────────────────────────────────
// File: assets/js/theme.js
// НОВЫЙ ФАЙЛ! Общая логика для хэдера: дата, время, тема
//───────────────────────────────────────────────────────────────────

export function initHeader() {
  const dateEl      = document.getElementById('current-date');
  const timeEl      = document.getElementById('current-time');
  const themeToggle = document.getElementById('theme-toggle');
  const htmlEl      = document.documentElement;

  // Если на странице нет этих элементов, ничего не делаем
  if (!dateEl || !timeEl || !themeToggle) {
    return;
  }

  // 1) Обновление даты и времени
  function updateDateTime() {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
    const [h, m, s] = [now.getHours(), now.getMinutes(), now.getSeconds()]
                     .map(n => String(n).padStart(2, '0'));
    timeEl.textContent = `${h}:${m}:${s}`;
  }
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // 2) Переключатель темы с сохранением
  const THEME_KEY = 'vipautologin_theme';
  let theme = localStorage.getItem(THEME_KEY) || 'dark'; // Темная тема по умолчанию

  const applyTheme = (themeName) => {
    htmlEl.setAttribute('data-theme', themeName);
    themeToggle.checked = (themeName === 'light');
    localStorage.setItem(THEME_KEY, themeName);
  };
  
  themeToggle.addEventListener('change', () => {
    theme = themeToggle.checked ? 'light' : 'dark';
    applyTheme(theme);
  });
  
  // Применяем тему при загрузке
  applyTheme(theme);
}
