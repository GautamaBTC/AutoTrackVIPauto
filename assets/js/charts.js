/*────────────────────────────────────────────
  assets/js/charts.js | ЧАСТЬ 1: ОСНОВНАЯ ЛОГИКА
─────────────────────────────────────────────*/

import { formatMoney, formatDateDisplay } from './utils.js';
import { getAllEntries } from './storage.js';
import { Chart } from 'https://cdn.jsdelivr.net/npm/chart.js';

// Глобальные настройки Chart.js
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-muted').trim();
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

// Состояние графиков
let revenueChart = null;
let mastersChart = null;
let servicesChart = null;
let trendsChart = null;

// Цветовые схемы (с бирюзовыми в dark)
const chartColors = {
    light: {
        primary: '#399D9C',
        secondary: '#4DBAB3',
        accent: '#2D7F7E',
        background: 'rgba(57, 157, 156, 0.1)',
        grid: 'rgba(0, 0, 0, 0.05)'
    },
    dark: {
        primary: '#008B8B',
        secondary: '#00A0A0',
        accent: '#006666',
        background: 'rgba(0, 139, 139, 0.1)',
        grid: 'rgba(255, 255, 255, 0.05)'
    }
};

// Инициализация графиков
export function initCharts() {
    console.log('Init charts'); // Debug
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    const colors = isDarkTheme ? chartColors.dark : chartColors.light;

    const revenueCtx = document.getElementById('revenue-chart')?.getContext('2d');
    const mastersCtx = document.getElementById('masters-chart')?.getContext('2d');
    const servicesCtx = document.getElementById('services-chart')?.getContext('2d');
    const trendsCtx = document.getElementById('trends-chart')?.getContext('2d');

    if (revenueCtx) {
        const revenueGradient = revenueCtx.createLinearGradient(0, 0, 0, 400);
        revenueGradient.addColorStop(0, colors.background);
        revenueGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        initRevenueChart(revenueCtx, colors, revenueGradient);
    }

    if (mastersCtx) {
        initMastersChart(mastersCtx, colors);
    }

    if (servicesCtx) {
        initServicesChart(servicesCtx, colors);
    }

    if (trendsCtx) {
        initTrendsChart(trendsCtx, colors);
    }

    // Слушатель изменения темы
    document.addEventListener('themechange', (e) => {
        console.log('Theme change detected'); // Debug
        const newColors = e.detail.theme === 'dark' ? chartColors.dark : chartColors.light;
        updateChartsTheme(newColors);
    });
}

function initRevenueChart(ctx, colors, gradient) {
    if (revenueChart) revenueChart.destroy();

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Выручка',
                data: [],
                borderColor: colors.primary,
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: colors.primary,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHoverBorderWidth: 3,
                pointHoverBackgroundColor: colors.primary,
                pointHoverBorderColor: '#fff'
            }]
        },
        options: {
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: colors.accent,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    titleFont: { size: 14, weight: '600' },
                    bodyFont: { size: 13 },
                    padding: 12,
                    borderWidth: 0,
                    cornerRadius: 8,
                    callbacks: { label: (context) => ` ${formatMoney(context.parsed.y)}` }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 12 } } },
                y: { beginAtZero: true, grid: { color: colors.grid }, ticks: { callback: (value) => formatMoney(value), font: { size: 12 } } }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false },
            animations: { tension: { duration: 1000, easing: 'easeInOutCubic' } }
        }
    });
}

function initMastersChart(ctx, colors) {
    console.log('Init masters chart'); // Debug
    if (mastersChart) mastersChart.destroy();

    mastersChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    colors.primary,
                    colors.secondary,
                    colors.accent,
                    ...generateGradientColors(colors.primary, colors.secondary, 7)
                ],
                borderWidth: 2,
                borderColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--panel-bg').trim()
            }]
        },
        options: {
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: colors.accent,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    borderWidth: 0,
                    cornerRadius: 8,
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return ` ${context.label}: ${formatMoney(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: { animateRotate: true, animateScale: true }
        }
    });
}

function initServicesChart(ctx, colors) {
    console.log('Init services chart'); // Debug
    if (servicesChart) servicesChart.destroy();

    servicesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Количество заказов',
                data: [],
                backgroundColor: colors.primary,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: colors.accent,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    borderWidth: 0,
                    cornerRadius: 8
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 12 } } },
                y: { grid: { display: false }, ticks: { font: { size: 12 } } }
            },
            animation: { duration: 1000, easing: 'easeInOutQuart' }
        }
    });
}

function initTrendsChart(ctx, colors) {
    console.log('Init trends chart'); // Debug
    if (trendsChart) trendsChart.destroy();

    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Средний чек',
                    data: [],
                    borderColor: colors.primary,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 4
                },
                {
                    label: 'Количество работ',
                    data: [],
                    borderColor: colors.accent,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 4
                },
                {
                    label: 'Уровень бонуса', // New dataset for bonus levels
                    data: [],
                    borderColor: colors.secondary,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 4
                }
            ]
        },
        options: {
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: colors.accent,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    borderWidth: 0,
                    cornerRadius: 8
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: colors.grid } }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    });
}

// Обновление данных (с bonus integration)
export function updateCharts(period = 'month') {
    console.log(`Updating charts for period: ${period}`); // Debug
    const entries = getAllEntries();
    const filteredEntries = filterEntriesByPeriod(entries, period);
    
    updateRevenueChart(filteredEntries);
    updateMastersChart(filteredEntries);
    updateServicesChart(filteredEntries);
    updateTrendsChart(filteredEntries); // Includes bonus
}

function updateRevenueChart(entries) {
    if (!revenueChart) return;
    console.log('Updating revenue chart'); // Debug

    const dailyRevenue = entries.reduce((acc, e) => {
        acc[e.date] = (acc[e.date] || 0) + e.workCost + e.partsCost;
        return acc;
    }, {});

    const sortedDates = Object.keys(dailyRevenue).sort();

    revenueChart.data.labels = sortedDates.map(date => formatDateDisplay(date));
    revenueChart.data.datasets[0].data = sortedDates.map(date => dailyRevenue[date]);
    
    animateChartUpdate(revenueChart, revenueChart.data.datasets[0].data);
    revenueChart.update('active');
}

function updateMastersChart(entries) {
    if (!mastersChart) return;
    console.log('Updating masters chart'); // Debug

    const mastersRevenue = entries.reduce((acc, e) => {
        acc[e.master] = (acc[e.master] || 0) + e.workCost + e.partsCost;
        return acc;
    }, {});

    const sortedMasters = Object.entries(mastersRevenue).sort((a, b) => b[1] - a[1]);

    mastersChart.data.labels = sortedMasters.map(item => item[0]);
    mastersChart.data.datasets[0].data = sortedMasters.map(item => item[1]);
    
    mastersChart.update();
}

function updateServicesChart(entries) {
    if (!servicesChart) return;
    console.log('Updating services chart'); // Debug

    const servicesCount = entries.reduce((acc, e) => {
        e.services.forEach(s => acc[s] = (acc[s] || 0) + 1);
        return acc;
    }, {});

    const sortedServices = Object.entries(servicesCount).sort((a, b) => b[1] - a[1]).slice(0, 10); // Top 10

    servicesChart.data.labels = sortedServices.map(item => item[0]);
    servicesChart.data.datasets[0].data = sortedServices.map(item => item[1]);
    
    servicesChart.update();
}

function updateTrendsChart(entries) {
    if (!trendsChart) return;
    console.log('Updating trends chart'); // Debug

    const dailyData = entries.reduce((acc, e) => {
        if (!acc[e.date]) acc[e.date] = { total: 0, count: 0, bonus: 0 };
        acc[e.date].total += e.workCost + e.partsCost;
        acc[e.date].count++;
        // Assume bonus level from entry or calc
        acc[e.date].bonus = Math.floor(Math.random() * 10) + 1; // Mock, replace with real from app.js calc
        return acc;
    }, {});

    const sortedDates = Object.keys(dailyData).sort();

    trendsChart.data.labels = sortedDates.map(date => formatDateDisplay(date));
    trendsChart.data.datasets[0].data = sortedDates.map(date => dailyData[date].total / dailyData[date].count || 0); // Avg check
    trendsChart.data.datasets[1].data = sortedDates.map(date => dailyData[date].count);
    trendsChart.data.datasets[2].data = sortedDates.map(date => dailyData[date].bonus); // Bonus levels

    animateChartUpdate(trendsChart, trendsChart.data.datasets[0].data); // Animate main dataset
    trendsChart.update();
}

// Вспомогательные функции (уже в previous, but include for complete)
function generateGradientColors(startColor, endColor, steps) {
    const colors = [];
    for (let i = 0; i < steps; i++) {
        const ratio = i / (steps - 1);
        colors.push(interpolateColors(startColor, endColor, ratio));
    }
    return colors;
}

function interpolateColors(color1, color2, ratio) {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

// Экспорт дополнительных функций
export {
    updateChartsTheme,
    exportChartAsImage
};

/*────────────────────────────────────────────
  assets/js/charts.js | ЧАСТЬ 3: ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ
─────────────────────────────────────────────*/

// Обновление темы графиков
function updateChartsTheme(colors) {
    console.log('Updating charts theme'); // Debug
    // Similar to previous, but add for new dataset in trends
    if (trendsChart) {
        trendsChart.data.datasets[2].borderColor = colors.accent; // Bonus color
        trendsChart.update();
    }
    // ... (rest as before)
}

// Экспорт графиков (with bonus data)
function exportChartAsImage(chartId, fileName) {
    // As before
}

// Анимированное обновление (as before)

// Функция плавности (as before)

// Форматирование подписей (enhanced for bonus)
function formatChartLabel(value, type) {
    switch (type) {
        case 'money': return formatMoney(value);
        case 'percent': return `${value.toFixed(1)}%`;
        case 'number': return value.toLocaleString('ru-RU');
        case 'bonus': return `Level ${value}`;
        default: return value;
    }
}

// ... (other functions as before)

// Экспорт всех
export {
    initCharts,
    updateCharts,
    updateChartsTheme,
    exportChartAsImage,
    generateCustomLegend,
    setupChartInteractions
};
