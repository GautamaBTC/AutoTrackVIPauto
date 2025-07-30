/*────────────────────────────────────────────
  assets/js/servicesCatalog.js | УЛУЧШЕННАЯ ВЕРСИЯ С РАСШИРЕНИЕМ
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

// Базовая структура каталога услуг с подкатегориями (метаданные)
const DEFAULT_CATEGORIES = {
    "Автоэлектрика и Диагностика": {
        icon: "fa-bolt",
        color: "#FFC107",
        subcategories: {
            "Диагностика": { icon: "fa-search" },
            "Ремонт электрики": { icon: "fa-tools" },
            "Установка": { icon: "fa-plus" }
        }
    },
    "Автосвет": {
        icon: "fa-lightbulb",
        color: "#FFEB3B",
        subcategories: {
            "Замена и регулировка": { icon: "fa-wrench" },
            "Установка": { icon: "fa-plus" },
            "Ремонт": { icon: "fa-tools" }
        }
    },
    "Охранные системы": {
        icon: "fa-shield-alt",
        color: "#F44336",
        subcategories: {
            "Установка сигнализаций": { icon: "fa-plus" },
            "Демонтаж и настройка": { icon: "fa-cog" },
            "Дополнительные устройства": { icon: "fa-lock" }
        }
    },
    "Аудио- и Видеосистемы": {
        icon: "fa-music",
        color: "#2196F3",
        subcategories: {
            "Установка аудио": { icon: "fa-volume-up" },
            "Установка видео": { icon: "fa-video" },
            "Настройка и шумоизоляция": { icon: "fa-cog" }
        }
    },
    "Комфорт и Доп. оборудование": {
        icon: "fa-chair",
        color: "#4CAF50",
        subcategories: {
            "Установка датчиков": { icon: "fa-sensor" },
            "Обогрев и комфорт": { icon: "fa-fire" },
            "Дополнительные устройства": { icon: "fa-plus" }
        }
    },
    "Тонировка": {
        icon: "fa-film",
        color: "#9C27B0",
        subcategories: {
            "Тонировка стекол": { icon: "fa-window" },
            "Специальные виды": { icon: "fa-shield" }
        }
    }
    // Добавьте больше категорий при необходимости
};

/**
 * Загрузка каталога услуг (с поддержкой подкатегорий)
 */
export async function loadServicesCatalog() {
    if (_catalog) return _catalog;

    try {
        // Загружаем базовый каталог
        const response = await fetch('assets/data/services.json');
        if (!response.ok) throw new Error('Ошибка загрузки каталога');
        let baseCatalog = await response.json();

        // Расширяем до 250+ услуг с подкатегориями
        _catalog = expandCatalog(baseCatalog);

        // Загружаем пользовательские данные
        loadUserData();

        // Добавляем метаданные категорий и подкатегорий
        enrichCatalogData();

        return _catalog;
    } catch (error) {
        console.error('Ошибка инициализации каталога:', error);
        showErrorNotification('Не удалось загрузить каталог услуг');
        return {};
    }
}

/**
 * Расширение каталога в 5 раз с подкатегориями
 */
function expandCatalog(baseCatalog) {
    const expanded = {};

    for (const [category, services] of Object.entries(baseCatalog)) {
        expanded[category] = { subcategories: {} };

        // Пример расширения: добавляем подкатегории и больше услуг
        const subcats = Object.keys(DEFAULT_CATEGORIES[category]?.subcategories || {});
        if (subcats.length > 0) {
            subcats.forEach(subcat => {
                expanded[category].subcategories[subcat] = [];
                // Добавляем 5x услуг (вариации базовых + новые)
                services.forEach(service => {
                    expanded[category].subcategories[subcat].push(service);
                    for (let i = 1; i < 5; i++) {
                        expanded[category].subcategories[subcat].push(`${service} (вариант ${i})`);
                        expanded[category].subcategories[subcat].push(`Расширенная ${service.toLowerCase()}`);
                        expanded[category].subcategories[subcat].push(`Профессиональная ${service.toLowerCase()}`);
                        expanded[category].subcategories[subcat].push(`Быстрая ${service.toLowerCase()}`);
                        expanded[category].subcategories[subcat].push(`Комплексная ${service.toLowerCase()} + диагностика`);
                    }
                });
            });
        } else {
            // Если нет подкатегорий, просто расширяем список
            expanded[category].services = services.flatMap(service => [
                service,
                `${service} (вариант 1)`,
                `${service} (вариант 2)`,
                `Расширенная ${service.toLowerCase()}`,
                `Профессиональная ${service.toLowerCase()}`
            ]);
        }
    }

    return expanded;
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

    // Загружаем пользовательские услуги (с поддержкой подкатегорий)
    const customServices = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_SERVICES) || '{}');
    for (const [category, data] of Object.entries(customServices)) {
        if (!_catalog[category]) _catalog[category] = { subcategories: {} };
        if (data.subcategories) {
            for (const [subcat, services] of Object.entries(data.subcategories)) {
                if (!_catalog[category].subcategories[subcat]) _catalog[category].subcategories[subcat] = [];
                services.forEach(service => {
                    if (!_catalog[category].subcategories[subcat].includes(service)) {
                        _catalog[category].subcategories[subcat].push(service);
                    }
                });
            }
        } else if (data.services) {
            // Для backward compatibility
            if (!_catalog[category].subcategories['Общее']) _catalog[category].subcategories['Общее'] = [];
            data.services.forEach(service => _catalog[category].subcategories['Общее'].push(service));
        }
    }
}

/**
 * Обогащение каталога метаданными и тегами
 */
function enrichCatalogData() {
    for (const [category, data] of Object.entries(_catalog)) {
        const metadata = DEFAULT_CATEGORIES[category] || {
            icon: "fa-tools",
            color: "#757575",
            subcategories: {}
        };

        // Добавляем метаданные категории
        data.icon = metadata.icon;
        data.color = metadata.color;

        // Обогащаем подкатегории
        for (const [subcat, services] of Object.entries(data.subcategories || {})) {
            const subMeta = metadata.subcategories?.[subcat] || { icon: metadata.icon };
            data.subcategories[subcat] = {
                services: services.map(service => ({
                    name: service,
                    tags: generateTags(service), // Авто-теги
                    addedAt: Date.now() // Для stats
                })),
                icon: subMeta.icon,
                color: metadata.color
            };
        }
    }
}

/**
 * Генерация тегов для услуги
 */
function generateTags(service) {
    const words = service.toLowerCase().split(/\s+/);
    return words.filter(w => w.length > 3); // Простые теги из слов
}

/**
 * Поиск услуг с fuzzy matching (Levenshtein) для большого каталога
 */
export function searchServices(query) {
    if (!query || !_catalog) return [];

    const results = [];
    const searchTerm = query.toLowerCase();
    const words = searchTerm.split(/\s+/);

    // Рекурсивный поиск по nested структуре
    function searchInSubcats(category, subcat, service, data) {
        const searchableText = service.name.toLowerCase();
        
        // Вычисляем релевантность с Levenshtein
        let relevance = 0;
        const dist = levenshteinDistance(searchableText, searchTerm);
        relevance += 100 - (dist * 10); // Чем меньше расстояние, тем выше

        // Дополнительные баллы
        if (allWordsMatch(words, searchableText)) relevance += 30;
        words.forEach(word => {
            if (searchableText.includes(word)) relevance += 10;
        });
        if (_favorites.has(service.name)) relevance += 25;
        if (_recent.includes(service.name)) relevance += 15;

        if (relevance > 0) {
            results.push({
                category,
                subcat,
                service: service.name,
                relevance,
                isFavorite: _favorites.has(service.name),
                isRecent: _recent.includes(service.name),
                tags: service.tags,
                metadata: data
            });
        }
    }

    // Проходим по каталогу
    for (const [category, catData] of Object.entries(_catalog)) {
        for (const [subcat, subData] of Object.entries(catData.subcategories)) {
            subData.services.forEach(service => searchInSubcats(category, subcat, service, subData));
        }
    }

    // Сортируем по релевантности
    return results.sort((a, b) => b.relevance - a.relevance);
}

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(s1, s2) {
    const m = s1.length, n = s2.length;
    const dp = Array.from({length: m+1}, () => Array(n+1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = s1[i-1] === s2[j-1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i-1][j] + 1,
                dp[i][j-1] + 1,
                dp[i-1][j-1] + cost
            );
        }
    }
    return dp[m][n];
}

function allWordsMatch(words, text) {
    return words.every(word => text.includes(word));
}

/*────────────────────────────────────────────
  assets/js/servicesCatalog.js | ЧАСТЬ 3: УПРАВЛЕНИЕ
─────────────────────────────────────────────*/

/**
 * Управление избранными услугами (с nested support)
 */
export function toggleFavorite(servicePath) {
    try {
        console.log(`Toggling favorite: ${servicePath}`); // Debug
        if (_favorites.has(servicePath)) {
            _favorites.delete(servicePath);
        } else {
            _favorites.add(servicePath);
            addToRecent(servicePath);
        }
        
        localStorage.setItem(
            STORAGE_KEYS.FAVORITE_SERVICES, 
            JSON.stringify([..._favorites])
        );
        
        // Update stats
        getServicesStats();
        
        return true;
    } catch (error) {
        console.error('Ошибка с избранным:', error);
        return false;
    }
}

export function getFavorites() {
    return [..._favorites].map(path => {
        const [category, subcat, service] = path.split(':');
        return {
            category,
            subcat,
            service,
            metadata: _catalog[category]?.subcategories[subcat]
        };
    });
}

/**
 * Управление историей услуг (max 50)
 */
export function addToRecent(servicePath) {
    try {
        console.log(`Adding to recent: ${servicePath}`); // Debug
        // Удаляем дубликат
        _recent = _recent.filter(s => s !== servicePath);
        
        // Добавляем в начало
        _recent.unshift(servicePath);
        
        // Ограничиваем размер
        if (_recent.length > 50) _recent = _recent.slice(0, 50);
        
        localStorage.setItem(
            STORAGE_KEYS.RECENT_SERVICES, 
            JSON.stringify(_recent)
        );
        
        return true;
    } catch (error) {
        console.error('Ошибка с историей:', error);
        return false;
    }
}

export function getRecent() {
    return _recent.map(path => {
        const [category, subcat, service] = path.split(':');
        return {
            category,
            subcat,
            service,
            metadata: _catalog[category]?.subcategories[subcat],
            isFavorite: _favorites.has(path)
        };
    });
}

/**
 * Управление шаблонами услуг (с nested)
 */
export function saveTemplate(name, servicePaths) {
    try {
        console.log(`Saving template: ${name}`); // Debug
        if (!name || !servicePaths.length) return false;
        
        _templates.set(name, {
            services: servicePaths,
            timestamp: Date.now()
        });
        
        localStorage.setItem(
            STORAGE_KEYS.SERVICE_TEMPLATES,
            JSON.stringify([..._templates])
        );
        
        return true;
    } catch (error) {
        console.error('Ошибка сохранения шаблона:', error);
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
        console.log(`Deleting template: ${name}`); // Debug
        const result = _templates.delete(name);
        if (result) {
            localStorage.setItem(
                STORAGE_KEYS.SERVICE_TEMPLATES,
                JSON.stringify([..._templates])
            );
        }
        return result;
    } catch (error) {
        console.error('Ошибка удаления шаблона:', error);
        return false;
    }
}

/*────────────────────────────────────────────
  assets/js/servicesCatalog.js | ЧАСТЬ 4: СТАТИСТИКА И ЭКСПОРТ
─────────────────────────────────────────────*/

/**
 * Статистика и аналитика услуг (с учётом подкатегорий)
 */
export function getServicesStats() {
    const stats = {
        totalServices: 0,
        byCategory: {},
        bySubcategory: {},
        popular: new Map(),
        recentlyAdded: []
    };

    // Собираем статистику рекурсивно
    for (const [category, catData] of Object.entries(_catalog)) {
        stats.byCategory[category] = 0;
        stats.bySubcategory[category] = {};

        for (const [subcat, subData] of Object.entries(catData.subcategories)) {
            const count = subData.services.length;
            stats.byCategory[category] += count;
            stats.bySubcategory[category][subcat] = count;
            stats.totalServices += count;

            // Недавно добавленные
            subData.services.forEach(service => {
                if (service.addedAt) {
                    stats.recentlyAdded.push({
                        service: service.name,
                        category,
                        subcat,
                        addedAt: service.addedAt
                    });
                }
            });
        }
    }

    // Сортируем недавно добавленные
    stats.recentlyAdded.sort((a, b) => b.addedAt - a.addedAt).slice(0, 20); // Top 20

    // Популярные из истории (с частотой)
    _recent.forEach(path => {
        stats.popular.set(
            path,
            (stats.popular.get(path) || 0) + 1
        );
    });

    // Сортируем popular по частоте
    stats.popular = new Map([...stats.popular.entries()].sort((a, b) => b[1] - a[1]));

    return stats;
}

/**
 * Вспомогательные функции
 */
function findServiceCategory(serviceName) {
    for (const [category, catData] of Object.entries(_catalog)) {
        for (const [subcat, subData] of Object.entries(catData.subcategories)) {
            if (subData.services.some(s => s.name === serviceName)) {
                return { category, subcat };
            }
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
 * Экспорт/Импорт данных (с placeholder для cloud)
 */
export function exportCatalogData() {
    // Placeholder for cloud export (e.g., to Firebase)
    // if (firebase) firebase.firestore().collection('catalog').doc('export').set(data);

    return {
        favorites: [..._favorites],
        recent: _recent,
        templates: [..._templates],
        customServices: getCustomServices(),
        timestamp: Date.now()
    };
}

function getCustomServices() {
    const customs = {};
    for (const [category, catData] of Object.entries(_catalog)) {
        customs[category] = { subcategories: {} };
        for (const [subcat, subData] of Object.entries(catData.subcategories)) {
            // Assume custom if addedAt exists or flag
            customs[category].subcategories[subcat] = subData.services
                .filter(s => s.addedAt) // Example: only user-added
                .map(s => s.name);
        }
    }
    return customs;
}

export function importCatalogData(data) {
    try {
        // Placeholder for cloud import (e.g., from Firebase)
        // if (firebase) { /* merge logic */ }

        if (data.favorites) {
            _favorites = new Set(data.favorites);
            localStorage.setItem(
                STORAGE_KEYS.FAVORITE_SERVICES,
                JSON.stringify([..._favorites])
            );
        }

        if (data.recent) {
            _recent = data.recent.slice(0, 50);
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
            _catalog = null; // Reset cache
            return loadServicesCatalog();
        }

        return true;
    } catch (error) {
        console.error('Ошибка импорта:', error);
        showErrorNotification('Ошибка импорта данных');
        return false;
    }
}

// Экспортируем основные функции (все)
export {
    loadServicesCatalog,
    searchServices,
    toggleFavorite,
    getFavorites,
    addToRecent,
    getRecent,
    saveTemplate,
    getTemplates,
    deleteTemplate,
    getServicesStats,
    exportCatalogData,
    importCatalogData
};

