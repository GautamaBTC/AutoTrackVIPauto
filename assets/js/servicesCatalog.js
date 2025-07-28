/*────────────────────────────────────────────
  assets/js/servicesCatalog.js | УЛУЧШЕННАЯ ВЕРСИЯ
─────────────────────────────────────────────*/

// Константы для хранилища
const STORAGE_KEYS = {
    CUSTOM_SERVICES: 'vipauto_custom_services',
    FAVORITE_SERVICES: 'vipauto_favorite_services',
    RECENT_SERVICES: 'vipauto_recent_services',
    SERVICE_TEMPLATES: 'vipauto_service_templates'
};

// Кэш данных
let _catalog = null;
let _favorites = new Set();
let _recent = [];
let _templates = new Map();

// Базовая структура каталога услуг
const DEFAULT_CATEGORIES = {
    "Диагностика": {
        icon: "fa-search",
        color: "#4CAF50"
    },
    "Электрика": {
        icon: "fa-bolt",
        color: "#FFC107"
    },
    "Механика": {
        icon: "fa-wrench",
        color: "#2196F3"
    },
    "Кузовные работы": {
        icon: "fa-car",
        color: "#9C27B0"
    },
    "Дополнительное оборудование": {
        icon: "fa-plus-circle",
        color: "#FF5722"
    }
};

/**
 * Загрузка каталога услуг
 */
export async function loadServicesCatalog() {
    if (_catalog) return _catalog;

    try {
        // Загружаем базовый каталог
        const response = await fetch('assets/data/services.json');
        if (!response.ok) throw new Error('Ошибка загрузки каталога');
        _catalog = await response.json();

        // Загружаем пользовательские данные
        loadUserData();

        // Добавляем метаданные категорий
        enrichCatalogData();

        return _catalog;
    } catch (error) {
        console.error('Ошибка инициализации каталога:', error);
        showErrorNotification('Не удалось загрузить каталог услуг');
        return {};
    }
}

/**
 * Загрузка пользовательских данных
 */
function loadUserData() {
    // Загружаем избранное
    const savedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITE_SERVICES);
    if (savedFavorites) {
        _favorites = new Set(JSON.parse(savedFavorites));
    }

    // Загружаем историю
    const savedRecent = localStorage.getItem(STORAGE_KEYS.RECENT_SERVICES);
    if (savedRecent) {
        _recent = JSON.parse(savedRecent);
    }

    // Загружаем шаблоны
    const savedTemplates = localStorage.getItem(STORAGE_KEYS.SERVICE_TEMPLATES);
    if (savedTemplates) {
        _templates = new Map(JSON.parse(savedTemplates));
    }

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
}

/**
 * Обогащение каталога метаданными
 */
function enrichCatalogData() {
    for (const [category, services] of Object.entries(_catalog)) {
        const metadata = DEFAULT_CATEGORIES[category] || {
            icon: "fa-tools",
            color: "#757575"
        };

        _catalog[category] = {
            services: services,
            icon: metadata.icon,
            color: metadata.color
        };
    }
}

/**
 * Поиск услуг с умным ранжированием результатов
 */
export function searchServices(query) {
    if (!query || !_catalog) return [];

    const results = [];
    const searchTerm = query.toLowerCase();
    const words = searchTerm.split(/\s+/);

    for (const [category, data] of Object.entries(_catalog)) {
        for (const service of data.services) {
            const searchableText = service.toLowerCase();
            
            // Вычисляем релевантность
            let relevance = 0;
            
            // Точное совпадение
            if (searchableText === searchTerm) {
                relevance += 100;
            }

            // Совпадение в начале
            if (searchableText.startsWith(searchTerm)) {
                relevance += 50;
            }

            // Совпадение всех слов
            const allWordsMatch = words.every(word => searchableText.includes(word));
            if (allWordsMatch) {
                relevance += 30;
            }

            // Частичные совпадения
            words.forEach(word => {
                if (searchableText.includes(word)) {
                    relevance += 10;
                }
            });

            // Добавляем бонусы
            if (_favorites.has(service)) relevance += 25;
            if (_recent.includes(service)) relevance += 15;

            if (relevance > 0) {
                results.push({
                    category,
                    service,
                    relevance,
                    isFavorite: _favorites.has(service),
                    isRecent: _recent.includes(service),
                    metadata: {
                        icon: data.icon,
                        color: data.color
                    }
                });
            }
        }
    }

    // Сортируем по релевантности
    return results.sort((a, b) => b.relevance - a.relevance);
}

/*────────────────────────────────────────────
  assets/js/servicesCatalog.js | ЧАСТЬ 2: ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ
─────────────────────────────────────────────*/

/**
 * Управление избранными услугами
 */
export function toggleFavorite(service) {
    try {
        if (_favorites.has(service)) {
            _favorites.delete(service);
        } else {
            _favorites.add(service);
            // Добавляем в историю при добавлении в избранное
            addToRecent(service);
        }
        
        localStorage.setItem(
            STORAGE_KEYS.FAVORITE_SERVICES, 
            JSON.stringify([..._favorites])
        );
        
        return true;
    } catch (error) {
        console.error('Ошибка при работе с избранным:', error);
        return false;
    }
}

export function getFavorites() {
    return [..._favorites].map(service => {
        const category = findServiceCategory(service);
        return {
            service,
            category,
            metadata: _catalog[category]
        };
    });
}

/**
 * Управление историей услуг
 */
export function addToRecent(service) {
    try {
        // Удаляем дубликат, если есть
        _recent = _recent.filter(s => s !== service);
        
        // Добавляем в начало
        _recent.unshift(service);
        
        // Ограничиваем размер истории
        if (_recent.length > 20) _recent.pop();
        
        localStorage.setItem(
            STORAGE_KEYS.RECENT_SERVICES, 
            JSON.stringify(_recent)
        );
        
        return true;
    } catch (error) {
        console.error('Ошибка при работе с историей:', error);
        return false;
    }
}

export function getRecent() {
    return _recent.map(service => {
        const category = findServiceCategory(service);
        return {
            service,
            category,
            metadata: _catalog[category],
            isFavorite: _favorites.has(service)
        };
    });
}

/**
 * Управление шаблонами услуг
 */
export function saveTemplate(name, services) {
    try {
        if (!name || !services.length) return false;
        
        _templates.set(name, {
            services,
            timestamp: Date.now()
        });
        
        localStorage.setItem(
            STORAGE_KEYS.SERVICE_TEMPLATES,
            JSON.stringify([..._templates])
        );
        
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении шаблона:', error);
        return false;
    }
}

export function getTemplates() {
    return [..._templates].map(([name, data]) => ({
        name,
        services: data.services,
        timestamp: data.timestamp
    }));
}

export function deleteTemplate(name) {
    try {
        const result = _templates.delete(name);
        if (result) {
            localStorage.setItem(
                STORAGE_KEYS.SERVICE_TEMPLATES,
                JSON.stringify([..._templates])
            );
        }
        return result;
    } catch (error) {
        console.error('Ошибка при удалении шаблона:', error);
        return false;
    }
}

/**
 * Статистика и аналитика услуг
 */
export function getServicesStats() {
    const stats = {
        totalServices: 0,
        byCategory: {},
        popular: new Map(),
        recentlyAdded: []
    };

    // Собираем статистику
    for (const [category, data] of Object.entries(_catalog)) {
        const services = data.services;
        stats.totalServices += services.length;
        stats.byCategory[category] = services.length;

        // Добавляем в недавно добавленные, если есть метка времени
        services.forEach(service => {
            if (service.addedAt) {
                stats.recentlyAdded.push({
                    service: service.name,
                    category,
                    addedAt: service.addedAt
                });
            }
        });
    }

    // Сортируем недавно добавленные
    stats.recentlyAdded.sort((a, b) => b.addedAt - a.addedAt);

    // Популярные услуги из истории
    _recent.forEach(service => {
        stats.popular.set(
            service,
            (stats.popular.get(service) || 0) + 1
        );
    });

    return stats;
}

/**
 * Вспомогательные функции
 */
function findServiceCategory(serviceName) {
    for (const [category, data] of Object.entries(_catalog)) {
        if (data.services.includes(serviceName)) {
            return category;
        }
    }
    return null;
}

function showErrorNotification(message) {
    // Интеграция с системой уведомлений
    if (window.showNotification) {
        window.showNotification(message, 'error');
    } else {
        console.error(message);
    }
}

/**
 * Экспорт/Импорт данных
 */
export function exportCatalogData() {
    return {
        favorites: [..._favorites],
        recent: _recent,
        templates: [..._templates],
        customServices: JSON.parse(
            localStorage.getItem(STORAGE_KEYS.CUSTOM_SERVICES) || '{}'
        ),
        timestamp: Date.now()
    };
}

export function importCatalogData(data) {
    try {
        if (data.favorites) {
            _favorites = new Set(data.favorites);
            localStorage.setItem(
                STORAGE_KEYS.FAVORITE_SERVICES,
                JSON.stringify([..._favorites])
            );
        }

        if (data.recent) {
            _recent = data.recent;
            localStorage.setItem(
                STORAGE_KEYS.RECENT_SERVICES,
                JSON.stringify(_recent)
            );
        }

        if (data.templates) {
            _templates = new Map(data.templates);
            localStorage.setItem(
                STORAGE_KEYS.SERVICE_TEMPLATES,
                JSON.stringify([..._templates])
            );
        }

        if (data.customServices) {
            localStorage.setItem(
                STORAGE_KEYS.CUSTOM_SERVICES,
                JSON.stringify(data.customServices)
            );
            // Перезагружаем каталог
            loadServicesCatalog();
        }

        return true;
    } catch (error) {
        console.error('Ошибка при импорте данных:', error);
        return false;
    }
}

// Экспортируем основные функции
export {
    toggleFavorite,
    addToRecent,
    saveTemplate,
    getServicesStats,
    exportCatalogData,
    importCatalogData
};
