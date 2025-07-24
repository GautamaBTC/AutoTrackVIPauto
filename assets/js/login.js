//───────────────────────────────────────────────────────────────────
// File: assets/js/login.js
// Логика страницы входа с аутентификацией через storage и редиректом
//───────────────────────────────────────────────────────────────────

// Импортируем функцию аутентификации из нашего хранилища
import { authUser } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
  const dateEl        = document.getElementById('current-date');
  const timeEl        = document.getElementById('current-time');
  const themeToggle   = document.getElementById('theme-toggle');
  const htmlEl        = document.documentElement;
  const form          = document.getElementById('login-form');
  const userInput     = document.getElementById('username');
  const passInput     = document.getElementById('password');
  const togglePassBtn = document.getElementById('toggle-password');

  // 1) Обновление даты и времени (без изменений)
  function updateDateTime() {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const [h, m, s] = [now.getHours(), now.getMinutes(), now.getSeconds()]
                     .map(n => String(n).padStart(2, '0'));
    timeEl.textContent = `${h}:${m}:${s}`;
  }
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // 2) Переключатель темы с сохранением (без изменений)
  const THEME_KEY = 'vipautologin_theme';
  let theme = localStorage.getItem(THEME_KEY) || 'dark';
  htmlEl.setAttribute('data-theme', theme);
  themeToggle.checked = (theme === 'light');

  themeToggle.addEventListener('change', () => {
    theme = themeToggle.checked ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  });

  // 3) Показ/скрытие пароля (без изменений)
  togglePassBtn.addEventListener('click', () => {
    if (passInput.type === 'password') {
      passInput.type = 'text';
      togglePassBtn.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
      passInput.type = 'password';
      togglePassBtn.classList.replace('fa-eye-slash', 'fa-eye');
    }
  });

  // 4) НОВАЯ ЛОГИКА: Валидируем и проверяем логин/пароль через storage.js
  form.addEventListener('submit', e => {
    e.preventDefault();
    // Сброс старых ошибок
    clearError(userInput);
    clearError(passInput);

    const login = userInput.value.trim();
    const pwd = passInput.value.trim();

    if (!login) {
      showError(userInput, 'Введите логин');
      return;
    }
    if (!pwd) {
      showError(passInput, 'Введите пароль');
      return;
    }

    // Используем нашу централизованную функцию для проверки
    if (authUser(login, pwd)) {
      // УСПЕХ!
      // Сохраняем имя пользователя для будущего использования
      sessionStorage.setItem('loggedInUser', login);
      
      // *** ГЛАВНОЕ ИЗМЕНЕНИЕ: ПЕРЕНАПРАВЛЯЕМ НА ГЛАВНУЮ СТРАНИЦУ ***
      window.location.href = 'index.html';

    } else {
      // НЕУДАЧА!
      showError(passInput, 'Неверный логин или пароль');
    }
  });

  // Вспомогательные функции для отображения/скрытия ошибок
  function showError(field, message) {
    const wrapper = field.closest('.form-group');
    const errSpan = wrapper.querySelector('.error-message');
    errSpan.textContent = message;
    field.focus();
  }
  
  function clearError(field) {
     const wrapper = field.closest('.form-group');
     const errSpan = wrapper.querySelector('.error-message');
     errSpan.textContent = '';
  }
});
