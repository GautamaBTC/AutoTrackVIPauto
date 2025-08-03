/*────────────────────────────────────────────
  assets/js/servicesCatalog.js
  Управление каталогом услуг, избранным и недавними.
─────────────────────────────────────────────*/

import { showNotification } from './utils.js';

// --- Константы ---
const STORAGE_KEYS = {
  FAVORITE_SERVICES: 'vipauto_favorite_services',
  RECENT_SERVICES: 'vipauto_recent_services'
};
const MAX_RECENT_SERVICES = 20;

// --- Состояние модуля ---
let catalog = null;
let favorites = new Set();
let recent = [];

/**
 * Загружает каталог услуг из JSON и пользовательские данные из localStorage.
 * @returns {Promise<object>}
 */
export async function loadServicesCatalog() {
  if (catalog) return catalog;

  try {
    const response = await fetch('assets/data/services.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    catalog = await response.json();

    const savedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITE_SERVICES);
    if (savedFavorites) {
      favorites = new Set(JSON.parse(savedFavorites));
    }

    const savedRecent = localStorage.getItem(STORAGE_KEYS.RECENT_SERVICES);
    if (savedRecent) {
      recent = JSON.parse(savedRecent);
    }

    console.log('Services catalog loaded successfully.');
    return catalog;

  } catch (error) {
    console.error('Failed to load services catalog:', error);
    showNotification('Не удалось загрузить каталог услуг', 'error');
    return {}; // Возвращаем пустой объект в случае ошибки
  }
}

/**
 * Ищет услуги по запросу в загруженном каталоге.
 * @param {string} query - Поисковый запрос.
 * @returns {Array<object>} - Массив найденных услуг.
 */
export function searchServices(query) {
  if (!catalog || !query) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const results = [];

  for (const categoryName in catalog) {
    const category = catalog[categoryName];
    for (const subcategoryName in category.subcategories) {
      const subcategory = category.subcategories[subcategoryName];
      for (const serviceName of subcategory) {
        if (serviceName.toLowerCase().includes(normalizedQuery)) {
          const servicePath = `${categoryName}:${subcategoryName}:${serviceName}`;
          results.push({
            category: categoryName,
            subcategory: subcategoryName,
            service: serviceName,
            isFavorite: favorites.has(servicePath),
          });
        }
      }
    }
  }

  // Избранные всегда наверху
  return results.sort((a, b) => (b.isFavorite - a.isFavorite));
}

/**
 * Добавляет или удаляет услугу из избранного.
 * @param {string} servicePath - Уникальный путь к услуге (Category:Subcategory:Service).
 */
export function toggleFavorite(servicePath) {
  if (favorites.has(servicePath)) {
    favorites.delete(servicePath);
  } else {
    favorites.add(servicePath);
  }
  localStorage.setItem(STORAGE_KEYS.FAVORITE_SERVICES, JSON.stringify([...favorites]));
}

/**
 * Возвращает массив избранных услуг.
 * @returns {Array<object>}
 */
export function getFavorites() {
  return [...favorites].map(path => {
    const [category, subcategory, service] = path.split(':');
    return { category, subcategory, service };
  });
}

/**
 * Добавляет услугу в список недавних.
 * @param {string} servicePath - Уникальный путь к услуге.
 */
export function addToRecent(servicePath) {
  // Удаляем, если уже есть, чтобы переместить наверх
  recent = recent.filter(path => path !== servicePath);
  // Добавляем в начало
  recent.unshift(servicePath);
  // Ограничиваем размер списка
  if (recent.length > MAX_RECENT_SERVICES) {
    recent = recent.slice(0, MAX_RECENT_SERVICES);
  }
  localStorage.setItem(STORAGE_KEYS.RECENT_SERVICES, JSON.stringify(recent));
}

/**
 * Возвращает список недавних услуг.
 * @returns {Array<object>}
 */
export function getRecent() {
  return recent.map(path => {
    const [category, subcategory, service] = path.split(':');
    return {
      category,
      subcategory,
      service,
      isFavorite: favorites.has(path)
    };
  });
}

/**
 * Возвращает статистику по каталогу услуг.
 * @returns {object}
 */
export function getServicesStats() {
  if (!catalog) return { totalServices: 0, favoriteCount: 0 };

  let serviceCount = 0;
  for (const categoryName in catalog) {
    const category = catalog[categoryName];
    for (const subcategoryName in category.subcategories) {
      serviceCount += category.subcategories[subcategoryName].length;
    }
  }

  return {
    totalServices: serviceCount,
    favoriteCount: favorites.size
  };
}
