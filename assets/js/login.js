/*────────────────────────────────────────────
  assets/js/login.js | С СИСТЕМОЙ РОЛЕЙ И УВЕДОМЛЕНИЯМИ
─────────────────────────────────────────────*/

// Константы для ролей и пользователей
const USER_ROLES = {
    DIRECTOR: 'director',    // Полный доступ
    ADMIN: 'admin',         // Расширенный доступ
    MASTER: 'master'        // Личный кабинет
};

// Пользователи системы с ролями
const INITIAL_USERS = {
    'vladimir.orlov': {
        password: 'director2024',
        role: USER_ROLES.DIRECTOR,
        name: 'Владимир Орлов',
        position: 'Директор'
    },
    'admin': {
        password: 'admin2024',
        role: USER_ROLES.ADMIN,
        name: 'Администратор',
        position: 'Администратор'
    },
    'vladimir.ch': {
        password: 'vlch2024',
        role: USER_ROLES.MASTER,
        name: 'Владимир Ч.',
        position: 'Мастер'
    },
    'vladimir.a': {
        password: 'vla2024',
        role: USER_ROLES.MASTER,
        name: 'Владимир А.',
        position: 'Мастер'
    },
    'andrey': {
        password: 'and2024',
        role: USER_ROLES.MASTER,
        name: 'Андрей',
        position: 'Мастер'
    },
    'danila': {
        password: 'dan2024',
        role: USER_ROLES.MASTER,
        name: 'Данила',
        position: 'Мастер'
    },
    'maxim': {
        password: 'max2024',
        role: USER_ROLES.MASTER,
        name: 'Максим',
        position: 'Мастер'
    },
    'artyom': {
        password: 'art2024',
        role: USER_ROLES.MASTER,
        name: 'Артём',
        position: 'Мастер'
    }
};

// Класс для красивых уведомлений
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

// Основной код
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

    // Проверка авторизации
    function authenticateUser(login, password) {
        const user = INITIAL_USERS[login];
        return user && user.password === password ? user : null;
    }

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
            // Имитация задержки сети
            await new Promise(resolve => setTimeout(resolve, 800));

            const user = authenticateUser(login, password);

            if (user) {
                // Сохраняем данные пользователя
                const userData = {
                    login,
                    name: user.name,
                    role: user.role,
                    position: user.position,
                    timestamp: new Date().toISOString()
                };

                if (rememberMe.checked) {
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
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-arrow-right-to-bracket"></i> Войти';
            Notification.show(error.message);
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
