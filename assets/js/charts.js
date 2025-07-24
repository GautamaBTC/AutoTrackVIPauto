//───────────────────────────────────────────────────────────────────
// File: assets/js/charts.js
// VIPавто Облачный бортовой журнал — аналитика, графики, экспорт CSV
//───────────────────────────────────────────────────────────────────

import { getAllEntries } from './storage.js';
import { formatDateInput } from './utils.js';
import { Chart, registerables } from 'https://cdn.jsdelivr.net/npm/chart.js';

Chart.register(...registerables);

let revenueChart, mastersChart;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('switch-to-analytics')
    .addEventListener('click', initAnalytics);
});

function initAnalytics() {
  const view = document.getElementById('analytics-view');
  view.innerHTML = `
    <div class="analytics-controls">
      <label for="period-select">Период:</label>
      <select id="period-select">
        <option value="this_month" selected>Этот месяц</option>
        <option value="last_month">Прошлый месяц</option>
        <option value="this_week">Эта неделя</option>
        <option value="last_week">Прошлая неделя</option>
        <option value="custom">Свой диапазон</option>
      </select>

      <button id="export-csv" class="btn-csv">
        <i class="fas fa-file-csv"></i> Скачать CSV
      </button>

      <div id="custom-range" class="hidden">
        <input type="date" id="start-date"> —
        <input type="date" id="end-date">
        <button id="apply-range">Применить</button>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <h4>Общая выручка</h4>
        <p id="kpi-revenue">0 ₽</p>
      </div>
      <div class="kpi-card">
        <h4>Прибыль сервиса</h4>
        <p id="kpi-profit">0 ₽</p>
      </div>
      <div class="kpi-card">
        <h4>Выплаты мастерам</h4>
        <p id="kpi-payout">0 ₽</p>
      </div>
      <div class="kpi-card">
        <h4>Кол-во работ</h4>
        <p id="kpi-jobs">0</p>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-container">
        <canvas id="revenue-chart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="masters-chart"></canvas>
      </div>
    </div>
  `;

  document.getElementById('period-select')
    .addEventListener('change', updateAnalytics);
  document.getElementById('apply-range')
    .addEventListener('click', updateAnalytics);
  document.getElementById('export-csv')
    .addEventListener('click', exportToCsv);

  updateAnalytics();
}

function updateAnalytics() {
  const sel = document.getElementById('period-select').value;
  const [start, end] = getDatesByPeriod(sel);
  if (!start || !end) return;

  // Фильтрация записей по датам
  const entries = getAllEntries()
    .map(e => ({ ...e, date: new Date(e.date) }))
    .filter(e => e.date >= start && e.date <= end);

  // KPI
  const total = entries.reduce((sum, e) => sum + e.workCost + e.partsMarkup, 0);
  const profit = total * 0.5;
  const payout = entries.reduce(
    (sum, e) => sum + (e.workCost + e.partsMarkup) * 0.5,
    0
  );
  const count = entries.length;

  document.getElementById('kpi-revenue').textContent = `${total.toFixed(0)} ₽`;
  document.getElementById('kpi-profit').textContent  = `${profit.toFixed(0)} ₽`;
  document.getElementById('kpi-payout').textContent = `${payout.toFixed(0)} ₽`;
  document.getElementById('kpi-jobs').textContent   = count;

  // Выручка по дням
  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  const revData = days.map(d =>
    entries
      .filter(e => e.date.toDateString() === d.toDateString())
      .reduce((s, e) => s + e.workCost + e.partsMarkup, 0)
  );
  drawRevenueChart(days, revData);

  // Вклад мастеров
  const contrib = {};
  entries.forEach(e => {
    contrib[e.master] = (contrib[e.master] || 0) + e.workCost + e.partsMarkup;
  });
  drawMastersChart(contrib);
}

function drawRevenueChart(days, data) {
  const labels = days.map(d => `${d.getDate()}.${d.getMonth()+1}`);
  const ctx = document.getElementById('revenue-chart').getContext('2d');
  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Выручка',
        data,
        backgroundColor: 'rgba(57,157,156,0.6)'
      }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });
}

function drawMastersChart(obj) {
  const items = Object.entries(obj).sort((a,b)=>b[1]-a[1]);
  const ctx = document.getElementById('masters-chart').getContext('2d');
  if (mastersChart) mastersChart.destroy();
  mastersChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: items.map(i=>i[0]),
      datasets: [{
        data: items.map(i=>i[1]),
        backgroundColor: ['#399D9C','#4DBAB3','#FFD166','#FF9F1C','#CCCCCC']
      }]
    }
  });
}

function exportToCsv() {
  const sel = document.getElementById('period-select').value;
  const [start, end] = getDatesByPeriod(sel);
  if (!start || !end) {
    alert('Выберите корректный период');
    return;
  }
  const entries = getAllEntries().filter(e => {
    const d = new Date(e.date);
    return d >= start && d <= end;
  });
  if (!entries.length) {
    alert('Нет данных для экспорта');
    return;
  }
  let csv = 'data:text/csv;charset=utf-8,';
  csv += 'ID,Дата,Мастер,Автомобиль,Услуги,Работа,Запчасти,Итого\r\n';
  entries.forEach(e => {
    const row = [
      e.id,
      e.date,
      e.master,
      `"${e.car.replace(/"/g,'""')}"`,
      `"${(e.services||[]).join('; ').replace(/"/g,'""')}"`,
      e.workCost,
      e.partsMarkup,
      (e.workCost + e.partsMarkup).toFixed(2)
    ].join(',');
    csv += row + '\r\n';
  });
  const link = document.createElement('a');
  link.href = encodeURI(csv);
  link.download = `report_${formatDateInput(start)}_to_${formatDateInput(end)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getDatesByPeriod(period) {
  const today = new Date(); today.setHours(0,0,0,0);
  let start = new Date(today), end = new Date(today);
  switch(period) {
    case 'this_week':
      start.setDate(today.getDate() - ((today.getDay()+6)%7));
      break;
    case 'last_week':
      end.setDate(today.getDate() - ((today.getDay()+6)%7) - 1);
      start = new Date(end);
      start.setDate(end.getDate() - 6);
      break;
    case 'this_month':
      start = new Date(today.getFullYear(), today.getMonth(),1);
      break;
    case 'last_month':
      end = new Date(today.getFullYear(), today.getMonth(),0);
      start = new Date(end.getFullYear(), end.getMonth(),1);
      break;
    case 'custom':
      const sd = document.getElementById('start-date').value;
      const ed = document.getElementById('end-date').value;
      start = sd ? new Date(sd) : null;
      end = ed ? new Date(ed) : null;
      break;
  }
  return [start,end];
}