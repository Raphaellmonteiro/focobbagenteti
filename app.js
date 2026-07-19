/* ==========================================================================
   Dados do edital — Banco do Brasil, Agente de Tecnologia, Cesgranrio
   Cores alinhadas ao esquema de matérias usado no Track Concursos.
   ========================================================================== */
const MATERIAS = {
  "LÍNGUA PORTUGUESA": {
    cor: "var(--mat-portugues)",
    topicos: [
      "Compreensão de textos", "Ortografia oficial", "Classe e emprego de palavras",
      "Emprego do acento indicativo de crase", "Sintaxe da oração e do período",
      "Emprego dos sinais de pontuação", "Concordância verbal e nominal",
      "Regência verbal e nominal", "Colocação dos pronomes oblíquos átonos"
    ]
  },
  "LÍNGUA INGLESA": {
    cor: "var(--mat-ingles)",
    topicos: ["Vocabulário fundamental e aspectos gramaticais básicos para compreensão de textos"]
  },
  "MATEMÁTICA": {
    cor: "var(--mat-matematica)",
    topicos: [
      "Noções de conjuntos", "Números inteiros, racionais e reais; problemas de contagem",
      "Sistema legal de medidas", "Razões e proporções; divisão proporcional; regras de três; porcentagens",
      "Lógica proposicional", "Relações e funções; polinomiais; exponenciais e logarítmicas",
      "Matrizes", "Sequências", "Progressões aritméticas e geométricas"
    ]
  },
  "ATUALIDADES DO MERCADO FINANCEIRO": {
    cor: "var(--mat-financeiro)",
    topicos: [
      "Os bancos na Era Digital", "Novos modelos de negócios", "Sistema de bancos-sombra (Shadow banking)",
      "Funções da moeda", "O dinheiro na era digital: blockchain, bitcoin e criptomoedas", "Marketplace",
      "Correspondentes bancários", "Arranjos de pagamentos", "Sistema de pagamentos instantâneos (PIX)",
      "Segmentação e interações digitais", "Transformação digital no Sistema Financeiro"
    ]
  },
  "PROBABILIDADE E ESTATÍSTICA": {
    cor: "var(--mat-probabilidade)",
    topicos: [
      "Representação tabular e gráfica", "Medidas de tendência central e de dispersão",
      "Variáveis aleatórias e distribuição de probabilidade", "Teorema de Bayes", "Probabilidade condicional",
      "População e amostra", "Variância e covariância", "Correlação linear simples",
      "Distribuição binomial e distribuição normal", "Noções de amostragem e inferência estatística"
    ]
  },
  "CONHECIMENTOS BANCÁRIOS": {
    cor: "var(--mat-bancarios)",
    topicos: [
      "Sistema Financeiro Nacional", "Mercado financeiro (monetário, crédito, capitais, cambial)",
      "Moeda e política monetária", "Orçamento público, títulos do Tesouro e dívida pública",
      "Produtos Bancários", "Noções de Mercado de capitais", "Noções de Mercado de Câmbio",
      "Regimes de taxas de câmbio", "Taxas de câmbio nominais e reais",
      "Impactos das taxas de câmbio sobre exportações/importações",
      "Diferencial de juros interno e externo, prêmios de risco, fluxo de capitais",
      "Dinâmica do Mercado", "Mercado bancário", "Taxas de juros de curto prazo e curva de juros",
      "Garantias do Sistema Financeiro Nacional", "Crime de lavagem de dinheiro",
      "Autorregulação bancária e Normativos SARB", "Sigilo Bancário",
      "Lei Geral de Proteção de Dados (LGPD)", "Legislação anticorrupção",
      "Segurança cibernética", "Ética aplicada", "Política de Responsabilidade Socioambiental do BB",
      "ASG (Ambiental, Social e Governança)"
    ]
  },
  "TECNOLOGIA DA INFORMAÇÃO": {
    cor: "var(--mat-ti)",
    topicos: [
      "Aprendizagem de máquina", "Banco de Dados", "Big data", "Desenvolvimento Mobile",
      "Estrutura de dados e algoritmos", "Ferramentas e Linguagens de Programação para manipulação de dados"
    ]
  }
};

const META_QUESTOES = 1000;
const STORAGE_KEY = "gabarito_questoes_v1";
const ESTRATEGIA_BASE = "https://concursos.estrategia.com/questoes/";

const STATUS_LABEL = { acertei: "Acertei", errei: "Errei", duvida: "Dúvida", chute: "Chute" };

/* ==========================================================================
   Persistência
   ========================================================================== */
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Erro ao ler dados salvos:", e);
    return [];
  }
}
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let questoes = loadData();
let statusSelecionado = null;

/* ==========================================================================
   Setup inicial
   ========================================================================== */
function popularMaterias() {
  const select = document.getElementById("materia");
  const filtroMateria = document.getElementById("filtro-materia");
  Object.keys(MATERIAS).forEach(nome => {
    const opt = document.createElement("option");
    opt.value = nome; opt.textContent = titleCase(nome);
    select.appendChild(opt);

    const opt2 = opt.cloneNode(true);
    filtroMateria.appendChild(opt2);
  });
}
function titleCase(str) {
  return str.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase())
    .replace(/\bLgpd\b/i, "LGPD").replace(/\bPix\b/i, "PIX").replace(/\bAsg\b/i, "ASG")
    .replace(/\bBb\b/i, "BB").replace(/\bSarb\b/i, "SARB");
}

document.getElementById("materia").addEventListener("change", (e) => {
  const datalist = document.getElementById("assunto-list");
  datalist.innerHTML = "";
  const topicos = MATERIAS[e.target.value]?.topicos || [];
  topicos.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    datalist.appendChild(opt);
  });
});

document.getElementById("data").valueAsDate = new Date();

/* ==========================================================================
   Tabs
   ========================================================================== */
document.getElementById("tabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
  if (btn.dataset.tab === "dashboard") renderDashboard();
  if (btn.dataset.tab === "revisao") renderRevisao();
});

/* ==========================================================================
   Status picker (cartão-resposta)
   ========================================================================== */
document.getElementById("status-picker").addEventListener("click", (e) => {
  const bubble = e.target.closest(".bubble");
  if (!bubble) return;
  selecionarStatus(bubble.dataset.status);
});
function selecionarStatus(status) {
  statusSelecionado = status;
  document.querySelectorAll(".bubble").forEach(b => {
    b.classList.toggle("selected", b.dataset.status === status);
  });
  const motivoField = document.getElementById("motivo-field");
  motivoField.hidden = status === "acertei";
}

document.addEventListener("keydown", (e) => {
  const activePanel = document.getElementById("panel-registrar");
  if (!activePanel.classList.contains("active")) return;
  const tag = document.activeElement.tagName;
  if (tag === "TEXTAREA") return;
  if (["1", "2", "3", "4"].includes(e.key) && document.activeElement.id !== "codigo" && document.activeElement.id !== "ano") {
    const map = { "1": "acertei", "2": "errei", "3": "duvida", "4": "chute" };
    selecionarStatus(map[e.key]);
  }
});

/* ==========================================================================
   Salvar questão
   ========================================================================== */
document.getElementById("form-registro").addEventListener("submit", (e) => {
  e.preventDefault();

  if (!statusSelecionado) {
    alert("Escolha um status: acertei, errei, dúvida ou chute.");
    return;
  }
  const materia = document.getElementById("materia").value;
  if (!materia) {
    alert("Escolha a matéria.");
    return;
  }

  const registro = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
    materia,
    assunto: document.getElementById("assunto").value.trim(),
    status: statusSelecionado,
    motivo: document.getElementById("motivo").value.trim(),
    codigo: document.getElementById("codigo").value.trim(),
    dificuldade: document.getElementById("dificuldade").value,
    ano: document.getElementById("ano").value,
    banca: document.getElementById("banca").value.trim() || "Cesgranrio",
    data: document.getElementById("data").value || new Date().toISOString().slice(0, 10),
    revisada: false,
    criadoEm: Date.now()
  };

  questoes.push(registro);
  saveData(questoes);
  renderRecentes();

  // limpa o formulário mantendo matéria e banca (fluxo rápido)
  const materiaAtual = materia;
  document.getElementById("form-registro").reset();
  document.getElementById("materia").value = materiaAtual;
  document.getElementById("materia").dispatchEvent(new Event("change"));
  document.getElementById("banca").value = "Cesgranrio";
  document.getElementById("data").valueAsDate = new Date();
  statusSelecionado = null;
  document.querySelectorAll(".bubble").forEach(b => b.classList.remove("selected"));
  document.getElementById("motivo-field").hidden = true;
  document.getElementById("assunto").focus();
});

/* ==========================================================================
   Lista de recentes
   ========================================================================== */
function renderRecentes() {
  const container = document.getElementById("lista-recentes");
  const ultimos = [...questoes].sort((a, b) => b.criadoEm - a.criadoEm).slice(0, 30);

  if (ultimos.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhuma questão registrada ainda. Comece ali do lado ⟵</p>';
    return;
  }

  container.innerHTML = ultimos.map(q => `
    <div class="item-recente">
      <span class="dot" style="background:${corStatus(q.status)}"></span>
      <div class="info">
        <b>${escapeHtml(q.assunto || q.materia)}</b>
        <span>${titleCase(q.materia)} · ${STATUS_LABEL[q.status]}</span>
      </div>
      ${q.codigo ? `<span class="codigo">#${escapeHtml(q.codigo)}</span>` : ""}
    </div>
  `).join("");
}

function corStatus(status) {
  return { acertei: "var(--acertei)", errei: "var(--errei)", duvida: "var(--duvida)", chute: "var(--chute)" }[status];
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ==========================================================================
   Dashboard
   ========================================================================== */
function renderDashboard() {
  const total = questoes.length;

  document.getElementById("meta-numero").textContent = `${total} / ${META_QUESTOES}`;
  document.getElementById("meta-pct").textContent = `${Math.min(100, Math.round((total / META_QUESTOES) * 100))}%`;

  // grade tipo gabarito: 1 bolinha por questão, até a meta
  const grid = document.getElementById("gabarito-grid");
  const ordenadas = [...questoes].sort((a, b) => a.criadoEm - b.criadoEm);
  let dots = "";
  for (let i = 0; i < META_QUESTOES; i++) {
    const q = ordenadas[i];
    dots += q ? `<div class="gab-dot g-${q.status}" title="${escapeHtml(q.assunto || q.materia)}"></div>` : `<div class="gab-dot"></div>`;
  }
  grid.innerHTML = dots;

  // contadores por status
  const counts = { acertei: 0, errei: 0, duvida: 0, chute: 0 };
  questoes.forEach(q => counts[q.status]++);
  Object.keys(counts).forEach(st => {
    document.getElementById("stat-" + st).textContent = counts[st];
    document.getElementById("stat-" + st + "-pct").textContent =
      total ? Math.round((counts[st] / total) * 100) + "%" : "0%";
  });

  // taxa por matéria
  const barsContainer = document.getElementById("materias-bars");
  const porMateria = Object.keys(MATERIAS).map(nome => {
    const qs = questoes.filter(q => q.materia === nome);
    const acertos = qs.filter(q => q.status === "acertei").length;
    const taxa = qs.length ? Math.round((acertos / qs.length) * 100) : null;
    return { nome, taxa, total: qs.length, cor: MATERIAS[nome].cor };
  });
  barsContainer.innerHTML = porMateria.map(m => `
    <div class="mbar-row">
      <span class="mbar-label">${titleCase(m.nome)}</span>
      <div class="mbar-track"><div class="mbar-fill" style="width:${m.taxa ?? 0}%; background:${m.cor}"></div></div>
      <span class="mbar-pct">${m.total ? m.taxa + "%" : "—"}</span>
    </div>
  `).join("");

  // ranking de assuntos mais fracos
  const porAssunto = {};
  questoes.forEach(q => {
    const chave = q.materia + " · " + (q.assunto || "sem assunto");
    if (!porAssunto[chave]) porAssunto[chave] = { total: 0, erros: 0, materia: q.materia, assunto: q.assunto };
    porAssunto[chave].total++;
    if (q.status === "errei" || q.status === "chute") porAssunto[chave].erros++;
  });
  const fracos = Object.values(porAssunto)
    .filter(a => a.total >= 3)
    .map(a => ({ ...a, taxaErro: Math.round((a.erros / a.total) * 100) }))
    .sort((a, b) => b.taxaErro - a.taxaErro)
    .slice(0, 6);

  const rankingEl = document.getElementById("ranking-fracos");
  rankingEl.innerHTML = fracos.length
    ? fracos.map(a => `
      <div class="rank-row">
        <div class="rname">${escapeHtml(a.assunto || "Sem assunto")}<small>${titleCase(a.materia)} · ${a.total} questões</small></div>
        <span class="rpct">${a.taxaErro}%</span>
      </div>
    `).join("")
    : '<p class="empty-state">Registre pelo menos 3 questões do mesmo assunto pra aparecer aqui.</p>';

  // streak
  document.getElementById("streak-numero").textContent = calcularStreak() + (calcularStreak() === 1 ? " dia" : " dias");
}

function calcularStreak() {
  if (questoes.length === 0) return 0;
  const dias = new Set(questoes.map(q => q.data));
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (dias.has(iso)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0 && iso === new Date().toISOString().slice(0, 10)) {
      // hoje ainda sem registro: não quebra a sequência de ontem pra trás
      cursor.setDate(cursor.getDate() - 1);
      continue;
    } else {
      break;
    }
  }
  return streak;
}

/* ==========================================================================
   Revisão
   ========================================================================== */
function renderRevisao() {
  const filtroMateria = document.getElementById("filtro-materia").value;
  const filtroStatus = document.getElementById("filtro-status").value;

  let lista = questoes.filter(q => {
    if (filtroStatus === "revisadas") return q.revisada;
    if (filtroStatus === "todas") return !q.revisada;
    if (filtroStatus) return q.status === filtroStatus && !q.revisada;
    return (q.status === "errei" || q.status === "duvida") && !q.revisada;
  });
  if (filtroMateria) lista = lista.filter(q => q.materia === filtroMateria);
  lista.sort((a, b) => b.criadoEm - a.criadoEm);

  const container = document.getElementById("lista-revisao");
  const vazio = document.getElementById("revisao-vazio");

  if (lista.length === 0) {
    container.innerHTML = "";
    vazio.hidden = false;
    return;
  }
  vazio.hidden = true;

  container.innerHTML = lista.map(q => `
    <div class="rev-card ${q.revisada ? "revisada" : ""}" data-id="${q.id}">
      <div class="rev-top">
        <span class="rev-tag ${q.status}">${STATUS_LABEL[q.status]}</span>
        <span class="rev-meta">${titleCase(q.materia)} · ${q.data}${q.codigo ? " · #" + escapeHtml(q.codigo) : ""}</span>
      </div>
      <span class="rev-assunto">${escapeHtml(q.assunto || "Sem assunto")}</span>
      ${q.motivo ? `<span class="rev-motivo">${escapeHtml(q.motivo)}</span>` : ""}
      <div class="rev-actions">
        ${q.codigo ? `<a href="${ESTRATEGIA_BASE}${encodeURIComponent(q.codigo)}/" target="_blank" rel="noopener">Abrir questão</a>` : ""}
        <button data-action="toggle">${q.revisada ? "Desmarcar revisão" : "Marcar como revisada"}</button>
        <button data-action="excluir">Excluir</button>
      </div>
    </div>
  `).join("");
}

document.getElementById("lista-revisao").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const card = e.target.closest(".rev-card");
  const id = card.dataset.id;
  const q = questoes.find(q => q.id === id);
  if (!q) return;

  if (btn.dataset.action === "toggle") {
    q.revisada = !q.revisada;
    saveData(questoes);
    renderRevisao();
  }
  if (btn.dataset.action === "excluir") {
    if (confirm("Excluir este registro? Não dá pra desfazer.")) {
      questoes = questoes.filter(x => x.id !== id);
      saveData(questoes);
      renderRevisao();
    }
  }
});

document.getElementById("filtro-materia").addEventListener("change", renderRevisao);
document.getElementById("filtro-status").addEventListener("change", renderRevisao);

/* ==========================================================================
   Backup: exportar / importar
   ========================================================================== */
document.getElementById("btn-exportar").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(questoes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gabarito-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("input-importar").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const dados = JSON.parse(reader.result);
      if (!Array.isArray(dados)) throw new Error("Formato inválido");
      const substituir = confirm(
        "Importar vai SOMAR estas questões às que já existem aqui.\n\nOK = somar aos dados atuais\nCancelar = substituir tudo pelos dados do arquivo"
      );
      questoes = substituir ? questoes.concat(dados) : dados;
      saveData(questoes);
      renderRecentes();
      renderDashboard();
      renderRevisao();
      alert("Backup importado com sucesso.");
    } catch (err) {
      alert("Não consegui ler esse arquivo. Confira se é um backup exportado por aqui.");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

/* ==========================================================================
   Boot
   ========================================================================== */
popularMaterias();
renderRecentes();
renderDashboard();
