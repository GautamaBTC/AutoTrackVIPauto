/*────────────────────────────────────────────
  assets/js/theme.js | СИСТЕМА ТЕМ И ХЕДЕРА
─────────────────────────────────────────────*/

// --- Константы ---
const STORAGE_KEY = 'vipautologin_theme';
const TRANSITION_DURATION = 300;

const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};

// --- CSS переменные для каждой темы (с бирюзовыми тонами в dark) ---
const THEME_VARIABLES = {
    [THEMES.LIGHT]: {
        '--bg': '#F0F2F5',
        '--panel-bg': '#FFFFFF',
        '--input-bg': '#F0F2F5',
        '--border': '#DCDFE6',
        '--text': '#303133',
        '--text-muted': '#909399',
        '--accent': '#399D9C',
        '--accent-light': '#4DBAB3',
        '--accent-dark': '#2D7F7E',
        '--shadow': 'rgba(0, 0, 0, 0.05)',
        '--btn-text': '#FFFFFF'
    },
    [THEMES.DARK]: {
        '--bg': '#001F3F', // Тёмно-бирюзовый фон
        '--panel-bg': '#002B55',
        '--input-bg': '#003D6B',
        '--border': '#005588',
        '--text': '#E0FFFF', // Светло-бирюзовый текст
        '--text-muted': '#A0D2DB',
        '--accent': '#008B8B', // Основной бирюзовый
        '--accent-light': '#00A0A0',
        '--accent-dark': '#0