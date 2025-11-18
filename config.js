// ==================== CONFIGURAÇÕES ====================

// ===== CONFIGURAÇÃO BACKEND =====
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyY6lG1YK-t7h5zuxxdvEsMCojRAgQOpKcKwPtnfFNoTXMRhoD2KEkJ-FhrOXyavMV3/exec';

// ===== LINKS DOS POWER BIs POR BOLÃO =====
const POWER_BI_LINKS = {
    'GERAL': 'https://app.powerbi.com/view?r=eyJrIjoiYjg2YTNiZjMtNGI0OS00NmQxLTllYjMtNDUzYzMyZjliZGM2IiwidCI6IjViYjM1MmQwLWMyM2ItNDc5My05MjkwLTZmY2Q0NmVhMzZkZiJ9',
    'AMIGOS': 'https://app.powerbi.com/view?r=eyJrIjoiN2U0MzgxNWUtZDY1Yy00MDFiLWIyZDEtNmQ3YTEyMTY1ZTFmIiwidCI6IjViYjM1MmQwLWMyM2ItNDc5My05MjkwLTZmY2Q0NmVhMzZkZiJ9',
    // Adicione mais bolões conforme necessário
};


// DATAS LIMITE por fase (CORRIGIDO PARA 2026!)
const DATAS_LIMITE = {
    'Grupo': new Date('2026-06-12T14:00:00'),
    '16 avos': new Date('2025-11-15T12:00:00'),
    'Oitavas de final': new Date('2025-11-12T12:00:00'),
    'Quartas de final': new Date('2025-11-12T16:00:00'),
    'Semifinais': new Date('2025-11-12T16:00:00'),
    'Terceiro e Quarto': new Date('2025-11-12T14:00:00'),
    'Final': new Date('2025-11-12T16:00:00'),
};
// ID DO GOOGLE SHEETS
const SPREADSHEET_ID = '1YpZOyzF1Uph8iBNFwx7xUizSzJUwm1wU-8YdWspH9tY';

// CHAVE DA API DO GOOGLE
const API_KEY = 'AIzaSyDFMcnjQHmqQhKyWysq5GHyCRINDnitg_A';

