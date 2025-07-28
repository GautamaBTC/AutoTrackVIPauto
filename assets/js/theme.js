/*────────────────────────────────────────────
  assets/js/theme.js | УЛУЧШЕННАЯ ВЕРСИЯ
─────────────────────────────────────────────*/

const STORAGE_KEY = 'vipautologin_theme';

// Константы для тем
const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};

// Настройки анимации
const ANIMATION = {
    DURATION: 300, // миллисекунды
    TIMING: 'cubic-bezier(0.4, 0, 0.2, 1)'
};

// Состояние темы
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

    // Проверяем системные настройки
    initSystemThemeListener();
}

/**
 * Инициализация отображения времени и даты
 */
function initDateTime(dateEl, timeEl) {
    function updateDateTime() {
        const now = new Date();
        
        // Форматирование даты
        dateEl.textContent = now.toLocaleDateString('ru-RU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });

        // Форматирование времени
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        // Анимированное обновление времени
        if (timeEl.textContent !== `${hours}:${minutes}:${seconds}`) {
            timeEl.style.opacity = '0';
            setTimeout(() => {
                timeEl.textContent = `${hours}:${minutes}:${seconds}`;
                timeEl.style.opacity = '1';
            }, 200);
        }
    }

    // Первоначальное обновление
    updateDateTime();
    
    // Обновление каждую секунду
    setInterval(updateDateTime, 1000);
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
    
    // Обработчик изменения
    toggle.addEventListener('change', () => {
        if (isAnimating) return;
        
        const newTheme = toggle.checked ? THEMES.LIGHT : THEMES.DARK;
        switchTheme(newTheme);
    });
}

/**
 * Следим за системными настройками темы
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
}

/**
 * Переключение темы с анимацией
 */
function switchTheme(newTheme) {
    if (currentTheme === newTheme || isAnimating) return;
    
    isAnimating = true;

    // Создаем элемент для анимации перехода
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: ${newTheme === THEMES.DARK ? '#141414' : '#F0F2F5'};
        opacity: 0;
        transition: opacity ${ANIMATION.DURATION}ms ${ANIMATION.TIMING};
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
            }, ANIMATION.DURATION);
        }, ANIMATION.DURATION);
    });
}

/**
 * Применение темы
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    currentTheme = theme;

    // Обновляем мета-тег theme-color для мобильных браузеров
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.content = theme === THEMES.DARK ? '#141414' : '#F0F2F5';
    }

    // Отправляем событие изменения темы
    window.dispatchEvent(new CustomEvent('themechange', { 
        detail: { theme } 
    }));
}

/**
 * Получение текущей темы
 */
export function getCurrentTheme() {
    return currentTheme;
}

/**
 * Программное переключение темы
 */
export function setTheme(theme) {
    if (theme in THEMES) {
        switchTheme(theme);
    }
}

/**
 * Проверка, является ли тема темной
 */
export function isDarkTheme() {
    return currentTheme === THEMES.DARK;
}

/**
 * Добавление слушателя изменения темы
 */
export function onThemeChange(callback) {
    window.addEventListener('themechange', (e) => callback(e.detail.theme));
}
