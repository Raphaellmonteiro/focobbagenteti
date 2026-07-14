const SUBJECT_MAP = {
    ti: 'Tecnologia da Informação',
    portugues: 'Língua Portuguesa',
    matematica: 'Matemática & Estatística',
    bancarios: 'Conhecimentos Bancários',
    ingles: 'Língua Inglesa',
    atualidades: 'Atualidades Financeiras'
};

const STUDY_CYCLE = [
    { key: 'ti', name: 'Tecnologia da Informação' },
    { key: 'portugues', name: 'Língua Portuguesa' },
    { key: 'matematica', name: 'Matemática & Estatística' },
    { key: 'ti', name: 'Tecnologia da Informação' },
    { key: 'bancarios', name: 'Conhecimentos Bancários / Atualidades' },
    { key: 'ingles', name: 'Língua Inglesa' },
    { key: 'redacao', name: 'Redação / Questões Livres' }
];

let appState = {
    timer: {
        secondsRemaining: 1500,
        isRunning: false,
        intervalId: null,
        currentMode: 'study'
    },
    currentCycleIndex: 0,
    logs: [],
    essays: []
};

// --- POMODORO ---
const timerDisplay = document.getElementById('timer');
const timerStatus = document.getElementById('timer-status');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const modeStudy = document.getElementById('mode-study');
const modeBreak = document.getElementById('mode-break');

function updateTimerDisplay() {
    const minutes = Math.floor(appState.timer.secondsRemaining / 60);
    const seconds = appState.timer.secondsRemaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (appState.timer.isRunning) return;
    appState.timer.isRunning = true;
    appState.timer.intervalId = setInterval(() => {
        if (appState.timer.secondsRemaining > 0) {
            appState.timer.secondsRemaining--;
            updateTimerDisplay();
        } else {
            clearInterval(appState.timer.intervalId);
            appState.timer.isRunning = false;
            alert(appState.timer.currentMode === 'study' ? 'Hora da pausa de 5 minutos!' : 'De volta ao foco!');
            resetTimer();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(appState.timer.intervalId);
    appState.timer.isRunning = false;
}

function resetTimer() {
    pauseTimer();
    appState.timer.secondsRemaining = appState.timer.currentMode === 'study' ? 1500 : 300;
    updateTimerDisplay();
}

function setTimerMode(mode) {
    appState.timer.currentMode = mode;
    if (mode === 'study') {
        modeStudy.classList.add('active');
        modeBreak.classList.remove('active');
        timerStatus.textContent = 'Foco total nas questões!';
    } else {
        modeStudy.classList.remove('active');
        modeBreak.classList.add('active');
        timerStatus.textContent = 'Descanse um pouco.';
    }
    resetTimer();
}

btnStart.addEventListener('click', startTimer);
btnPause.addEventListener('click', pauseTimer);
btnReset.addEventListener('click', resetTimer);
modeStudy.addEventListener('click', () => setTimerMode('study'));
modeBreak.addEventListener('click', () => setTimerMode('break'));


// --- GESTÃO DE ESTUDOS ---
const questoesForm = document.getElementById('questoes-form');
const subjectList = document.getElementById('subject-list');
const recentLogsDiv = document.getElementById('recent-logs');
const cycleStepsDiv = document.getElementById('cycle-steps');
const btnAdvanceCycle = document.getElementById('btn-advance-cycle');

const btnSaveEssay = document.getElementById('btn-save-essay');
const essayThemeInput = document.getElementById('essay-theme');
const essayScoreInput = document.getElementById('essay-score');

function saveToLocalStorage() {
    localStorage.setItem('bb_study_state_v5', JSON.stringify({
        logs: appState.logs,
        essays: appState.essays,
        currentCycleIndex: appState.currentCycleIndex
    }));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('bb_study_state_v5');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.logs) appState.logs = parsed.logs;
        if (parsed.essays) appState.essays = parsed.essays;
        if (parsed.currentCycleIndex !== undefined) appState.currentCycleIndex = parsed.currentCycleIndex;
    }
}

// ALGORITMO REALISTA DE PROBABILIDADE (BLINDADO CONTRA DISTORÇÕES DE VOLUME)
function calculateProbability(totalSolved, totalCorrect, stats) {
    if (totalSolved === 0) {
        return { percent: 0, feedback: "Registre suas primeiras questões para calcularmos sua chance real.", colorClass: "bg-red" };
    }

    const accuracyRate = totalSolved > 0 ? (totalCorrect / totalSolved) : 0;

    // [REGRA DE ELIMINAÇÃO] Se o aproveitamento geral estiver abaixo de 50%, a chance é IMEDIATAMENTE travada em 0%
    if (accuracyRate < 0.50) {
        return { 
            percent: 0, 
            feedback: `🛑 Chance Atual: 0%. Sua média de acertos geral (${Math.round(accuracyRate*100)}%) está abaixo do mínimo de 50% exigido. Foque em ler os comentários das questões resolvidas para corrigir o rumo!`, 
            colorClass: "bg-red" 
        };
    }

    // 1. CÁLCULO DA PONTUAÇÃO BASE DE APROVEITAMENTO (Régua de corte real do BB TI fica entre 75% e 82%)
    let accuracyScore = 0;
    if (accuracyRate >= 0.75) {
        accuracyScore = 100; // Nível ideal de vaga garantida
    } else if (accuracyRate >= 0.65) {
        // Interpolação de 50 a 100 pontos de chance real (65% também é o piso da penalidade de TI)
        accuracyScore = 50 + ((accuracyRate - 0.65) / 0.10) * 50;
    } else {
        // Interpolação para taxas entre 50% e 65% (de 5 a 50 pontos de chance real)
        accuracyScore = 5 + ((accuracyRate - 0.50) / 0.15) * 45;
    }

    // 2. FATOR MULTIPLICADOR DE VOLUME (Meta ideal: 1.000 questões resolvidas, conforme robustez estatística exigida)
    // Se fez poucas questões, a taxa de acertos pode ser instável, por isso o volume matura sua chance real
    const targetVolume = 1000;
    const volumeMultiplier = Math.min(totalSolved / targetVolume, 1.0);

    // 3. PENALIDADE DISCIPLINAR (Se estiver mal em TI, que vale metade da prova)
    let tiPenalty = 1.0;
    const tiSolved = stats.ti.solved;
    const tiCorrect = stats.ti.correct;
    const tiAccuracy = tiSolved > 0 ? (tiCorrect / tiSolved) : 0;
    if (tiSolved >= 15 && tiAccuracy < 0.65) {
        tiPenalty = 0.75; // Perde 25% de chance potencial se o rendimento de TI estiver baixo
    }

    // Cálculo Combinado Final: EXCLUSIVAMENTE prova objetiva (taxa de acerto refinada pelo volume acumulado e penalidade de TI).
    // A Redação corre separada (ver getEssayStatus) e NÃO entra nesta conta, conforme regra de Escopo Independente.
    let finalPercent = Math.round(accuracyScore * (0.3 + 0.7 * volumeMultiplier) * tiPenalty);
    
    // Proteção de limites de 0% a 100%
    finalPercent = Math.max(0, Math.min(finalPercent, 100));

    let feedback = "";
    let colorClass = "bg-red";

    if (finalPercent >= 80) {
        colorClass = "bg-green";
        feedback = `🔥 Excelente! Você tem ${finalPercent}% de chance de aprovação na prova objetiva. Sua taxa geral (${Math.round(accuracyRate*100)}%) e volume estão excelentes!`;
    } else if (finalPercent >= 50) {
        colorClass = "bg-yellow";
        feedback = `⚠️ Margem Competitiva (${finalPercent}%). Seu aproveitamento é bom, mas você precisa acumular mais volume de questões para alcançar a margem de segurança.`;
    } else {
        colorClass = "bg-red";
        if (totalSolved < 150) {
            feedback = `📈 Chance Atual: ${finalPercent}%. O volume de treino (${totalSolved}/150 mínimo sugerido) está baixo para garantir constância estatística. Continue alimentando o ciclo!`;
        } else if (tiAccuracy < 0.65) {
            feedback = `💻 Foco em TI! O rendimento em TI (matéria de maior peso) está abaixo de 65%, puxando sua aprovação para ${finalPercent}%. Estude os comentários das questões que errou!`;
        } else {
            feedback = `Estude atentamente os seus erros para subir a taxa média geral e sair dos ${finalPercent}%.`;
        }
    }

    return { percent: finalPercent, feedback, colorClass };
}

// STATUS DA REDAÇÃO — ISOLADO, avalia apenas a redação MAIS RECENTE (simulando o dia da prova).
// Não interfere na probabilidade da prova objetiva calculada acima (Escopo Independente).
function getEssayStatus() {
    if (appState.essays.length === 0) {
        return { label: '✍️ Nenhuma redação registrada ainda', className: '' };
    }
    const latest = appState.essays[0]; // essays são inseridas com unshift, [0] = mais recente
    if (latest.score < 70) {
        return { label: `🔴 ELIMINADO (${latest.score} pts)`, className: 'eliminated' };
    }
    return { label: `🟢 APTO (${latest.score} pts)`, className: 'apt' };
}

// MÉDIA E TENDÊNCIA DAS REDAÇÕES — mostra a EVOLUÇÃO ao longo do tempo (diferente do status isolado acima,
// que só olha a última nota). Aqui sim entra a média histórica, para você acompanhar seu caminho.
function getEssayTrend() {
    const essays = appState.essays;
    if (essays.length === 0) {
        return { text: '', className: '' };
    }
    const average = essays.reduce((sum, e) => sum + e.score, 0) / essays.length;
    const averageText = `Média geral: ${average.toFixed(1)} pts (${essays.length} redaç${essays.length === 1 ? 'ão' : 'ões'})`;

    if (essays.length < 2) {
        return { text: averageText, className: '' };
    }

    // essays[0] = mais recente, essays[1] = anterior a ela
    const diff = essays[0].score - essays[1].score;
    let trendText = '';
    let className = '';
    if (diff > 0) {
        trendText = ` · ↑ subiu ${diff} pts vs. anterior`;
        className = 'trend-up';
    } else if (diff < 0) {
        trendText = ` · ↓ caiu ${Math.abs(diff)} pts vs. anterior`;
        className = 'trend-down';
    } else {
        trendText = ' · manteve a nota anterior';
    }

    return { text: averageText + trendText, className };
}

function updateDashboard() {
    const stats = {
        ti: { solved: 0, correct: 0 },
        portugues: { solved: 0, correct: 0 },
        matematica: { solved: 0, correct: 0 },
        bancarios: { solved: 0, correct: 0 },
        ingles: { solved: 0, correct: 0 },
        atualidades: { solved: 0, correct: 0 }
    };

    let totalSolved = 0;
    let totalCorrect = 0;

    appState.logs.forEach(log => {
        if (stats[log.subject]) {
            stats[log.subject].solved += log.solved;
            stats[log.subject].correct += log.correct;
            totalSolved += log.solved;
            totalCorrect += log.correct;
        }
    });

    // Renderizar painel de matérias
    subjectList.innerHTML = '';
    for (const key in stats) {
        const item = stats[key];
        const accuracy = item.solved > 0 ? Math.round((item.correct / item.solved) * 100) : 0;
        let accuracyClass = 'acc-low';
        if (accuracy >= 70) accuracyClass = 'acc-high';
        else if (accuracy >= 50) accuracyClass = 'acc-mid';

        subjectList.innerHTML += `
            <div class="subject-row">
                <div>
                    <div class="sub-title">${SUBJECT_MAP[key]}</div>
                    <div class="sub-details">${item.solved} resolvidas / ${item.correct} acertos</div>
                </div>
                <div class="sub-acc ${accuracyClass}">${accuracy}%</div>
            </div>
        `;
    }

    // Atualiza probabilidade real de aprovação
    const probData = calculateProbability(totalSolved, totalCorrect, stats);
    const probBadge = document.getElementById('prob-badge');
    const probProgress = document.getElementById('prob-progress');
    const probFeedback = document.getElementById('prob-feedback');

    probBadge.textContent = `${probData.percent}%`;
    probBadge.className = `prob-badge ${probData.colorClass.replace('bg-', '')}`;
    probProgress.style.width = `${probData.percent}%`;
    probProgress.className = `progress-bar-fill ${probData.colorClass}`;
    probFeedback.textContent = probData.feedback;

    // Status isolado da redação (não afeta a probabilidade acima)
    const essayStatus = getEssayStatus();
    const essayStatusBadge = document.getElementById('essay-status-badge');
    essayStatusBadge.textContent = essayStatus.label;
    essayStatusBadge.className = `essay-status-badge ${essayStatus.className}`;

    // Média e tendência das redações (evolução ao longo do tempo)
    const essayTrend = getEssayTrend();
    const essayTrendLine = document.getElementById('essay-trend-line');
    essayTrendLine.textContent = essayTrend.text;
    essayTrendLine.className = `essay-trend-line ${essayTrend.className}`;

    // Estatísticas superiores
    document.getElementById('total-solved').textContent = totalSolved;
    document.getElementById('total-correct').textContent = totalCorrect;
    
    const generalAccuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
    document.getElementById('accuracy-rate').textContent = `${generalAccuracy}%`;

    const weeklyGoal = 100;
    const progressPercent = Math.min(Math.round((totalSolved / weeklyGoal) * 100), 100);
    document.getElementById('overall-progress').style.width = `${progressPercent}%`;
    document.getElementById('progress-text').textContent = `${progressPercent}% (${totalSolved} / ${weeklyGoal})`;

    renderCycle();
    renderRecentLogs();
}

function renderCycle() {
    cycleStepsDiv.innerHTML = '';
    STUDY_CYCLE.forEach((step, index) => {
        let stepClass = 'cycle-step';
        let badgeText = 'Aguardando';

        if (index === appState.currentCycleIndex) {
            stepClass += ' active';
            badgeText = '👉 Próximo';
        } else if (index < appState.currentCycleIndex) {
            stepClass += ' completed';
            badgeText = '✅ Feito';
        }

        cycleStepsDiv.innerHTML += `
            <div class="${stepClass}">
                <div>
                    <strong style="display: block;">Etapa ${index + 1}: ${step.name}</strong>
                    <span style="font-size: 0.78rem; color: var(--text-secondary);">2 Pomodoros de foco</span>
                </div>
                <span style="font-size: 0.8rem; font-weight: 600;">${badgeText}</span>
            </div>
        `;
    });
}

btnAdvanceCycle.addEventListener('click', () => {
    appState.currentCycleIndex = (appState.currentCycleIndex + 1) % STUDY_CYCLE.length;
    saveToLocalStorage();
    updateDashboard();
});

// LINHA DO TEMPO UNIFICADA: questões e redações juntas, em ordem cronológica de inserção (mais recente primeiro)
function getUnifiedTimeline() {
    const combined = [
        ...appState.logs.map(log => ({ ...log, type: 'questao' })),
        ...appState.essays.map(essay => ({ ...essay, type: 'redacao' }))
    ];
    combined.sort((a, b) => Number(b.id) - Number(a.id));
    return combined;
}

function renderRecentLogs() {
    recentLogsDiv.innerHTML = '';
    const timeline = getUnifiedTimeline();

    if (timeline.length === 0) {
        recentLogsDiv.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.85rem; text-align: center; padding: 15px 0;">Nenhum lançamento registrado.</p>';
        return;
    }

    timeline.forEach(item => {
        if (item.type === 'questao') {
            const accuracy = item.solved > 0 ? Math.round((item.correct / item.solved) * 100) : 0;
            let badgeClass = 'low';
            if (accuracy >= 70) badgeClass = 'high';
            else if (accuracy >= 50) badgeClass = 'mid';

            recentLogsDiv.innerHTML += `
                <div class="history-row">
                    <div class="history-info">
                        <span class="history-subj"><span class="history-type-tag questao">Questões</span>${SUBJECT_MAP[item.subject]}</span>
                        <span class="history-meta">${item.solved} resolvidas / ${item.correct} acertos (${item.date})</span>
                    </div>
                    <div class="history-action">
                        <span class="history-score-badge ${badgeClass}">${accuracy}%</span>
                        <button class="btn-delete-log" onclick="deleteLog('${item.id}')" title="Apagar lançamento errado">🗑️</button>
                    </div>
                </div>
            `;
        } else {
            const badgeClass = item.score >= 70 ? 'high' : 'low';
            recentLogsDiv.innerHTML += `
                <div class="history-row">
                    <div class="history-info">
                        <span class="history-subj"><span class="history-type-tag redacao">Redação</span>${item.theme}</span>
                        <span class="history-meta">${item.score >= 70 ? 'Aprovado' : 'Abaixo do corte'} (${item.date})</span>
                    </div>
                    <div class="history-action">
                        <span class="history-score-badge ${badgeClass}">${item.score} pts</span>
                        <button class="btn-delete-log" onclick="deleteEssay('${item.id}')" title="Apagar redação errada">🗑️</button>
                    </div>
                </div>
            `;
        }
    });
}

window.deleteLog = function(id) {
    if (confirm('Deseja apagar este lançamento específico do histórico?')) {
        appState.logs = appState.logs.filter(log => log.id !== id);
        saveToLocalStorage();
        updateDashboard();
    }
};

window.deleteEssay = function(id) {
    if (confirm('Deseja apagar esta nota de redação do histórico?')) {
        appState.essays = appState.essays.filter(essay => essay.id !== id);
        saveToLocalStorage();
        updateDashboard();
    }
};

questoesForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = document.getElementById('subject').value;
    const solvedVal = parseInt(document.getElementById('solved').value);
    const correctVal = parseInt(document.getElementById('correct').value);

    if (correctVal > solvedVal) {
        alert('O número de acertos não pode ser maior do que o de questões resolvidas!');
        return;
    }

    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}`;

    const newLog = {
        id: Date.now().toString(),
        subject,
        solved: solvedVal,
        correct: correctVal,
        date: formattedDate
    };

    appState.logs.unshift(newLog);
    saveToLocalStorage();
    updateDashboard();
    questoesForm.reset();
});

btnSaveEssay.addEventListener('click', () => {
    const theme = essayThemeInput.value.trim();
    const score = parseInt(essayScoreInput.value);

    if (!theme || isNaN(score) || score < 0 || score > 100) {
        alert('Digite um tema e uma nota entre 0 e 100.');
        return;
    }

    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}`;

    const newEssay = {
        id: Date.now().toString(),
        theme,
        score,
        date: formattedDate
    };

    appState.essays.unshift(newEssay);
    saveToLocalStorage();
    updateDashboard();

    essayThemeInput.value = '';
    essayScoreInput.value = '';
});

window.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    updateTimerDisplay();
    updateDashboard();
});
