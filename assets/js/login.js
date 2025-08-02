/*────────────────────────────────────────────
  assets/js/login.js | С СИСТЕМОЙ РОЛЕЙ И УВЕДОМЛЕНИЯМИ
─────────────────────────────────────────────*/

// --- Константы для ролей ---
const USER_ROLES = {
    DIRECTOR: 'director', // Полный доступ (админ + директор)
    MASTER: 'master'      // Личный кабинет
};

// --- Пользователи системы (логин/пароль в открытом виде для демонстрации) ---
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
        position: 'Мастер'
    },
    'vladimir.a': {
        password: 'vla123',
        role: USER_ROLES.MASTER,
        name: 'Владимир А.',
        position: 'Мастер'
    },
    'andrey': {
        password: 'andrey123',
        role: USER_ROLES.MASTER,
        name: 'Андрей',
        position: 'Мастер'
    },
    'danila': {
        password: 'danila123',
        role: USER_ROLES.MASTER,
        name: 'Данила',
        position: 'Мастер'
    },
    'maxim': {
        password: 'maxim123',
        role: USER_ROLES.MASTER,
        name: 'Максим',
        position: 'Мастер'
    },
    'artyom': {
        password: 'artyom123',
        role: USER_ROLES.MASTER,
        name: 'Артём',
        position: 'Мастер'
    }
};

// --- Класс для уведомлений ---
class Notification {
    static show(message, type = 'error') {
        // Удаляем предыдущие уведомления
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);

        // Анимация появления
        setTimeout(() => notification.classList.add('show'), 10);

        // Автоматическое скрытие
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// --- Основной код ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Login page loaded");

    // --- Блок 1: Хэдер (Дата, время, тема) ---
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');
    const themeToggle = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;

    if (!dateEl || !timeEl || !themeToggle) {
        console.error('Required header elements not found');
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
    const timeInterval = setInterval(updateDateTime, 1000);

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
        console.error('Required form elements not found');
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

    // Валидация полей при вводе
    function validateField(input) {
        const errorEl = input.parentElement.parentElement.querySelector('.error-message');
        if (!input.value.trim()) {
            if (errorEl) errorEl.textContent = 'Поле обязательно для заполнения';
            return false;
        }
        if (errorEl) errorEl.textContent = '';
        return true;
    }

    userInput.addEventListener('input', () => validateField(userInput));
    passInput.addEventListener('input', () => validateField(passInput));

    // Проверка авторизации
    function authenticateUser(login, password) {
        // Приводим логин к нижнему регистру для сравнения
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
        console.log("Form submitted");

        // Валидация
        const isLoginValid = validateField(userInput);
        const isPassValid = validateField(passInput);
        if (!isLoginValid || !isPassValid) return;

        const login = userInput.value.trim();
        const password = passInput.value.trim();

        // Анимация загрузки
        submitBtn.disabled = true;
        const originalBtnContent = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';

        try {
            // Имитация задержки сети
            await new Promise(resolve => setTimeout(resolve, 800));

            const user = authenticateUser(login, password);

            if (user) {
                // Сохраняем данные пользователя
                const userData = {
                    ...user,
                    timestamp: new Date().toISOString()
                };

                if (rememberMe && rememberMe.checked) {
                    localStorage.setItem('vipauto_user', JSON.stringify(userData));
                } else {
                    sessionStorage.setItem('vipauto_user', JSON.stringify(userData));
                }

                Notification.show('Успешный вход!', 'success');

                // Редирект с небольшой задержкой
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                throw new Error('Неверный логин или пароль!');
            }
        } catch (error) {
            console.error('Login error:', error);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnContent;
            Notification.show(error.message || 'Ошибка входа');
        }
    });

    // Автозаполнение, если пользователь сохранен
    const savedUser = localStorage.getItem('vipauto_user') || sessionStorage.getItem('vipauto_user');
    if (savedUser) {
        try {
            const { login } = JSON.parse(savedUser);
            if (userInput) userInput.value = login;
            if (rememberMe) rememberMe.checked = true;
        } catch (e) {
            console.error('Error parsing saved user ', e);
        }
    }
});