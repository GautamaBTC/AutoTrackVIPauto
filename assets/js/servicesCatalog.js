/*────────────────────────────────────────────
  assets/js/servicesCatalog.js | УЛУЧШЕННАЯ ВЕРСИЯ
─────────────────────────────────────────────*/

const STORAGE_KEYS = {
    CUSTOM_SERVICES: 'vipauto_custom_services',
    FAVORITE_SERVICES: 'vipauto_favorite_services',
    RECENT_SERVICES: 'vipauto_recent_services'
};

let _catalog = null;
let _favorites = new Set();
let _recent = [];

// Загрузка каталога
export async function loadServicesCatalog() {
    if (_catalog) return _catalog;

    try {
        // Загружаем базовый каталог
        const response = await fetch('assets/data/services.json');
        if (!response.ok) throw new Error('Ошибка загрузки каталога');
        _catalog = await response.json();

        // Загружаем пользовательские услуги
        const customServices = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_SERVICES) || '{}');
        for (const [category, services] of Object.entries(customServices)) {
            if (!_catalog[category]) _catalog[category] = [];
            services.forEach(service => {
                if (!_catalog[category].includes(service)) {
                    _catalog[category].push(service);
                }
            });
        }

        // Загружаем избранное
        _favorites = new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITE_SERVICES) || '[]'));
        
        // Загружаем историю
        _recent = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_SERVICES) || '[]');

        return _catalog;
    } catch (error) {
        console.error('Ошибка инициализации каталога:', error);
        return {};
    }
}

// Получение каталога
export function getServicesCatalog() {
    return _catalog;
}

// Добавление пользовательской услуги
export function addCustomService(category, serviceName) {
    if (!category || !serviceName) return false;

    try {
        const customServices = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_SERVICES) || '{}');
        
        if (!customServices[category]) customServices[category] = [];
        if (!customServices[category].includes(serviceName)) {
            customServices[category].push(serviceName);
            localStorage.setItem(STORAGE_KEYS.CUSTOM_SERVICES, JSON.stringify(customServices));

            // Обновляем локальный каталог
            if (_catalog) {
                if (!_catalog[category]) _catalog[category] = [];
                _catalog[category].push(serviceName);
            }
            return true;
        }
    } catch (error) {
        console.error('Ошибка добавления услуги:', error);
    }
    return false;
}

// Управление избранным
export function toggleFavorite(service) {
    try {
        if (_favorites.has(service)) {
            _favorites.delete(service);
        } else {
            _favorites.add(service);
        }
        localStorage.setItem(STORAGE_KEYS.FAVORITE_SERVICES, JSON.stringify([..._favorites]));
        return true;
    } catch (error) {
        console.error('Ошибка управления избранным:', error);
        return false;
    }
}

export function isFavorite(service) {
    return _favorites.has(service);
}

export function getFavorites() {
    return [..._favorites];
}

// Управление историей
export function addToRecent(service) {
    try {
        // Удаляем дубликат, если есть
        _recent = _recent.filter(s => s !== service);
        
        // Добавляем в начало
        _recent.unshift(service);
        
        // Ограничиваем размер истории
        if (_recent.length > 20) _recent.pop();
        
        localStorage.setItem(STORAGE_KEYS.RECENT_SERVICES, JSON.stringify(_recent));
        return true;
    } catch (error) {
        console.error('Ошибка добавления в историю:', error);
        return false;
    }
}

export function getRecent() {
    return _recent;
}

// Поиск услуг
export function searchServices(query) {
    if (!query || !_catalog) return [];

    const results = [];
    const searchTerm = query.toLowerCase();

    for (const [category, services] of Object.entries(_catalog)) {
        for (const service of services) {
            if (service.toLowerCase().includes(searchTerm)) {
                results.push({
                    category,
                    service,
                    isFavorite: _favorites.has(service),
                    isRecent: _recent.includes(service)
                });
            }
        }
    }

    // Сортируем результаты
    return results.sort((a, b) => {
        // Сначала избранные
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        
        // Затем недавние
        if (a.isRecent && !b.isRecent) return -1;
        if (!a.isRecent && b.isRecent) return 1;
        
        // Затем по алфавиту
        return a.service.localeCompare(b.service);
    });
}

// Получение популярных услуг
export function getPopularServices() {
    // В будущем здесь может быть анализ частоты использования
    return [..._favorites].slice(0, 10);
}

// Группировка услуг
export function getServicesByCategory() {
    if (!_catalog) return {};

    const result = {};
    for (const [category, services] of Object.entries(_catalog)) {
        result[category] = services.map(service => ({
            name: service,
            isFavorite: _favorites.has(service),
            isRecent: _recent.includes(service)
        }));
    }
    return result;
}

// Экспорт дополнительных утилит
export const ServiceUtils = {
    // Проверка существования услуги
    exists: (service) => {
        if (!_catalog) return false;
        return Object.values(_catalog).some(services => services.includes(service));
    },

    // Получение категории услуги
    getCategory: (service) => {
        if (!_catalog) return null;
        for (const [category, services] of Object.entries(_catalog)) {
            if (services.includes(service)) return category;
        }
        return null;
    },

    // Валидация названия услуги
    validateServiceName: (name) => {
        return name.length >= 3 && name.length <= 100;
    }
};
