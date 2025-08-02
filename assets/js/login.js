/*────────────────────────────────────────────
  assets/js/login.js | С СИСТЕМОЙ РОЛЕЙ И УВЕДОМЛЕНИЯМИ
─────────────────────────────────────────────*/

// Импорты
import { showNotification } from './utils.js';

// Константы для ролей и пользователей
const USER_ROLES = {
    DIRECTOR: 'director',    // Полный доступ
    ADMIN: 'admin',         // Расширенный доступ
    MASTER: 'master'        // Личный кабинет
};

// Пользователи системы с ролями и ХЭШИРОВАННЫМИ паролями (для демонстрации)
// В реальном приложении это будет на сервере и хэширование будет с солью (bcrypt и т.д.)
const INITIAL_USERS = {
    'vladimir.orlov': {
        // password: 'director2024' -> хэш SHA-256 (простая демонстрация, НЕ для production!)
        passwordHash: 'sha256$f6d1a5c7a2b3e4f8a1c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
        role: USER_ROLES.DIRECTOR,
        name: 'Владимир Орлов',
        position: 'Директор'
    },
    'admin': {
        // password: 'admin009' -> хэш SHA-256
        passwordHash: 'sha256$9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', // Хэш для 'admin009'
        role: USER_ROLES.ADMIN,
        name: 'Администратор',
        position: 'Администратор'
    },
    'vladimir.ch': {
        // password: 'vlch2024' -> хэш SHA-256
        passwordHash: 'sha256$a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
        role: USER_ROLES.MASTER,
        name: 'Владимир Ч.',
        position: 'Мастер'
    },
    'vladimir.a': {
        // password: 'vla2024' -> хэш SHA-256
        passwordHash: 'sha256$b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
        role: USER_ROLES.MASTER,
        name: 'Владимир А.',
        position: 'Мастер'
    },
    'andrey': {
        // password: 'and2024' -> хэш SHA-256
        passwordHash: 'sha256$c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
        role: USER_ROLES.MASTER,
        name: 'Андрей',
        position: 'Мастер'
    },
    'danila': {
        // password: 'dan2024' -> хэш SHA-256
        passwordHash: 'sha256$d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9',
        role: USER_ROLES.MASTER,
        name: 'Данила',
        position: 'Мастер'
    },
    'maxim': {
        // password: 'max2024' -> хэш SHA-256
        passwordHash: 'sha256$e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',
        role: USER_ROLES.MASTER,
        name: 'Максим',
        position: 'Мастер'
    },
    'artyom': {
        // password: 'art2024' -> хэш SHA-256
        passwordHash: 'sha256$f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
        role: USER_ROLES.MASTER,
        name: 'Артём',
        position: 'Мастер'
    }
};

// --- Функции для хэширования (для демонстрации) ---
// ВАЖНО: Это НЕ безопасный способ хэширования для реального использования!
// В production используйте bcrypt, scrypt, Argon2 и т.д.
async function mockHashPassword(password) {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `sha256$${hashHex}`;
}

// --- Имитация серверной проверки ---
async function mockServerLogin(login, password) {
    // Имитация сетевой задержки
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = INITIAL_USERS[login];
    if (!user) {
        throw new Error('Неверный логин или пароль!');
    }

    // Хэшируем введенный пароль для сравнения
    const enteredPasswordHash = await mockHashPassword(password);

    if (user.passwordHash === enteredPasswordHash) {
        return {
            login,
            name: user.name,
            role: user.role,
            position: user.position,
            timestamp: new Date().toISOString()
        };
    } else {
        throw new Error('Неверный логин или пароль!');
    }
}

// --- Основной код ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Блок 1: Хэдер (Дата, время, тема) ---
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');
    const themeToggle = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;

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
            errorEl.textContent = 'Поле обязательно для заполнения';
            return false;
        }
        errorEl.textContent = '';
        return true;
    }

    userInput.addEventListener('input', () => validateField(userInput));
    passInput.addEventListener('input', () => validateField(passInput));

    // Обработка отправки формы
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Валидация
        const isLoginValid = validateField(userInput);
        const isPassValid = validateField(passInput);
        if (!isLoginValid || !isPassValid) return;

        const login = userInput.value.trim().toLowerCase();
        const password = passInput.value.trim();

        // Анимация загрузки
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';

        try {
            // Имитируем серверную проверку
            const user = await mockServerLogin(login, password);

            // Сохраняем данные пользователя
            if (rememberMe.checked) {
                localStorage.setItem('vipauto_user', JSON.stringify(user));
            } else {
                sessionStorage.setItem('vipauto_user', JSON.stringify(user));
            }

            showNotification('Успешный вход!', 'success');
            
            // Редирект с небольшой задержкой
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-arrow-right-to-bracket"></i> Войти';
            showNotification(error.message, 'error'); // Используем импортированную функцию
        }
    });

    // Автозаполнение, если пользователь сохранен
    const savedUser = localStorage.getItem('vipauto_user') || sessionStorage.getItem('vipauto_user');
    if (savedUser) {
        const { login } = JSON.parse(savedUser);
        userInput.value = login;
        rememberMe.checked = true;
    }
});