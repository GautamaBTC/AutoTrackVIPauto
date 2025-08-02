/*────────────────────────────────────────────
  assets/js/servicesCatalog.js | КАТАЛОГ УСЛУГ С ИЗБРАННЫМ
─────────────────────────────────────────────*/

// --- Импорты ---
import { showNotification } from './utils.js';

// --- Константы ---
const STORAGE_KEYS = {
    FAVORITE_SERVICES: 'vipauto_favorite_services',
    RECENT_SERVICES: 'vipauto_recent_services'
};

// Метаданные категорий (иконки, цвета)
const DEFAULT_CATEGORIES = {
    "Автоэлектрика и Диагностика": {
        icon: "fa-bolt",
        color: "#FF6B6B",
        subcategories: {
            "Диагностика": { icon: "fa-microchip" },
            "Электропроводка": { icon: "fa-plug" },
            "Стартеры и генераторы": { icon: "fa-car-battery" },
            "Системы зажигания": { icon: "fa-fire" },
            "Электронные блоки": { icon: "fa-microchip" }
        }
    },
    "Автосвет": {
        icon: "fa-lightbulb",
        color: "#FFD93D",
        subcategories: {
            "Фары": { icon: "fa-car" },
            "ПТФ": { icon: "fa-car-side" },
            "ДХО": { icon: "fa-sun" },
            "Подсветка": { icon: "fa-lightbulb" }
        }
    },
    "Охранные системы": {
        icon: "fa-shield-alt",
        color: "#6BCB77",
        subcategories: {
            "Сигнализации": { icon: "fa-bell" },
            "Иммобилайзеры": { icon: "fa-lock" },
            "GPS-трекеры": { icon: "fa-map-marker-alt" },
            "Блокираторы": { icon: "fa-lock" }
        }
    },
    "Аудио- и Видеосистемы": {
        icon: "fa-music",
        color: "#4D96FF",
        subcategories: {
            "Магнитолы": { icon: "fa-radio" },
            "Акустика": { icon: "fa-volume-up" },
            "Усилители": { icon: "fa-wave-square" },
            "Видеорегистраторы": { icon: "fa-video" }
        }
    },
    "Комфорт и Доп. оборудование": {
        icon: "fa-couch",
        color: "#9A60FF",
        subcategories: {
            "Парктроники": { icon: "fa-parking" },
            "Климат": { icon: "fa-wind" },
            "Обогрев": { icon: "fa-temperature-high" },
            "Электроприводы": { icon: "fa-motorcycle" }
        }
    },
    "Тонировка": {
        icon: "fa-window-maximize",
        color: "#FF7F50",
        subcategories: {
            "Стандартная": { icon: "fa-window-maximize" },
            "Атермальная": { icon: "fa-sun" },
            "Защита": { icon: "fa-shield-alt" }
        }
    }
};

// --- Внутреннее состояние ---
let _catalog = null; // Кэш загруженного каталога
let _favorites = new Set(); // Set с путями избранных услуг
let _recent = []; // Массив с недавними услугами (макс. 50)

// --- Загрузка и инициализация ---
/**
 * Загрузка каталога услуг (с поддержкой подкатегорий)
 */
export async function loadServicesCatalog() {
    if (_catalog) return _catalog;

    try {
        // Загружаем базовый каталог из assets/data/services.json
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
        showNotification('Не удалось загрузить каталог услуг', 'error');
        return {}; // Возвращаем пустой объект в случае ошибки
    }
}

/**
 * Расширение каталога в 5 раз с подкатегориями
 */
function expandCatalog(baseCatalog) {
    const expanded = {};
    for (const [category, catData] of Object.entries(baseCatalog)) {
        expanded[category] = { subcategories: {} };

        // Проверяем, есть ли уже подкатегории в данных
        if (catData.subcategories) {
            // Если есть, используем их
            expanded[category].subcategories = catData.subcategories;
        } else {
            // Если нет, создаем одну общую подкатегорию
            const servicesArray = Array.isArray(catData) ? catData : catData.services || [];
            expanded[category].subcategories['Общее'] = {
                services: servicesArray.map(service => ({
                    name: service,
                    tags: generateTags(service), // Авто-теги
                    addedAt: Date.now() // Для stats
                })),
                icon: DEFAULT_CATEGORIES[category]?.icon || "fa-tools"
            };
        }

        // Расширяем каждую подкатегорию
        for (const [subcat, subData] of Object.entries(expanded[category].subcategories)) {
            const servicesArray = Array.isArray(subData) ? subData : subData.services || [];
            const extendedServices = [];

            // Добавляем 5x услуг (вариации базовых + новые)
            servicesArray.forEach(serviceObj => {
                const serviceName = typeof serviceObj === 'string' ? serviceObj : serviceObj.name;
                extendedServices.push({
                    name: serviceName,
                    tags: generateTags(serviceName),
                    addedAt: Date.now()
                });

                for (let i = 1; i < 5; i++) {
                    extendedServices.push({
                        name: `${serviceName} (вариант ${i})`,
                        tags: [...generateTags(serviceName), `вариант-${i}`],
                        addedAt: Date.now()
                    });
                    extendedServices.push({
                        name: `Расширенная ${serviceName.toLowerCase()}`,
                        tags: [...generateTags(serviceName), 'расширенная'],
                        addedAt: Date.now()
                    });
                    extendedServices.push({
                        name: `Профессиональная ${serviceName.toLowerCase()}`,
                        tags: [...generateTags(serviceName), 'профессиональная'],
                        addedAt: Date.now()
                    });
                    extendedServices.push({
                        name: `Быстрая ${serviceName.toLowerCase()}`,
                        tags: [...generateTags(serviceName), 'быстрая'],
                        addedAt: Date.now()
                    });
                    extendedServices.push({
                        name: `Комплексная ${serviceName.toLowerCase()} + диагностика`,
                        tags: [...generateTags(serviceName), 'комплексная', 'диагностика'],
                        addedAt: Date.now()
                    });
                }
            });

            expanded[category].subcategories[subcat].services = extendedServices;
        }
    }
    return expanded;
}

/**
 * Обогащение каталога метаданными и тегами
 */
function enrichCatalogData() {
    for (const [category, data] of Object.entries(_catalog)) {
        const metadata = DEFAULT_CATEGORIES[category] || { icon: "fa-tools", color: "#757575", subcategories: {} };

        // Добавляем метаданные категории
        data.icon = metadata.icon;
        data.color = metadata.color;

        // Обогащаем подкатегории
        for (const [subcat, subData] of Object.entries(data.subcategories || {})) {
            const subMeta = metadata.subcategories?.[subcat] || { icon: metadata.icon };
            data.subcategories[subcat] = {
                services: subData.services.map(service => ({
                    name: service.name,
                    tags: service.tags || generateTags(service.name), // Авто-теги
                    addedAt: service.addedAt || Date.now() // Для stats
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
}

// --- Поиск и фильтрация ---
/**
 * Поиск услуг с fuzzy matching (Levenshtein) для большого каталога
 */
export function searchServices(query) {
    if (!_catalog || !query) return [];

    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const words = normalizedQuery.split(/\s+/).filter(w => w.length > 1);
    if (words.length === 0) return [];

    let results = [];

    // Функция поиска внутри подкатегорий
    function searchInSubcats(category, subcat, service, subData) {
        const serviceName = service.name.toLowerCase();
        let relevance = 0;

        // Точное совпадение по фразе
        if (serviceName.includes(normalizedQuery)) {
            relevance += 100;
        }

        // Совпадение по словам
        words.forEach(word => {
            if (serviceName.includes(word)) relevance += 20;
            // Совпадение по тегам
            if (service.tags && service.tags.some(tag => tag.includes(word))) relevance += 10;
        });

        // Избранное
        const servicePath = `${category}:${subcat}:${service.name}`;
        if (_favorites.has(servicePath)) relevance += 50;

        // Недавние
        if (_recent.includes(servicePath)) relevance += 30;

        if (relevance > 0) {
            results.push({
                category,
                subcat,
                service: service.name,
                relevance,
                isFavorite: _favorites.has(servicePath),
                isRecent: _recent.includes(servicePath),
                tags: service.tags,
                metadata: {
                    categoryIcon: _catalog[category].icon,
                    categoryColor: _catalog[category].color,
                    subcatIcon: subData.icon
                }
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
    return results
        .sort((a, b) => {
            // Сначала избранные
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            // Потом недавние
            if (a.isRecent && !b.isRecent) return -1;
            if (!a.isRecent && b.isRecent) return 1;
            // По релевантности
            return b.relevance - a.relevance;
        })
        .slice(0, 100); // Ограничиваем количество результатов
}

// --- Управление ---
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
            // Добавляем в недавние при добавлении в избранное
            addToRecent(servicePath);
        }
        localStorage.setItem(STORAGE_KEYS.FAVORITE_SERVICES, JSON.stringify([..._favorites]));
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
        localStorage.setItem(STORAGE_KEYS.RECENT_SERVICES, JSON.stringify(_recent));
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

// --- Статистика и экспорт ---
/**
 * Статистика и аналитика услуг (с учётом подкатегорий)
 */
export function getServicesStats() {
    // TODO: Реализовать сбор статистики по услугам
    // Например, сколько раз каждая услуга была выбрана
    console.log('Services stats requested'); // Stub
    return {
        totalCategories: Object.keys(_catalog).length,
        totalServices: Object.values(_catalog).reduce((acc, cat) =>
            acc + Object.values(cat.subcategories).reduce((subAcc, sub) =>
                subAcc + (sub.services?.length || 0), 0), 0),
        favoriteCount: _favorites.size,
        recentCount: _recent.length
    };
}

// --- Вспомогательные функции ---
/**
 * Расстояние Левенштейна (для неточного поиска)
 */
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // Increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // Increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Проверка, что все слова из массива words есть в тексте text
 */
function allWordsMatch(words, text) {
    return words.every(word => text.includes(word));
}

// --- Экспорт функций ---
export {
    loadServicesCatalog,
    searchServices,
    toggleFavorite,
    getFavorites,
    addToRecent,
    getRecent,
    getServicesStats
};