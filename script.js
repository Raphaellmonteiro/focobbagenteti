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


// --- CÁLCULO E ATUALIZAÇÃO DO SISTEMA ---
const questoesForm = document.getElementById('questoes-form');
const subjectList = document.getElementById('subject-list');
const btnResetData = document.getElementById('btn-reset-data');
const recentLogsDiv = document.getElementById('recent-logs');
const cycleStepsDiv = document.getElementById('cycle-steps');
const btnAdvanceCycle = document.getElementById('btn-advance-cycle');

const btnSaveEssay = document.getElementById('btn-save-essay');
const essayThemeInput = document.getElementById('essay-theme');
const essayScoreInput = document.getElementById('essay-score');
const essayHistoryDiv = document.getElementById('essay-history');

function saveToLocalStorage() {
    localStorage.setItem('bb_study_state_v3', JSON.stringify({
        logs: appState.logs,
        essays: appState.essays,
        currentCycleIndex: appState.currentCycleIndex
    }));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('bb_study_state_v3');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.logs) appState.logs = parsed.logs;
        if (parsed.essays) appState.essays = parsed.essays;
        if (parsed.currentCycleIndex !== undefined) appState.currentCycleIndex = parsed.currentCycleIndex;
    }
}

// CALCULA PROBABILIDADE REAL (SEM ILUSÃO)
function calculateProbability(totalSolved, totalCorrect, stats) {
    if (totalSolved === 0) {
        return { percent: 0, feedback: "Registre suas primeiras questões para calcularmos sua chance real.", colorClass: "bg-red" };
    }

    const accuracyRate = totalSolved > 0 ? (totalCorrect / totalSolved) : 0; // 0.00 a 1.00

    // 1. FATOR VOLUME (Meta ideal de bagagem: 500 questões resolvidas)
    const targetVolume = 500;
    const volumeFactor = Math.min(totalSolved / targetVolume, 1.0); // Máximo 100% do fator

    // 2. FATOR APROVEITAMENTO (Régua de corte para TI é alta: ~78%)
    let accuracyFactor = 0;
    if (accuracyRate >= 0.80) {
        accuracyFactor = 1.0; // Excelente
    } else if (accuracyRate >= 0.70) {
        accuracyFactor = 0.80; // Competitivo
    } else if (accuracyRate >= 0.50) {
        accuracyFactor = 0.40; // Razoável, mas fora das vagas
    } else {
        accuracyFactor = 0.10; // Muito baixo para o corte
    }

    // 3. FATOR REDAÇÃO (Corte obrigatório de 70 pontos)
    let essayFactor = 0;
    if (appState.essays.length > 0) {
        const averageEssay = appState.essays.reduce((sum, e) => sum + e.score, 0) / appState.essays.length;
        if (averageEssay >= 85) essayFactor = 1.0;
        else if (averageEssay >= 70) essayFactor = 0.75;
        else essayFactor = 0.10; // Reprovado na redação zera as chances reais
    } else {
        essayFactor = 0.30; // Sem redação perde pontos de probabilidade por falta de treino
    }

    // Ponderação final da probabilidade
    // 55% Média de Acertos, 30% Volume de treino acumulado, 15% Desempenho na redação
    let rawProb = (accuracyFactor * 0.55) + (volumeFactor * 0.30) + (essayFactor * 0.15);
    
    // Penalidade se o desempenho em TI (matéria principal) estiver muito baixo
    const tiSolved = stats.ti.solved;
    const tiCorrect = stats.ti.correct;
    const tiAccuracy = tiSolved > 0 ? (tiCorrect / tiSolved) : 0;
    if (tiSolved > 10 && tiAccuracy < 0.65) {
        rawProb *= 0.8; // Perde 20% de chance por estar fraco em TI (metade da prova)
    }

    const finalPercent = Math.round(rawProb * 100);

    // Definição de feedbacks e cores
    let feedback = "";
    let colorClass = "bg-red";

    if (finalPercent >= 75) {
        colorClass = "bg-green";
        feedback = "🔥 Excelente! Você está no nível de disputa real pelas vagas. Continue mantendo a constância!";
    } else if (finalPercent >= 50) {
        colorClass = "bg-yellow";
        feedback = "⚠️ Você está competitivo, mas ainda fora da margem de segurança. Aumente o volume de questões de TI e suba sua média de acertos geral.";
    } else {
        colorClass = "bg-red";
        if (totalSolved < 100) {
            feedback = "🛑 Sua chance é baixa porque você tem pouca bagagem de questões resolvidas. Resolva mais exercícios para amadurecer a matéria.";
        } else if (accuracyRate < 0.65) {
            feedback = "🛑 Sua média de acertos geral está abaixo da régua de corte do Banco do Brasil. Estude os comentários das questões que errou!";
        } else if (appState.essays.length === 0) {
            feedback = "✍️ Atenção: Treine pelo menos uma redação e registre a nota para blindar sua nota de corte.";
        } else {
            feedback = "Foco em subir o aproveitamento nas específicas e resolver mais questões por dia!";
        }
    }

    return { percent: finalPercent, feedback, colorClass };
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

    // Estatísticas superiores
    document.getElementById('total-solved').textContent = totalSolved;
    document.getElementById('total-correct').textContent = totalCorrect;
    
    const generalAccuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
    document.getElementById('accuracy-rate').textContent = `${generalAccuracy}%`;

    const weeklyGoal = 100;
    const progressPercent = Math.min(Math.round((totalSolved / weeklyGoal) * 100), 100);
    document.getElementById('overall-progress').style.width = `${progressPercent}%`;
    document.getElementById('progress-text').textContent = `${progressPercent}% (${totalSolved} / ${weeklyGoal} questões)`;

    renderCycle();
    renderRecentLogs();
    renderEssayHistory();
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

function renderRecentLogs() {
    recentLogsDiv.innerHTML = '';
    if (appState.logs.length === 0) {
        recentLogsDiv.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.85rem; text-align: center; padding: 15px 0;">Nenhum lançamento registrado.</p>';
        return;
    }

    appState.logs.forEach(log => {
        recentLogsDiv.innerHTML += `
            <div class="subject-row" style="padding: 8px 0; font-size: 0.88rem;">
                <div>
                    <strong>${SUBJECT_MAP[log.subject]}</strong>
                    <span style="color: var(--text-secondary); display: block;">${log.solved} qst / ${log.correct} acertos (${log.date})</span>
                </div>
                <button class="btn-delete-log" onclick="deleteLog('${log.id}')">🗑️</button>
            </div>
        `;
    });
}

window.deleteLog = function(id) {
    if (confirm('Deseja apagar este lançamento?')) {
        appState.logs = appState.logs.filter(log => log.id !== id);
        saveToLocalStorage();
        updateDashboard();
    }
};

function renderEssayHistory() {
    essayHistoryDiv.innerHTML = '';
    if (appState.essays.length === 0) {
        essayHistoryDiv.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.85rem; text-align: center; padding: 10px 0;">Nenhuma redação registrada.</p>';
        return;
    }

    appState.essays.forEach(essay => {
        const passedClass = essay.score >= 70 ? 'acc-high' : 'acc-low';
        essayHistoryDiv.innerHTML += `
            <div class="subject-row" style="padding: 8px 0;">
                <div>
                    <div class="sub-title" style="font-size: 0.9rem;">${essay.theme}</div>
                    <div class="sub-details">Status: ${essay.score >= 70 ? 'Aprovado' : 'Abaixo do corte'}</div>
                </div>
                <div class="sub-acc ${passedClass}" style="font-size: 1rem;">${essay.score} pts</div>
            </div>
        `;
    });
}

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

    appState.essays.unshift({ theme, score });
    saveToLocalStorage();
    updateDashboard();

    essayThemeInput.value = '';
    essayScoreInput.value = '';
});

btnResetData.addEventListener('click', () => {
    if (confirm('Tem certeza de que deseja apagar absolutamente todo o seu progresso?')) {
        appState.logs = [];
        appState.essays = [];
        appState.currentCycleIndex = 0;
        saveToLocalStorage();
        updateDashboard();
    }
});

window.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    updateTimerDisplay();
    updateDashboard();
});