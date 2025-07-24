//───────────────────────────────────────────────────────────────────
// File: assets/js/app.js
// VIPавто Облачный бортовой журнал — окончательный CRUD + услуги + поиск
//───────────────────────────────────────────────────────────────────

import {
  loadServicesCatalog,
  getServicesCatalog
} from './servicesCatalog.js';

import {
  getUsers,
  getAllEntries,
  addEntry,
  updateEntry,
  deleteEntry
} from './storage.js';

import {
  formatDateInput,
  formatDateDisplay,
  debounce
} from './utils.js';

let currentFilter = '';

document.addEventListener('DOMContentLoaded', async () => {
  // 1) подгрузить каталог услуг
  await loadServicesCatalog();

  // 2) переключатели Журнал/Аналитика
  document.getElementById('switch-to-log')
    .addEventListener('click', () => showSection('log'));
  document.getElementById('switch-to-analytics')
    .addEventListener('click', () => showSection('analytics'));
  showSection('log');

  // 3) инициализация Журнала
  initLogView();
});

function showSection(name) {
  document.getElementById('log-view').classList.toggle('active', name === 'log');
  document.getElementById('analytics-view').classList.toggle('active', name === 'analytics');
  document.getElementById('switch-to-log').classList.toggle('active', name === 'log');
  document.getElementById('switch-to-analytics').classList.toggle('active', name === 'analytics');
}

function initLogView() {
  const container = document.getElementById('log-view');
  container.innerHTML = `
    <div class="log-search">
      <input type="search" id="log-search-input"
             placeholder="Поиск по мастеру или машине…">
    </div>
    <h2>Добавить запись</h2>
    <form id="entry-form" class="entry-form">
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
    <div id="entries-list"></div>
    <div id="summary-block"></div>
  `;

  // default date
  document.getElementById('entry-date').value = formatDateInput(new Date());

  // привязка событий
  document.getElementById('entry-form').addEventListener('submit', onFormSubmit);
  document.getElementById('btn-cancel').addEventListener('click', resetForm);
  document.getElementById('service-field').addEventListener('click', openServiceModal);

  // поиск с debounce
  const searchInput = document.getElementById('log-search-input');
  searchInput.addEventListener('input',
    debounce(e => {
      currentFilter = e.target.value.trim().toLowerCase();
      renderEntries();
    }, 300)
  );

  // первоначальный рендер
  renderEntries();
}

function onFormSubmit(e) {
  e.preventDefault();
  const dateVal  = document.getElementById('entry-date').value;
  const master   = document.getElementById('entry-master').value;
  const car      = document.getElementById('entry-car').value.trim();
  const services = JSON.parse(document.getElementById('entry-services').value || '[]');
  const workCost = parseFloat(document.getElementById('entry-workCost').value) || 0;
  const partsMk  = parseFloat(document.getElementById('entry-partsMarkup').value) || 0;

  if (!dateVal || !master || !car || services.length === 0) {
    alert('Заполните все поля, включая услуги.');
    return;
  }

  addEntry({ date: dateVal, master, car, services, workCost, partsMarkup: partsMk });
  resetForm();
  renderEntries();
}

function resetForm() {
  const formEl = document.getElementById('entry-form');
  formEl.reset();
  document.getElementById('entry-date').value = formatDateInput(new Date());
  document.getElementById('service-field').textContent = 'Нажмите, чтобы выбрать услуги…';
  document.getElementById('entry-services').value = '';
  document.getElementById('btn-submit').textContent = 'Добавить';
  document.getElementById('btn-cancel').classList.add('hidden');
  formEl.onsubmit = onFormSubmit;
}

function renderEntries() {
  const all    = getAllEntries();
  const today  = formatDateInput(new Date());
  let todays   = all.filter(e => e.date === today);

  if (currentFilter) {
    todays = todays.filter(e =>
      e.master.toLowerCase().includes(currentFilter) ||
      e.car.toLowerCase().includes(currentFilter)
    );
  }

  document.getElementById('log-heading').textContent = todays.length
    ? `Записи за ${formatDateDisplay(today)}`
    : 'Нет записей за сегодня';

  const listEl = document.getElementById('entries-list');
  listEl.innerHTML = '';
  const grouped = todays.reduce((acc,e)=>{
    (acc[e.master] = acc[e.master]||[]).push(e);
    return acc;
  },{});

  Object.entries(grouped).forEach(([master, entries])=>{
    const sum = entries.reduce((s,e)=>s+e.workCost+e.partsMarkup,0);
    const html = `
      <div class="accordion">
        <div class="accordion-header">
          <h3>${master}</h3>
          <span>Всего: ${sum.toFixed(2)} ₽</span>
        </div>
        <div class="accordion-body">
          <table>
            <thead>
              <tr><th>Авто</th><th>Услуги</th><th>Работа</th><th>Запчасти</th><th>Итого</th><th></th></tr>
            </thead>
            <tbody>
              ${entries.map(e=>`
                <tr data-id="${e.id}">
                  <td>${e.car}</td>
                  <td>${e.services.join(', ')}</td>
                  <td>${e.workCost.toFixed(2)}</td>
                  <td>${e.partsMarkup.toFixed(2)}</td>
                  <td>${(e.workCost+e.partsMarkup).toFixed(2)}</td>
                  <td>
                    <button class="btn-edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    listEl.insertAdjacentHTML('beforeend', html);
  });

  const total = todays.reduce((s,e)=>s+e.workCost+e.partsMarkup,0);
  document.getElementById('summary-block').innerHTML = `
    <p><strong>Общая выручка:</strong> ${total.toFixed(2)} ₽</p>
    <p><strong>Доля сервиса:</strong> ${(total/2).toFixed(2)} ₽</p>
  `;

  initAccordions();
  initRowButtons();
}

function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(h=>{
    h.onclick = ()=>h.parentElement.classList.toggle('open');
  });
}

function initRowButtons() {
  document.querySelectorAll('.btn-delete').forEach(btn=>{
    btn.onclick = e=>{
      const id = +e.currentTarget.closest('tr').dataset.id;
      if (confirm('Удалить запись?')) {
        deleteEntry(id);
        renderEntries();
      }
    };
  });
  document.querySelectorAll('.btn-edit').forEach(btn=>{
    btn.onclick = e=>startEdit(+e.currentTarget.closest('tr').dataset.id);
  });
}

function startEdit(id) {
  const entry = getAllEntries().find(e=>e.id===id);
  if(!entry) return;

  document.getElementById('entry-date').value = entry.date;
  document.getElementById('entry-master').value = entry.master;
  document.getElementById('entry-car').value = entry.car;
  document.getElementById('entry-services').value = JSON.stringify(entry.services);
  document.getElementById('service-field').textContent = entry.services.join(', ');
  document.getElementById('entry-workCost').value = entry.workCost;
  document.getElementById('entry-partsMarkup').value = entry.partsMarkup;

  document.getElementById('btn-submit').textContent = 'Сохранить';
  document.getElementById('btn-cancel').classList.remove('hidden');

  const formEl = document.getElementById('entry-form');
  formEl.onsubmit = e=>{
    e.preventDefault();
    updateEntry(id, {
      date: document.getElementById('entry-date').value,
      master: document.getElementById('entry-master').value,
      car: document.getElementById('entry-car').value.trim(),
      services: JSON.parse(document.getElementById('entry-services').value||'[]'),
      workCost: parseFloat(document.getElementById('entry-workCost').value)||0,
      partsMarkup: parseFloat(document.getElementById('entry-partsMarkup').value)||0
    });
    resetForm();
    renderEntries();
    formEl.onsubmit = onFormSubmit;
  };
}