// Estado global
let usuarioLogado = null;
let jogosData = [];
let palpitesUsuario = {};
let palpitesAtuais = {};
let userToken = null;


const BACKEND_URL = 'https://bolao-2026-geral-backend.vercel.app';

// Elementos DOM
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const nomeUsuario = document.getElementById('nomeUsuario');
const logoutBtn = document.getElementById('logoutBtn');
const jogosContainer = document.getElementById('jogosContainer');
const loading = document.getElementById('loading');
const submitContainer = document.getElementById('submitContainer');
const submitBtn = document.getElementById('submitBtn');
const successMessage = document.getElementById('successMessage');
const prazosInfo = document.getElementById('prazosInfo');
const progressContainer = document.getElementById('progressContainer');

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    mostrarPrazos();
    
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    submitBtn.addEventListener('click', handleSubmit);
});

// Mostrar prazos na tela de login
function mostrarPrazos() {
    let html = '';
    for (const [fase, dataLimite] of Object.entries(DATAS_LIMITE)) {
        const tempoRestante = calcularTempoRestante(dataLimite);
        const classe = tempoRestante.encerrado ? 'prazo-encerrado' : 'prazo-aberto';
        const icone = tempoRestante.encerrado ? '🔒' : '🟢';
        const texto = tempoRestante.encerrado ? 'Indisponivel' : tempoRestante.texto;
        
        html += `<div class="prazo-item ${classe}">${icone} ${fase}: ${texto}</div>`;
    }
    prazosInfo.innerHTML = html;
}

// Calcular tempo restante
function calcularTempoRestante(dataLimite) {
    const agora = new Date();
    const diferenca = dataLimite - agora;
    
    if (diferenca <= 0) {
        return { encerrado: true, texto: 'Indisponível' };
    }
    
    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
    
    if (dias > 0) {
        return { encerrado: false, texto: `${dias}d ${horas}h ${minutos}min` };
    } else if (horas > 0) {
        return { encerrado: false, texto: `${horas}h ${minutos}min` };
    } else {
        return { encerrado: false, texto: `${minutos}min` };
    }
}

// Verificar se fase está aberta
function faseEstaAberta(fase) {
    if (!DATAS_LIMITE[fase]) return true;
    return !calcularTempoRestante(DATAS_LIMITE[fase]).encerrado;
}

// Login com backend
async function handleLogin(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    const codigo = document.getElementById('codigo').value;
    
    loginError.textContent = '⏳ Verificando...';
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nome, codigo })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            usuarioLogado = nome;
            userToken = data.token;
            loginError.textContent = '';
            nomeUsuario.textContent = nome;
            
            loginScreen.style.display = 'none';
            appScreen.style.display = 'block';

            document.getElementById('rankingSection').style.display = 'block';
            
            carregarDados();
        } else {
            loginError.textContent = '❌ ' + (data.error || 'Nome ou código inválido!');
        }
    } catch (error) {
        loginError.textContent = '❌ Erro de conexão. Tente novamente.';
        console.error('Erro no login:', error);
    }
}

// Logout
function handleLogout() {
    usuarioLogado = null;
    userToken = null;
    palpitesAtuais = {};
    
    loginScreen.style.display = 'block';
    appScreen.style.display = 'none';
    
    document.getElementById('nome').value = '';
    document.getElementById('codigo').value = '';
}

// Carregar dados do Google Sheets
async function carregarDados() {
    try {
        loading.style.display = 'block';
        jogosContainer.innerHTML = '';
        
        await carregarJogos();
        await carregarPalpites();
        
        renderizarJogos();
        
        loading.style.display = 'none';
        submitContainer.style.display = 'block';
        
    } catch (error) {
        loading.innerHTML = `<p style="color: #f44336;">❌ Erro ao carregar dados: ${error.message}</p>`;
    }
}

// Carregar jogos do Google Sheets
async function carregarJogos() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/JOGOS?key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.values) {
        throw new Error('Nenhum jogo encontrado');
    }
    
    const headers = data.values[0];
    jogosData = data.values.slice(1).map(row => {
        const jogo = {};
        headers.forEach((header, index) => {
            jogo[header] = row[index] || '';
        });
        return jogo;
    });
}

// Carregar palpites do usuário
async function carregarPalpites() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/PALPITES?key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
            const headers = data.values[0];
            const rows = data.values.slice(1);
            
            rows.forEach(row => {
                if (row[0] === usuarioLogado) {
                    const idJogo = row[1];
                    palpitesUsuario[idJogo] = {
                        golsA: parseInt(row[2]) || 0,
                        golsB: parseInt(row[3]) || 0
                    };
                }
            });
        }
    } catch (error) {
        console.log('Nenhum palpite anterior encontrado');
    }
}

// Renderizar jogos por fase
function renderizarJogos() {
    const fases = ['Grupo', '16 avos', 'Oitavas de final', 'Quartas de final', 'Semifinais', 'Terceiro e Quarto', 'Final'];
    let html = '';
    let temFaseAberta = false;
    
    fases.forEach(fase => {
        const jogosFase = jogosData.filter(j => j.Fase === fase);
        if (jogosFase.length === 0) return;
        
        const faseAberta = faseEstaAberta(fase);
        if (faseAberta) temFaseAberta = true;
        
        const tempoRestante = calcularTempoRestante(DATAS_LIMITE[fase]);
        
        html += `
            <div class="fase-section">
                <div class="fase-header">
                    <h2 class="fase-title">🏆 ${fase}</h2>
                    <div class="fase-prazo ${faseAberta ? 'aberta' : 'encerrada'}">
                        ${faseAberta ? '⏰ ' + tempoRestante.texto : '🔒 Indisponível'}
                    </div>
                </div>
        `;
        
        if (!faseAberta) {
            html += `<div class="fase-bloqueada">⚠️ Palpites desta fase indisponível</div>`;
        }
        
        if (fase === 'Grupo') {
            const grupos = [...new Set(jogosFase.map(j => j.Grupo))].sort();
            grupos.forEach(grupo => {
                if (grupo) {
                    html += `<h3 class="grupo-subtitle">Grupo ${grupo}</h3>`;
                    const jogosGrupo = jogosFase.filter(j => j.Grupo === grupo);
                    jogosGrupo.forEach(jogo => {
                        html += renderizarJogo(jogo, faseAberta);
                    });
                }
            });
        } else {
            jogosFase.forEach(jogo => {
                html += renderizarJogo(jogo, faseAberta);
            });
        }
        
        html += `</div>`;
    });
    
    if (!temFaseAberta) {
        html += `<div class="fase-bloqueada" style="font-size: 1.2rem; padding: 30px;">
            🔒 Todas as fases encerradas. Você está visualizando seus palpites salvos.
        </div>`;
        submitContainer.style.display = 'none';
    }
    
    jogosContainer.innerHTML = html;
    
    document.querySelectorAll('.gols-input').forEach(input => {
        input.addEventListener('change', handlePalpiteChange);
    });
}

// Renderizar um jogo individual
function renderizarJogo(jogo, faseAberta) {
    const idJogo = jogo.ID_Jogo;
    const palpiteAnterior = palpitesUsuario[idJogo] || { golsA: 0, golsB: 0 };
    
    if (faseAberta) {
        return `
            <div class="jogo-card">
                <div class="jogo-content">
                    <div class="time">
                        <h3>${jogo.SeleçãoA}</h3>
                    </div>
                    <div>
                        <input type="number" class="gols-input" 
                               data-jogo="${idJogo}" 
                               data-time="A" 
                               min="0" max="20" 
                               value="${palpiteAnterior.golsA}">
                    </div>
                    <div class="vs">X</div>
                    <div>
                        <input type="number" class="gols-input" 
                               data-jogo="${idJogo}" 
                               data-time="B" 
                               min="0" max="20" 
                               value="${palpiteAnterior.golsB}">
                    </div>
                    <div class="time">
                        <h3>${jogo.SeleçãoB}</h3>
                    </div>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="jogo-card">
                <div class="jogo-content">
                    <div class="time">
                        <h3>${jogo.SeleçãoA}</h3>
                    </div>
                    <div class="gols-display">${palpiteAnterior.golsA}</div>
                    <div class="vs">X</div>
                    <div class="gols-display">${palpiteAnterior.golsB}</div>
                    <div class="time">
                        <h3>${jogo.SeleçãoB}</h3>
                    </div>
                </div>
            </div>
        `;
    }
}

// Atualizar palpite quando input muda
function handlePalpiteChange(e) {
    const idJogo = e.target.dataset.jogo;
    const time = e.target.dataset.time;
    const valor = parseInt(e.target.value) || 0;
    
    if (!palpitesAtuais[idJogo]) {
        palpitesAtuais[idJogo] = { golsA: 0, golsB: 0 };
    }
    
    if (time === 'A') {
        palpitesAtuais[idJogo].golsA = valor;
    } else {
        palpitesAtuais[idJogo].golsB = valor;
    }
}

// Enviar palpites via backend
async function handleSubmit() {
    const inputs = document.querySelectorAll('.gols-input');
    inputs.forEach(input => {
        const idJogo = input.dataset.jogo;
        const time = input.dataset.time;
        const valor = parseInt(input.value) || 0;
        
        if (!palpitesAtuais[idJogo]) {
            palpitesAtuais[idJogo] = { golsA: 0, golsB: 0 };
        }
        
        if (time === 'A') {
            palpitesAtuais[idJogo].golsA = valor;
        } else {
            palpitesAtuais[idJogo].golsB = valor;
        }
    });
    
    // Filtrar apenas jogos de fases abertas
    const palpitesFasesAbertas = {};
    for (const [idJogo, palpite] of Object.entries(palpitesAtuais)) {
        const jogo = jogosData.find(j => j.ID_Jogo == idJogo);
        if (jogo && faseEstaAberta(jogo.Fase)) {
            palpitesFasesAbertas[idJogo] = palpite;
        }
    }
    
    if (Object.keys(palpitesFasesAbertas).length === 0) {
        alert('⚠️ Não há palpites em fases abertas para salvar!');
        return;
    }
    
    // Mostrar barra de progresso
    submitContainer.style.display = 'none';
    progressContainer.style.display = 'block';
    
    const progressText = document.getElementById('progressText');
    const progressDetails = document.getElementById('progressDetails');
    const progressFill = document.getElementById('progressFill');
    const progressPercentage = document.getElementById('progressPercentage');
    
    progressText.textContent = '⏳ Salvando palpites...';
    progressDetails.textContent = `Salvando ${Object.keys(palpitesFasesAbertas).length} palpites de fases abertas`;
    progressFill.style.width = '30%';
    progressPercentage.textContent = '30%';
    
    try {
        setTimeout(() => {
            progressFill.style.width = '60%';
            progressPercentage.textContent = '60%';
        }, 500);
        
        const response = await fetch(`${BACKEND_URL}/api/salvar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                participante: usuarioLogado,
                palpites: palpitesFasesAbertas,
                token: userToken
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            progressFill.style.width = '100%';
            progressPercentage.textContent = '100%';
            progressText.textContent = '✅ Palpites salvos!';
            progressDetails.textContent = `${Object.keys(palpitesFasesAbertas).length} palpites salvos com sucesso!`;
            
            setTimeout(() => {
                progressContainer.style.display = 'none';
                submitContainer.style.display = 'block';
                
                successMessage.innerHTML = `✅ ${Object.keys(palpitesFasesAbertas).length} palpites salvos com sucesso! Boa sorte! 🍀`;
                successMessage.style.display = 'block';
                
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 5000);
            }, 2000);
        } else {
            throw new Error(data.error || 'Erro ao salvar');
        }
        
    } catch (error) {
        progressContainer.style.display = 'none';
        submitContainer.style.display = 'block';
        alert('❌ Erro ao salvar: ' + error.message);
    }
}
