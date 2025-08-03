/*────────────────────────────────────────────
  assets/js/login.js
  Логика для страницы входа, включая аутентификацию
  и взаимодействие с пользователем.
─────────────────────────────────────────────*/

// [FIX] Импортируем централизованную функцию уведомлений
import { showNotification } from './utils.js';

// --- Константы для ролей ---
const USER_ROLES = {
  DIRECTOR: 'director', // Полный доступ
  MASTER: 'master'      // Личный кабинет
};

// --- Пользователи системы (в реальном проекте это будет API-запрос) ---
const USERS = {
  // Директор
  'director': {
    password: 'director123',
    role: USER_ROLES.DIRECTOR,
    name: 'Александр Иванов',
    position: 'Директор'
  },
  // Мастера
  'vladimir.ch': {
    password: 'vlch123',
    role: USER_ROLES.MASTER,
    name: 'Владимир Ч.',
    position: 'Мастер-электрик'
  },
  'vladimir.a': {
    password: 'vla123',
    role: USER_ROLES.MASTER,
    name: 'Владимир А.',
    position: 'Мастер по автосвету'
  },
  'andrey': {
    password: 'andrey123',
    role: USER_ROLES.MASTER,
    name: 'Андрей',
    position: 'Мастер по доп. оборудованию'
  },
  'danila': {
    password: 'danila123',
    role: USER_ROLES.MASTER,
    name: 'Данила',
    position: 'Мастер по охранным системам'
  },
  'maxim': {
    password: 'maxim123',
    role: USER_ROLES.MASTER,
    name: 'Максим',
    position: 'Мастер по аудиосистемам'
  },
  'artyom': {
    password: 'artyom123',
    role: USER_ROLES.MASTER,
    name: 'Артём',
    position: 'Мастер по тонировке'
  }
};

// [FIX] Локальный класс Notification удален, так как теперь используется импорт

document.addEventListener('DOMContentLoaded', () => {
  // --- Блок 1: Хедер (Дата, время, тема) ---
  const dateEl = document.getElementById('current-date');
  const timeEl = document.getElementById('current-time');
  const themeToggle = document.getElementById('theme-toggle');
  const htmlEl = document.documentElement;

  if (!dateEl || !timeEl || !themeToggle) {
    console.error('Required header elements not found on login page.');
    return;
  }

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
  updateDateTime();
  setInterval(updateDateTime, 1000);

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    themeToggle.checked = (theme === 'light');
    localStorage.setItem('vipautologin_theme', theme);
  }

  themeToggle.addEventListener('change', () => {
    const newTheme = themeToggle.checked ? 'light' : 'dark';
    applyTheme(newTheme);
  });

  const savedTheme = localStorage.getItem('vipautologin_theme') || 'dark';
  applyTheme(savedTheme);

  // --- Блок 2: Логика формы входа ---
  const form = document.getElementById('login-form');
  const userInput = document.getElementById('username');
  const passInput = document.getElementById('password');
  const togglePassBtn = document.getElementById('toggle-password');
  const submitBtn = form.querySelector('button[type="submit"]');
  const rememberMe = document.getElementById('remember-me');

  if (!form || !userInput || !passInput || !submitBtn) {
    console.error('Required form elements not found on login page.');
    return;
  }

  // Показать/скрыть пароль
  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', () => {
      const isPassword = passInput.type === 'password';
      passInput.type = isPassword ? 'text' : 'password';
      togglePassBtn.classList.toggle('fa-eye', !isPassword);
      togglePassBtn.classList.toggle('fa-eye-slash', isPassword);
    });
  }

  // Валидация полей
  function validateField(input) {
    const errorEl = input.closest('.form-group').querySelector('.error-message');
    if (!input.value.trim()) {
      if (errorEl) errorEl.textContent = 'Поле не может быть пустым';
      return false;
    }
    if (errorEl) errorEl.textContent = '';
    return true;
  }

  userInput.addEventListener('input', () => validateField(userInput));
  passInput.addEventListener('input', () => validateField(passInput));

  // Аутентификация
  function authenticateUser(login, password) {
    const normalizedLogin = login.toLowerCase().trim();
    const user = USERS[normalizedLogin];
    if (user && user.password === password) {
      return {
        login: normalizedLogin,
        name: user.name,
        role: user.role,
        position: user.position
      };
    }
    return null;
  }

  // Обработка отправки формы
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isLoginValid = validateField(userInput);
    const isPassValid = validateField(passInput);
    if (!isLoginValid || !isPassValid) return;

    const login = userInput.value;
    const password = passInput.value;

    submitBtn.disabled = true;
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';

    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = authenticateUser(login, password);

    if (user) {
      const userData = {
        ...user,
        timestamp: new Date().toISOString()
      };

      if (rememberMe && rememberMe.checked) {
        localStorage.setItem('vipauto_user', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('vipauto_user', JSON.stringify(userData));
      }

      // [FIX] Используем импортированную функцию уведомлений
      showNotification('Успешный вход! Перенаправляем...', 'success');

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1200);

    } else {
      // [FIX] Используем импортированную функцию уведомлений
      showNotification('Неверный логин или пароль', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
    }
  });
});
