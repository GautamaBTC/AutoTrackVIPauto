/*────────────────────────────────────────────
  assets/js/app.js | ПОЛНЫЙ ОБНОВЛЁННЫЙ ФАЙЛ
─────────────────────────────────────────────*/

import { initHeader } from './theme.js';
import { loadServicesCatalog, getServicesStats } from './servicesCatalog.js';
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

// Критерии для авто-расчёта (пример)
const BONUS_CRITERIA = {
    jobs: { min: 50, bonus: 2 },
    revenue: { min: 100000, bonus: 3 },
    servicesVariety: { min: 20, bonus: 1 } // From stats
};

// Состояние
let currentUser = null;
let currentView = 'journal';
let selectedServices = [];
let activeModals = new Set();

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App init started'); // Debug
    const userData = localStorage.getItem('vipauto_user') || sessionStorage.getItem('vipauto_user');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    try {
        currentUser = JSON.parse(userData);
        await initializeApp();
    } catch (error) {
        console.error('Init error:', error);
        showNotification('Ошибка загрузки', 'error');
    }
});

async function initializeApp() {
    console.log('Initializing components'); // Debug
    initHeader();
    initUserInterface();
    await loadServicesCatalog();
    initCharts();
    setupRoleBasedUI();
    showView(currentView);
    setupEventListeners();
    console.log('App initialized'); // Debug
}

function initUserInterface() {
    console.log('Init user interface'); // Debug
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
            console.log('User menu clicked'); // Debug
            e.stopPropagation();
            const isVisible = menuDropdown.classList.toggle('visible');
            menuDropdown.setAttribute('aria-expanded', isVisible); // Accessibility
        });

        // Закрытие при клике вне меню
        document.addEventListener('click', (e) => {
            if (!menuDropdown.contains(e.target) && !menuBtn.contains(e.target)) {
                menuDropdown.classList.remove('visible');
                menuDropdown.setAttribute('aria-expanded', 'false');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('Logout clicked'); // Debug
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
        quickAddJob.addEventListener('click', () => {
            console.log('Quick add job clicked'); // Debug
            openModal('add-job-modal');
        });
    }

    if (quickStats) {
        quickStats.addEventListener('click', () => {
            console.log('Quick stats clicked'); // Debug
            showView('analytics');
        });
    }

    if (quickServices) {
        quickServices.addEventListener('click', () => {
            console.log('Quick services clicked'); // Debug
            openModal('services-modal');
        });
    }
}

function setupRoleBasedUI() {
    console.log('Setting up role UI for ' + currentUser.role); // Debug
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
        if (shouldShow) el.setAttribute('aria-hidden', 'false');
        else el.setAttribute('aria-hidden', 'true');
    });

    // Настраиваем интерфейс мастера
    if (isMaster) {
        document.querySelectorAll('[data-master-only]').forEach(el => {
            el.classList.remove('hidden');
            el.setAttribute('aria-hidden', 'false');
        });
        
        // Фильтруем данные только для текущего мастера
        filterMasterData();
    }
}

// Управление представлениями (с анимациями)
function showView(viewName) {
    console.log(`Showing view: ${viewName}`); // Debug
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

    // Показываем выбранное представление с анимацией
    Object.entries(views).forEach(([name, section]) => {
        if (section) {
            if (name === viewName) {
                section.classList.remove('hidden');
                section.classList.add('animate-slide-in');
                section.setAttribute('aria-hidden', 'false');
            } else {
                section.classList.add('hidden');
                section.classList.remove('animate-slide-in');
                section.setAttribute('aria-hidden', 'true');
            }
        }
    });

    // Инициализируем содержимое
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

// Модальные окна (с aria и enhanced swipe)
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    console.log(`Opening modal: ${modalId}`); // Debug

    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modal.classList.add('visible');
    });

    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('role', 'dialog');

    activeModals.add(modalId);
    document.body.style.overflow = 'hidden';

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

    console.log(`Closing modal: ${modalId}`); // Debug

    modal.classList.remove('visible');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.removeAttribute('aria-modal');
        modal.removeAttribute('role');
        activeModals.delete(modalId);
        if (activeModals.size === 0) {
            document.body.style.overflow = '';
        }
    }, 300);
}

function initAddJobModal() {
    const form = document.getElementById('add-job-form');
    const dateInput = document.getElementById('job-date');
    const servicesField = document.getElementById('services-selector');

    dateInput.value = formatDateInput(new Date());
    selectedServices = [];
    updateServicesDisplay();

    form.addEventListener('submit', handleJobSubmit);
    servicesField.addEventListener('click', () => openModal('services-modal'));
}

function initServicesModal() {
    const searchInput = document.getElementById('service-search');
    const servicesList = document.getElementById('services-list');
    const confirmBtn = document.getElementById('services-confirm');

    renderServicesList();

    searchInput.addEventListener('input', debounce((e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        filterServices(searchTerm);
    }, 300));

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

    document.getElementById('bonus-master-name').textContent = masterData.name;
    document.getElementById('bonus-master-stats').textContent = 
        `Выручка за месяц: ${formatMoney(masterData.monthRevenue)}`;

    slider.value = masterData.currentBonusLevel || 0;
    updateBonusDisplay(slider.value, masterData.monthRevenue);

    slider.addEventListener('input', (e) => {
        updateBonusDisplay(e.target.value, masterData.monthRevenue);
    });

    initBonusHistoryChart(masterId);
}

function initJournalView() {
    console.log('Init journal view'); // Debug
    const entriesList = document.getElementById('master-jobs-list');
    const searchInput = document.getElementById('jobs-search');
    const periodFilter = document.getElementById('jobs-period-filter');

    if (entriesList) entriesList.setAttribute('aria-label', 'Список работ'); // Accessibility

    loadAndDisplayEntries();

    if (searchInput) searchInput.addEventListener('input', debounce(() => loadAndDisplayEntries(), 300));
    if (periodFilter) periodFilter.addEventListener('change', loadAndDisplayEntries);
}

function loadAndDisplayEntries() {
    console.log('Loading entries'); // Debug
    const searchTerm = document.getElementById('jobs-search')?.value.toLowerCase() || '';
    const periodFilter = document.getElementById('jobs-period-filter')?.value || 'all';
    const entriesList = document.getElementById('master-jobs-list');

    let entries = getAllEntries();
    
    if (currentUser.role === USER_ROLES.MASTER) {
        entries = entries.filter(e => e.master === currentUser.name);
    }

    entries = filterEntriesByPeriod(entries, periodFilter);

    if (searchTerm) {
        entries = entries.filter(e => 
            e.car.toLowerCase().includes(searchTerm) ||
            e.services.some(s => s.toLowerCase().includes(searchTerm))
        );
    }

    const groupedEntries = groupEntriesByDate(entries);

    renderGroupedEntries(groupedEntries, entriesList);
}

function groupEntriesByDate(entries) {
    return entries.reduce((groups, entry) => {
        const date = entry.date;
        if (!groups[date]) groups[date] = [];
        groups[date].push(entry);
        return groups;
    }, {});
}

function renderGroupedEntries(groupedEntries, container) {
    container.innerHTML = '';

    const sortedDates = Object.keys(groupedEntries).sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(date => {
        const entries = groupedEntries[date];
        const totalRevenue = entries.reduce((sum, e) => sum + e.workCost + e.partsCost, 0);

        const dateGroup = document.createElement('div');
        dateGroup.className = 'entries-date-group';
        dateGroup.setAttribute('aria-labelledby', `date-header-${date}`);

        dateGroup.innerHTML = `
            <div class="date-group-header" id="date-header-${date}">
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

        const entriesList = document.createElement('div');
        entriesList.className = 'entries-list';
        entriesList.setAttribute('role', 'list');

        entries.forEach(entry => entriesList.appendChild(createEntryCard(entry)));

        dateGroup.appendChild(entriesList);
        container.appendChild(dateGroup);
    });

    if (sortedDates.length === 0) {
        container.innerHTML = `
            <div class="no-entries" role="alert">
                <i class="fas fa-folder-open"></i>
                <p>Записей не найдено</p>
            </div>
        `;
    }
    console.log('Entries rendered'); // Debug
}

function createEntryCard(entry) {
    const total = entry.workCost + entry.partsCost;
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.dataset.id = entry.id;
    card.setAttribute('role', 'listitem');

    card.innerHTML = `
        <div class="entry-header">
            <div class="car-info">
                <i class="fas fa-car"></i>
                <span>${entry.car}</span>
            </div>
            <div class="entry-actions">
                <button class="icon-btn edit-entry" title="Редактировать" aria-label="Редактировать запись">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn delete-entry" title="Удалить" aria-label="Удалить запись">
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

    card.querySelector('.edit-entry').addEventListener('click', () => {
        console.log(`Edit entry ${entry.id}`); // Debug
        startEditEntry(entry.id);
    });

    card.querySelector('.delete-entry').addEventListener('click', () => {
        console.log(`Delete entry ${entry.id}`); // Debug
        confirmDeleteEntry(entry.id);
    });

    return card;
}

// Система бонусов (с авто-расчётом)
function calculateBonus(revenue, level) {
    const bonusInfo = BONUS_LEVELS[level];
    return revenue * (bonusInfo.percent / 100);
}

function updateMasterBonus(masterId, level = null, comment) {
    console.log(`Updating bonus for ${masterId}`); // Debug
    const master = getMasterData(masterId);
    if (!master) return;

    // Auto-calc if not provided
    let calculatedLevel = level || calculateAutoLevel(master);

    const bonus = {
        level: calculatedLevel,
        percent: BONUS_LEVELS[calculatedLevel].percent,
        amount: calculateBonus(master.monthRevenue, calculatedLevel),
        comment,
        timestamp: Date.now()
    };

    saveMasterBonus(masterId, bonus);

    updateBonusDisplay(calculatedLevel, master.monthRevenue);
    updateMasterCard(masterId);
}

function calculateAutoLevel(master) {
    let autoLevel = 0;

    if (master.jobsCount > BONUS_CRITERIA.jobs.min) autoLevel += BONUS_CRITERIA.jobs.bonus;
    if (master.monthRevenue > BONUS_CRITERIA.revenue.min) autoLevel += BONUS_CRITERIA.revenue.bonus;

    // Integrate services stats
    const stats = getServicesStats();
    if (stats.totalServices > BONUS_CRITERIA.servicesVariety.min) autoLevel += BONUS_CRITERIA.servicesVariety.bonus;

    return Math.min(Math.max(autoLevel, 0), 10);
}

function updateBonusDisplay(level, revenue) {
    const bonusInfo = BONUS_LEVELS[level];
    const currentBonus = document.getElementById('current-bonus');
    const bonusAmount = document.getElementById('bonus-amount');
    const bonusDescription = document.getElementById('bonus-description');

    if (currentBonus) currentBonus.textContent = `+${bonusInfo.percent}%`;
    if (bonusAmount) bonusAmount.textContent = formatMoney(revenue * (bonusInfo.percent / 100));
    if (bonusDescription) bonusDescription.textContent = bonusInfo.description;

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

function initBonusHistoryChart(masterId) {
    const bonusHistory = getMasterBonusHistory(masterId);
    const ctx = document.getElementById('bonus-history-chart')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: bonusHistory.map(b => formatDateDisplay(new Date(b.timestamp))),
            datasets: [{
                label: 'Уровень бонуса',
                data: bonusHistory.map(b => b.level),
                borderColor: 'var(--accent)',
                backgroundColor: 'rgba(var(--accent-rgb), 0.1)',
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

    setTimeout(() => {
        notification.classList.add('notification-hiding');
        setTimeout(() => notification.remove(), 300);
    }, 5000);

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
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeModals.size > 0) {
            const lastModal = Array.from(activeModals).pop();
            closeModal(lastModal);
        }
    });

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

        if (Math.abs(diff) > SWIPE_THRESHOLD && diff > 0 && activeModals.size > 0) {
            const lastModal = Array.from(activeModals).pop();
            closeModal(lastModal);
        }
    }
}

window.addEventListener('beforeunload', () => {
    localStorage.setItem('vipauto_last_state', JSON.stringify({
        currentView,
        selectedServices,
        activeModals: Array.from(activeModals)
    }));
});
