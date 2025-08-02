/*────────────────────────────────────────────
  assets/js/app.js | ПОЛНЫЙ ОБНОВЛЁННЫЙ ФАЙЛ
─────────────────────────────────────────────*/

import { initHeader } from './theme.js';
import { loadServicesCatalog, getServicesStats } from './servicesCatalog.js';
import { getAllEntries, addEntry, updateEntry, deleteEntry, getUserByLogin } from './storage.js';
import { formatDateInput, formatDateDisplay, formatMoney, debounce, showNotification as utilsShowNotification } from './utils.js';
import { initCharts, updateCharts } from './charts.js';

// Константы
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

// Критерии для автоматического расчета бонуса
const BONUS_CRITERIA = {
    jobs: { min: 50, bonus: 2 },
    revenue: { min: 100000, bonus: 3 },
    servicesVariety: { min: 20, bonus: 1 } // From stats
};

// Состояние
let currentUser = null;
let currentView = 'journal'; // Для мастеров это 'journal', для админов/директоров 'overview' по умолчанию
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
    
    // Устанавливаем начальный вид в зависимости от роли
    const initialView = currentUser.role === USER_ROLES.MASTER ? 'journal' : 'overview';
    showView(initialView);
    
    setupEventListeners();
    console.log('App initialized'); // Debug
}

function initUserInterface() {
    console.log('Init user interface'); // Debug
    
    // Заполняем информацию о пользователе в хедере
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    
    if (userNameEl) userNameEl.textContent = currentUser.name;
    if (userRoleEl) userRoleEl.textContent = getRoleDisplay(currentUser.role);

    // Инициализация меню пользователя
    initUserMenu();

    // Быстрые действия (если есть)
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
    // Обработчики для быстрых действий, если они есть в интерфейсе
    const quickAddJobBtn = document.getElementById('add-job-btn') || document.getElementById('quick-add-job');
    if (quickAddJobBtn) {
        quickAddJobBtn.addEventListener('click', () => openModal('add-job-modal'));
    }
}

/**
 * Настраивает UI в зависимости от роли пользователя
 */
function setupRoleBasedUI() {
    console.log('Setting up role-based UI for:', currentUser); // Debug
    
    if (!currentUser) {
        console.warn('No current user, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    const isDirector = currentUser.role === USER_ROLES.DIRECTOR;
    const isAdmin = currentUser.role === USER_ROLES.ADMIN;
    const isMaster = currentUser.role === USER_ROLES.MASTER;
    
    console.log('User roles:', { isDirector, isAdmin, isMaster }); // Debug

    // Показываем соответствующий интерфейс
    const masterInterface = document.getElementById('master-interface');
    const adminInterface = document.getElementById('admin-interface');
    
    if (masterInterface && adminInterface) {
        if (isMaster) {
            console.log('Showing master interface'); // Debug
            masterInterface.classList.remove('hidden');
            adminInterface.classList.add('hidden');
            // Инициализируем интерфейс мастера
            initMasterInterface();
        } else if (isDirector || isAdmin) {
            console.log('Showing admin interface'); // Debug
            adminInterface.classList.remove('hidden');
            masterInterface.classList.add('hidden');
            // Инициализируем интерфейс администратора
            initAdminInterface();
        } else {
            // Если роль не определена, показываем мастерский интерфейс по умолчанию
            console.log('Showing default master interface'); // Debug
            masterInterface.classList.remove('hidden');
            adminInterface.classList.add('hidden');
            initMasterInterface();
        }
    } else {
        console.error('Interface containers not found');
    }

    // Обновляем информацию о пользователе в хедере (уже сделано в initUserInterface)
}

function getRoleDisplay(role) {
    const roles = {
        [USER_ROLES.DIRECTOR]: 'Директор',
        [USER_ROLES.ADMIN]: 'Администратор',
        [USER_ROLES.MASTER]: 'Мастер'
    };
    return roles[role] || 'Пользователь';
}

// Инициализация интерфейса мастера
function initMasterInterface() {
    console.log('Initializing master interface');
    // Здесь будет код инициализации интерфейса мастера
    loadAndDisplayEntries(); // Загружаем записи для текущего мастера
    updateMasterKPI(); // Обновляем KPI
}

// Инициализация интерфейса администратора
function initAdminInterface() {
    console.log('Initializing admin interface');
    // Здесь будет код инициализации интерфейса администратора
    showView('overview'); // Показываем вкладку "Обзор" по умолчанию
    updateAdminKPI(); // Обновляем KPI
}

/**
 * Показывает определенный вид/вкладку
 */
function showView(viewName) {
    console.log(`Switching to view: ${viewName}`); // Debug
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

// --- Функции обновления вкладок админ-панели ---
async function updateOverviewTab() {
    console.log('Updating overview tab');
    // Здесь будет логика обновления данных на вкладке "Обзор"
    // Например, загрузка общей статистики и обновление графиков
    const allEntries = await getAllEntries();
    // Обновляем KPI
    document.getElementById('total-revenue').textContent = formatMoney(
        allEntries.reduce((sum, e) => sum + e.workCost + e.partsCost, 0)
    );
    document.getElementById('total-jobs').textContent = allEntries.length;
    document.getElementById('active-masters').textContent = '6'; // Заглушка
    
    // Обновляем графики
    updateCharts('month'); // Заглушка для периода
}

async function updateMastersTab() {
    console.log('Updating masters tab');
    // Здесь будет логика обновления данных на вкладке "Мастера"
    // Например, загрузка списка мастеров и их статистики
}

async function updateAnalyticsTab() {
    console.log('Updating analytics tab');
    // Здесь будет логика обновления данных на вкладке "Аналитика"
    // Например, загрузка и отображение графиков
    updateCharts('month'); // Заглушка для периода
}

// --- Функции работы с журналом мастера ---
async function loadAndDisplayEntries(filter = {}) {
    console.log('Loading entries for master:', currentUser.name);
    try {
        let allEntries = await getAllEntries();
        
        // Фильтруем записи только для текущего мастера
        const masterEntries = allEntries.filter(entry => entry.master === currentUser.name);
        
        // Применяем дополнительные фильтры, если они есть
        let filteredEntries = masterEntries;
        if (filter.period) {
            filteredEntries = filterEntriesByPeriod(filteredEntries, filter.period);
        }
        if (filter.search) {
            // Простая текстовая фильтрация
            const searchTerm = filter.search.toLowerCase();
            filteredEntries = filteredEntries.filter(entry => 
                entry.car.toLowerCase().includes(searchTerm) ||
                entry.client.toLowerCase().includes(searchTerm) ||
                entry.services.some(service => service.toLowerCase().includes(searchTerm))
            );
        }
        
        renderGroupedEntries(filteredEntries);
        updateMasterKPI(); // Обновляем KPI после загрузки записей
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
                <p class="entry-cost"><i class="fas fa-sack-dollar"></i> ${formatMoney(entry.workCost + entry.partsCost)}</p>
            </div>
            <div class="entry-footer">
                <span class="entry-master"><i class="fas fa-user-tag"></i> ${entry.master}</span>
                <span class="entry-time"><i class="fas fa-clock"></i> ${new Date(entry.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    `;
}

function updateMasterKPI() {
    // Заглушка для обновления KPI мастера
    // В реальной реализации здесь будет логика расчета статистики
    document.getElementById('master-today-earnings').textContent = formatMoney(0);
    document.getElementById('master-month-earnings').textContent = formatMoney(0);
    document.getElementById('master-jobs-count').textContent = '0';
    // Бонусы обновляются отдельно
    updateMasterBonus();
}

async function updateMasterBonus() {
    // Заглушка для обновления уровня бонуса
    const bonusLevel = 0; // Заглушка
    document.getElementById('master-bonus-level').textContent = bonusLevel;
    
    // Обновление звездочек бонуса
    const starsContainer = document.getElementById('master-bonus-stars');
    if (starsContainer) {
        starsContainer.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('i');
            star.className = `fas fa-star${i <= bonusLevel ? '' : '-empty'}`;
            starsContainer.appendChild(star);
        }
    }
}

// --- Модальные окна ---
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
    
    // Устанавливаем сегодняшнюю дату по умолчанию
    if (dateInput) {
        dateInput.value = formatDateInput(new Date());
    }
    
    // Очищаем выбранные услуги
    selectedServices = [];
    updateSelectedServicesDisplay();
    
    // Сброс формы (если нужно)
    if (form) {
        form.reset();
        // Но восстанавливаем дату
        if (dateInput) {
            dateInput.value = formatDateInput(new Date());
        }
    }
}

function initServicesModal() {
    // Логика инициализации модального окна выбора услуг
    console.log('Initializing services modal');
}

function initBonusModal() {
    // Логика инициализации модального окна бонусов
    console.log('Initializing bonus modal');
}

// --- Утилиты ---
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
                ${service}
                <i class="fas fa-times remove-service" data-service="${service}"></i>
            </span>`
        ).join('');
        
        if (hiddenInput) hiddenInput.value = selectedServices.join(', ');
    }
}

// --- Обработка ошибок и уведомления ---
function showNotification(message, type = 'info') {
    // Используем функцию из utils.js или свою реализацию
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
            // Находим ближайшее родительское модальное окно
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
    
    // Обработчики для закрытия модальных окон по клавише Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeModals.size > 0) {
            // Закрываем последнее открытое модальное окно
            const lastModalId = Array.from(activeModals).pop();
            closeModal(lastModalId);
        }
    });
}

// Обработчик отправки формы добавления работы
async function handleJobSubmit(e) {
    e.preventDefault();
    console.log('Handling job submit');
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Собираем данные из формы
    const jobData = {
        id: Date.now().toString(), // Временный ID
        date: formData.get('job-date'),
        car: formData.get('job-car'),
        client: formData.get('job-client'),
        services: selectedServices, // Получаем из состояния selectedServices
        workCost: parseFloat(formData.get('job-work-cost')) || 0,
        partsCost: parseFloat(formData.get('job-parts-cost')) || 0,
        notes: formData.get('job-notes'),
        master: currentUser.name, // Добавляем имя текущего мастера
        timestamp: new Date().toISOString()
    };
    
    // Валидация
    if (!jobData.date || !jobData.car || selectedServices.length === 0) {
        showNotification('Пожалуйста, заполните все обязательные поля', 'error');
        return;
    }
    
    try {
        // Блокируем кнопку отправки
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
        
        // Сохраняем запись (в localStorage через storage.js)
        await addEntry(jobData);
        
        // Закрываем модальное окно
        closeModal('add-job-modal');
        
        // Перезагружаем список записей
        loadAndDisplayEntries();
        
        showNotification('Работа успешно добавлена!', 'success');
    } catch (error) {
        console.error('Error saving job:', error);
        showNotification('Ошибка при сохранении работы', 'error');
    } finally {
        // Разблокируем кнопку
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
        }
    }
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