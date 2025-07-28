/*────────────────────────────────────────────
  assets/js/app.js | ЧАСТЬ 1: ОСНОВНАЯ ЛОГИКА
─────────────────────────────────────────────*/

import { initHeader } from './theme.js';
import { loadServicesCatalog } from './servicesCatalog.js';
import { getAllEntries, addEntry, updateEntry, deleteEntry, getUserByLogin } from './storage.js';
import { formatDateInput, formatDateDisplay, formatMoney, debounce } from './utils.js';
import { initCharts, updateCharts } from './charts.js';

// Константы
const USER_ROLES = {
    DIRECTOR: 'director',
    ADMIN: 'admin',
    MASTER: 'master'
};

const BONUS_LEVELS = {
    0: { percent: 0, description: 'Базовый уровень' },
    1: { percent: 3, description: 'Начальный бонус' },
    2: { percent: 5, description: 'Стабильный рост' },
    3: { percent: 7, description: 'Хорошая работа' },
    4: { percent: 9, description: 'Отличный результат' },
    5: { percent: 11, description: 'Превосходно' },
    6: { percent: 13, description: 'Профессионал' },
    7: { percent: 15, description: 'Эксперт' },
    8: { percent: 17, description: 'Мастер своего дела' },
    9: { percent: 19, description: 'Виртуоз' },
    10: { percent: 20, description: 'Легенда сервиса' }
};

// Состояние приложения
let currentUser = null;
let currentView = 'journal';
let selectedServices = [];
let activeModals = new Set();

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    // Проверка авторизации
    const userData = localStorage.getItem('vipauto_user') || sessionStorage.getItem('vipauto_user');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    try {
        currentUser = JSON.parse(userData);
        await initializeApp();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showNotification('Ошибка загрузки приложения', 'error');
    }
});

async function initializeApp() {
    // Инициализация компонентов
    initHeader();
    initUserInterface();
    await loadServicesCatalog();
    initCharts();
    
    // Настройка интерфейса под роль
    setupRoleBasedUI();
    
    // Загрузка начального вида
    showView(currentView);
    
    // Обработчики событий
    setupEventListeners();
}

function initUserInterface() {
    // Заполняем информацию о пользователе
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    const userPositionEl = document.getElementById('user-position');

    if (userNameEl) userNameEl.textContent = currentUser.name;
    if (userRoleEl) userRoleEl.textContent = getRoleDisplay(currentUser.role);
    if (userPositionEl) userPositionEl.textContent = currentUser.position;

    // Инициализация меню пользователя
    initUserMenu();

    // Быстрые действия
    initQuickActions();
}

function initUserMenu() {
    const menuBtn = document.getElementById('user-menu-btn');
    const menuDropdown = document.querySelector('.user-menu-dropdown');
    const logoutBtn = document.getElementById('logout-btn');

    if (menuBtn && menuDropdown) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.classList.toggle('visible');
        });

        // Закрытие при клике вне меню
        document.addEventListener('click', (e) => {
            if (!menuDropdown.contains(e.target) && !menuBtn.contains(e.target)) {
                menuDropdown.classList.remove('visible');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('vipauto_user');
            sessionStorage.removeItem('vipauto_user');
            window.location.href = 'login.html';
        });
    }
}

function initQuickActions() {
    const quickAddJob = document.getElementById('quick-add-job');
    const quickStats = document.getElementById('quick-stats');
    const quickServices = document.getElementById('quick-services');

    if (quickAddJob) {
        quickAddJob.addEventListener('click', () => openModal('add-job-modal'));
    }

    if (quickStats) {
        quickStats.addEventListener('click', () => showView('analytics'));
    }

    if (quickServices) {
        quickServices.addEventListener('click', () => openModal('services-modal'));
    }
}

function setupRoleBasedUI() {
    const isDirector = currentUser.role === USER_ROLES.DIRECTOR;
    const isAdmin = currentUser.role === USER_ROLES.ADMIN;
    const isMaster = currentUser.role === USER_ROLES.MASTER;

    // Показываем/скрываем элементы в зависимости от роли
    document.querySelectorAll('[data-role]').forEach(el => {
        const requiredRole = el.dataset.role;
        const shouldShow = 
            requiredRole === 'all' ||
            (requiredRole === 'director' && isDirector) ||
            (requiredRole === 'admin' && (isDirector || isAdmin)) ||
            (requiredRole === 'master' && isMaster);

        el.classList.toggle('hidden', !shouldShow);
    });

    // Настраиваем интерфейс мастера
    if (isMaster) {
        document.querySelectorAll('[data-master-only]').forEach(el => {
            el.classList.remove('hidden');
        });
        
        // Фильтруем данные только для текущего мастера
        filterMasterData();
    }
}
/*────────────────────────────────────────────
  assets/js/app.js | ЧАСТЬ 2: ПРЕДСТАВЛЕНИЯ И МОДАЛЬНЫЕ ОКНА
─────────────────────────────────────────────*/

// Управление представлениями
function showView(viewName) {
    const views = {
        journal: document.getElementById('journal-section'),
        analytics: document.getElementById('analytics-section'),
        masters: document.getElementById('masters-section'),
        settings: document.getElementById('settings-section')
    };

    // Обновляем активную вкладку
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === viewName);
    });

    // Анимируем индикатор вкладки
    const activeTab = document.querySelector(`.tab-btn[data-tab="${viewName}"]`);
    const tabIndicator = document.querySelector('.tab-indicator');
    if (activeTab && tabIndicator) {
        const tabWidth = activeTab.offsetWidth;
        const tabLeft = activeTab.offsetLeft;
        tabIndicator.style.width = `${tabWidth}px`;
        tabIndicator.style.transform = `translateX(${tabLeft}px)`;
    }

    // Показываем выбранное представление
    Object.entries(views).forEach(([name, section]) => {
        if (section) {
            if (name === viewName) {
                section.classList.remove('hidden');
                section.classList.add('animate-slide-in');
            } else {
                section.classList.add('hidden');
                section.classList.remove('animate-slide-in');
            }
        }
    });

    // Инициализируем содержимое представления
    switch(viewName) {
        case 'journal':
            initJournalView();
            break;
        case 'analytics':
            initAnalyticsView();
            break;
        case 'masters':
            initMastersView();
            break;
        case 'settings':
            initSettingsView();
            break;
    }

    currentView = viewName;
}

// Модальные окна
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Анимация открытия
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modal.classList.add('visible');
    });

    // Добавляем в список активных модальных окон
    activeModals.add(modalId);

    // Блокируем прокрутку body
    document.body.style.overflow = 'hidden';

    // Инициализация содержимого модального окна
    switch(modalId) {
        case 'add-job-modal':
            initAddJobModal();
            break;
        case 'services-modal':
            initServicesModal();
            break;
        case 'bonus-modal':
            initBonusModal();
            break;
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Анимация закрытия
    modal.classList.remove('visible');
    setTimeout(() => {
        modal.classList.add('hidden');
        
        // Удаляем из списка активных модальных окон
        activeModals.delete(modalId);

        // Разблокируем прокрутку body если нет активных модальных окон
        if (activeModals.size === 0) {
            document.body.style.overflow = '';
        }
    }, 300);
}

function initAddJobModal() {
    const form = document.getElementById('add-job-form');
    const dateInput = document.getElementById('job-date');
    const servicesField = document.getElementById('services-selector');

    // Устанавливаем текущую дату
    dateInput.value = formatDateInput(new Date());

    // Очищаем выбранные услуги
    selectedServices = [];
    updateServicesDisplay();

    // Обработчики событий
    form.addEventListener('submit', handleJobSubmit);
    servicesField.addEventListener('click', () => openModal('services-modal'));
}

function initServicesModal() {
    const searchInput = document.getElementById('service-search');
    const servicesList = document.getElementById('services-list');
    const confirmBtn = document.getElementById('services-confirm');

    // Загружаем и отображаем услуги
    renderServicesList();

    // Поиск услуг
    searchInput.addEventListener('input', debounce((e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        filterServices(searchTerm);
    }, 300));

    // Подтверждение выбора
    confirmBtn.addEventListener('click', () => {
        updateServicesDisplay();
        closeModal('services-modal');
    });
}

function initBonusModal(masterId) {
    const slider = document.getElementById('bonus-slider');
    const currentBonus = document.getElementById('current-bonus');
    const bonusAmount = document.getElementById('bonus-amount');
    const masterData = getMasterData(masterId);

    if (!masterData) return;

    // Заполняем информацию о мастере
    document.getElementById('bonus-master-name').textContent = masterData.name;
    document.getElementById('bonus-master-stats').textContent = 
        `Выручка за месяц: ${formatMoney(masterData.monthRevenue)}`;

    // Настраиваем слайдер
    slider.value = masterData.currentBonusLevel || 0;
    updateBonusDisplay(slider.value, masterData.monthRevenue);

    // Обработчик изменения значения слайдера
    slider.addEventListener('input', (e) => {
        updateBonusDisplay(e.target.value, masterData.monthRevenue);
    });

    // Анимация графика истории бонусов
    initBonusHistoryChart(masterId);
}

function updateBonusDisplay(level, revenue) {
    const bonusInfo = BONUS_LEVELS[level];
    const currentBonus = document.getElementById('current-bonus');
    const bonusAmount = document.getElementById('bonus-amount');
    const bonusDescription = document.getElementById('bonus-description');

    currentBonus.textContent = `+${bonusInfo.percent}%`;
    bonusAmount.textContent = formatMoney(revenue * (bonusInfo.percent / 100));
    bonusDescription.textContent = bonusInfo.description;

    // Обновляем звезды рейтинга
    updateBonusStars(level);
}

function updateBonusStars(level) {
    const starsContainer = document.querySelector('.bonus-stars');
    const maxStars = 5;
    const filledStars = Math.round((level / 10) * maxStars);

    starsContainer.innerHTML = Array(maxStars)
        .fill(null)
        .map((_, index) => `
            <i class="fas fa-star ${index < filledStars ? 'filled' : ''}"></i>
        `)
        .join('');
}
/*────────────────────────────────────────────
  assets/js/app.js | ЧАСТЬ 3: ЖУРНАЛ И БОНУСЫ
─────────────────────────────────────────────*/

// Инициализация журнала
function initJournalView() {
    const entriesList = document.getElementById('master-jobs-list');
    const searchInput = document.getElementById('jobs-search');
    const periodFilter = document.getElementById('jobs-period-filter');

    // Загружаем данные
    loadAndDisplayEntries();

    // Обработчики поиска и фильтрации
    searchInput.addEventListener('input', debounce(() => {
        loadAndDisplayEntries();
    }, 300));

    periodFilter.addEventListener('change', () => {
        loadAndDisplayEntries();
    });
}

function loadAndDisplayEntries() {
    const searchTerm = document.getElementById('jobs-search').value.toLowerCase();
    const periodFilter = document.getElementById('jobs-period-filter').value;
    const entriesList = document.getElementById('master-jobs-list');

    // Получаем и фильтруем записи
    let entries = getAllEntries();
    
    // Фильтр по мастеру для роли мастера
    if (currentUser.role === USER_ROLES.MASTER) {
        entries = entries.filter(e => e.master === currentUser.name);
    }

    // Фильтр по периоду
    entries = filterEntriesByPeriod(entries, periodFilter);

    // Поисковый фильтр
    if (searchTerm) {
        entries = entries.filter(e => 
            e.car.toLowerCase().includes(searchTerm) ||
            e.services.some(s => s.toLowerCase().includes(searchTerm))
        );
    }

    // Группируем по дате
    const groupedEntries = groupEntriesByDate(entries);

    // Отображаем записи
    renderGroupedEntries(groupedEntries, entriesList);
}

function groupEntriesByDate(entries) {
    return entries.reduce((groups, entry) => {
        const date = entry.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(entry);
        return groups;
    }, {});
}

function renderGroupedEntries(groupedEntries, container) {
    container.innerHTML = '';

    // Сортируем даты в обратном порядке
    const sortedDates = Object.keys(groupedEntries).sort((a, b) => 
        new Date(b) - new Date(a)
    );

    sortedDates.forEach(date => {
        const entries = groupedEntries[date];
        const totalRevenue = entries.reduce((sum, e) => 
            sum + e.workCost + e.partsCost, 0
        );

        const dateGroup = document.createElement('div');
        dateGroup.className = 'entries-date-group';
        
        // Заголовок группы
        dateGroup.innerHTML = `
            <div class="date-group-header">
                <div class="date-info">
                    <h3>${formatDateDisplay(date)}</h3>
                    <span class="entry-count">${entries.length} работ</span>
                </div>
                <div class="date-total">
                    <span class="total-label">Выручка:</span>
                    <span class="total-amount">${formatMoney(totalRevenue)}</span>
                </div>
            </div>
        `;

        // Список записей
        const entriesList = document.createElement('div');
        entriesList.className = 'entries-list';

        entries.forEach(entry => {
            entriesList.appendChild(createEntryCard(entry));
        });

        dateGroup.appendChild(entriesList);
        container.appendChild(dateGroup);
    });

    // Если записей нет
    if (sortedDates.length === 0) {
        container.innerHTML = `
            <div class="no-entries">
                <i class="fas fa-folder-open"></i>
                <p>Записей не найдено</p>
            </div>
        `;
    }
}

function createEntryCard(entry) {
    const total = entry.workCost + entry.partsCost;
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.dataset.id = entry.id;

    card.innerHTML = `
        <div class="entry-header">
            <div class="car-info">
                <i class="fas fa-car"></i>
                <span>${entry.car}</span>
            </div>
            <div class="entry-actions">
                <button class="icon-btn edit-entry" title="Редактировать">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn delete-entry" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="entry-services">
            ${entry.services.map(service => `
                <span class="service-tag">${service}</span>
            `).join('')}
        </div>
        <div class="entry-footer">
            <div class="cost-breakdown">
                <span class="cost-item">
                    <i class="fas fa-tools"></i>
                    Работа: ${formatMoney(entry.workCost)}
                </span>
                <span class="cost-item">
                    <i class="fas fa-cogs"></i>
                    Запчасти: ${formatMoney(entry.partsCost)}
                </span>
            </div>
            <div class="total-cost">
                Итого: <strong>${formatMoney(total)}</strong>
            </div>
        </div>
    `;

    // Обработчики действий
    card.querySelector('.edit-entry').addEventListener('click', () => {
        startEditEntry(entry.id);
    });

    card.querySelector('.delete-entry').addEventListener('click', () => {
        confirmDeleteEntry(entry.id);
    });

    return card;
}

// Система бонусов
function calculateBonus(revenue, level) {
    const bonusInfo = BONUS_LEVELS[level];
    return revenue * (bonusInfo.percent / 100);
}

function updateMasterBonus(masterId, level, comment) {
    const master = getMasterData(masterId);
    if (!master) return;

    const bonus = {
        level,
        percent: BONUS_LEVELS[level].percent,
        amount: calculateBonus(master.monthRevenue, level),
        comment,
        timestamp: Date.now()
    };

    // Сохраняем бонус
    saveMasterBonus(masterId, bonus);

    // Обновляем отображение
    updateBonusDisplay(level, master.monthRevenue);
    updateMasterCard(masterId);
}

function initBonusHistoryChart(masterId) {
    const bonusHistory = getMasterBonusHistory(masterId);
    const ctx = document.getElementById('bonus-history-chart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: bonusHistory.map(b => formatDateDisplay(new Date(b.timestamp))),
            datasets: [{
                label: 'Уровень бонуса',
                data: bonusHistory.map(b => b.level),
                borderColor: 'var(--accent)',
                backgroundColor: 'rgba(57, 157, 156, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10
                }
            }
        }
    });
}
/*────────────────────────────────────────────
  assets/js/app.js | ЧАСТЬ 4: УТИЛИТЫ И ЭКСПОРТ
─────────────────────────────────────────────*/

// Утилиты для работы с датами
function filterEntriesByPeriod(entries, period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    switch (period) {
        case 'today':
            return entries.filter(e => new Date(e.date).toDateString() === today.toDateString());
        case 'week':
            return entries.filter(e => new Date(e.date) >= startOfWeek);
        case 'month':
            return entries.filter(e => new Date(e.date) >= startOfMonth);
        default:
            return entries;
    }
}

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} animate-slide-in`;
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(notification);

    // Автоматическое скрытие
    setTimeout(() => {
        notification.classList.add('notification-hiding');
        setTimeout(() => notification.remove(), 300);
    }, 5000);

    // Обработчик закрытия
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.add('notification-hiding');
        setTimeout(() => notification.remove(), 300);
    });
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Анимации
function animateNumber(element, start, end, duration = 1000) {
    const startTime = performance.now();
    const change = end - start;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Функция плавности
        const easing = t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        
        const currentValue = start + (change * easing(progress));
        element.textContent = formatMoney(Math.round(currentValue));

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// Вспомогательные функции
function getRoleDisplay(role) {
    const roles = {
        [USER_ROLES.DIRECTOR]: 'Директор',
        [USER_ROLES.ADMIN]: 'Администратор',
        [USER_ROLES.MASTER]: 'Мастер'
    };
    return roles[role] || role;
}

function getMasterData(masterId) {
    // Получаем данные мастера из хранилища
    const entries = getAllEntries().filter(e => e.master === masterId);
    const today = new Date().toISOString().slice(0, 10);
    
    return {
        id: masterId,
        name: masterId,
        todayRevenue: entries
            .filter(e => e.date === today)
            .reduce((sum, e) => sum + e.workCost + e.partsCost, 0),
        monthRevenue: entries
            .filter(e => {
                const entryDate = new Date(e.date);
                const now = new Date();
                return entryDate.getMonth() === now.getMonth() &&
                       entryDate.getFullYear() === now.getFullYear();
            })
            .reduce((sum, e) => sum + e.workCost + e.partsCost, 0),
        jobsCount: entries.length,
        currentBonusLevel: getCurrentBonusLevel(masterId)
    };
}

// Обработка ошибок
function handleError(error, context = '') {
    console.error(`Ошибка ${context}:`, error);
    showNotification(
        `Произошла ошибка${context ? ` при ${context}` : ''}. Попробуйте позже.`,
        'error'
    );
}

// Экспорт функций
export {
    initializeApp,
    showView,
    openModal,
    closeModal,
    showNotification,
    updateMasterBonus,
    handleError
};

// Инициализация обработчиков событий
function setupEventListeners() {
    // Обработка клавиш
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeModals.size > 0) {
            const lastModal = Array.from(activeModals).pop();
            closeModal(lastModal);
        }
    });

    // Обработка свайпов на мобильных устройствах
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const SWIPE_THRESHOLD = 50;
        const diff = touchEndX - touchStartX;

        if (Math.abs(diff) > SWIPE_THRESHOLD) {
            // Свайп вправо - назад
            if (diff > 0 && activeModals.size > 0) {
                const lastModal = Array.from(activeModals).pop();
                closeModal(lastModal);
            }
        }
    }
}

// Автоматическое сохранение состояния
window.addEventListener('beforeunload', () => {
    // Сохраняем текущее состояние приложения
    localStorage.setItem('vipauto_last_state', JSON.stringify({
        currentView,
        selectedServices,
        activeModals: Array.from(activeModals)
    }));
});
