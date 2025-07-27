/*────────────────────────────────────────────
  assets/js/login.js | С РАБОЧИМ ПЕРЕХОДОМ
─────────────────────────────────────────────*/

// --- Имитация хранилища, чтобы не было ошибок ---
// В будущем мы заменим это на импорт из storage.js
function authUser(login, password) {
  const validUsers = {
    admin: 'admin',
    test: '123'
    // В будущем здесь будут все пользователи из storage.js
  };
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
  
  const savedTheme = localStorage.getItem('vipautologin_theme') || 'light';
  applyTheme(savedTheme);


  // --- Блок 2: Логика формы входа ---
  const form = document.getElementById('login-form');
  const userInput = document.getElementById('username');
  const passInput = document.getElementById('password');
  const togglePassBtn = document.getElementById('toggle-password');

  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', () => {
      const isPassword = passInput.type === 'password';
      passInput.type = isPassword ? 'text' : 'password';
      togglePassBtn.classList.toggle('fa-eye', !isPassword);
      togglePassBtn.classList.toggle('fa-eye-slash', isPassword);
    });
  }

  // Обработка отправки формы
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const login = userInput.value.trim();
    const password = passInput.value.trim();

    if (authUser(login, password)) {
      // УСПЕХ!
      // *** ГЛАВНОЕ ИЗМЕНЕНИЕ: ПЕРЕНАПРАВЛЯЕМ НА ГЛАВНУЮ СТРАНИЦУ ***
      window.location.href = 'index.html'; 
    } else {
      // НЕУДАЧА!
      alert('Неверный логин или пароль!');
      // TODO: Заменить на красивое уведомление об ошибке
    }
  });

});
