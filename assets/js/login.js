/*────────────────────────────────────────────
  assets/js/login.js | ФИНАЛЬНЫЙ ИСПРАВЛЕННЫЙ КОД
─────────────────────────────────────────────*/

// --- Имитация хранилища, чтобы не было ошибок ---
function authUser(login, password) {
  const validUsers = { admin: 'admin', test: '123' };
  return validUsers[login] === password;
}
// --- Конец имитации ---


document.addEventListener('DOMContentLoaded', () => {

  // --- Блок 1: Хэдер (Дата, время, тема) ---
  const dateEl = document.getElementById('current-date');
  const timeEl = document.getElementById('current-time');
  const themeToggle = document.getElementById('theme-toggle');
  const htmlEl = document.documentElement;

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

  // ИСПРАВЛЕННЫЙ И РАБОЧИЙ "ГЛАЗИК"
  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', () => {
      // Проверяем текущий тип поля
      const isPassword = passInput.type === 'password';
      
      // Меняем тип поля
      passInput.type = isPassword ? 'text' : 'password';
      
      // Меняем иконку
      togglePassBtn.classList.toggle('fa-eye', !isPassword);
      togglePassBtn.classList.toggle('fa-eye-slash', isPassword);
    });
  }


  // Обработка отправки формы
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const login = userInput.value.trim();
    const password = passInput.value.trim();

    console.log(`Попытка входа с логином: ${login}`);

    if (authUser(login, password)) {
      console.log('Успешный вход!');
      alert('Успешный вход! (Переход будет реализован позже)');
      // window.location.href = 'index.html'; // Это мы включим позже
    } else {
      console.log('Неверный логин или пароль.');
      alert('Неверный логин или пароль!');
      // Здесь можно будет добавить сообщение об ошибке
    }
  });

});
