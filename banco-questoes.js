// banco-questoes.js
// Página separada do dashboard: aqui mora o cadastro completo de questões (com alternativas
// e gabarito, pra dar pra responder de novo dentro do site) e o cadastro rápido (só ID +
// resultado, pra quando você tá com pressa e já resolveu na Estratégia). As duas formas
// alimentam o MESMO banco (appState.questionRepo), diferenciadas pelo campo `mode`.

let qState = { questionRepo: [] };
let editingId = null; // id do item em edição (null = cadastro novo)
let currentFormMode = 'full'; // 'full' | 'quick'

// --- STORAGE (merge-safe, ver shared-storage.js) ---
function loadQState() {
    const shared = loadSharedState();
    qState.questionRepo = shared.questionRepo || [];
}

function persistQuestionRepo() {
    saveSharedState({ questionRepo: qState.questionRepo });
}

// --- HELPERS DE DATA ---
function getDateStr(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}
function todayStr() { return getDateStr(new Date()); }
function displayDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}`;
}
function daysAgo(dateStr, n) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - n);
    return new Date(dateStr) >= new Date(getDateStr(cutoff));
}

// --- STATUS DE UMA QUESTÃO (baseado na última tentativa) ---
// 'never'  -> nunca respondida
// 'wrong'  -> errou da última vez
// 'doubt'  -> acertou, mas marcado como "na dúvida" (só acontece em registro rápido)
// 'correct'-> acertou com confiança da última vez
function getItemStatus(item) {
    const attempts = item.attempts || [];
    if (attempts.length === 0) return 'never';
    const last = attempts[attempts.length - 1];
    if (last.correct === false) return 'wrong';
    if (last.flagDoubt) return 'doubt';
    return 'correct';
}

const STATUS_BADGES = {
    never: '<span class="qr-status-badge never">⚪ Nunca respondida</span>',
    wrong: '<span class="qr-status-badge wrong">🔴 Errei</span>',
    doubt: '<span class="qr-status-badge doubt">🟡 Na dúvida</span>',
    correct: '<span class="qr-status-badge correct">🟢 Acertei</span>'
};

function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function truncate(text, n) {
    if (!text) return '';
    return text.length > n ? text.slice(0, n).trim() + '…' : text;
}

// =====================================================================================
// FORMULÁRIO DE CADASTRO / EDIÇÃO
// =====================================================================================
const subjectSelect = document.getElementById('q-subject');
const topicSelect = document.getElementById('q-topic');
const altGrid = document.getElementById('qr-alt-grid');
const qform = document.getElementById('qform');
const btnModeFull = document.getElementById('btn-mode-full');
const btnModeQuick = document.getElementById('btn-mode-quick');
const fullFields = document.getElementById('qr-full-fields');
const quickFields = document.getElementById('qr-quick-fields');
const modeHint = document.getElementById('qr-mode-hint');
const formTitle = document.getElementById('qr-form-title');
const submitBtn = document.getElementById('qr-submit-btn');
const cancelEditBtn = document.getElementById('qr-cancel-edit');

const ALT_LABELS = ['A', 'B', 'C', 'D', 'E'];

function renderAltGrid() {
    altGrid.innerHTML = ALT_LABELS.map(letter => `
        <div class="qr-alt-row">
            <span class="qr-alt-letter">${letter}</span>
            <input type="text" id="q-alt-${letter}" placeholder="Texto da alternativa ${letter}">
        </div>
    `).join('');
}

function populateTopicSelect(subjectKey) {
    const topics = SYLLABUS[subjectKey] || [];
    let optionsHtml = '<option value="">📌 Geral (assunto não especificado)</option>';
    optionsHtml += topics.map((topicName, index) => `<option value="${index}">${topicName}</option>`).join('');
    topicSelect.innerHTML = optionsHtml;
}

subjectSelect.addEventListener('change', () => populateTopicSelect(subjectSelect.value));

function setFormMode(mode) {
    currentFormMode = mode;
    btnModeFull.classList.toggle('active', mode === 'full');
    btnModeQuick.classList.toggle('active', mode === 'quick');
    fullFields.style.display = mode === 'full' ? 'block' : 'none';
    quickFields.style.display = mode === 'quick' ? 'block' : 'none';
    modeHint.textContent = mode === 'full'
        ? 'Cole o enunciado e as alternativas: essa questão fica disponível pra você resolver de novo aqui dentro, no modo Praticar.'
        : 'Rapidinho: guarda o ID da questão no Estratégia + se você errou (ou acertou na dúvida), sem precisar retranscrever o enunciado inteiro.';
}

btnModeFull.addEventListener('click', () => { if (!editingId) setFormMode('full'); });
btnModeQuick.addEventListener('click', () => { if (!editingId) setFormMode('quick'); });

function resetForm() {
    qform.reset();
    editingId = null;
    populateTopicSelect(subjectSelect.value);
    renderAltGrid();
    formTitle.textContent = '➕ Cadastrar Questão';
    submitBtn.textContent = 'Salvar Questão';
    cancelEditBtn.style.display = 'none';
    btnModeFull.disabled = false;
    btnModeQuick.disabled = false;
    setFormMode('full');
}

window.editItem = function (id) {
    const item = qState.questionRepo.find(q => q.id === id);
    if (!item) return;

    editingId = id;
    setFormMode(item.mode);
    btnModeFull.disabled = true;
    btnModeQuick.disabled = true; // não dá pra trocar o tipo no meio da edição, evita inconsistência

    subjectSelect.value = item.subject;
    populateTopicSelect(item.subject);
    topicSelect.value = item.topicIndex !== null && item.topicIndex !== undefined ? String(item.topicIndex) : '';
    document.getElementById('q-external-id').value = item.externalId || '';
    document.getElementById('q-note').value = item.note || '';

    if (item.mode === 'full') {
        renderAltGrid();
        document.getElementById('q-statement').value = item.statement || '';
        (item.alternatives || []).forEach(alt => {
            const input = document.getElementById(`q-alt-${alt.label}`);
            if (input) input.value = alt.text;
        });
        document.getElementById('q-correct').value = item.correctLabel || 'A';
    } else {
        document.getElementById('q-quick-result').value = item.result || 'wrong';
    }

    formTitle.textContent = '✏️ Editando Questão';
    submitBtn.textContent = 'Salvar Alterações';
    cancelEditBtn.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

cancelEditBtn.addEventListener('click', resetForm);

qform.addEventListener('submit', (e) => {
    e.preventDefault();

    const subject = subjectSelect.value;
    const topicRaw = topicSelect.value;
    const topicIndex = topicRaw === '' ? null : parseInt(topicRaw);
    const topicName = topicIndex !== null ? SYLLABUS[subject][topicIndex] : null;
    const externalId = document.getElementById('q-external-id').value.trim();
    const note = document.getElementById('q-note').value.trim();

    if (editingId) {
        const item = qState.questionRepo.find(q => q.id === editingId);
        if (!item) return;
        item.subject = subject;
        item.topicIndex = topicIndex;
        item.topicName = topicName;
        item.externalId = externalId;
        item.note = note;

        if (item.mode === 'full') {
            const statement = document.getElementById('q-statement').value.trim();
            if (!statement) { alert('Cole o enunciado da questão.'); return; }
            const alternatives = ALT_LABELS.map(letter => ({
                label: letter,
                text: document.getElementById(`q-alt-${letter}`).value.trim()
            }));
            if (alternatives.some(a => !a.text)) { alert('Preencha as 5 alternativas (A a E).'); return; }
            item.statement = statement;
            item.alternatives = alternatives;
            item.correctLabel = document.getElementById('q-correct').value;
        } else {
            item.result = document.getElementById('q-quick-result').value;
            // Mantém a última tentativa (índice 0, criada no cadastro) coerente com o resultado editado
            if (item.attempts && item.attempts.length > 0) {
                item.attempts[0].correct = item.result !== 'wrong';
                item.attempts[0].flagDoubt = item.result === 'doubt';
            }
        }

        persistQuestionRepo();
        resetForm();
        renderAll();
        return;
    }

    // --- CADASTRO NOVO ---
    if (currentFormMode === 'full') {
        const statement = document.getElementById('q-statement').value.trim();
        if (!statement) { alert('Cole o enunciado da questão.'); return; }
        const alternatives = ALT_LABELS.map(letter => ({
            label: letter,
            text: document.getElementById(`q-alt-${letter}`).value.trim()
        }));
        if (alternatives.some(a => !a.text)) { alert('Preencha as 5 alternativas (A a E).'); return; }

        const newItem = {
            id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
            mode: 'full',
            subject, topicIndex, topicName,
            externalId,
            statement,
            alternatives,
            correctLabel: document.getElementById('q-correct').value,
            note,
            createdDate: todayStr(),
            attempts: []
        };
        qState.questionRepo.unshift(newItem);
    } else {
        if (!externalId) { alert('Cole o ID da questão no Estratégia pra dar pra achar ela de novo depois.'); return; }
        const result = document.getElementById('q-quick-result').value;
        const newItem = {
            id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
            mode: 'quick',
            subject, topicIndex, topicName,
            externalId,
            result,
            note,
            createdDate: todayStr(),
            attempts: [{ date: todayStr(), selectedLabel: null, correct: result !== 'wrong', flagDoubt: result === 'doubt', via: 'external' }]
        };
        qState.questionRepo.unshift(newItem);
    }

    persistQuestionRepo();
    resetForm();
    renderAll();
});

window.deleteItem = function (id) {
    if (!confirm('Apagar esta questão do banco?')) return;
    qState.questionRepo = qState.questionRepo.filter(q => q.id !== id);
    persistQuestionRepo();
    renderAll();
};

// =====================================================================================
// LISTA / FILTROS
// =====================================================================================
const fSubject = document.getElementById('f-subject');
const fStatus = document.getElementById('f-status');
const fType = document.getElementById('f-type');
const fPeriod = document.getElementById('f-period');
const fSearch = document.getElementById('f-search');
const qrListDiv = document.getElementById('qr-list');

[fSubject, fStatus, fType, fPeriod].forEach(el => el.addEventListener('change', renderList));
fSearch.addEventListener('input', renderList);

function renderList() {
    let items = qState.questionRepo.filter(item => {
        if (fSubject.value && item.subject !== fSubject.value) return false;
        if (fStatus.value && getItemStatus(item) !== fStatus.value) return false;
        if (fType.value && item.mode !== fType.value) return false;
        if (fPeriod.value === 'today' && item.createdDate !== todayStr()) return false;
        if (fPeriod.value === 'week' && !daysAgo(item.createdDate, 7)) return false;
        if (fSearch.value.trim()) {
            const term = fSearch.value.trim().toLowerCase();
            const haystack = `${item.externalId || ''} ${item.statement || ''}`.toLowerCase();
            if (!haystack.includes(term)) return false;
        }
        return true;
    });

    const statusPriority = { wrong: 0, doubt: 1, never: 2, correct: 3 };
    items = items.sort((a, b) => {
        const pa = statusPriority[getItemStatus(a)], pb = statusPriority[getItemStatus(b)];
        if (pa !== pb) return pa - pb;
        return Number(b.createdDate.replace(/-/g, '')) - Number(a.createdDate.replace(/-/g, '')) || b.id.localeCompare(a.id);
    });

    if (items.length === 0) {
        qrListDiv.innerHTML = `<div class="qb-empty">Nenhuma questão encontrada com esses filtros. Cadastre a primeira lá em cima ☝️</div>`;
        return;
    }

    qrListDiv.innerHTML = items.map(item => {
        const status = getItemStatus(item);
        const subjectLabel = item.topicName ? `${SUBJECT_MAP[item.subject]} · ${item.topicName}` : SUBJECT_MAP[item.subject];
        const typeTag = item.mode === 'full' ? '<span class="qr-type-tag">📝 Completa</span>' : '<span class="qr-type-tag" style="background:rgba(148,163,184,0.15); color:var(--text-secondary);">⚡ Rápida</span>';
        const idTag = item.externalId ? `<span class="qb-question-id">ID: ${item.externalId}</span>` : '';
        const attempts = item.attempts || [];
        const correctCount = attempts.filter(a => a.correct).length;
        const statsLine = attempts.length > 0
            ? `<div class="qr-item-stats">Respondida ${attempts.length}x · acerto ${Math.round((correctCount / attempts.length) * 100)}%</div>`
            : `<div class="qr-item-stats">Ainda não praticada</div>`;
        const statementPreview = item.mode === 'full' ? `<div class="qr-item-statement">${truncate(item.statement, 160)}</div>` : '';
        const practiceBtn = item.mode === 'full' ? `<button class="btn btn-primary" onclick="practiceOne('${item.id}')">🎯 Praticar</button>` : '';

        return `
            <div class="qb-item">
                <div class="qb-item-top">
                    <div class="qb-item-tags">
                        ${STATUS_BADGES[status]}
                        ${typeTag}
                        ${idTag}
                        <span class="qb-item-subject">${subjectLabel}</span>
                    </div>
                    <span class="qb-item-date">${displayDate(item.createdDate)}</span>
                </div>
                ${statementPreview}
                ${item.note ? `<div class="qb-item-note">${item.note}</div>` : ''}
                ${statsLine}
                <div class="qb-item-actions">
                    ${practiceBtn}
                    <button class="btn btn-secondary" onclick="editItem('${item.id}')">✏️ Editar</button>
                    <button class="btn btn-danger" onclick="deleteItem('${item.id}')">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// =====================================================================================
// GAMIFICAÇÃO (nível/XP + conquistas) — tudo calculado na hora a partir do banco,
// sem guardar estado extra, então nunca fica dessincronizado com os dados reais.
// =====================================================================================
const LEVEL_TITLES = [
    'Recruta', 'Aprendiz de TI', 'Analista Júnior', 'Analista Pleno', 'Analista Sênior',
    'Especialista', 'Referência Técnica', 'Veterano de Banca', 'Quase Agente BB', 'Futuro Agente do BB 🏆'
];

function computeGamification() {
    const repo = qState.questionRepo;
    const fullCount = repo.filter(q => q.mode === 'full').length;
    const quickCount = repo.filter(q => q.mode === 'quick').length;
    const allAttempts = repo.flatMap(q => q.attempts || []);
    const practiceAttempts = repo.flatMap(q => (q.attempts || []).filter(a => a.via === 'practice'));
    const totalAttempts = allAttempts.length;
    const correctAttempts = allAttempts.filter(a => a.correct).length;
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : null;
    const pending = repo.filter(q => {
        const s = getItemStatus(q);
        return s === 'wrong' || s === 'doubt' || s === 'never';
    }).length;

    const xp = fullCount * 5 + quickCount * 2 + totalAttempts * 2 + correctAttempts * 8;
    const XP_PER_LEVEL = 150;
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    const xpIntoLevel = xp % XP_PER_LEVEL;
    const progressPercent = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100);
    const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

    // "Redenções": questão que tinha uma tentativa errada seguida de uma certa logo depois
    let redemptions = 0;
    repo.forEach(q => {
        const a = q.attempts || [];
        for (let i = 1; i < a.length; i++) {
            if (a[i - 1].correct === false && a[i].correct === true) redemptions++;
        }
    });

    const distinctDays = new Set();
    repo.forEach(q => {
        distinctDays.add(q.createdDate);
        (q.attempts || []).forEach(a => distinctDays.add(a.date));
    });

    return {
        fullCount, quickCount, total: repo.length, totalAttempts, correctAttempts, accuracy, pending,
        xp, level, progressPercent, levelTitle, redemptions, activeDays: distinctDays.size, practiceAttempts: practiceAttempts.length
    };
}

const ACHIEVEMENTS = [
    { icon: '🌱', title: 'Primeira Questão', check: g => g.total >= 1 },
    { icon: '📚', title: 'Colecionador (25)', check: g => g.total >= 25 },
    { icon: '🗄️', title: 'Banco Cheio (100)', check: g => g.total >= 100 },
    { icon: '🎯', title: 'Praticante (50 respondidas)', check: g => g.totalAttempts >= 50 },
    { icon: '🎯', title: 'Precisão Cirúrgica (80%+)', check: g => g.accuracy !== null && g.accuracy >= 80 && g.totalAttempts >= 20 },
    { icon: '🔁', title: 'Sem Medo de Errar', check: g => g.redemptions >= 5 },
    { icon: '🔥', title: 'Constância (5 dias)', check: g => g.activeDays >= 5 },
    { icon: '🏆', title: 'Maratonista (100 respondidas)', check: g => g.totalAttempts >= 100 }
];

function renderGamification() {
    const g = computeGamification();
    document.getElementById('qr-level-badge').textContent = `Nv. ${g.level}`;
    document.getElementById('qr-level-title').textContent = g.levelTitle;
    document.getElementById('qr-xp-progress').style.width = `${g.progressPercent}%`;
    document.getElementById('qr-level-xp').textContent = `${g.xp} XP total`;

    document.getElementById('gami-total').textContent = g.total;
    document.getElementById('gami-answered').textContent = g.totalAttempts;
    document.getElementById('gami-accuracy').textContent = g.accuracy === null ? '—' : `${g.accuracy}%`;
    document.getElementById('gami-pending').textContent = g.pending;

    const earned = ACHIEVEMENTS.filter(a => a.check(g));
    const achievementsEl = document.getElementById('qr-achievements');
    if (earned.length === 0) {
        achievementsEl.innerHTML = `<span class="qr-badge-empty">Cadastre e responda questões pra desbloquear conquistas 🏅</span>`;
    } else {
        achievementsEl.innerHTML = earned.map(a => `<span class="qr-badge-chip earned">${a.icon} ${a.title}</span>`).join('')
            + (ACHIEVEMENTS.length > earned.length ? `<span class="qr-badge-chip">🔒 +${ACHIEVEMENTS.length - earned.length} por desbloquear</span>` : '');
    }
}

// =====================================================================================
// PAINEL DE PRÁTICA: monta o pool de questões conforme filtro e mostra quantas entram
// =====================================================================================
const pSubject = document.getElementById('p-subject');
const pScope = document.getElementById('p-scope');
const pQuantity = document.getElementById('p-quantity');
const poolCountEl = document.getElementById('qr-pool-count');

function buildPracticePool() {
    let pool = qState.questionRepo.filter(q => q.mode === 'full');
    if (pSubject.value) pool = pool.filter(q => q.subject === pSubject.value);

    if (pScope.value === 'wrong') pool = pool.filter(q => getItemStatus(q) === 'wrong');
    else if (pScope.value === 'never') pool = pool.filter(q => getItemStatus(q) === 'never');
    else if (pScope.value === 'today') pool = pool.filter(q => q.createdDate === todayStr());

    return pool;
}

function updatePoolCount() {
    const pool = buildPracticePool();
    if (pool.length === 0) {
        poolCountEl.textContent = '⚠️ Nenhuma questão completa encontrada com esses filtros.';
    } else {
        poolCountEl.textContent = `✅ ${pool.length} questão${pool.length > 1 ? 'ões' : ''} disponíve${pool.length > 1 ? 'is' : 'l'} com esse filtro.`;
    }
}

[pSubject, pScope, pQuantity].forEach(el => el.addEventListener('change', updatePoolCount));

document.getElementById('btn-start-practice').addEventListener('click', () => {
    const pool = buildPracticePool();
    if (pool.length === 0) {
        alert('Nenhuma questão completa encontrada com esses filtros. Cadastre no modo Completo (com alternativas) pra poder praticar.');
        return;
    }
    const qty = parseInt(pQuantity.value);
    const queue = shuffleArray(pool).slice(0, qty);
    startQuiz(queue, document.getElementById('p-mode').value);
});

window.practiceOne = function (id) {
    const item = qState.questionRepo.find(q => q.id === id);
    if (!item || item.mode !== 'full') return;
    startQuiz([item], 'immediate');
};

// =====================================================================================
// QUIZ RUNTIME (overlay)
// =====================================================================================
let quiz = null; // { queue, index, mode, answers: [{item, selectedLabel, correct}], comboCurrent, comboBest }
const overlay = document.getElementById('quiz-overlay');
const quizContent = document.getElementById('quiz-content');

function startQuiz(queue, mode) {
    quiz = { queue, index: 0, mode, answers: [], comboCurrent: 0, comboBest: 0 };
    overlay.style.display = 'flex';
    renderQuizQuestion();
}

function closeQuiz(skipConfirm) {
    if (!skipConfirm && quiz && quiz.answers.length > 0 && quiz.index < quiz.queue.length) {
        if (!confirm('Sair agora descarta o progresso desta sessão (nada é salvo até você finalizar). Sair mesmo assim?')) return;
    }
    quiz = null;
    overlay.style.display = 'none';
}

function renderQuizQuestion() {
    const item = quiz.queue[quiz.index];
    const total = quiz.queue.length;
    const subjectLabel = item.topicName ? `${SUBJECT_MAP[item.subject]} · ${item.topicName}` : SUBJECT_MAP[item.subject];
    const comboHtml = quiz.comboCurrent >= 2 ? `<span class="quiz-combo">🔥 ${quiz.comboCurrent} seguidas</span>` : '<span></span>';

    quizContent.innerHTML = `
        <div class="quiz-topbar">
            <span class="quiz-progress-text">Questão ${quiz.index + 1} de ${total} · ${quiz.mode === 'immediate' ? 'Feedback imediato' : 'Mini-simulado'}</span>
            ${comboHtml}
            <button class="quiz-exit-btn" id="quiz-exit-btn">Sair</button>
        </div>
        <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${(quiz.index / total) * 100}%"></div></div>
        <div class="quiz-tags">
            <span class="qb-item-subject">${subjectLabel}</span>
            ${item.externalId ? `<span class="qb-question-id">ID: ${item.externalId}</span>` : ''}
        </div>
        <div class="quiz-statement">${item.statement}</div>
        <div class="quiz-alternatives" id="quiz-alternatives">
            ${item.alternatives.map(alt => `
                <button class="quiz-alt-btn" data-label="${alt.label}" onclick="selectQuizAnswer('${alt.label}')">
                    <span class="quiz-alt-letter">${alt.label}</span>
                    <span>${alt.text}</span>
                </button>
            `).join('')}
        </div>
        <div id="quiz-feedback-area"></div>
        <div class="quiz-actions" id="quiz-actions-area"></div>
    `;
    document.getElementById('quiz-exit-btn').addEventListener('click', () => closeQuiz(false));
}

window.selectQuizAnswer = function (label) {
    const item = quiz.queue[quiz.index];
    const correct = label === item.correctLabel;
    const buttons = document.querySelectorAll('#quiz-alternatives .quiz-alt-btn');

    if (quiz.mode === 'immediate') {
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.label === item.correctLabel) btn.classList.add('correct-answer');
            if (btn.dataset.label === label && !correct) btn.classList.add('wrong-answer');
            if (btn.dataset.label === label) btn.classList.add('selected');
        });

        const feedbackArea = document.getElementById('quiz-feedback-area');
        feedbackArea.innerHTML = `
            <div class="quiz-feedback ${correct ? 'correct' : 'wrong'}">
                ${correct ? '✅ Você acertou!' : `❌ Você errou. Gabarito: ${item.correctLabel}.`}
                ${item.note ? `<br><strong>Anotação:</strong> ${item.note}` : ''}
            </div>
        `;

        const isLast = quiz.index === quiz.queue.length - 1;
        document.getElementById('quiz-actions-area').innerHTML = `
            <button class="btn btn-primary" onclick="quizNext()">${isLast ? 'Ver resultado 🏁' : 'Próxima →'}</button>
        `;
    } else {
        // modo mini-simulado: só marca a seleção, sem revelar nada ainda
        buttons.forEach(btn => btn.classList.toggle('selected', btn.dataset.label === label));
        const isLast = quiz.index === quiz.queue.length - 1;
        document.getElementById('quiz-actions-area').innerHTML = `
            <button class="btn btn-primary" onclick="quizNext()">${isLast ? 'Finalizar e ver gabarito 🏁' : 'Próxima →'}</button>
        `;
    }

    quiz._pendingLabel = label;
    quiz._pendingCorrect = correct;
};

window.quizNext = function () {
    const item = quiz.queue[quiz.index];
    const label = quiz._pendingLabel || null;
    const correct = label !== null ? quiz._pendingCorrect : false;

    quiz.answers.push({ item, selectedLabel: label, correct });
    quiz.comboCurrent = correct ? quiz.comboCurrent + 1 : 0;
    quiz.comboBest = Math.max(quiz.comboBest, quiz.comboCurrent);
    quiz._pendingLabel = null;
    quiz._pendingCorrect = null;

    if (quiz.index < quiz.queue.length - 1) {
        quiz.index++;
        renderQuizQuestion();
    } else {
        finishQuiz();
    }
};

function finishQuiz() {
    const today = todayStr();
    let xpGained = 0;

    quiz.answers.forEach(ans => {
        ans.item.attempts = ans.item.attempts || [];
        ans.item.attempts.push({ date: today, selectedLabel: ans.selectedLabel, correct: ans.correct, via: 'practice' });
        xpGained += ans.correct ? 10 : 2;
    });
    persistQuestionRepo();

    const correctCount = quiz.answers.filter(a => a.correct).length;
    const total = quiz.answers.length;
    const pct = Math.round((correctCount / total) * 100);
    const scoreClass = pct >= 70 ? 'quiz-feedback correct' : (pct >= 40 ? '' : 'quiz-feedback wrong');

    quizContent.innerHTML = `
        <div class="quiz-topbar">
            <span class="quiz-progress-text">Resultado da sessão</span>
            <button class="quiz-exit-btn" id="quiz-exit-btn">Fechar</button>
        </div>
        <div class="quiz-result-score">
            <div class="big">${correctCount}/${total}</div>
            <div class="sub">${pct}% de acerto ${quiz.comboBest >= 3 ? `· 🔥 combo máximo: ${quiz.comboBest}` : ''}</div>
        </div>
        <div class="quiz-xp-gained">+${xpGained} XP nesta sessão</div>
        <div id="quiz-results-list">
            ${quiz.answers.map(ans => `
                <div class="quiz-result-item ${ans.correct ? 'correct' : 'wrong'}">
                    <div class="quiz-result-item-top">
                        <span>${ans.correct ? '✅' : '❌'} ${truncate(ans.item.statement, 90)}</span>
                    </div>
                    <div class="quiz-result-answers">
                        Sua resposta: ${ans.selectedLabel || '—'} · Gabarito: ${ans.item.correctLabel}
                        ${!ans.correct && ans.item.note ? `<br>💡 ${ans.item.note}` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="quiz-actions" style="margin-top:14px; justify-content: space-between;">
            <button class="btn btn-secondary" onclick="closeQuiz(true)">Voltar ao banco</button>
            ${total - correctCount > 0 ? `<button class="btn btn-danger" onclick="retryWrongOnes()">🔁 Praticar as ${total - correctCount} erradas de novo</button>` : ''}
        </div>
    `;
    document.getElementById('quiz-exit-btn').addEventListener('click', () => closeQuiz(true));

    renderGamification();
    renderList();
}

window.retryWrongOnes = function () {
    const wrongItems = quiz.answers.filter(a => !a.correct).map(a => a.item);
    startQuiz(wrongItems, 'immediate');
};

window.closeQuiz = closeQuiz;

// =====================================================================================
// INIT
// =====================================================================================
function renderAll() {
    renderGamification();
    renderList();
    updatePoolCount();
}

window.addEventListener('DOMContentLoaded', () => {
    loadQState();
    renderAltGrid();
    populateTopicSelect(subjectSelect.value);
    setFormMode('full');
    renderAll();
});
