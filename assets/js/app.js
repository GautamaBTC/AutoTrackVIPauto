/*────────────────────────────────────────────
  assets/js/app.js | ЧАСТЬ 1: ОСНОВНАЯ ЛОГИКА
─────────────────────────────────────────────*/

import { initHeader } from './theme.js';
import { loadServicesCatalog } from './servicesCatalog.js';
import { getAllEntries, addEntry, updateEntry, deleteEntry } from './storage.js';
import { formatDateInput, formatDateDisplay, debounce } from './utils.js';

// Константы для ролей
const USER_ROLES = {
    DIRECTOR: 'director',
    ADMIN: 'admin',
    MASTER: 'master'
};

// Текущий пользователь и настройки
let currentUser = null;
let currentView = 'journal';
let selectedServices = [];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    // Проверка авторизации
    const userData = localStorage.getItem('vipauto_user') || sessionStorage.getItem('vipauto_user');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = JSON.parse(userData);
    initializeApp();
});

async function initializeApp() {
    // Инициализация компонентов
    initHeader();
    initUserMenu();
    initNavigation();
    await loadServicesCatalog();
    
    // Показываем интерфейс в зависимости от роли
    setupRoleBasedUI();
    
    // Загружаем начальный вид
    showView('journal');
}

// Инициализация меню пользователя
function initUserMenu() {
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    const userPositionEl = document.getElementById('user-position');
    const menuBtn = document.getElementById('user-menu-btn');
    const menuDropdown = document.querySelector('.user-menu-dropdown');
    const logoutBtn = document.getElementById('logout-btn');

    // Заполняем данные пользователя
    userNameEl.textContent = currentUser.name;
    userRoleEl.textContent = getRoleDisplay(currentUser.role);
    userPositionEl.textContent = currentUser.position;

    // Обработка клика по кнопке меню
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle('visible');
    });

    // Закрытие при клике вне меню
    document.addEventListener('click', () => {
        menuDropdown.classList.remove('visible');
    });

    // Обработка выхода
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('vipauto_user');
        sessionStorage.removeItem('vipauto_user');
        window.location.href = 'login.html';
    });
}

// Настройка интерфейса под роль
function setupRoleBasedUI() {
    const isDirector = currentUser.role === USER_ROLES.DIRECTOR;
    const isAdmin = currentUser.role === USER_ROLES.ADMIN;
    const isMaster = currentUser.role === USER_ROLES.MASTER;

    // Показываем/скрываем элементы в зависимости от роли
    document.querySelectorAll('.director-only').forEach(el => {
        el.classList.toggle('hidden', !isDirector);
    });

    document.querySelectorAll('.admin-only').forEach(el => {
        el.classList.toggle('hidden', !isDirector && !isAdmin);
    });

    // Для мастера показываем только его записи
    if (isMaster) {
        const masterFilter = document.getElementById('journal-filter');
        if (masterFilter) {
            masterFilter.value = currentUser.name;
            masterFilter.disabled = true;
        }
    }
}

// Навигация между разделами
function initNavigation() {
    const navButtons = {
        journal: document.getElementById('nav-journal'),
        analytics: document.getElementById('nav-analytics'),
        masters: document.getElementById('nav-masters'),
        settings: document.getElementById('nav-settings')
    };

    // Обработчики для кнопок навигации
    Object.entries(navButtons).forEach(([view, btn]) => {
        if (btn) {
            btn.addEventListener('click', () => showView(view));
        }
    });
}

// Показ выбранного раздела
function showView(viewName) {
    const views = {
        journal: document.getElementById('journal-section'),
        analytics: document.getElementById('analytics-section'),
        masters: document.getElementById('masters-section'),
        settings: document.getElementById('settings-section')
    };

    // Обновляем активную кнопку
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`nav-${viewName}`)?.classList.add('active');

    // Показываем выбранный раздел
    Object.entries(views).forEach(([name, section]) => {
        if (section) {
            section.classList.toggle('hidden', name !== viewName);
        }
    });

    // Инициализируем содержимое раздела
    if (viewName === 'journal') {
        initJournalView();
    } else if (viewName === 'analytics') {
        initAnalyticsView();
    } else if (viewName === 'masters') {
        initMastersView();
    }

    currentView = viewName;
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
/*────────────────────────────────────────────
  assets/js/app.js | ЧАСТЬ 2: ЖУРНАЛ И БОНУСЫ
─────────────────────────────────────────────*/

// Инициализация журнала
function initJournalView() {
    const entryForm = document.getElementById('entry-form');
    const serviceSelector = document.getElementById('services-selector');
    const journalSearch = document.getElementById('journal-search');
    const journalFilter = document.getElementById('journal-filter');

    // Заполняем форму текущей датой
    document.getElementById('entry-date').value = formatDateInput(new Date());

    // Обработчики формы
    entryForm.addEventListener('submit', handleEntrySubmit);
    serviceSelector.addEventListener('click', openServicesModal);
    journalSearch.addEventListener('input', debounce(filterEntries, 300));
    journalFilter.addEventListener('change', filterEntries);

    // Загружаем записи
    renderEntries();
}

// Обработка добавления записи
async function handleEntrySubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
        // Блокируем кнопку и показываем загрузку
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';

        const entry = {
            date: form.querySelector('#entry-date').value,
            master: form.querySelector('#entry-master').value,
            car: form.querySelector('#entry-car').value,
            services: selectedServices,
            workCost: parseFloat(form.querySelector('#entry-work-cost').value),
            partsCost: parseFloat(form.querySelector('#entry-parts-cost').value)
        };

        // Добавляем запись
        await addEntry(entry);
        
        // Очищаем форму
        form.reset();
        selectedServices = [];
        document.getElementById('services-selector').textContent = 
            'Нажмите, чтобы выбрать услуги...';

        // Обновляем список
        renderEntries();
        
        showNotification('Запись успешно добавлена!', 'success');
    } catch (error) {
        showNotification('Ошибка при сохранении записи', 'error');
    } finally {
        // Возвращаем кнопку в исходное состояние
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Добавить';
    }
}

// Отображение записей
function renderEntries(filter = '') {
    const entriesList = document.getElementById('entries-list');
    let entries = getAllEntries();

    // Фильтрация для мастера
    if (currentUser.role === USER_ROLES.MASTER) {
        entries = entries.filter(e => e.master === currentUser.name);
    }

    // Применяем поисковый фильтр
    if (filter) {
        const searchTerm = filter.toLowerCase();
        entries = entries.filter(e => 
            e.master.toLowerCase().includes(searchTerm) ||
            e.car.toLowerCase().includes(searchTerm) ||
            e.services.some(s => s.toLowerCase().includes(searchTerm))
        );
    }

    // Группируем по мастерам
    const grouped = entries.reduce((acc, entry) => {
        (acc[entry.master] = acc[entry.master] || []).push(entry);
        return acc;
    }, {});

    // Формируем HTML
    entriesList.innerHTML = Object.entries(grouped)
        .map(([master, masterEntries]) => {
            const totalRevenue = masterEntries.reduce((sum, e) => 
                sum + e.workCost + e.partsCost, 0);
            
            return `
                <div class="master-entries card">
                    <div class="card-header">
                        <div class="master-info">
                            <h3>${master}</h3>
                            <span class="text-muted">
                                Записей: ${masterEntries.length}
                            </span>
                        </div>
                        <div class="master-total">
                            <span class="text-muted">Выручка:</span>
                            <strong>${totalRevenue.toFixed(2)} ₽</strong>
                            ${currentUser.role === USER_ROLES.DIRECTOR ? `
                                <button class="btn btn-secondary btn-sm" 
                                        onclick="openBonusModal('${master}', ${totalRevenue})">
                                    <i class="fas fa-star"></i> Бонус
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="entries-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Дата</th>
                                    <th>Автомобиль</th>
                                    <th>Услуги</th>
                                    <th>Работа</th>
                                    <th>Запчасти</th>
                                    <th>Итого</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${masterEntries.map(entry => `
                                    <tr data-id="${entry.id}">
                                        <td>${formatDateDisplay(entry.date)}</td>
                                        <td>${entry.car}</td>
                                        <td>${entry.services.join(', ')}</td>
                                        <td>${entry.workCost.toFixed(2)} ₽</td>
                                        <td>${entry.partsCost.toFixed(2)} ₽</td>
                                        <td>
                                            <strong>
                                                ${(entry.workCost + entry.partsCost).toFixed(2)} ₽
                                            </strong>
                                        </td>
                                        <td class="actions">
                                            <button class="btn-icon" onclick="editEntry(${entry.id})">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn-icon" onclick="deleteEntry(${entry.id})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }).join('') || '<p class="text-muted text-center">Записей не найдено</p>';
}

// Система бонусов
function openBonusModal(master, revenue) {
    const modal = document.getElementById('bonus-modal');
    const masterNameEl = document.getElementById('bonus-master-name');
    const slider = document.getElementById('bonus-slider');
    const currentBonus = document.getElementById('current-bonus');
    const bonusAmount = document.getElementById('bonus-amount');

    masterNameEl.textContent = master;
    
    // Обновление бонуса при движении ползунка
    slider.addEventListener('input', () => {
        const bonusPercent = calculateBonusPercent(parseInt(slider.value));
        const amount = (revenue * bonusPercent / 100).toFixed(2);
        
        currentBonus.textContent = `+${bonusPercent}%`;
        bonusAmount.textContent = `${amount} ₽`;
    });

    modal.classList.add('visible');
}

function calculateBonusPercent(level) {
    const bonusLevels = {
        0: 0,   // Базовый уровень
        1: 3,   // +3%
        2: 5,   // +5%
        3: 7,   // +7%
        4: 9,   // +9%
        5: 11,  // +11%
        6: 13,  // +13%
        7: 15,  // +15%
        8: 17,  // +17%
        9: 19,  // +19%
        10: 20  // +20%
    };
    return bonusLevels[level] || 0;
}

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                            type === 'error' ? 'exclamation-circle' : 
                            'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Экспортируем необходимые функции
export {
    initJournalView,
    renderEntries,
    openBonusModal,
    showNotification
};
