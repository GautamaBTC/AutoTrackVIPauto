/*────────────────────────────────────────────
  assets/js/charts.js | ГРАФИКИ С Chart.js
─────────────────────────────────────────────*/

// Импорты
import { formatMoney } from './utils.js';

// Глобальные переменные для хранения экземпляров графиков
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

    // Получаем текущие цвета темы
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const colors = isDark ? chartColors.dark : chartColors.light;

    // Получаем контексты canvas
    const revenueCtx = document.getElementById('revenue-chart')?.getContext('2d');
    const mastersCtx = document.getElementById('distribution-chart')?.getContext('2d');
    const servicesCtx = document.getElementById('services-chart')?.getContext('2d');
    const trendsCtx = document.getElementById('trends-chart')?.getContext('2d');

    // Инициализируем каждый график
    if (revenueCtx) revenueChart = initRevenueChart(revenueCtx, colors);
    if (mastersCtx) mastersChart = initMastersChart(mastersCtx, colors);
    if (servicesCtx) servicesChart = initServicesChart(servicesCtx, colors);
    if (trendsCtx) trendsChart = initTrendsChart(trendsCtx, colors);

    // Слушатель события смены темы для динамического обновления цветов
    window.addEventListener('themechange', (e) => {
        console.log('Theme changed, updating charts'); // Debug
        updateChartsTheme(e.detail.theme === 'dark' ? chartColors.dark : chartColors.light);
    });
}

// Функции инициализации отдельных графиков
function initRevenueChart(ctx, colors) {
    console.log('Init revenue chart'); // Debug
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Будут заполнены позже
            datasets: [{
                label: 'Выручка (₽)',
                 [],
                borderColor: colors.primary,
                backgroundColor: colors.background,
                borderWidth: 3,
                pointBackgroundColor: colors.primary,
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
                    backgroundColor: colors.accent,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    borderWidth: 0,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return `Выручка: ${formatMoney(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: colors.grid
                    },
                    ticks: {
                        callback: function(value) {
                            return formatMoney(value);
                        }
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

function initMastersChart(ctx, colors) {
    console.log('Init masters chart'); // Debug
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [], // Будут заполнены позже
            datasets: [{
                data: [],
                backgroundColor: [
                    colors.primary,
                    colors.secondary,
                    colors.accent,
                    '#FF6B6B',
                    '#4D96FF',
                    '#FFD93D'
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
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
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ${formatMoney(value)}`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            cutout: '60%'
        }
    });
}

function initServicesChart(ctx, colors) {
    console.log('Init services chart'); // Debug
    return new Chart(ctx, {
        type: 'bar',
         {
            labels: [], // Будут заполнены позже
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
                legend: {
                    display: false
                },
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
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
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

function initTrendsChart(ctx, colors) {
    console.log('Init trends chart'); // Debug
    return new Chart(ctx, {
        type: 'line',
         {
            labels: [], // Будут заполнены позже
            datasets: [
                {
                    label: 'Средний чек (₽)',
                    data: [],
                    borderColor: colors.primary,
                    backgroundColor: 'rgba(0, 0, 0, 0)', // Прозрачный фон
                    borderWidth: 3,
                    pointBackgroundColor: colors.primary,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Кол-во работ',
                     [],
                    borderColor: colors.secondary,
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderWidth: 3,
                    borderDash: [5, 5], // Пунктирная линия
                    pointBackgroundColor: colors.secondary,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
                // Бонусный уровень будет добавлен динамически
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
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
                x: {
                    grid: {
                        color: colors.grid
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: {
                        color: colors.grid
                    },
                    ticks: {
                        callback: function(value) {
                            return formatMoney(value);
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false, // Не рисуем сетку для второй оси
                    },
                    ticks: {
                        // Убираем форматирование для количества
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

// --- Обновление данных графиков ---
export function updateCharts(period = 'month') {
    console.log(`Updating charts for period: ${period}`); // Debug

    // Получаем все записи
    const allEntries = JSON.parse(localStorage.getItem('vipauto_entries') || '[]');

    // Фильтруем по периоду
    const filteredEntries = filterEntriesByPeriod(allEntries, period);

    // Обновляем каждый график
    updateRevenueChart(filteredEntries);
    updateMastersChart(filteredEntries);
    updateServicesChart(filteredEntries);
    updateTrendsChart(filteredEntries);
}

function filterEntriesByPeriod(entries, period) {
    const now = new Date();
    let startDate = new Date(0); // По умолчанию - все время

    switch (period) {
        case 'week':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
        case 'quarter':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
        case 'year':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
        case 'custom':
            // Для кастомного периода фильтрация должна быть реализована отдельно
            return entries;
        default:
            return entries;
    }

    return entries.filter(entry => new Date(entry.date) >= startDate);
}

function updateRevenueChart(entries) {
    if (!revenueChart) return;

    // Агрегируем данные по дням
    const dailyData = {};
    entries.forEach(entry => {
        const date = entry.date;
        const value = (parseFloat(entry.workCost) || 0) + (parseFloat(entry.partsCost) || 0);
        if (!dailyData[date]) {
            dailyData[date] = 0;
        }
        dailyData[date] += value;
    });

    // Сортируем даты
    const sortedDates = Object.keys(dailyData).sort();

    // Подготавливаем данные для графика
    const labels = sortedDates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    });
    const data = sortedDates.map(date => dailyData[date]);

    // Обновляем данные графика
    revenueChart.data.labels = labels;
    revenueChart.data.datasets[0].data = data;
    revenueChart.update();
}

function updateMastersChart(entries) {
    if (!mastersChart) return;

    // Агрегируем данные по мастерам
    const masterData = {};
    entries.forEach(entry => {
        const master = entry.master;
        const value = (parseFloat(entry.workCost) || 0) + (parseFloat(entry.partsCost) || 0);
        if (!masterData[master]) {
            masterData[master] = 0;
        }
        masterData[master] += value;
    });

    // Подготавливаем данные для графика
    const labels = Object.keys(masterData);
    const data = Object.values(masterData);

    // Обновляем данные графика
    mastersChart.data.labels = labels;
    mastersChart.data.datasets[0].data = data;
    mastersChart.update();
}

function updateServicesChart(entries) {
    if (!servicesChart) return;

    // Агрегируем данные по услугам
    const serviceData = {};
    entries.forEach(entry => {
        entry.services.forEach(service => {
            if (!serviceData[service]) {
                serviceData[service] = 0;
            }
            serviceData[service] += 1;
        });
    });

    // Сортируем по количеству и берем топ-10
    const sortedServices = Object.entries(serviceData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    // Подготавливаем данные для графика
    const labels = sortedServices.map(([service]) => service);
    const data = sortedServices.map(([, count]) => count);

    // Обновляем данные графика
    servicesChart.data.labels = labels;
    servicesChart.data.datasets[0].data = data;
    servicesChart.update();
}

function updateTrendsChart(entries) {
    if (!trendsChart) return;

    // Агрегируем данные по неделям
    const weeklyData = {};
    entries.forEach(entry => {
        const entryDate = new Date(entry.date);
        // Определяем начало недели (понедельник)
        const startOfWeek = new Date(entryDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Корректировка для понедельника
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const weekKey = startOfWeek.toISOString().split('T')[0]; // Формат YYYY-MM-DD

        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { total: 0, count: 0 };
        }
        const value = (parseFloat(entry.workCost) || 0) + (parseFloat(entry.partsCost) || 0);
        weeklyData[weekKey].total += value;
        weeklyData[weekKey].count += 1;
    });

    // Сортируем недели
    const sortedWeeks = Object.keys(weeklyData).sort();

    // Подготавливаем данные для графика
    const labels = sortedWeeks.map(week => {
        const d = new Date(week);
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    });
    const avgCheckData = sortedWeeks.map(week => {
        const data = weeklyData[week];
        return data.count > 0 ? data.total / data.count : 0;
    });
    const countData = sortedWeeks.map(week => weeklyData[week].count);

    // Обновляем данные графика
    trendsChart.data.labels = labels;
    trendsChart.data.datasets[0].data = avgCheckData; // Средний чек
    trendsChart.data.datasets[1].data = countData;   // Количество работ
    // TODO: Добавить данные по бонусам
    trendsChart.update();
}

// --- Вспомогательные функции ---
// Генерация градиентов (пример)
function generateGradientColors(ctx, color1, color2, steps) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
}

// Интерполяция цветов (пример)
function interpolateColors(color1, color2, factor) {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Обновление темы графиков
function updateChartsTheme(colors) {
    console.log('Updating charts theme'); // Debug
    // Обновляем каждый график с новыми цветами
    if (revenueChart) {
        revenueChart.data.datasets[0].borderColor = colors.primary;
        revenueChart.data.datasets[0].backgroundColor = colors.background;
        revenueChart.data.datasets[0].pointBackgroundColor = colors.primary;
        revenueChart.options.scales.y.grid.color = colors.grid;
        revenueChart.options.plugins.tooltip.backgroundColor = colors.accent;
        revenueChart.update();
    }

    if (mastersChart) {
        // Цвета сегментов задаются при инициализации, для динамического изменения
        // нужно обновить весь массив backgroundColor
        mastersChart.options.plugins.legend.labels.fontColor = colors.text;
        mastersChart.options.plugins.tooltip.backgroundColor = colors.accent;
        mastersChart.update();
    }

    if (servicesChart) {
        servicesChart.data.datasets[0].backgroundColor = colors.primary;
        servicesChart.options.plugins.tooltip.backgroundColor = colors.accent;
        servicesChart.update();
    }

    if (trendsChart) {
        trendsChart.data.datasets[0].borderColor = colors.primary;
        trendsChart.data.datasets[1].borderColor = colors.secondary;
        trendsChart.options.scales.x.grid.color = colors.grid;
        trendsChart.options.scales.y.grid.color = colors.grid;
        trendsChart.options.plugins.tooltip.backgroundColor = colors.accent;
        trendsChart.update();
    }
}

// Экспорт графиков (пример)
function exportChartAsImage(chartId, fileName) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `${chartId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Анимированное обновление (пример)
function animateChartUpdate(chart, newData) {
    const duration = 1000;
    const start = performance.now();

    const animate = (time) => {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1);
        // Применяем easing
        const ease = t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

        // Интерполируем данные
        // ... (логика интерполяции)

        chart.update();

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };

    requestAnimationFrame(animate);
}

// Форматирование подписей (пример)
function formatChartLabel(value, type) {
    switch (type) {
        case 'money':
            return formatMoney(value);
        case 'percent':
            return `${value.toFixed(1)}%`;
        case 'number':
            return value.toLocaleString('ru-RU');
        default:
            return value;
    }
}

// ... (другие вспомогательные функции)

// Экспорт всех функций
export {
    initCharts,
    updateCharts,
    updateChartsTheme,
    exportChartAsImage
};