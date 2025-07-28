/*────────────────────────────────────────────
  assets/js/utils.js | УЛУЧШЕННАЯ ВЕРСИЯ
─────────────────────────────────────────────*/

// Форматирование дат
export function formatDateInput(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().slice(0, 10);
}

export function formatDateDisplay(dateValue) {
    const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

export function formatDateWithTime(dateValue) {
    const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return d.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - (date instanceof Date ? date : new Date(date));
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
        return `${minutes} ${declension(minutes, ['минуту', 'минуты', 'минут'])} назад`;
    } else if (hours < 24) {
        return `${hours} ${declension(hours, ['час', 'часа', 'часов'])} назад`;
    } else if (days < 7) {
        return `${days} ${declension(days, ['день', 'дня', 'дней'])} назад`;
    } else {
        return formatDateDisplay(date);
    }
}

// Форматирование чисел
export function formatMoney(amount, currency = '₽') {
    return new Intl.NumberFormat('ru-RU', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount) + ' ' + currency;
}

export function formatNumber(num, decimals = 0) {
    return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
}

export function formatPercent(value) {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
}

// Склонение числительных
export function declension(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[
        (number % 100 > 4 && number % 100 < 20) ? 
        2 : 
        cases[(number % 10 < 5) ? number % 10 : 5]
    ];
}

// Работа с DOM
export function debounce(fn, ms = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), ms);
    };
}

export function throttle(fn, ms = 300) {
    let isThrottled = false;
    let savedArgs;
    let savedThis;

    function wrapper() {
        if (isThrottled) {
            savedArgs = arguments;
            savedThis = this;
            return;
        }

        fn.apply(this, arguments);
        isThrottled = true;

        setTimeout(() => {
            isThrottled = false;
            if (savedArgs) {
                wrapper.apply(savedThis, savedArgs);
                savedArgs = savedThis = null;
            }
        }, ms);
    }

    return wrapper;
}

// Анимации
export function animate({
    timing = t => t,
    draw,
    duration = 300
}) {
    const start = performance.now();

    requestAnimationFrame(function animate(time) {
        let timeFraction = (time - start) / duration;
        if (timeFraction > 1) timeFraction = 1;

        const progress = timing(timeFraction);
        draw(progress);

        if (timeFraction < 1) {
            requestAnimationFrame(animate);
        }
    });
}

// Работа с данными
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Object) {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, deepClone(value)])
        );
    }
}

export function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
    if (obj1 === null || obj2 === null) return false;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => 
        keys2.includes(key) && deepEqual(obj1[key], obj2[key])
    );
}

// Валидация
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function validatePhone(phone) {
    const re = /^\+?[1-9]\d{10}$/;
    return re.test(phone);
}

// Генерация ID
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Работа с цветами
export function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => 
        ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount))
        .toString(16)).substr(-2));
}

// Работа с URL
export function getQueryParams() {
    return Object.fromEntries(
        new URLSearchParams(window.location.search).entries()
    );
}

export function buildUrl(base, params) {
    const url = new URL(base, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, value);
        }
    });
    return url.toString();
}

// Экспорт всех утилит
export {
    formatDateInput,
    formatDateDisplay,
    formatDateWithTime,
    formatRelativeTime,
    formatMoney,
    formatNumber,
    formatPercent,
    declension,
    debounce,
    throttle,
    animate,
    deepClone,
    deepEqual,
    validateEmail,
    validatePhone,
    generateId,
    adjustColor,
    getQueryParams,
    buildUrl
};
