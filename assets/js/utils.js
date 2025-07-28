/*────────────────────────────────────────────
  assets/js/utils.js | РАСШИРЕННАЯ ВЕРСИЯ
─────────────────────────────────────────────*/

// 1. РАБОТА С ДАТАМИ
/**
 * Форматирует дату для input type="date" (YYYY-MM-DD)
 */
export function formatDateInput(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().slice(0, 10);
}

/**
 * Форматирует дату для отображения (например, "12 июля 2025")
 */
export function formatDateDisplay(dateValue) {
    const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Форматирует дату с днем недели (например, "Понедельник, 12 июля")
 */
export function formatDateWithWeekday(dateValue) {
    const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return d.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
}

/**
 * Проверяет, является ли дата сегодняшней
 */
export function isToday(dateValue) {
    const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
    const today = new Date();
    return d.toDateString() === today.toDateString();
}

/**
 * Получает массив дат между начальной и конечной
 */
export function getDateRange(startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    const lastDate = new Date(endDate);

    while (currentDate <= lastDate) {
        dates.push(formatDateInput(new Date(currentDate)));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

// 2. ФОРМАТИРОВАНИЕ ЧИСЕЛ
/**
 * Форматирует число как денежную сумму
 */
export function formatMoney(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Форматирует число с разделителями разрядов
 */
export function formatNumber(num) {
    return new Intl.NumberFormat('ru-RU').format(num);
}

/**
 * Форматирует процент
 */
export function formatPercent(value) {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

// 3. УТИЛИТЫ ДЛЯ РАБОТЫ С DOM
/**
 * Функция debounce для отложенного выполнения
 */
export function debounce(fn, ms = 300) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), ms);
    };
}

/**
 * Функция throttle для ограничения частоты вызовов
 */
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

// 4. ВАЛИДАЦИЯ
/**
 * Проверяет корректность суммы
 */
export function isValidAmount(value) {
    return !isNaN(value) && value >= 0 && value <= 1000000;
}

/**
 * Проверяет корректность названия автомобиля
 */
export function isValidCarName(value) {
    return value.length >= 3 && value.length <= 50;
}

// 5. РАБОТА С ЛОКАЛЬНЫМ ХРАНИЛИЩЕМ
/**
 * Безопасное сохранение в localStorage
 */
export function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Ошибка сохранения в localStorage:', error);
        return false;
    }
}

/**
 * Безопасное чтение из localStorage
 */
export function safeGetItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Ошибка чтения из localStorage:', error);
        return defaultValue;
    }
}

// 6. ГЕНЕРАЦИЯ ID
/**
 * Генерирует уникальный ID
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 7. РАБОТА С ЦВЕТАМИ
/**
 * Осветляет/затемняет цвет
 */
export function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => 
        ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount))
        .toString(16)).substr(-2));
}

// 8. УТИЛИТЫ ДЛЯ РАБОТЫ С МАССИВАМИ
/**
 * Группирует массив по ключу
 */
export function groupBy(array, key) {
    return array.reduce((result, item) => {
        (result[item[key]] = result[item[key]] || []).push(item);
        return result;
    }, {});
}

/**
 * Вычисляет статистику по массиву чисел
 */
export function getStats(numbers) {
    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);
    const median = numbers.length % 2 === 0
        ? (sorted[numbers.length / 2 - 1] + sorted[numbers.length / 2]) / 2
        : sorted[Math.floor(numbers.length / 2)];

    return {
        sum,
        avg,
        median,
        min: Math.min(...numbers),
        max: Math.max(...numbers)
    };
}

// 9. УТИЛИТЫ ДЛЯ РАБОТЫ С ОБЪЕКТАМИ
/**
 * Глубокое клонирование объекта
 */
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

/**
 * Сравнение объектов
 */
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
