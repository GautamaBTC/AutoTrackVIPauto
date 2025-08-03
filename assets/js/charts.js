/*────────────────────────────────────────────
  assets/js/charts.js
  Управление графиками с помощью Chart.js.
─────────────────────────────────────────────*/

// --- Импорты ---
import { getAllEntries } from './storage.js';
import { formatMoney } from './utils.js';

// --- Глобальные переменные для хранения экземпляров графиков ---
let revenueChart = null;
let mastersChart = null;
let servicesChart = null;
let trendsChart = null;

// --- Цветовые схемы для графиков ---
const chartColors = {
  light: {
    primary: '#399D9C',
    secondary: '#4DBAB3',
    accent: '#2D7F7E',
    background: 'rgba(57, 157, 156, 0.1)',
    grid: 'rgba(0, 0, 0, 0.05)',
    text: '#303133',
    tooltip: '#303133',
    tooltipText: '#FFFFFF',
  },
  dark: {
    primary: '#FFD166',
    secondary: '#00A0A0',
    accent: '#e6b847',
    background: 'rgba(255, 209, 102, 0.1)',
    grid: 'rgba(255, 255, 255, 0.1)',
    text: '#E5EAF3',
    tooltip: '#1D1D1D',
    tooltipText: '#E5EAF3',
  }
};

/**
 * Инициализация всех графиков на странице.
 */
export function initCharts() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const colors = isDark ? chartColors.dark : chartColors.light;

  const revenueCtx = document.getElementById('revenue-chart')?.getContext('2d');
  const mastersCtx = document.getElementById('distribution-chart')?.getContext('2d');
  const servicesCtx = document.getElementById('services-chart')?.getContext('2d');
  const trendsCtx = document.getElementById('trends-chart')?.getContext('2d');

  if (revenueCtx) revenueChart = initRevenueChart(revenueCtx, colors);
  if (mastersCtx) mastersChart = initMastersChart(mastersCtx, colors);
  if (servicesCtx) servicesChart = initServicesChart(servicesCtx, colors);
  if (trendsCtx) trendsChart = initTrendsChart(trendsCtx, colors);

  // Слушатель для смены темы
  window.addEventListener('themechange', (e) => {
    const newColors = e.detail.theme === 'dark' ? chartColors.dark : chartColors.light;
    updateChartsTheme(newColors);
  });
}

// --- Функции инициализации для каждого графика ---

function initRevenueChart(ctx, colors) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, colors.background);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  return new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{
      label: 'Выручка',
      data: [],
      borderColor: colors.primary,
      backgroundColor: gradient,
      borderWidth: 3,
      pointBackgroundColor: colors.primary,
      tension: 0.4,
      fill: true
    }]},
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: colors.tooltip, titleColor: colors.tooltipText, bodyColor: colors.tooltipText,
        callbacks: { label: (c) => `Выручка: ${formatMoney(c.parsed.y)}` }
      }},
      scales: {
        y: { beginAtZero: true, grid: { color: colors.grid }, ticks: { color: colors.text, callback: (v) => formatMoney(v) }},
        x: { grid: { display: false }, ticks: { color: colors.text }}
      }
    }
  });
}

function initMastersChart(ctx, colors) {
  return new Chart(ctx, {
    type: 'doughnut',
    data: { labels: [], datasets: [{
      data: [],
      backgroundColor: [colors.primary, colors.secondary, '#4D96FF', '#FF6B6B', '#6BCB77', '#9A60FF'],
      borderWidth: 0, hoverOffset: 8
    }]},
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: colors.text, usePointStyle: true, pointStyle: 'circle', padding: 20 }},
        tooltip: {
          backgroundColor: colors.tooltip, titleColor: colors.tooltipText, bodyColor: colors.tooltipText,
          callbacks: { label: (c) => `${c.label}: ${formatMoney(c.parsed || 0)}` }
        }
      },
      cutout: '60%'
    }
  });
}

function initServicesChart(ctx, colors) {
  return new Chart(ctx, {
    type: 'bar',
    data: { labels: [], datasets: [{
      label: 'Количество заказов',
      data: [],
      backgroundColor: colors.primary,
      borderRadius: 4
    }]},
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: colors.tooltip, titleColor: colors.tooltipText, bodyColor: colors.tooltipText
      }},
      scales: {
        x: { grid: { display: false }, ticks: { color: colors.text }},
        y: { grid: { color: colors.grid }, ticks: { color: colors.text }}
      }
    }
  });
}

function initTrendsChart(ctx, colors) {
    return new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [
            { label: 'Средний чек', data: [], borderColor: colors.primary, yAxisID: 'y' },
            { label: 'Кол-во работ', data: [], borderColor: colors.secondary, borderDash: [5, 5], yAxisID: 'y1' }
        ]},
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { color: colors.text }}, tooltip: {
              backgroundColor: colors.tooltip, titleColor: colors.tooltipText, bodyColor: colors.tooltipText, mode: 'index', intersect: false
            }},
            scales: {
                x: { grid: { color: colors.grid }, ticks: { color: colors.text }},
                y: { type: 'linear', position: 'left', grid: { color: colors.grid }, ticks: { color: colors.text, callback: (v) => formatMoney(v) }},
                y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { color: colors.text }}
            }
        }
    });
}

/**
 * Обновляет все графики на основе переданных данных.
 * @param {string} period - Период для фильтрации ('month', 'week', etc.).
 */
export function updateCharts(period = 'month') {
  console.log(`Updating charts for period: ${period}`);
  const allEntries = getAllEntries();
  // TODO: Реализовать фильтрацию по периоду
  // const filteredEntries = filterEntriesByPeriod(allEntries, period);

  updateRevenueChart(allEntries);
  updateMastersChart(allEntries);
  updateServicesChart(allEntries);
  updateTrendsChart(allEntries);
}

// --- Функции обновления данных для каждого графика ---

function updateRevenueChart(entries) {
  if (!revenueChart) return;
  const dailyData = entries.reduce((acc, entry) => {
    const date = entry.date;
    const value = (entry.workCost || 0) + (entry.partsCost || 0);
    acc[date] = (acc[date] || 0) + value;
    return acc;
  }, {});
  const sortedDates = Object.keys(dailyData).sort();
  const labels = sortedDates.map(d => new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }));
  const data = sortedDates.map(d => dailyData[d]);
  revenueChart.data.labels = labels;
  revenueChart.data.datasets[0].data = data;
  revenueChart.update();
}

function updateMastersChart(entries) {
  if (!mastersChart) return;
  const masterData = entries.reduce((acc, entry) => {
    const value = (entry.workCost || 0) + (entry.partsCost || 0);
    acc[entry.master] = (acc[entry.master] || 0) + value;
    return acc;
  }, {});
  mastersChart.data.labels = Object.keys(masterData);
  mastersChart.data.datasets[0].data = Object.values(masterData);
  mastersChart.update();
}

function updateServicesChart(entries) {
  if (!servicesChart) return;
  const serviceData = entries.reduce((acc, entry) => {
    (entry.services || []).forEach(service => {
      acc[service] = (acc[service] || 0) + 1;
    });
    return acc;
  }, {});
  const sortedServices = Object.entries(serviceData).sort((a, b) => b[1] - a[1]).slice(0, 10);
  servicesChart.data.labels = sortedServices.map(([service]) => service);
  servicesChart.data.datasets[0].data = sortedServices.map(([, count]) => count);
  servicesChart.update();
}

function updateTrendsChart(entries) {
    if (!trendsChart) return;
    const weeklyData = entries.reduce((acc, entry) => {
        const d = new Date(entry.date);
        // Корректное определение начала недели (понедельник)
        const day = d.getDay() || 7; // Делаем воскресенье 7-м днем
        const diff = d.getDate() - day + 1;
        const startOfWeek = new Date(d.setDate(diff)).toISOString().split('T')[0];
        
        if (!acc[startOfWeek]) acc[startOfWeek] = { total: 0, count: 0 };
        acc[startOfWeek].total += (entry.workCost || 0) + (entry.partsCost || 0);
        acc[startOfWeek].count += 1;
        return acc;
    }, {});
    const sortedWeeks = Object.keys(weeklyData).sort();
    const labels = sortedWeeks.map(w => new Date(w).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }));
    const avgCheckData = sortedWeeks.map(w => weeklyData[w].total / weeklyData[w].count);
    const countData = sortedWeeks.map(w => weeklyData[w].count);
    trendsChart.data.labels = labels;
    trendsChart.data.datasets[0].data = avgCheckData;
    trendsChart.data.datasets[1].data = countData;
    trendsChart.update();
}


/**
 * Обновляет цвета на всех графиках при смене темы.
 * @param {object} colors - Объект с новыми цветами.
 */
export function updateChartsTheme(colors) {
  const allCharts = [revenueChart, mastersChart, servicesChart, trendsChart];
  allCharts.forEach(chart => {
    if (chart) {
      if (chart.options.scales.x) chart.options.scales.x.ticks.color = colors.text;
      if (chart.options.scales.y) {
          chart.options.scales.y.ticks.color = colors.text;
          chart.options.scales.y.grid.color = colors.grid;
      }
      if (chart.options.scales.y1) {
          chart.options.scales.y1.ticks.color = colors.text;
      }
      if (chart.options.plugins.legend) chart.options.plugins.legend.labels.color = colors.text;
      if (chart.options.plugins.tooltip) {
          chart.options.plugins.tooltip.backgroundColor = colors.tooltip;
          chart.options.plugins.tooltip.titleColor = colors.tooltipText;
          chart.options.plugins.tooltip.bodyColor = colors.tooltipText;
      }
      
      chart.data.datasets.forEach((dataset, index) => {
        if(chart.config.type === 'line') {
          // Для линейных графиков используем разные цвета
          dataset.borderColor = index === 0 ? colors.primary : colors.secondary;
        } else if (chart.config.type !== 'doughnut') {
          // Для bar-графика
          dataset.backgroundColor = colors.primary;
        }
      });

      if(chart === revenueChart) {
        const gradient = chart.ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, colors.background);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        chart.data.datasets[0].backgroundColor = gradient;
        chart.data.datasets[0].borderColor = colors.primary;
      }
      
      chart.update('none'); // Обновляем без анимации для плавной смены темы
    }
  });
}

// [FIX] Весь блок с дублирующимися экспортами был удален.
