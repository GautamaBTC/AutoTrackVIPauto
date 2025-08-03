/*────────────────────────────────────────────
  assets/js/utils.js
  Вспомогательные функции, используемые во всем приложении.
─────────────────────────────────────────────*/

/**
 * Форматирует дату в строку 'YYYY-MM-DD' для input[type="date"].
 * @param {Date|string} date - Исходная дата.
 * @returns {string}
 */
export function formatDateInput(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

/**
 * Форматирует дату в читаемый вид (напр., "1 января 2025 г.").
 * @param {Date|string} dateValue - Исходная дата.
 * @returns {string}
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
 * Форматирует денежную сумму с разделителями и знаком валюты.
 * @param {number} amount - Число для форматирования.
 * @param {string} [currency='₽'] - Знак валюты.
 * @returns {string}
 */
export function formatMoney(amount, currency = '₽') {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' ' + currency;
}

/**
 * Форматирует число с разделителями.
 * @param {number} num - Число для форматирования.
 * @param {number} [decimals=0] - Количество знаков после запятой.
 * @returns {string}
 */
export function formatNumber(num, decimals = 0) {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

/**
 * Функция "debounce" для задержки выполнения функции (например, при вводе в поиске).
 * @param {Function} fn - Функция для выполнения.
 * @param {number} [ms=300] - Задержка в миллисекундах.
 * @returns {Function}
 */
export function debounce(fn, ms = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Анимирует изменение значения с помощью requestAnimationFrame.
 * @param {Object} options - Опции анимации.
 * @param {Function} options.timing - Функция временной зависимости.
 * @param {Function} options.draw - Функция отрисовки.
 * @param {number} [options.duration=300] - Длительность анимации.
 */
export function animate({ timing = t => t, draw, duration = 300 }) {
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

/**
 * Показывает всплывающее уведомление.
 * @param {string} message - Текст сообщения.
 * @param {'success'|'error'|'warning'} [type='info'] - Тип уведомления.
 */
export function showNotification(message, type = 'success') {
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  const iconClass = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  }[type] || 'fa-info-circle';

  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas ${iconClass}"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(notification);

  // Анимация появления
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  // Автоматическое скрытие
  setTimeout(() => {
    notification.classList.remove('show');
    // Удаляем элемент из DOM после завершения анимации
    notification.addEventListener('transitionend', () => notification.remove());
  }, 4000);
}
