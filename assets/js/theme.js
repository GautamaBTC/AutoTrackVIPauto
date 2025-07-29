/*────────────────────────────────────────────
  assets/js/theme.js | УЛУЧШЕННАЯ ВЕРСИЯ С ФИКСАМИ
─────────────────────────────────────────────*/

// Константы
const STORAGE_KEY = 'vipautologin_theme';
const TRANSITION_DURATION = 300;

const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};

// CSS переменные для каждой темы (с бирюзовыми тонами в dark)
const THEME_VARIABLES = {
    [THEMES.LIGHT]: {
        '--bg': '#F0F2F5',
        '--panel-bg': '#FFFFFF',
        '--input-bg': '#F0F2F5',
        '--border': '#DCDFE6',
        '--text': '#303133',
        '--text-muted': '#909399',
        '--accent': '#399D9C',
        '--accent-light': '#4DBAB3',
        '--accent-dark': '#2D7F7E',
        '--shadow': 'rgba(0, 0, 0, 0.05)',
        '--btn-text': '#FFFFFF'
    },
    [THEMES.DARK]: {
        '--bg': '#001F3F', // Тёмно-бирюзовый фон
        '--panel-bg': '#002B55',
        '--input-bg': '#003D6B',
        '--border': '#005588',
        '--text': '#E0FFFF', // Светло-бирюзовый текст
        '--text-muted': '#A0D2DB',
        '--accent': '#008B8B', // Основной бирюзовый
        '--accent-light': '#00A0A0',
        '--accent-dark': '#006666',
        '--shadow': 'rgba(0, 0, 0, 0.3)',
        '--btn-text': '#001F3F'
    }
};

// Состояние
let currentTheme = null;
let isAnimating = false;

/**
 * Инициализация хедера и системы тем
 */
export function initHeader() {
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');
    const themeToggle = document.getElementById('theme-toggle');
    
    if (!dateEl || !timeEl || !themeToggle) {
        console.warn('Не найдены необходимые элементы хедера');
        return;
    }

    // Инициализация времени и даты
    initDateTime(dateEl, timeEl);
    
    // Инициализация переключателя темы
    initThemeToggle(themeToggle);

    // Отслеживаем системные настройки
    initSystemThemeListener();
}

/**
 * Инициализация отображения времени и даты (без секунд, крупно)
 */
function initDateTime(dateEl, timeEl) {
    let lastDate = '';
    let lastTime = '';

    function updateDateTime() {
        const now = new Date();
        
        // Обновляем дату только при изменении
        const currentDate = now.toLocaleDateString('ru-RU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        
        if (currentDate !== lastDate) {
            dateEl.textContent = currentDate;
            lastDate = currentDate;
        }

        // Обновляем время только при изменении (без секунд)
        const [h, m] = [
            now.getHours(),
            now.getMinutes()
        ].map(n => String(n).padStart(2, '0'));
        
        const currentTime = `${h}:${m}`;
        
        if (currentTime !== lastTime) {
            // Плавное обновление времени
            timeEl.style.opacity = '0';
            setTimeout(() => {
                timeEl.textContent = currentTime;
                timeEl.style.opacity = '1';
            }, 200);
            lastTime = currentTime;
        }
    }

    updateDateTime();
    setInterval(updateDateTime, 60000); // Обновление каждую минуту
}

/**
 * Инициализация переключателя темы
 */
function initThemeToggle(toggle) {
    // Загружаем сохраненную тему
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    currentTheme = savedTheme || THEMES.DARK; // По умолчанию темная тема
    
    // Применяем тему
    applyTheme(currentTheme);
    
    // Устанавливаем состояние переключателя
    toggle.checked = currentTheme === THEMES.LIGHT;
    
    // Обработчик изменения с debug log
    toggle.addEventListener('change', () => {
        console.log('Theme toggle changed'); // Debug для проверки
        if (isAnimating) return;
        
        const newTheme = toggle.checked ? THEMES.LIGHT : THEMES.DARK;
        switchTheme(newTheme);
    });
}

/**
 * Отслеживание системных настроек темы
 */
function initSystemThemeListener() {
    const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    function handleSystemThemeChange(e) {
        // Меняем тему только если пользователь не выбрал её сам
        if (!localStorage.getItem(STORAGE_KEY)) {
            switchTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
        }
    }

    systemThemeQuery.addListener(handleSystemThemeChange);
    handleSystemThemeChange(systemThemeQuery); // Initial check
}

/**
 * Переключение темы с анимацией
 */
function switchTheme(newTheme) {
    if (currentTheme === newTheme || isAnimating) return;
    
    isAnimating = true;
    console.log(`Switching to ${newTheme}`); // Debug

    // Создаем элемент для анимации перехода
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: ${THEME_VARIABLES[newTheme]['--bg']};
        opacity: 0;
        transition: opacity ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        z-index: 9999;
    `;

    document.body.appendChild(overlay);

    // Запускаем анимацию
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';

        setTimeout(() => {
            applyTheme(newTheme);
            
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                isAnimating = false;
                console.log(`Theme switched to ${newTheme}`); // Debug
            }, TRANSITION_DURATION);
        }, TRANSITION_DURATION);
    });
}

/**
 * Применение темы
 */
function applyTheme(theme) {
    // Устанавливаем атрибут темы
    document.documentElement.setAttribute('data-theme', theme);
    
    // Применяем CSS переменные
    Object.entries(THEME_VARIABLES[theme]).forEach(([variable, value]) => {
        document.documentElement.style.setProperty(variable, value);
    });
    
    // Сохраняем выбор пользователя
    localStorage.setItem(STORAGE_KEY, theme);
    currentTheme = theme;

    // Обновляем мета-тег theme-color для мобильных браузеров
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.content = THEME_VARIABLES[theme]['--bg'];
    }

    // Отправляем событие изменения темы
    window.dispatchEvent(new CustomEvent('themechange', { 
        detail: { theme } 
    }));
    console.log('Theme applied and event dispatched'); // Debug
}

// Экспорт публичных функций
export {
    initHeader,
    getCurrentTheme: () => currentTheme,
    setTheme: (theme) => {
        if (theme in THEMES) {
            switchTheme(theme);
        }
    },
    isDarkTheme: () => currentTheme === THEMES.DARK
};
