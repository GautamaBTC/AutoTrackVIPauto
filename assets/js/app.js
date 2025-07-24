import { initHeader } from './theme.js';
import { loadServicesCatalog } from './servicesCatalog.js';
import { getUsers, getAllEntries, addEntry, updateEntry, deleteEntry } from './storage.js';
import { formatDateInput, formatDateDisplay, debounce } from './utils.js';

// ... (весь остальной код app.js остается точно таким же, как я присылал в прошлый раз)
// Главное - наличие import { initHeader } from './theme.js'; и вызова initHeader();
let currentFilter = '';

document.addEventListener('DOMContentLoaded', async () => {
  initHeader(); // <-- ВКЛЮЧАЕМ ХЭДЕР
  await loadServicesCatalog();
  document.getElementById('switch-to-log').addEventListener('click', () => showSection('log'));
  document.getElementById('switch-to-analytics').addEventListener('click', () => showSection('analytics'));
  showSection('log');
  initLogView();
});

// ... (далее все остальные функции initLogView, renderEntries и т.д. без изменений)
function showSection(name) {
  const logView = document.getElementById('log-view');
  const analyticsView = document.getElementById('analytics-view');
  const switchToLogBtn = document.getElementById('switch-to-log');
  const switchToAnalyticsBtn = document.getElementById('switch-to-analytics');
  
  if (name === 'log') {
    logView.style.display = 'block';
    analyticsView.style.display = 'none';
    switchToLogBtn.classList.add('active');
    switchToAnalyticsBtn.classList.remove('active');
  } else {
    logView.style.display = 'none';
    analyticsView.style.display = 'block';
    switchToLogBtn.classList.remove('active');
    switchToAnalyticsBtn.classList.add('active');
  }
}

function initLogView() {
  const container = document.getElementById('log-view');
  container.innerHTML = `
    <div class="log-search">
      <input type="search" id="log-search-input"
             placeholder="Поиск по мастеру или машине…">
    </div>
    <form id="entry-form" class="entry-form">
      <h2>Добавить запись</h2>
      <div class="form-row">
        <label>Дата:<input type="date" id="entry-date" required></label>
        <label>Мастер:
          <select id="entry-master" required>
            <option value="" disabled selected>Выберите мастера</option>
            ${getUsers().map(u => `<option value="${u}">${u}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="form-row">
        <label>Автомобиль:<input type="text" id="entry-car"
             placeholder="Напр. Kia Rio" required></label>
      </div>
      <div class="form-row">
        <label>Услуги:
          <div id="service-field" class="service-field">Нажмите, чтобы выбрать услуги…</div>
          <input type="hidden" id="entry-services" name="services">
        </label>
      </div>
      <div class="form-row">
        <label>Работа:<input type="number" id="entry-workCost"
             min="0" value="0" required></label>
        <label>Запчасти:<input type="number" id="entry-partsMarkup"
             min="0" value="0" required></label>
      </div>
      <div class="form-actions">
        <button type="submit" id="btn-submit">Добавить</button>
        <button type="button" id="btn-cancel" class="hidden">Отмена</button>
      </div>
    </form>
    <hr/>
    <h2 id="log-heading"></h2>
    <div id="summary-block"></div>
    <div id="entries-list"></div>
  `;
  document.getElementById('entry-date').value = formatDateInput(new Date());
  document.getElementById('entry-form').addEventListener('submit', onFormSubmit);
  document.getElementById('btn-cancel').addEventListener('click', resetForm);
  // document.getElementById('service-field').addEventListener('click', openServiceModal);
  const searchInput = document.getElementById('log-search-input');
  searchInput.addEventListener('input', debounce(e => {
    currentFilter = e.target.value.trim().toLowerCase();
    renderEntries();
  }, 300));
  renderEntries();
}

function onFormSubmit(e) { /* ... без изменений ... */ }
function resetForm() { /* ... без изменений ... */ }
function renderEntries() {
  const all = getAllEntries();
  let entriesToRender = all; // Логика фильтрации по дате будет позже
  if (currentFilter) {
      entriesToRender = entriesToRender.filter(e =>
          e.master.toLowerCase().includes(currentFilter) ||
          e.car.toLowerCase().includes(currentFilter)
      );
  }
  const listEl = document.getElementById('entries-list');
  listEl.innerHTML = ''; // Очищаем список
  const grouped = entriesToRender.reduce((acc, e) => {
      (acc[e.master] = acc[e.master] || []).push(e);
      return acc;
  }, {});
  Object.entries(grouped).forEach(([master, entries]) => {
      const accordion = document.createElement('div');
      accordion.className = 'accordion';
      const totalSum = entries.reduce((sum, e) => sum + e.workCost + e.partsMarkup, 0);
      accordion.innerHTML = `
          <div class="accordion-header">
              <h3>${master}</h3>
              <span>Всего: ${totalSum.toFixed(2)} ₽</span>
          </div>
          <div class="accordion-body">
              <table>
                  <thead>
                      <tr><th>Авто</th><th>Услуги</th><th>Работа</th><th>Запчасти</th><th>Итого</th><th></th></tr>
                  </thead>
                  <tbody>
                      ${entries.map(e => `
                          <tr data-id="${e.id}">
                              <td>${e.car}</td>
                              <td>${e.services.join(', ')}</td>
                              <td>${e.workCost.toFixed(2)}</td>
                              <td>${e.partsMarkup.toFixed(2)}</td>
                              <td>${(e.workCost + e.partsMarkup).toFixed(2)}</td>
                              <td>
                                  <button class="btn-edit"><i class="fas fa-edit"></i></button>
                                  <button class="btn-delete"><i class="fas fa-trash"></i></button>
                              </td>
                          </tr>`).join('')}
                  </tbody>
              </table>
          </div>
      `;
      listEl.appendChild(accordion);
  });
  initAccordions();
  initRowButtons();
  const total = entriesToRender.reduce((s, e) => s + e.workCost + e.partsMarkup, 0);
  document.getElementById('summary-block').innerHTML = `<p><strong>Общая выручка:</strong> ${total.toFixed(2)} ₽</p><p><strong>Доля сервиса:</strong> ${(total / 2).toFixed(2)} ₽</p>`;
}
function initAccordions() { /* ... без изменений ... */ }
function initRowButtons() { /* ... без изменений ... */ }
function startEdit(id) { /* ... без изменений ... */ }
