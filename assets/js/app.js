/*────────────────────────────────────────────
  assets/js/app.js | ГЛАВНЫЙ МОДУЛЬ ПРИЛОЖЕНИЯ
─────────────────────────────────────────────*/

// --- Импорты ---
import { initHeader, getCurrentTheme } from './theme.js';
import { loadServicesCatalog, searchServices, toggleFavorite, getFavorites, addToRecent, getRecent } from './servicesCatalog.js';
import { getAllEntries, saveEntry, deleteEntry, getMasterData, getAllMastersData, getMasterBonusHistory, setBonusLevel, getBonusLevel } from './storage.js';
import { formatDateInput, formatDateDisplay, formatMoney, debounce, showNotification as utilsShowNotification, animate } from './utils.js';
import { initCharts, updateCharts } from './charts.js';

// --- Константы ---
const USER_ROLES = {
    DIRECTOR: 'director',
    ADMIN: 'admin',
    MASTER: 'master'
};

const BONUS_LEVELS = {
    0: { name: 'Нет', color: '#909399', min: 0 },
    1: { name: 'Бронза', color: '#CD7F32', min: 1 },
    2: { name: 'Серебро', color: '#C0C0C0', min: 2 },
    3: { name: 'Золото', color: '#FFD700', min: 3 },
    4: { name: 'Платина', color: '#E5E4E2', min: 4 },
    5: { name: 'Алмаз', color: '#B9F2FF', min: 5 }
};

// --- Состояние ---
let currentUser = null;
let currentView = 'journal'; // Для мастеров это 'journal', для админов/директоров 'overview' по умолчанию
let selectedServices = [];
let activeModals = new Set();

// --- Инициализация ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App init started');
    
    // Проверяем авторизацию
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
        showNotification('Ошибка загрузки приложения', 'error');
    }
});

async function initializeApp() {
    console.log('Initializing app components');
    
    // Инициализируем хедер (тема, время, меню пользователя)
    initHeader();
    
    // Инициализируем пользовательский интерфейс
    initUserInterface();
    
    // Загружаем каталог услуг
    await loadServicesCatalog();
    
    // Инициализируем графики
    initCharts();
    
    // Настраиваем интерфейс в зависимости от роли
    setupRoleBasedUI();
    
    // Устанавливаем начальный вид в зависимости от роли
    const initialView = currentUser.role === USER_ROLES.MASTER ? 'journal' : 'overview';
    showView(initialView);
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    console.log('App initialized successfully');
}

// --- Инициализация пользовательского интерфейса ---
function initUserInterface() {
    console.log('Initializing user interface');
    
    // Заполняем информацию о пользователе в хедере
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    
    if (userNameEl) userNameEl.textContent = currentUser.name;
    if (userRoleEl) userRoleEl.textContent = getRoleDisplay(currentUser.role);

    // Инициализация меню пользователя
    initUserMenu();

    // Быстрые действия
    initQuickActions();
}

function initUserMenu() {
    const menuBtn = document.getElementById('user-menu-trigger');
    const menuDropdown = document.getElementById('user-menu-dropdown');
    const logoutBtn = document.getElementById('logout-btn');

    if (menuBtn && menuDropdown) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
            menuBtn.setAttribute('aria-expanded', !isExpanded);
            menuDropdown.classList.toggle('hidden');
        });

        // Закрытие меню при клике вне его
        document.addEventListener('click', (e) => {
            if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
                menuBtn.setAttribute('aria-expanded', 'false');
                menuDropdown.classList.add('hidden');
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
    const quickAddJobBtn = document.getElementById('add-job-btn');
    if (quickAddJobBtn) {
        quickAddJobBtn.addEventListener('click', () => openModal('add-job-modal'));
    }
}

// --- Настройка интерфейса в зависимости от роли ---
function setupRoleBasedUI() {
    console.log('Setting up role-based UI for:', currentUser);
    
    if (!currentUser) {
        console.warn('No current user, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    const isDirector = currentUser.role === USER_ROLES.DIRECTOR;
    const isAdmin = currentUser.role === USER_ROLES.ADMIN;
    const isMaster = currentUser.role === USER_ROLES.MASTER;
    
    console.log('User roles:', { isDirector, isAdmin, isMaster });

    // Показываем соответствующий интерфейс
    const masterInterface = document.getElementById('master-interface');
    const adminInterface = document.getElementById('admin-interface');
    
    if (masterInterface && adminInterface) {
        if (isMaster) {
            console.log('Showing master interface');
            masterInterface.classList.remove('hidden');
            adminInterface.classList.add('hidden');
            // Инициализируем интерфейс мастера
            initMasterInterface();
        } else if (isDirector || isAdmin) {
            console.log('Showing admin interface');
            adminInterface.classList.remove('hidden');
            masterInterface.classList.add('hidden');
            // Инициализируем интерфейс администратора
            initAdminInterface();
        } else {
            // Если роль не определена, показываем мастерский интерфейс по умолчанию
            console.log('Showing default master interface');
            masterInterface.classList.remove('hidden');
            adminInterface.classList.add('hidden');
            initMasterInterface();
        }
    } else {
        console.error('Interface containers not found');
    }
}

function getRoleDisplay(role) {
    const roles = {
        [USER_ROLES.DIRECTOR]: 'Директор',
        [USER_ROLES.ADMIN]: 'Администратор',
        [USER_ROLES.MASTER]: 'Мастер'
    };
    return roles[role] || 'Пользователь';
}

// --- Инициализация интерфейсов ---
function initMasterInterface() {
    console.log('Initializing master interface');
    loadAndDisplayEntries();
    updateMasterKPI();
}

function initAdminInterface() {
    console.log('Initializing admin interface');
    showView('overview');
    updateAdminKPI();
}

// --- Навигация по вкладкам ---
function showView(viewName) {
    console.log(`Switching to view: ${viewName}`);
    currentView = viewName;

    // Скрываем все вкладки админ-панели
    document.querySelectorAll('#admin-interface .tab-pane').forEach(tab => {
        tab.classList.add('hidden');
    });

    // Показываем выбранную вкладку
    const targetTab = document.getElementById(`${viewName}-tab`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }

    // Обновляем активные кнопки навигации
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });
    
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${viewName}-tab"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.setAttribute('aria-selected', 'true');
    }

    // Обновляем данные в зависимости от вкладки
    switch(viewName) {
        case 'overview':
            updateOverviewTab();
            break;
        case 'masters':
            updateMastersTab();
            break;
        case 'analytics':
            updateAnalyticsTab();
            break;
        case 'journal':
            loadAndDisplayEntries();
            break;
    }
}

// --- Обновление вкладок админ-панели ---
async function updateOverviewTab() {
    console.log('Updating overview tab');
    try {
        const allEntries = await getAllEntries();
        const allMastersData = getAllMastersData();
        
        // Обновляем KPI
        document.getElementById('total-revenue').textContent = formatMoney(
            allEntries.reduce((sum, e) => sum + (e.workCost || 0) + (e.partsCost || 0), 0)
        );
        document.getElementById('total-jobs').textContent = allEntries.length;
        document.getElementById('active-masters').textContent = Object.keys(allMastersData).length;
        document.getElementById('revenue-growth').textContent = '+0%';
        
        // Обновляем графики
        updateCharts('month');
    } catch (error) {
        console.error('Error updating overview:', error);
        showNotification('Ошибка при обновлении данных обзора', 'error');
    }
}

async function updateMastersTab() {
    console.log('Updating masters tab');
    try {
        const mastersData = getAllMastersData();
        const mastersGrid = document.getElementById('masters-grid');
        if (!mastersGrid) return;

        mastersGrid.innerHTML = '';

        Object.values(mastersData).forEach(master => {
            const masterCard = document.createElement('div');
            masterCard.className = 'master-card';
            masterCard.innerHTML = `
                <div class="master-header">
                    <div class="master-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="master-info">
                        <h4 class="master-name">${master.name}</h4>
                        <p class="master-position">Мастер</p>
                    </div>
                </div>
                <div class="master-stats">
                    <div class="stat-item">
                        <div class="stat-value">${formatMoney(master.totalRevenue || 0)}</div>
                        <div class="stat-label">Выручка</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${master.totalJobs || 0}</div>
                        <div class="stat-label">Работы</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${master.currentBonusLevel || 0}</div>
                        <div class="stat-label">Бонус</div>
                    </div>
                </div>
                <div class="master-actions">
                    <button class="icon-btn" onclick="window.openBonusModal('${master.name}')">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="icon-btn">
                        <i class="fas fa-chart-line"></i>
                    </button>
                </div>
            `;
            mastersGrid.appendChild(masterCard);
        });
    } catch (error) {
        console.error('Error updating masters tab:', error);
        showNotification('Ошибка при обновлении данных мастеров', 'error');
    }
}

async function updateAnalyticsTab() {
    console.log('Updating analytics tab');
    updateCharts('month');
}

// --- Работа с журналом мастера ---
async function loadAndDisplayEntries(filter = {}) {
    console.log('Loading entries for master:', currentUser.name);
    try {
        let allEntries = await getAllEntries();
        
        // Фильтруем записи только для текущего мастера
        const masterEntries = allEntries.filter(entry => entry.master === currentUser.name);
        
        // Применяем дополнительные фильтры
        let filteredEntries = masterEntries;
        if (filter.period) {
            filteredEntries = filterEntriesByPeriod(filteredEntries, filter.period);
        }
        if (filter.search) {
            const searchTerm = filter.search.toLowerCase();
            filteredEntries = filteredEntries.filter(entry => 
                entry.car.toLowerCase().includes(searchTerm) ||
                (entry.client && entry.client.toLowerCase().includes(searchTerm)) ||
                entry.services.some(service => service.toLowerCase().includes(searchTerm))
            );
        }
        
        renderGroupedEntries(filteredEntries);
        updateMasterKPI();
    } catch (error) {
        console.error('Error loading entries:', error);
        showNotification('Ошибка загрузки записей', 'error');
    }
}

function renderGroupedEntries(entries) {
    const container = document.getElementById('master-jobs-list');
    if (!container) {
        console.error('Container #master-jobs-list not found');
        return;
    }

    if (entries.length === 0) {
        container.innerHTML = `
            <div class="no-entries" role="status">
                <i class="fas fa-folder-open"></i>
                <p>Нет записей для отображения</p>
            </div>
        `;
        return;
    }

    // Группировка по дате
    const grouped = entries.reduce((acc, entry) => {
        const date = entry.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry);
        return acc;
    }, {});

    // Сортировка дат по убыванию
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

    let html = '';
    sortedDates.forEach(date => {
        html += `<div class="entries-group">
                    <h4 class="entries-date">${formatDateDisplay(date)}</h4>
                    <div class="entries-cards">`;
        
        grouped[date].forEach(entry => {
            html += createEntryCard(entry);
        });
        
        html += `</div></div>`;
    });

    container.innerHTML = html;
}

function createEntryCard(entry) {
    return `
        <div class="entry-card" data-entry-id="${entry.id}">
            <div class="entry-header">
                <h5 class="entry-car">${entry.car}</h5>
                <div class="entry-actions">
                    <button class="icon-btn edit-entry" data-entry-id="${entry.id}" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn delete-entry" data-entry-id="${entry.id}" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="entry-details">
                <p><i class="fas fa-user"></i> ${entry.client || 'Клиент не указан'}</p>
                <p><i class="fas fa-list"></i> ${entry.services.join(', ')}</p>
                <p class="entry-cost"><i class="fas fa-sack-dollar"></i> ${formatMoney((entry.workCost || 0) + (entry.partsCost || 0))}</p>
            </div>
            <div class="entry-footer">
                <span class="entry-master"><i class="fas fa-user-tag"></i> ${entry.master}</span>
                <span class="entry-time"><i class="fas fa-clock"></i> ${new Date(entry.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    `;
}

function updateMasterKPI() {
    if (currentUser.role !== USER_ROLES.MASTER) return;

    const masterData = getMasterData(currentUser.name);
    document.getElementById('master-today-earnings').textContent = formatMoney(0); // TODO: Реализовать
    document.getElementById('master-month-earnings').textContent = formatMoney(masterData.totalRevenue || 0);
    document.getElementById('master-jobs-count').textContent = masterData.totalJobs || 0;
    updateMasterBonus();
}

async function updateMasterBonus() {
    if (currentUser.role !== USER_ROLES.MASTER) return;

    const masterData = getMasterData(currentUser.name);
    const bonusLevel = masterData.currentBonusLevel || 0;
    document.getElementById('master-bonus-level').textContent = bonusLevel;

    const starsContainer = document.getElementById('master-bonus-stars');
    if (starsContainer) {
        starsContainer.innerHTML = '';
        const maxStars = 5;
        const filledStars = Math.min(bonusLevel, maxStars);
        for (let i = 0; i < maxStars; i++) {
            const star = document.createElement('i');
            star.className = `fas fa-star${i < filledStars ? '' : '-empty'}`;
            starsContainer.appendChild(star);
        }
    }
}

// --- Модальные окна ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    console.log(`Opening modal: ${modalId}`);
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
            // initBonusModal будет вызван с аргументом
            break;
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    console.log(`Closing modal: ${modalId}`);
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

    if (dateInput) {
        dateInput.value = formatDateInput(new Date());
    }

    selectedServices = [];
    updateSelectedServicesDisplay();

    if (form) {
        form.reset();
        if (dateInput) {
            dateInput.value = formatDateInput(new Date());
        }
    }
}

function initServicesModal() {
    console.log('Initializing services modal');
    const serviceSearch = document.getElementById('service-search');
    const servicesList = document.getElementById('services-list');

    if (serviceSearch && servicesList) {
        const recentServices = getRecent();
        const favoriteServices = getFavorites();

        servicesList.innerHTML = '';

        if (favoriteServices.length > 0) {
            const favCategory = document.createElement('div');
            favCategory.className = 'service-category';
            favCategory.innerHTML = `<div class="service-category-header"><i class="fas fa-star"></i> Избранные</div>`;
            const favSubcat = document.createElement('div');
            favSubcat.className = 'service-subcategory';
            favoriteServices.forEach(fav => {
                const serviceEl = document.createElement('div');
                serviceEl.className = 'service-item';
                serviceEl.dataset.service = fav.service;
                serviceEl.dataset.category = fav.category;
                serviceEl.dataset.subcategory = fav.subcat;
                serviceEl.innerHTML = `
                    <i class="fas fa-star"></i>
                    <span class="service-name">${fav.service}</span>
                    <span class="service-favorite">Избранное</span>
                `;
                serviceEl.addEventListener('click', () => selectServiceInModal(serviceEl));
                favSubcat.appendChild(serviceEl);
            });
            favCategory.appendChild(favSubcat);
            servicesList.appendChild(favCategory);
        }

        const recentSet = new Set(recentServices.map(r => r.service));
        const favSet = new Set(favoriteServices.map(f => f.service));
        const uniqueRecent = recentServices.filter(r => !favSet.has(r.service));

        if (uniqueRecent.length > 0) {
            const recCategory = document.createElement('div');
            recCategory.className = 'service-category';
            recCategory.innerHTML = `<div class="service-category-header"><i class="fas fa-clock"></i> Недавние</div>`;
            const recSubcat = document.createElement('div');
            recSubcat.className = 'service-subcategory';
            uniqueRecent.forEach(rec => {
                const serviceEl = document.createElement('div');
                serviceEl.className = 'service-item';
                serviceEl.dataset.service = rec.service;
                serviceEl.dataset.category = rec.category;
                serviceEl.dataset.subcategory = rec.subcat;
                serviceEl.innerHTML = `
                    <i class="fas fa-clock"></i>
                    <span class="service-name">${rec.service}</span>
                    <span class="service-recent">Недавнее</span>
                `;
                serviceEl.addEventListener('click', () => selectServiceInModal(serviceEl));
                recSubcat.appendChild(serviceEl);
            });
            recCategory.appendChild(recSubcat);
            servicesList.appendChild(recCategory);
        }

        serviceSearch.addEventListener('input', debounce(() => {
            const query = serviceSearch.value;
            if (query.length > 1) {
                const results = searchServices(query);
                displaySearchResults(results);
            } else {
                servicesList.innerHTML = '';
                if (favoriteServices.length > 0) {
                    // ... (повтор кода добавления избранных)
                }
                if (uniqueRecent.length > 0) {
                    // ... (повтор кода добавления недавних)
                }
            }
        }, 300));
    }
}

function displaySearchResults(results) {
    const servicesList = document.getElementById('services-list');
    if (!servicesList) return;

    servicesList.innerHTML = '';

    if (results.length === 0) {
        servicesList.innerHTML = '<div class="no-entries"><p>Услуги не найдены</p></div>';
        return;
    }

    const grouped = {};
    results.forEach(result => {
        if (!grouped[result.category]) {
            grouped[result.category] = {};
        }
        if (!grouped[result.category][result.subcat]) {
            grouped[result.category][result.subcat] = [];
        }
        grouped[result.category][result.subcat].push(result);
    });

    for (const [category, subcats] of Object.entries(grouped)) {
        const categoryEl = document.createElement('div');
        categoryEl.className = 'service-category';
        categoryEl.innerHTML = `<div class="service-category-header"><i class="fas fa-tools"></i> ${category}</div>`;

        for (const [subcat, services] of Object.entries(subcats)) {
            const subcatEl = document.createElement('div');
            subcatEl.className = 'service-subcategory';
            subcatEl.innerHTML = `<div class="service-subcategory-header"><i class="fas fa-toolbox"></i> ${subcat}</div>`;

            services.forEach(service => {
                const serviceEl = document.createElement('div');
                serviceEl.className = 'service-item';
                serviceEl.dataset.service = service.service;
                serviceEl.dataset.category = service.category;
                serviceEl.dataset.subcategory = service.subcat;
                let tagsHtml = '';
                if (service.isFavorite) tagsHtml += '<span class="service-favorite">Избранное</span>';
                if (service.isRecent) tagsHtml += '<span class="service-recent">Недавнее</span>';

                serviceEl.innerHTML = `
                    <i class="fas ${service.isFavorite ? 'fa-star' : 'fa-wrench'}"></i>
                    <span class="service-name">${service.service}</span>
                    ${tagsHtml}
                `;
                serviceEl.addEventListener('click', () => selectServiceInModal(serviceEl));
                subcatEl.appendChild(serviceEl);
            });

            categoryEl.appendChild(subcatEl);
        }

        servicesList.appendChild(categoryEl);
    }
}

function selectServiceInModal(serviceElement) {
    const serviceName = serviceElement.dataset.service;
    const category = serviceElement.dataset.category;
    const subcategory = serviceElement.dataset.subcategory;

    serviceElement.classList.toggle('selected');

    const servicePath = `${category}:${subcategory}:${serviceName}`;
    const index = selectedServices.findIndex(s => s.path === servicePath);
    if (index !== -1) {
        selectedServices.splice(index, 1);
    } else {
        selectedServices.push({ name: serviceName, path: servicePath });
        addToRecent(servicePath);
    }

    const confirmBtn = document.getElementById('services-confirm');
    if (confirmBtn) {
        confirmBtn.disabled = selectedServices.length === 0;
    }
}

// Функция для открытия модального окна бонусов (глобальная)
window.openBonusModal = function(masterName) {
    openModal('bonus-modal');
    initBonusModal(masterName);
};

function initBonusModal(masterName) {
    const masterData = getMasterData(masterName);
    if (!masterData) return;

    document.getElementById('bonus-master-name').textContent = masterData.name;
    document.getElementById('bonus-master-stats').textContent = `Выручка за всё время: ${formatMoney(masterData.totalRevenue || 0)}`;

    const slider = document.getElementById('bonus-slider');
    const bonusAmount = document.getElementById('bonus-amount');
    const bonusStarsDisplay = document.getElementById('bonus-stars-display');
    const bonusValueDisplay = document.getElementById('bonus-value-display');

    if (slider) {
        slider.value = masterData.currentBonusLevel || 0;
        bonusAmount.textContent = slider.value;
        updateBonusModalDisplay(slider.value, bonusStarsDisplay, bonusValueDisplay);

        slider.addEventListener('input', (e) => {
            const level = e.target.value;
            bonusAmount.textContent = level;
            updateBonusModalDisplay(level, bonusStarsDisplay, bonusValueDisplay);
        });
    }

    initBonusHistoryChart(masterName);

    const saveBtn = document.getElementById('save-bonus-btn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            const newLevel = parseInt(slider.value);
            const oldLevel = getBonusLevel(masterName);
            if (newLevel !== oldLevel) {
                setBonusLevel(masterName, newLevel);
                showNotification(`Уровень бонуса для ${masterData.name} изменен на ${newLevel}`, 'success');
                if (currentView === 'masters') {
                    updateMastersTab();
                }
            }
            closeModal('bonus-modal');
        };
    }
}

function updateBonusModalDisplay(level, starsContainer, valueContainer) {
    if (starsContainer) {
        starsContainer.innerHTML = '';
        const maxStars = 10;
        const filledStars = level;
        for (let i = 0; i < maxStars; i++) {
            const star = document.createElement('i');
            star.className = `fas fa-star${i < filledStars ? '' : '-empty'}`;
            if (i < filledStars) {
                if (i < 2) star.style.color = '#CD7F32';
                else if (i < 4) star.style.color = '#C0C0C0';
                else if (i < 6) star.style.color = '#FFD700';
                else if (i < 8) star.style.color = '#E5E4E2';
                else star.style.color = '#B9F2FF';
            }
            starsContainer.appendChild(star);
        }
    }

    if (valueContainer) {
        const percent = level * 1;
        valueContainer.textContent = `${percent}%`;
        valueContainer.style.color = level > 5 ? '#FFD700' : '#399D9C';
    }
}

function initBonusHistoryChart(masterName) {
    const bonusHistory = getMasterBonusHistory(masterName);
    const ctx = document.getElementById('bonus-history-chart')?.getContext('2d');
    if (!ctx) return;

    if (window.bonusHistoryChartInstance) {
        window.bonusHistoryChartInstance.destroy();
    }

    const labels = bonusHistory.map(b => {
        const date = new Date(b.timestamp);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    });
    const data = bonusHistory.map(b => b.level);

    window.bonusHistoryChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Уровень бонуса',
                data: data,
                borderColor: '#399D9C',
                backgroundColor: 'rgba(57, 157, 156, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#399D9C',
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#399D9C',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    borderWidth: 0,
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// --- Утилиты ---
function filterEntriesByPeriod(entries, period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

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

function updateSelectedServicesDisplay() {
    const container = document.getElementById('selected-services');
    const hiddenInput = document.getElementById('job-services');

    if (!container) return;

    if (selectedServices.length === 0) {
        container.innerHTML = '<span class="placeholder-text">Нажмите для выбора услуг</span>';
        if (hiddenInput) hiddenInput.value = '';
    } else {
        container.innerHTML = selectedServices.map(service =>
            `<span class="service-tag">
                ${service.name}
                <i class="fas fa-times remove-service" data-service-path="${service.path}"></i>
            </span>`
        ).join('');

        if (hiddenInput) hiddenInput.value = selectedServices.map(s => s.name).join(', ');
    }

    container.querySelectorAll('.remove-service').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = btn.dataset.servicePath;
            selectedServices = selectedServices.filter(s => s.path !== path);
            updateSelectedServicesDisplay();
        });
    });
}

// --- Обработка ошибок и уведомления ---
function showNotification(message, type = 'info') {
    utilsShowNotification(message, type);
}

function handleError(error, context = '') {
    console.error(`Ошибка ${context}:`, error);
    showNotification(`Произошла ошибка${context ? ` при ${context}` : ''}. Попробуйте позже.`, 'error');
}

// --- Инициализация обработчиков событий ---
function setupEventListeners() {
    // Обработчики для кнопок открытия модальных окон
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            openModal(modalId);
        });
    });

    // Обработчики для кнопок закрытия модальных окон
    document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });

    // Закрытие модального окна по клику на оверлей
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Обработчики для навигации по вкладкам
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            const viewName = tabId.replace('-tab', '');
            showView(viewName);
        });
    });

    // Обработчики для фильтров в журнале мастера
    const jobsSearch = document.getElementById('jobs-search');
    if (jobsSearch) {
        jobsSearch.addEventListener('input', debounce(() => {
            const filter = { search: jobsSearch.value };
            loadAndDisplayEntries(filter);
        }, 300));
    }

    const jobsPeriodFilter = document.getElementById('jobs-period-filter');
    if (jobsPeriodFilter) {
        jobsPeriodFilter.addEventListener('change', () => {
            const filter = { period: jobsPeriodFilter.value };
            loadAndDisplayEntries(filter);
        });
    }

    // Обработчики для формы добавления работы
    const addJobForm = document.getElementById('add-job-form');
    if (addJobForm) {
        addJobForm.addEventListener('submit', handleJobSubmit);
    }

    // Обработчик для кнопки выбора услуг
    const selectServicesBtn = document.getElementById('select-services-btn');
    if (selectServicesBtn) {
        selectServicesBtn.addEventListener('click', () => openModal('services-modal'));
    }

    // Обработчик для кнопки подтверждения выбора услуг
    const servicesConfirmBtn = document.getElementById('services-confirm');
    if (servicesConfirmBtn) {
        servicesConfirmBtn.addEventListener('click', () => {
            updateSelectedServicesDisplay();
            closeModal('services-modal');
        });
    }

    // Обработчики для закрытия модальных окон по клавише Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeModals.size > 0) {
            const lastModalId = Array.from(activeModals).pop();
            closeModal(lastModalId);
        }
    });

    // Обработчики для админ-панели
    const mastersSearch = document.getElementById('masters-search');
    if (mastersSearch) {
        mastersSearch.addEventListener('input', debounce(() => {
            console.log('Masters search:', mastersSearch.value);
        }, 300));
    }

    const viewCardsBtn = document.getElementById('view-cards');
    const viewListBtn = document.getElementById('view-list');
    if (viewCardsBtn && viewListBtn) {
        viewCardsBtn.addEventListener('click', () => {
            viewCardsBtn.classList.add('active');
            viewListBtn.classList.remove('active');
        });
        viewListBtn.addEventListener('click', () => {
            viewListBtn.classList.add('active');
            viewCardsBtn.classList.remove('active');
        });
    }

    const periodSelect = document.getElementById('period-select');
    const customPeriod = document.getElementById('custom-period');
    if (periodSelect && customPeriod) {
        periodSelect.addEventListener('change', () => {
            if (periodSelect.value === 'custom') {
                customPeriod.classList.remove('hidden');
            } else {
                customPeriod.classList.add('hidden');
            }
        });
    }

    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            updateCharts(periodSelect.value);
            showNotification('Фильтры применены', 'success');
        });
    }

    const exportDataBtn = document.getElementById('export-data');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
            showNotification('Данные экспортированы (заглушка)', 'success');
        });
    }
}

// Обработчик отправки формы добавления работы
async function handleJobSubmit(e) {
    e.preventDefault();
    console.log('Handling job submit');

    const form = e.target;
    const formData = new FormData(form);

    const jobData = {
        id: Date.now().toString(),
        date: formData.get('job-date'),
        car: formData.get('job-car'),
        client: formData.get('job-client'),
        services: selectedServices.map(s => s.name),
        workCost: parseFloat(formData.get('job-work-cost')) || 0,
        partsCost: parseFloat(formData.get('job-parts-cost')) || 0,
        notes: formData.get('job-notes'),
        master: currentUser.name,
        timestamp: new Date().toISOString()
    };

    if (!jobData.date || !jobData.car || selectedServices.length === 0) {
        showNotification('Пожалуйста, заполните все обязательные поля', 'error');
        return;
    }

    try {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';

        await saveEntry(jobData);

        closeModal('add-job-modal');
        loadAndDisplayEntries();

        showNotification('Работа успешно добавлена!', 'success');
    } catch (error) {
        console.error('Error saving job:', error);
        showNotification('Ошибка при сохранении работы', 'error');
    } finally {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
        }
    }
}

// --- Экспорт функций ---
export {
    initializeApp,
    showView,
    openModal,
    closeModal,
    showNotification,
    updateMasterBonus,
    handleError
};