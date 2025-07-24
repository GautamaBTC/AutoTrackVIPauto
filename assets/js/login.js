//───────────────────────────────────────────────────────────────────
// File: assets/js/login.js
// Логика страницы входа (теперь без дублирования кода темы)
//───────────────────────────────────────────────────────────────────

import { authUser } from './storage.js';
import { initHeader } from './theme.js'; // Импортируем новую функцию

document.addEventListener('DOMContentLoaded', () => {
  // Запускаем общую логику для хэдера
  initHeader();

  const form          = document.getElementById('login-form');
  const userInput     = document.getElementById('username');
  const passInput     = document.getElementById('password');
  const togglePassBtn = document.getElementById('toggle-password');
  
  // Показ/скрытие пароля
  togglePassBtn.addEventListener('click', () => {
    if (passInput.type === 'password') {
      passInput.type = 'text';
      togglePassBtn.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
      passInput.type = 'password';
      togglePassBtn.classList.replace('fa-eye-slash', 'fa-eye');
    }
  });

  // Валидация и вход
  form.addEventListener('submit', e => {
    e.preventDefault();
    clearError(userInput);
    clearError(passInput);

    const login = userInput.value.trim();
    const pwd = passInput.value.trim();

    if (!login) { showError(userInput, 'Введите логин'); return; }
    if (!pwd) { showError(passInput, 'Введите пароль'); return; }

    if (authUser(login, pwd)) {
      sessionStorage.setItem('loggedInUser', login);
      window.location.href = 'index.html';
    } else {
      showError(passInput, 'Неверный логин или пароль');
    }
  });

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
