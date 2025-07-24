//───────────────────────────────────────────────────────────────────
// File: assets/js/login.js
// VIPавто Login 2025 — финальный скрипт (дата, тема, глазик, валид)
//───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const dateEl        = document.getElementById('current-date');
  const timeEl        = document.getElementById('current-time');
  const themeToggle   = document.getElementById('theme-toggle');
  const htmlEl        = document.documentElement;
  const form          = document.getElementById('login-form');
  const userInput     = document.getElementById('username');
  const passInput     = document.getElementById('password');
  const togglePassBtn = document.getElementById('toggle-password');

  // 1) Обновление даты и времени
  function updateDateTime() {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const [h,m,s] = [now.getHours(), now.getMinutes(), now.getSeconds()]
                     .map(n => String(n).padStart(2,'0'));
    timeEl.textContent = `${h}:${m}:${s}`;
  }
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // 2) Переключатель темы с сохранением
  const THEME_KEY = 'vipautologin_theme';
  let theme = localStorage.getItem(THEME_KEY) || 'dark';
  htmlEl.setAttribute('data-theme', theme);
  themeToggle.checked = (theme === 'light');

  themeToggle.addEventListener('change', () => {
    theme = themeToggle.checked ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  });

  // 3) Показ/скрытие пароля
  togglePassBtn.addEventListener('click', () => {
    if (passInput.type === 'password') {
      passInput.type = 'text';
      togglePassBtn.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
      passInput.type = 'password';
      togglePassBtn.classList.replace('fa-eye-slash', 'fa-eye');
    }
  });

  // 4) Валидируем и проверяем логин/пароль
  form.addEventListener('submit', e => {
    e.preventDefault();
    // Сброс ошибок
    form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    let hasError = false;

    if (!userInput.value.trim()) {
      showError(userInput, 'Введите логин');
      hasError = true;
    }
    if (!passInput.value.trim()) {
      showError(passInput, 'Введите пароль');
      hasError = true;
    }
    if (hasError) return;

    // Предварительно заданные логины/пароли
    const validUsers = {
      admin:   'admin009',
      vladimir:'vlad123',
      andrey:  'andr456',
      danila:  'dan789',
      maxim:   'max123',
      artyom:  'art987'
    };

    const login = userInput.value.trim();
    const pwd   = passInput.value.trim();

    if (!validUsers[login] || validUsers[login] !== pwd) {
      showError(passInput, 'Неверный логин или пароль');
      return;
    }

    // Успешный вход
    console.log(`Вход выполнен: ${login}`);
    // TODO: Перенаправить на главную страницу приложения
    form.reset();
  });

  // Вспомогательная функция отображения ошибки
  function showError(field, message) {
    const wrapper = field.closest('.form-group');
    const errSpan = wrapper.querySelector('.error-message');
    errSpan.textContent = message;
    field.focus();
  }
});