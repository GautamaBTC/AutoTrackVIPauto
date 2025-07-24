//───────────────────────────────────────────────────────────────────
// servicesCatalog.js — подгрузка каталога услуг из JSON + доп. услуги
//───────────────────────────────────────────────────────────────────

const CUSTOM_KEY = 'vipautojournal_custom_services';
let _catalog = null;

/**
 * Загружает базовый каталог из JSON (assets/data/services.json),
 * затем добавляет пользовательские услуги из localStorage.
 * @returns {Promise<Object>} объект { категория: [услуги...] }
 */
export async function loadServicesCatalog() {
  if (_catalog) return _catalog;

  // 1) загрузить базовый JSON
  let base = {};
  try {
    const resp = await fetch('assets/data/services.json');
    base = resp.ok ? await resp.json() : {};
  } catch (err) {
    console.error('Ошибка загрузки services.json:', err);
  }

  // 2) получить сохранённые вручную услуги
  const custom = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '{}');

  // 3) объединить базовый и пользовательский
  _catalog = {};
  for (const [cat, list] of Object.entries(base)) {
    _catalog[cat] = Array.isArray(list) ? [...list] : [];
  }
  for (const [cat, list] of Object.entries(custom)) {
    if (!_catalog[cat]) _catalog[cat] = [];
    list.forEach(item => {
      if (!_catalog[cat].includes(item)) {
        _catalog[cat].push(item);
      }
    });
  }

  return _catalog;
}

/**
 * Возвращает загруженный каталог (или null, если ещё не загружали).
 * @returns {Object|null}
 */
export function getServicesCatalog() {
  return _catalog;
}

/**
 * Добавляет новую услугу в указанную категорию и сохраняет в localStorage.
 * @param {string} category
 * @param {string} serviceName
 */
export function addCustomService(category, serviceName) {
  if (!category || !serviceName) return;
  const custom = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '{}');
  if (!custom[category]) custom[category] = [];
  if (!custom[category].includes(serviceName)) {
    custom[category].push(serviceName);
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom));
    // сразу обновляем локальный кэш
    if (_catalog && _catalog[category]) {
      _catalog[category].push(serviceName);
    }
  }
}