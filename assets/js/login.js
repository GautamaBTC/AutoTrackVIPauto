import { authUser } from './storage.js';
import { initHeader } from './theme.js'; // Главное - этот импорт

document.addEventListener('DOMContentLoaded', () => {
  initHeader(); // И этот вызов
  // ... (весь остальной код login.js без изменений)
  const form = document.getElementById('login-form');
  const userInput = document.getElementById('username');
  const passInput = document.getElementById('password');
  const togglePassBtn = document.getElementById('toggle-password');
  
  togglePassBtn.addEventListener('click', () => { /* ... */ });
  form.addEventListener('submit', e => { /* ... */ });
  function showError(field, message) { /* ... */ }
  function clearError(field) { /* ... */ }
});
