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

// Цветовые схемы
const chartColors = {
    light: {
        primary: '#399D9C',
        secondary: '#4DBAB3',
        accent: '#FFD166',
        background: 'rgba(57, 157, 156, 0.1)',
        grid: 'rgba(0, 0, 0, 0.05)'
    },
    dark: {
        primary: '#FFD166',
        secondary: '#FFE0A3',
        accent: '#399D9C',
        background: 'rgba(255, 209, 102, 0.1)',
        grid: 'rgba(255, 255, 255, 0.05)'
    }
};

// Инициализация графиков
export function initCharts() {
    // Определяем текущую тему
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    const colors = isDarkTheme ? chartColors.dark : chartColors.light;

    // Настраиваем градиенты
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
        const newColors = e.detail.theme === 'dark' ? chartColors.dark : chartColors.light;
        updateChartsTheme(newColors);
    });
}

function initRevenueChart(ctx, colors, gradient) {
    if (revenueChart) {
        revenueChart.destroy();
    }

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
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: colors.accent,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    titleFont: {
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    borderWidth: 0,
                    cornerRadius: 8,
                    callbacks: {
                        label: (context) => {
                            return ` ${formatMoney(context.parsed.y)}`;
                        }
                    }
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
                    beginAtZero: true,
                    grid: {
                        color: colors.grid
                    },
                    ticks: {
                        callback: (value) => formatMoney(value),
                        font: {
                            size: 12
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            animations: {
                tension: {
                    duration: 1000,
                    easing: 'easeInOutCubic'
                }
            }
        }
    });
}

/*────────────────────────────────────────────
  assets/js/charts.js | ЧАСТЬ 2: ГРАФИКИ И ОБНОВЛЕНИЕ
─────────────────────────────────────────────*/

function initMastersChart(ctx, colors) {
    if (mastersChart) {
        mastersChart.destroy();
    }

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
                        font: {
                            size: 12
                        }
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
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    });
}

function initServicesChart(ctx, colors) {
    if (servicesChart) {
        servicesChart.destroy();
    }

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
    if (trendsChart) {
        trendsChart.destroy();
    }

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
                y: {
                    beginAtZero: true,
                    grid: {
                        color: colors.grid
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Обновление данных
export function updateCharts(period = 'month') {
    const entries = getAllEntries();
    
    // Фильтруем записи по периоду
    const filteredEntries = filterEntriesByPeriod(entries, period);
    
    // Обновляем все графики
    updateRevenueChart(filteredEntries);
    updateMastersChart(filteredEntries);
    updateServicesChart(filteredEntries);
    updateTrendsChart(filteredEntries);
}

function updateRevenueChart(entries) {
    if (!revenueChart) return;

    // Группируем данные по датам
    const dailyRevenue = entries.reduce((acc, entry) => {
        const date = entry.date;
        acc[date] = (acc[date] || 0) + entry.workCost + entry.partsCost;
        return acc;
    }, {});

    // Сортируем даты
    const sortedDates = Object.keys(dailyRevenue).sort();

    revenueChart.data.labels = sortedDates.map(date => formatDateDisplay(date));
    revenueChart.data.datasets[0].data = sortedDates.map(date => dailyRevenue[date]);
    
    // Анимированное обновление
    revenueChart.update('active');
}

// Вспомогательные функции
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
    // Обновляем градиенты
    const revenueCtx = document.getElementById('revenue-chart')?.getContext('2d');
    if (revenueCtx && revenueChart) {
        const revenueGradient = revenueCtx.createLinearGradient(0, 0, 0, 400);
        revenueGradient.addColorStop(0, colors.background);
        revenueGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        revenueChart.data.datasets[0].backgroundColor = revenueGradient;
        revenueChart.data.datasets[0].borderColor = colors.primary;
        revenueChart.data.datasets[0].pointBackgroundColor = colors.primary;
        revenueChart.options.scales.y.grid.color = colors.grid;
        revenueChart.update();
    }

    // Обновляем цвета круговой диаграммы
    if (mastersChart) {
        mastersChart.data.datasets[0].backgroundColor = [
            colors.primary,
            colors.secondary,
            colors.accent,
            ...generateGradientColors(colors.primary, colors.secondary, 7)
        ];
        mastersChart.data.datasets[0].borderColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--panel-bg').trim();
        mastersChart.update();
    }

    // Обновляем цвета столбчатой диаграммы
    if (servicesChart) {
        servicesChart.data.datasets[0].backgroundColor = colors.primary;
        servicesChart.update();
    }

    // Обновляем цвета графика трендов
    if (trendsChart) {
        trendsChart.data.datasets[0].borderColor = colors.primary;
        trendsChart.data.datasets[1].borderColor = colors.accent;
        trendsChart.options.scales.y.grid.color = colors.grid;
        trendsChart.update();
    }
}

// Экспорт графиков
function exportChartAsImage(chartId, fileName) {
    const chart = getChartById(chartId);
    if (!chart) return;

    // Создаем временный canvas с белым фоном
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = chart.canvas.width;
    tempCanvas.height = chart.canvas.height;

    // Рисуем белый фон
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Копируем график
    tempCtx.drawImage(chart.canvas, 0, 0);

    // Создаем ссылку для скачивания
    const link = document.createElement('a');
    link.download = `${fileName || 'chart'}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
}

// Анимированное обновление данных
function animateChartUpdate(chart, newData, duration = 1000) {
    const startData = [...chart.data.datasets[0].data];
    const diff = newData.map((val, i) => val - (startData[i] || 0));
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    function animate() {
        currentStep++;
        const progress = currentStep / steps;
        
        // Используем функцию плавности
        const easeProgress = easeOutCubic(progress);

        const currentData = newData.map((val, i) => 
            startData[i] + (diff[i] * easeProgress)
        );

        chart.data.datasets[0].data = currentData;
        chart.update('none'); // Отключаем встроенную анимацию

        if (currentStep < steps) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

// Функция плавности
function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
}

// Форматирование подписей
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

// Создание легенды с дополнительной информацией
function generateCustomLegend(chart) {
    const ul = document.createElement('ul');
    ul.className = 'custom-chart-legend';

    chart.data.datasets[0].data.forEach((value, index) => {
        const li = document.createElement('li');
        li.className = 'legend-item';
        
        const color = chart.data.datasets[0].backgroundColor[index];
        const label = chart.data.labels[index];
        const percentage = ((value / chart.data.datasets[0].data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);

        li.innerHTML = `
            <span class="legend-color" style="background-color: ${color}"></span>
            <span class="legend-label">${label}</span>
            <span class="legend-value">${formatMoney(value)}</span>
            <span class="legend-percentage">${percentage}%</span>
        `;

        ul.appendChild(li);
    });

    return ul;
}

// Обработка взаимодействия с графиком
function setupChartInteractions(chartId) {
    const chart = getChartById(chartId);
    if (!chart) return;

    chart.canvas.addEventListener('mousemove', (e) => {
        const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
        
        if (points.length) {
            chart.canvas.style.cursor = 'pointer';
        } else {
            chart.canvas.style.cursor = 'default';
        }
    });

    chart.canvas.addEventListener('click', (e) => {
        const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
        
        if (points.length) {
            const firstPoint = points[0];
            const label = chart.data.labels[firstPoint.index];
            const value = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
            
            // Вызываем callback с данными точки
            if (typeof chart.options.onClick === 'function') {
                chart.options.onClick(label, value);
            }
        }
    });
}

// Получение графика по ID
function getChartById(chartId) {
    switch (chartId) {
        case 'revenue':
            return revenueChart;
        case 'masters':
            return mastersChart;
        case 'services':
            return servicesChart;
        case 'trends':
            return trendsChart;
        default:
            return null;
    }
}

// Экспорт всех необходимых функций
export {
    initCharts,
    updateCharts,
    updateChartsTheme,
    exportChartAsImage,
    generateCustomLegend,
    setupChartInteractions
};
