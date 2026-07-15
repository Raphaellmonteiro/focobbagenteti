const SUBJECT_MAP = {
    ti: 'Tecnologia da Informação',
    portugues: 'Língua Portuguesa',
    matematica: 'Matemática & Estatística',
    bancarios: 'Conhecimentos Bancários',
    ingles: 'Língua Inglesa',
    atualidades: 'Atualidades Financeiras'
};

// TÓPICOS REAIS DO EDITAL (Cesgranrio - BB Escriturário, Agente de Tecnologia) POR MATÉRIA.
// Base pro checklist de cobertura: o que já foi estudado x o que ainda falta.
const SYLLABUS = {
    ti: [
        'Lógica de Programação',
        'Estruturas de Dados (pilha, fila, lista, árvore)',
        'Python para Dados/IA (Pandas, NumPy, Scikit-learn)',
        'Aprendizagem de Máquina (supervisionado/não supervisionado, PLN)',
        'Banco de Dados',
        'Redes de Computadores',
        'Segurança da Informação / LGPD / Sigilo Bancário',
        'Sistemas Operacionais e Ferramentas de Desenvolvimento'
    ],
    portugues: [
        'Interpretação de Texto',
        'Ortografia Oficial e Acentuação/Crase',
        'Classes e Emprego de Palavras',
        'Sintaxe (concordância, regência, pontuação)'
    ],
    matematica: [
        'Números Inteiros, Racionais e Reais',
        'Razões, Proporções e Regra de Três',
        'Lógica Proposicional e Noções de Conjuntos',
        'Funções, Determinantes e Sistemas Lineares',
        'Sequências, PA e PG',
        'Probabilidade e Estatística'
    ],
    bancarios: [
        'Sistema Financeiro Nacional',
        'Produtos e Serviços Bancários',
        'Ética e Legislação Anticorrupção'
    ],
    ingles: [
        'Compreensão de Texto (Reading Comprehension)',
        'Vocabulário Técnico e Bancário'
    ],
    atualidades: [
        'Conjuntura Econômica e Financeira Recente'
    ]
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
    // Quantos pomodoros de FOCO já foram concluídos de verdade na etapa atual (meta: 2 por etapa).
    // Existe pra imprevisto: se você só conseguir 1 dos 2 hoje e precisar parar, esse número fica salvo
    // e na próxima vez você continua exatamente daqui, sem perder o que já foi feito nem precisar repetir.
    cyclePomodorosDone: 0,
    // STREAK: contagem de dias seguidos com pelo menos 1 ação de estudo (questão, redação ou pomodoro concluído).
    streak: { count: 0, lastActiveDateStr: null },
    // Registro (timestamps) de cada pomodoro de foco concluído, usado pra calcular "pomodoros hoje" e alimentar a streak.
    pomodoroLog: [],
    // Meta mínima diária, de propósito bem pequena, pra reduzir a barreira de começar (edite clicando na pill).
    dailyGoalQuestions: 5,
    // Último "marco" de streak de meta batida em que já sugerimos aumentar a meta (evita ficar sugerindo toda hora).
    lastGoalSuggestionStreak: 0,
    logs: [],
    essays: [],
    topicStatus: {} // ex: { "ti-0": "reviewed", "portugues-2": "studying" }
};

// --- HELPERS DE DATA (streak e meta diária) ---
function getDateStr(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function isToday(timestamp) {
    return getDateStr(new Date(timestamp)) === getDateStr(new Date());
}

// Chamada sempre que uma ação de estudo de verdade acontece (questão lançada, redação lançada, pomodoro concluído).
// Atualiza a streak: mantém se já contou hoje, soma 1 se o último dia ativo foi ontem, ou reinicia em 1 se houve um buraco.
function registerActivityToday() {
    const todayStr = getDateStr(new Date());
    if (appState.streak.lastActiveDateStr === todayStr) return;

    const yesterdayStr = getDateStr(new Date(Date.now() - 86400000));
    if (appState.streak.lastActiveDateStr === yesterdayStr) {
        appState.streak.count += 1;
    } else {
        appState.streak.count = 1;
    }
    appState.streak.lastActiveDateStr = todayStr;
}

// PADRÃO DE DESEMPENHO: calcula há quantos dias SEGUIDOS a meta mínima diária vem sendo batida,
// olhando pro histórico real (logs e pomodoros já têm timestamp, não precisa guardar nada extra pra isso).
// O dia de hoje só entra na conta se já foi cumprido; se ainda não foi, não quebra nem soma (o dia não acabou).
function getGoalMetStreak() {
    let streak = 0;
    for (let i = 0; i < 60; i++) {
        const day = new Date();
        day.setDate(day.getDate() - i);
        const dayStr = getDateStr(day);

        const questionsThatDay = appState.logs
            .filter(log => getDateStr(new Date(Number(log.id))) === dayStr)
            .reduce((sum, log) => sum + log.solved, 0);
        const pomodorosThatDay = appState.pomodoroLog.filter(ts => getDateStr(new Date(ts)) === dayStr).length;
        const met = questionsThatDay >= appState.dailyGoalQuestions || pomodorosThatDay >= 1;

        if (i === 0 && !met) continue; // hoje ainda não acabou, não conta a favor nem contra ainda
        if (met) streak++;
        else break;
    }
    return streak;
}

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

            if (appState.timer.currentMode === 'study') {
                // Pomodoro de foco concluído de verdade (não apenas iniciado) -> conta pra meta da etapa atual,
                // entra no registro de pomodoros de hoje, e alimenta a streak de dias seguidos.
                appState.cyclePomodorosDone++;
                appState.pomodoroLog.push(Date.now());
                appState.pomodoroLog = appState.pomodoroLog.filter(ts => ts > Date.now() - 60 * 86400000); // guarda só os últimos ~60 dias
                registerActivityToday();
                saveToLocalStorage();
                updateDashboard();
                alert('Pomodoro concluído! Hora da pausa de 5 minutos.');
                setTimerMode('break');
            } else {
                alert('Pausa terminada! De volta ao foco.');
                setTimerMode('study');
            }
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
    saveToLocalStorage();
}

btnStart.addEventListener('click', startTimer);
btnPause.addEventListener('click', pauseTimer);
btnReset.addEventListener('click', resetTimer);
modeStudy.addEventListener('click', () => setTimerMode('study'));
modeBreak.addEventListener('click', () => setTimerMode('break'));

// ENCERRAR SESSÃO DE HOJE: pra imprevistos onde não dá pra terminar o pomodoro de 25 min.
// Não força terminar nada. Só pausa com segurança e confirma que o que já foi concluído está salvo -
// na próxima vez o ciclo continua exatamente da mesma etapa e do mesmo contador de pomodoros,
// sem repetir trabalho e sem empurrar pra frente uma etapa que ainda não foi de fato estudada.
const btnEndSession = document.getElementById('btn-end-session');
const sessionEndMessageDiv = document.getElementById('session-end-message');

btnEndSession.addEventListener('click', () => {
    pauseTimer();
    saveToLocalStorage();
    const step = STUDY_CYCLE[appState.currentCycleIndex];
    sessionEndMessageDiv.textContent = `✅ Progresso salvo. Você já tem ${appState.cyclePomodorosDone}/2 pomodoros feitos em "${step.name}". Pode fechar tranquilo — na próxima vez é só continuar dessa mesma etapa.`;
});


// --- GESTÃO DE ESTUDOS ---
const questoesForm = document.getElementById('questoes-form');
const subjectList = document.getElementById('subject-list');
const recentLogsDiv = document.getElementById('recent-logs');
const cycleStepsDiv = document.getElementById('cycle-steps');
const btnAdvanceCycle = document.getElementById('btn-advance-cycle');
const subjectSelect = document.getElementById('subject');
const topicSelect = document.getElementById('topic');
const strengthsWeaknessesDiv = document.getElementById('strengths-weaknesses');

const btnSaveEssay = document.getElementById('btn-save-essay');
const essayThemeInput = document.getElementById('essay-theme');
const essayScoreInput = document.getElementById('essay-score');

// PREENCHE O SELECT DE ASSUNTO conforme a matéria escolhida, usando os tópicos reais do edital (SYLLABUS).
// Isso é o que permite depois calcular acerto POR ASSUNTO (não só por matéria) e montar o raio-x de pontos fortes/fracos.
function populateTopicSelect(subjectKey) {
    const topics = SYLLABUS[subjectKey] || [];
    let optionsHtml = '<option value="">📌 Geral (assunto não especificado)</option>';
    optionsHtml += topics.map((topicName, index) => `<option value="${index}">${topicName}</option>`).join('');
    topicSelect.innerHTML = optionsHtml;
}

subjectSelect.addEventListener('change', () => {
    populateTopicSelect(subjectSelect.value);
});

function saveToLocalStorage() {
    localStorage.setItem('bb_study_state_v5', JSON.stringify({
        logs: appState.logs,
        essays: appState.essays,
        currentCycleIndex: appState.currentCycleIndex,
        cyclePomodorosDone: appState.cyclePomodorosDone,
        topicStatus: appState.topicStatus,
        timerMode: appState.timer.currentMode,
        streak: appState.streak,
        pomodoroLog: appState.pomodoroLog,
        dailyGoalQuestions: appState.dailyGoalQuestions,
        lastGoalSuggestionStreak: appState.lastGoalSuggestionStreak
    }));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('bb_study_state_v5');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.logs) appState.logs = parsed.logs;
        if (parsed.essays) appState.essays = parsed.essays;
        if (parsed.currentCycleIndex !== undefined) appState.currentCycleIndex = parsed.currentCycleIndex;
        if (parsed.cyclePomodorosDone !== undefined) appState.cyclePomodorosDone = parsed.cyclePomodorosDone;
        if (parsed.topicStatus) appState.topicStatus = parsed.topicStatus;
        if (parsed.timerMode) appState.timer.currentMode = parsed.timerMode;
        if (parsed.streak) appState.streak = parsed.streak;
        if (parsed.pomodoroLog) appState.pomodoroLog = parsed.pomodoroLog;
        if (parsed.dailyGoalQuestions) appState.dailyGoalQuestions = parsed.dailyGoalQuestions;
        if (parsed.lastGoalSuggestionStreak !== undefined) appState.lastGoalSuggestionStreak = parsed.lastGoalSuggestionStreak;
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

    // topicStats[subject] = array paralelo a SYLLABUS[subject], com {solved, correct} por assunto.
    // Alimentado apenas pelos lançamentos que informaram um assunto específico (não "Geral").
    const topicStats = {};
    for (const key in SYLLABUS) {
        topicStats[key] = SYLLABUS[key].map(() => ({ solved: 0, correct: 0 }));
    }

    let totalSolved = 0;
    let totalCorrect = 0;

    appState.logs.forEach(log => {
        if (stats[log.subject]) {
            stats[log.subject].solved += log.solved;
            stats[log.subject].correct += log.correct;
            totalSolved += log.solved;
            totalCorrect += log.correct;

            if (log.topicIndex !== undefined && log.topicIndex !== null && topicStats[log.subject] && topicStats[log.subject][log.topicIndex]) {
                topicStats[log.subject][log.topicIndex].solved += log.solved;
                topicStats[log.subject][log.topicIndex].correct += log.correct;
            }
        }
    });

    // Renderizar painel de matérias (desempenho + cobertura de tópicos do edital)
    subjectList.innerHTML = '';
    for (const key in stats) {
        const item = stats[key];
        const accuracy = item.solved > 0 ? Math.round((item.correct / item.solved) * 100) : 0;
        let accuracyClass = 'acc-low';
        if (accuracy >= 70) accuracyClass = 'acc-high';
        else if (accuracy >= 50) accuracyClass = 'acc-mid';

        const topics = SYLLABUS[key] || [];
        const topicsHtml = topics.map((topicName, index) => {
            const topicId = `${key}-${index}`;
            const status = appState.topicStatus[topicId] || 'pending';
            const icon = status === 'reviewed' ? '🟢' : status === 'studying' ? '🟡' : '⬜';

            const tStat = topicStats[key][index];
            let accBadge = '';
            if (tStat.solved > 0) {
                const tAcc = Math.round((tStat.correct / tStat.solved) * 100);
                let accClass = 'low';
                if (tAcc >= 70) accClass = 'high';
                else if (tAcc >= 50) accClass = 'mid';
                accBadge = `<span class="topic-acc ${accClass}">${tAcc}% (${tStat.solved}q)</span>`;
            }

            return `<button type="button" class="topic-pill ${status}" onclick="cycleTopicStatus('${topicId}')" title="Clique para mudar o status de cobertura">${icon} ${topicName}${accBadge}</button>`;
        }).join('');

        const reviewedCount = topics.filter((_, index) => appState.topicStatus[`${key}-${index}`] === 'reviewed').length;
        const coverageLabel = topics.length > 0 ? `${reviewedCount}/${topics.length} tópicos revisados` : '';

        subjectList.innerHTML += `
            <div class="subject-row subject-row-expanded">
                <div class="subject-row-top">
                    <div>
                        <div class="sub-title">${SUBJECT_MAP[key]}</div>
                        <div class="sub-details">${item.solved} resolvidas / ${item.correct} acertos ${coverageLabel ? '· ' + coverageLabel : ''}</div>
                    </div>
                    <div class="sub-acc ${accuracyClass}">${accuracy}%</div>
                </div>
                ${topics.length > 0 ? `<div class="topic-pill-list">${topicsHtml}</div>` : ''}
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

    // A meta de volume exibida aqui tem que ser a MESMA usada no algoritmo de probabilidade (calculateProbability),
    // senão o usuário vê "100% concluído" na barra enquanto o cálculo de chance real ainda considera amostra pequena.
    const targetVolume = 1000;
    const progressPercent = Math.min(Math.round((totalSolved / targetVolume) * 100), 100);
    document.getElementById('overall-progress').style.width = `${progressPercent}%`;
    document.getElementById('progress-text').textContent = `${progressPercent}% (${totalSolved} / ${targetVolume.toLocaleString('pt-BR')})`;

    // Cobertura geral do edital (todos os tópicos, todas as matérias)
    let totalTopics = 0;
    let reviewedTopics = 0;
    for (const key in SYLLABUS) {
        SYLLABUS[key].forEach((_, index) => {
            totalTopics++;
            if (appState.topicStatus[`${key}-${index}`] === 'reviewed') reviewedTopics++;
        });
    }
    const coveragePercent = totalTopics > 0 ? Math.round((reviewedTopics / totalTopics) * 100) : 0;
    document.getElementById('coverage-progress').style.width = `${coveragePercent}%`;
    document.getElementById('coverage-text').textContent = `${coveragePercent}% (${reviewedTopics} / ${totalTopics} tópicos)`;

    renderCycle();
    renderRecentLogs();
    renderStrengthsWeaknesses(topicStats);
    renderStatusBar();
}

// BARRA DE STATUS: streak de dias seguidos, "retome de onde parou" e meta mínima do dia.
// Existe pra reduzir a barreira de começar e dar um sinal de continuidade em vez de tudo-ou-nada.
function renderStatusBar() {
    // Streak
    const streakValueEl = document.getElementById('streak-value');
    const streakPillEl = document.getElementById('streak-pill');
    streakValueEl.textContent = `${appState.streak.count} ${appState.streak.count === 1 ? 'dia' : 'dias'}`;
    streakPillEl.classList.toggle('cold', appState.streak.count === 0);

    // Retomar de onde parou
    const step = STUDY_CYCLE[appState.currentCycleIndex];
    const done = Math.min(appState.cyclePomodorosDone, 2);
    let resumeText = '';
    if (done === 0) resumeText = `Comece: ${step.name}`;
    else if (done === 1) resumeText = `Falta 1 pomodoro: ${step.name}`;
    else resumeText = `Pronto p/ avançar: ${step.name}`;
    document.getElementById('resume-value').textContent = resumeText;

    // Meta mínima do dia (bem pequena, de propósito, pra não travar o começo)
    const questionsToday = appState.logs
        .filter(log => isToday(Number(log.id)))
        .reduce((sum, log) => sum + log.solved, 0);
    const pomodorosToday = appState.pomodoroLog.filter(ts => isToday(ts)).length;
    const goalMet = questionsToday >= appState.dailyGoalQuestions || pomodorosToday >= 1;

    document.getElementById('daily-goal-value').textContent = `${questionsToday}/${appState.dailyGoalQuestions} questões`;
    document.getElementById('daily-goal-icon').textContent = goalMet ? '✅' : '⬜';
    document.getElementById('daily-goal-pill').classList.toggle('met', goalMet);

    checkGoalSuggestion();
}

// SUGESTÃO ADAPTATIVA: a cada marco de 5 dias seguidos batendo a meta mínima, sugere subir a meta um pouco.
// Nunca aumenta sozinho — só sugere, com botão pra aceitar ou manter como está.
let pendingGoalSuggestion = null;
const goalSuggestionBanner = document.getElementById('goal-suggestion-banner');
const goalSuggestionText = document.getElementById('goal-suggestion-text');
const btnAcceptGoalIncrease = document.getElementById('btn-accept-goal-increase');
const btnDismissGoalIncrease = document.getElementById('btn-dismiss-goal-increase');

function checkGoalSuggestion() {
    const MILESTONE_STEP = 5;
    const goalMetStreak = getGoalMetStreak();
    const currentMilestone = Math.floor(goalMetStreak / MILESTONE_STEP) * MILESTONE_STEP;

    if (currentMilestone > 0 && currentMilestone > appState.lastGoalSuggestionStreak) {
        const suggestedGoal = appState.dailyGoalQuestions + Math.max(2, Math.round(appState.dailyGoalQuestions * 0.3));
        pendingGoalSuggestion = { newGoal: suggestedGoal, milestone: currentMilestone };
        goalSuggestionText.textContent = `🎯 Você bateu sua meta mínima ${currentMilestone} dias seguidos! Que tal subir de ${appState.dailyGoalQuestions} para ${suggestedGoal} questões/dia?`;
        goalSuggestionBanner.style.display = 'flex';
    } else {
        pendingGoalSuggestion = null;
        goalSuggestionBanner.style.display = 'none';
    }
}

btnAcceptGoalIncrease.addEventListener('click', () => {
    if (!pendingGoalSuggestion) return;
    appState.dailyGoalQuestions = pendingGoalSuggestion.newGoal;
    appState.lastGoalSuggestionStreak = pendingGoalSuggestion.milestone;
    saveToLocalStorage();
    updateDashboard();
});

btnDismissGoalIncrease.addEventListener('click', () => {
    if (!pendingGoalSuggestion) return;
    appState.lastGoalSuggestionStreak = pendingGoalSuggestion.milestone;
    saveToLocalStorage();
    updateDashboard();
});

// Clique na pill de meta mínima pra ajustar o número (mantenha pequeno e alcançável de propósito)
window.editDailyGoal = function() {
    const input = prompt('Meta mínima de questões por dia (algo bem pequeno e realista, tipo 5):', appState.dailyGoalQuestions);
    if (input === null) return;
    const num = parseInt(input);
    if (!isNaN(num) && num > 0) {
        appState.dailyGoalQuestions = num;
        saveToLocalStorage();
        updateDashboard();
    }
};

// DIAGNÓSTICO DE PONTOS FORTES E FRACOS: junta todos os assuntos (de todas as matérias) que já têm
// pelo menos MIN_SAMPLE questões lançadas, ordena por taxa de acerto e mostra os melhores e os piores.
// Isso é o que responde "onde eu erro e onde eu acerto", em vez de só olhar a matéria inteira.
function renderStrengthsWeaknesses(topicStats) {
    const MIN_SAMPLE = 3;
    const flatTopics = [];

    for (const subjectKey in topicStats) {
        topicStats[subjectKey].forEach((tStat, index) => {
            if (tStat.solved >= MIN_SAMPLE) {
                flatTopics.push({
                    subject: SUBJECT_MAP[subjectKey],
                    topicName: SYLLABUS[subjectKey][index],
                    solved: tStat.solved,
                    correct: tStat.correct,
                    accuracy: Math.round((tStat.correct / tStat.solved) * 100)
                });
            }
        });
    }

    if (flatTopics.length === 0) {
        strengthsWeaknessesDiv.innerHTML = `
            <div class="sw-empty">
                Ainda não há assuntos com pelo menos ${MIN_SAMPLE} questões lançadas. Ao registrar questões, escolha o assunto específico (não só "Geral") para começar a ver seus pontos fortes e fracos aqui.
            </div>
        `;
        return;
    }

    const sortedDesc = [...flatTopics].sort((a, b) => b.accuracy - a.accuracy);
    const strongest = sortedDesc.slice(0, 5);
    const weakest = [...flatTopics].sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);

    function renderList(list) {
        return list.map(t => {
            let accClass = 'acc-low';
            if (t.accuracy >= 70) accClass = 'acc-high';
            else if (t.accuracy >= 50) accClass = 'acc-mid';
            return `
                <div class="sw-item">
                    <div class="sw-item-info">
                        <span class="sw-item-topic">${t.topicName}</span>
                        <span class="sw-item-subject">${t.subject} · ${t.solved} questões</span>
                    </div>
                    <span class="sw-item-acc ${accClass}">${t.accuracy}%</span>
                </div>
            `;
        }).join('');
    }

    strengthsWeaknessesDiv.innerHTML = `
        <div class="sw-col">
            <div class="sw-col-title strong">💪 Pontos Fortes (maior acerto)</div>
            ${renderList(strongest)}
        </div>
        <div class="sw-col">
            <div class="sw-col-title weak">🚨 Pontos Fracos (foco nos estudos)</div>
            ${renderList(weakest)}
        </div>
    `;
}

function renderCycle() {
    cycleStepsDiv.innerHTML = '';
    STUDY_CYCLE.forEach((step, index) => {
        let stepClass = 'cycle-step';
        let badgeText = 'Aguardando';
        let progressText = '2 Pomodoros de foco';

        if (index === appState.currentCycleIndex) {
            stepClass += ' active';
            const done = Math.min(appState.cyclePomodorosDone, 2);
            badgeText = done >= 2 ? '✅ Pronto p/ avançar' : '👉 Em andamento';
            progressText = `${done}/2 pomodoros concluídos`;
        } else if (index < appState.currentCycleIndex) {
            stepClass += ' completed';
            badgeText = '✅ Feito';
        }

        cycleStepsDiv.innerHTML += `
            <div class="${stepClass}">
                <div>
                    <strong style="display: block;">Etapa ${index + 1}: ${step.name}</strong>
                    <span class="cycle-step-progress">${progressText}</span>
                </div>
                <span style="font-size: 0.8rem; font-weight: 600;">${badgeText}</span>
            </div>
        `;
    });
}

btnAdvanceCycle.addEventListener('click', () => {
    appState.currentCycleIndex = (appState.currentCycleIndex + 1) % STUDY_CYCLE.length;
    appState.cyclePomodorosDone = 0; // nova etapa, novo contador - a etapa anterior guarda seu histórico só nos logs de questões
    sessionEndMessageDiv.textContent = '';
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

            const subjectLabel = item.topicName ? `${SUBJECT_MAP[item.subject]} · ${item.topicName}` : SUBJECT_MAP[item.subject];
            recentLogsDiv.innerHTML += `
                <div class="history-row">
                    <div class="history-info">
                        <span class="history-subj"><span class="history-type-tag questao">Questões</span>${subjectLabel}</span>
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

// COBERTURA DO EDITAL: avança o status de um tópico ao clicar (Não iniciado -> Estudando -> Revisado -> Não iniciado)
window.cycleTopicStatus = function(topicId) {
    const current = appState.topicStatus[topicId] || 'pending';
    const next = current === 'pending' ? 'studying' : current === 'studying' ? 'reviewed' : 'pending';
    appState.topicStatus[topicId] = next;
    saveToLocalStorage();
    updateDashboard();
};

questoesForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = document.getElementById('subject').value;
    const topicRaw = topicSelect.value; // '' = Geral, senão índice do tópico dentro de SYLLABUS[subject]
    const topicIndex = topicRaw === '' ? null : parseInt(topicRaw);
    const topicName = topicIndex !== null ? SYLLABUS[subject][topicIndex] : null;
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
        topicIndex,
        topicName,
        solved: solvedVal,
        correct: correctVal,
        date: formattedDate
    };

    appState.logs.unshift(newLog);
    registerActivityToday();
    saveToLocalStorage();
    updateDashboard();
    questoesForm.reset();
    populateTopicSelect(subjectSelect.value);
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
    registerActivityToday();
    saveToLocalStorage();
    updateDashboard();

    essayThemeInput.value = '';
    essayScoreInput.value = '';
});

window.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    setTimerMode(appState.timer.currentMode);
    populateTopicSelect(subjectSelect.value);
    updateDashboard();
});
