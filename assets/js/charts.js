/*────────────────────────────────────────────
  assets/js/charts.js | АНАЛИТИКА И ГРАФИКИ
─────────────────────────────────────────────*/

import { getAllEntries } from './storage.js';
import { formatDateInput, formatDateDisplay, getDateRange } from './utils.js';
import { Chart, registerables } from 'https://cdn.jsdelivr.net/npm/chart.js';

Chart.register(...registerables);

let revenueChart, mastersChart, servicesChart;
let currentPeriod = 'this_month';

export function initAnalyticsView() {
    setupPeriodSelector();
    setupCharts();
    updateAnalytics();
}

function setupPeriodSelector() {
    const selector = document.getElementById('period-select');
    const customRange = document.getElementById('custom-range');
    
    selector.addEventListener('change', () => {
        currentPeriod = selector.value;
        customRange.classList.toggle('hidden', currentPeriod !== 'custom');
        updateAnalytics();
    });

    // Обработчики для кастомного периода
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    const applyRange = document.getElementById('apply-range');

    applyRange.addEventListener('click', () => {
        if (startDate.value && endDate.value) {
            updateAnalytics();
        }
    });
}

function getPeriodDates() {
    const today = new Date();
    let start = new Date(today);
    let end = new Date(today);

    switch (currentPeriod) {
        case 'today':
            break;
            
        case 'this_week':
            start.setDate(today.getDate() - today.getDay());
            break;
            
        case 'last_week':
            end.setDate(today.getDate() - today.getDay() - 1);
            start.setDate(end.getDate() - 6);
            break;
            
        case 'this_month':
            start.setDate(1);
            break;
            
        case 'last_month':
            end = new Date(today.getFullYear(), today.getMonth(), 0);
            start = new Date(end.getFullYear(), end.getMonth(), 1);
            break;
            
        case 'custom':
            start = new Date(document.getElementById('start-date').value);
            end = new Date(document.getElementById('end-date').value);
            break;
    }

    return [start, end];
}

function updateAnalytics() {
    const [startDate, endDate] = getPeriodDates();
    
    // Фильтруем записи по периоду
    const entries = getAllEntries().filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
    });

    // Обновляем KPI
    updateKPIs(entries);

    // Обновляем графики
    updateRevenueChart(entries, startDate, endDate);
    updateMastersChart(entries);
    updateServicesChart(entries);
}

function updateKPIs(entries) {
    const totalRevenue = entries.reduce((sum, e) => sum + e.workCost + e.partsCost, 0);
    const serviceProfit = totalRevenue * 0.5;
    const mastersPayouts = entries.reduce((sum, e) => {
        const base = (e.workCost + e.partsCost) * 0.5;
        const bonus = calculateBonus(e);
        return sum + base + bonus;
    }, 0);

    // Получаем данные за предыдущий период для сравнения
    const prevEntries = getPreviousPeriodEntries();
    const prevRevenue = prevEntries.reduce((sum, e) => sum + e.workCost + e.partsCost, 0);
    
    // Рассчитываем изменения
    const revenueChange = ((totalRevenue - prevRevenue) / prevRevenue * 100) || 0;

    // Обновляем элементы
    document.getElementById('kpi-revenue').textContent = `${totalRevenue.toFixed(0)} ₽`;
    document.getElementById('kpi-profit').textContent = `${serviceProfit.toFixed(0)} ₽`;
    document.getElementById('kpi-payouts').textContent = `${mastersPayouts.toFixed(0)} ₽`;
    document.getElementById('kpi-jobs').textContent = entries.length;

    // Обновляем тренды
    updateTrendIndicator('revenue-trend', revenueChange);
}

function updateTrendIndicator(elementId, change) {
    const element = document.getElementById(elementId);
    const isPositive = change > 0;
    const isNeutral = change === 0;

    element.className = `kpi-trend ${isPositive ? 'positive' : isNeutral ? 'neutral' : 'negative'}`;
    element.innerHTML = `
        <i class="fas fa-${isPositive ? 'arrow-up' : isNeutral ? 'minus' : 'arrow-down'}"></i>
        ${Math.abs(change).toFixed(1)}%
    `;
}

function updateRevenueChart(entries, startDate, endDate) {
    const dates = getDateRange(startDate, endDate);
    const data = dates.map(date => {
        const dayEntries = entries.filter(e => e.date === date);
        return dayEntries.reduce((sum, e) => sum + e.workCost + e.partsCost, 0);
    });

    if (revenueChart) revenueChart.destroy();

    const ctx = document.getElementById('revenue-chart').getContext('2d');
    revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates.map(d => formatDateDisplay(d)),
            datasets: [{
                label: 'Выручка',
                data: data,
                backgroundColor: 'rgba(57, 157, 156, 0.6)',
                borderColor: 'rgba(57, 157, 156, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => `${value} ₽`
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => `Выручка: ${context.parsed.y.toFixed(2)} ₽`
                    }
                }
            }
        }
    });
}

function updateMastersChart(entries) {
    const masterStats = entries.reduce((acc, entry) => {
        const total = entry.workCost + entry.partsCost;
        acc[entry.master] = (acc[entry.master] || 0) + total;
        return acc;
    }, {});

    const sortedData = Object.entries(masterStats)
        .sort(([,a], [,b]) => b - a);

    if (mastersChart) mastersChart.destroy();

    const ctx = document.getElementById('masters-chart').getContext('2d');
    mastersChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sortedData.map(([master]) => master),
            datasets: [{
                data: sortedData.map(([,value]) => value),
                backgroundColor: [
                    'rgba(57, 157, 156, 0.8)',
                    'rgba(77, 186, 179, 0.8)',
                    'rgba(255, 209, 102, 0.8)',
                    'rgba(255, 159, 28, 0.8)',
                    'rgba(220, 53, 69, 0.8)',
                    'rgba(108, 117, 125, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value.toFixed(2)} ₽ (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateServicesChart(entries) {
    // Собираем статистику по услугам
    const serviceStats = entries.reduce((acc, entry) => {
        entry.services.forEach(service => {
            acc[service] = (acc[service] || 0) + 1;
        });
        return acc;
    }, {});

    // Берем топ-10 услуг
    const topServices = Object.entries(serviceStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    if (servicesChart) servicesChart.destroy();

    const ctx = document.getElementById('services-chart').getContext('2d');
    servicesChart = new Chart(ctx, {
        type: 'horizontalBar',
        data: {
            labels: topServices.map(([service]) => service),
            datasets: [{
                label: 'Количество заказов',
                data: topServices.map(([,count]) => count),
                backgroundColor: 'rgba(255, 209, 102, 0.8)',
                borderColor: 'rgba(255, 209, 102, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Вспомогательные функции
function calculateBonus(entry) {
    // Здесь будет логика расчета бонусов
    return 0;
}

function getPreviousPeriodEntries() {
    // Получаем записи за предыдущий период для сравнения
    return [];
}
