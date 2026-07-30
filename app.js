/* ==========================================================================
   Dados do edital — Banco do Brasil, Agente Comercial, Cesgranrio (Edital 2022/2023,
   última edição vigente até jul/2026 — confirme se já saiu edital novo antes de fixar)
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
  "MATEMÁTICA FINANCEIRA": {
    cor: "var(--mat-probabilidade)",
    topicos: [
      "Juros simples", "Juros compostos", "Taxas nominais, efetivas e equivalentes",
      "Sistema de Amortização Constante (SAC)", "Sistema Price (Tabela Price)",
      "Descontos simples e compostos", "Séries de pagamentos e fluxo de caixa",
      "Correção monetária e inflação", "Taxa de juros real (Fisher)", "Multas e juros de mora"
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
  "CONHECIMENTOS DE INFORMÁTICA": {
    cor: "var(--mat-informatica)",
    topicos: [
      "Windows 10 (Explorador de Arquivos, Firewall, atalhos)", "Microsoft Office / Microsoft 365 (Word, Excel)",
      "Excel: fórmulas, referência absoluta e relativa", "Navegadores (Firefox, Edge): configurações e privacidade",
      "Segurança da informação: phishing, assinatura digital", "Redes: DHCP, protocolos, conexão",
      "Nuvem e compartilhamento (Google Drive, OneDrive)", "Aplicativos de comunicação (Teams, WhatsApp, Telegram)",
      "Mineração de dados e aprendizado de máquina (noções)", "Tipos de gráfico e visualização de dados"
    ]
  },
  "VENDAS E NEGOCIAÇÃO": {
    cor: "var(--mat-vendas)",
    topicos: [
      "Marketing de relacionamento", "Qualidade em serviços (dimensões SERVQUAL)",
      "Momento da verdade", "Segmentação de mercado", "Venda consultiva",
      "Churn rate e retenção de clientes", "Código de Defesa do Consumidor aplicado a vendas",
      "Gatilhos mentais (urgência, escassez, prova social)", "Storytelling em vendas",
      "Estratégias de precificação", "Ouvidoria e canais de atendimento (SAC)",
      "Barreiras de entrada e composto de marketing"
    ]
  }
};

const META_QUESTOES = 1000;
const STORAGE_KEY = "gabarito_questoes_v2";
const STORAGE_KEY_LEGADO = "gabarito_questoes_v1";
const ESTRATEGIA_BASE = "https://concursos.estrategia.com/questoes/";

const STATUS_LABEL = { acertei: "Acertei", errei: "Errei", duvida: "Dúvida", chute: "Chute" };
const MOTIVO_LABEL = {
  nao_sabia: "Não sabia o conteúdo",
  interpretei_mal: "Interpretei mal o enunciado",
  pegadinha_comando: "Caí na pegadinha do comando (EXCETO/NÃO)",
  erro_calculo: "Erro de cálculo / conta",
  confundi_conceito: "Confundi com conceito parecido",
  chute_puro: "Chute mesmo, não tinha ideia"
};

/* ==========================================================================
   Persistência
   ========================================================================== */
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    // migração silenciosa de uma versão anterior do app, se existir
    const legado = localStorage.getItem(STORAGE_KEY_LEGADO);
    if (legado) {
      const dados = JSON.parse(legado).map(q => ({ origem: "prova", grupo: "", volatil: false, ...q }));
      saveData(dados);
      return dados;
    }
    return [];
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
let filtroGrupoAtivo = "";

const hojeISO = () => new Date().toISOString().slice(0, 10);
function somarDias(dataISO, dias) {
  const d = new Date(dataISO + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

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

function atualizarListaAssuntos(materiaNome) {
  const datalist = document.getElementById("assunto-list");
  datalist.innerHTML = "";
  const topicos = MATERIAS[materiaNome]?.topicos || [];
  topicos.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    datalist.appendChild(opt);
  });
}

function atualizarListaGrupos(materiaNome) {
  const datalist = document.getElementById("grupo-list");
  datalist.innerHTML = "";
  const grupos = [...new Set(
    questoes.filter(q => q.grupo && (!materiaNome || q.materia === materiaNome)).map(q => q.grupo)
  )].sort();
  grupos.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g;
    datalist.appendChild(opt);
  });
}

const APLICACOES_PADRAO = [
  "BB 2018 - Escriturário", "BB 2021 - Agente Comercial", "BB 2022 - Agente Comercial"
];
function atualizarListaAplicacoes() {
  const datalist = document.getElementById("aplicacao-list");
  datalist.innerHTML = "";
  const doQuestoes = questoes.filter(q => q.aplicacao).map(q => q.aplicacao);
  const aplicacoes = [...new Set([...APLICACOES_PADRAO, ...doQuestoes])].sort();
  aplicacoes.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a;
    datalist.appendChild(opt);
  });
}

document.getElementById("materia").addEventListener("change", (e) => {
  atualizarListaAssuntos(e.target.value);
  atualizarListaGrupos(e.target.value);
});

document.getElementById("origem").addEventListener("change", toggleOrigemFields);
function toggleOrigemFields() {
  const isIA = document.getElementById("origem").value === "ia";
  document.getElementById("row-prova").hidden = isIA;
  document.getElementById("row-prova-fonte").hidden = isIA;
}
toggleOrigemFields();

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

  const origem = document.getElementById("origem").value;
  const grupo = document.getElementById("grupo").value.trim();
  const assunto = document.getElementById("assunto").value.trim();
  const banca = document.getElementById("banca").value.trim() || "Cesgranrio";
  const aplicacao = document.getElementById("aplicacao").value.trim();
  const volatil = document.getElementById("volatil").checked;

  const registro = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
    materia,
    origem,
    assunto,
    grupo,
    status: statusSelecionado,
    motivoCategoria: document.getElementById("motivo-categoria").value,
    motivo: document.getElementById("motivo").value.trim(),
    codigo: origem === "prova" ? document.getElementById("codigo").value.trim() : "",
    aplicacao: origem === "prova" ? aplicacao : "",
    questaoPdf: origem === "prova" ? document.getElementById("questao-pdf").value.trim() : "",
    dificuldade: document.getElementById("dificuldade").value,
    ano: document.getElementById("ano").value,
    banca: origem === "prova" ? banca : "",
    data: document.getElementById("data").value || hojeISO(),
    volatil,
    enunciado: document.getElementById("enunciado").value.trim(),
    alternativas: {
      A: document.getElementById("alt-a").value.trim(),
      B: document.getElementById("alt-b").value.trim(),
      C: document.getElementById("alt-c").value.trim(),
      D: document.getElementById("alt-d").value.trim(),
      E: document.getElementById("alt-e").value.trim()
    },
    respostaMarcada: document.getElementById("resposta-marcada").value,
    gabarito: document.getElementById("gabarito").value,
    explicacao: document.getElementById("explicacao").value.trim(),
    revisada: false,
    proximaRevisao: null,
    criadoEm: Date.now()
  };

  questoes.push(registro);
  saveData(questoes);
  renderRecentes();
  atualizarListaAplicacoes();

  // limpa a maior parte do formulário, mas mantém matéria / origem / assunto / grupo / prova
  // pra emendar rápido a próxima variação da mesma questão
  document.getElementById("form-registro").reset();
  document.getElementById("materia").value = materia;
  document.getElementById("origem").value = origem;
  toggleOrigemFields();
  atualizarListaAssuntos(materia);
  atualizarListaGrupos(materia);
  document.getElementById("assunto").value = assunto;
  document.getElementById("grupo").value = grupo;
  document.getElementById("banca").value = "Cesgranrio";
  document.getElementById("aplicacao").value = origem === "prova" ? aplicacao : "";
  document.getElementById("data").valueAsDate = new Date();
  document.getElementById("volatil").checked = volatil;

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
        ${q.aplicacao ? `<span class="chip">${escapeHtml(q.aplicacao)}${q.questaoPdf ? " · Q" + escapeHtml(q.questaoPdf) : ""}</span>` : ""}
        ${q.grupo ? `<span class="chip">${escapeHtml(q.grupo)}</span>` : ""}
      </div>
      <span class="origem-badge origem-${q.origem || "prova"}">${q.origem === "ia" ? "IA" : "Prova"}</span>
      ${q.codigo ? `<span class="codigo">#${escapeHtml(q.codigo)}</span>` : ""}
    </div>
  `).join("");
}

function corStatus(status) {
  return { acertei: "var(--acertei)", errei: "var(--errei)", duvida: "var(--duvida)", chute: "var(--chute)" }[status];
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

/* ==========================================================================
   Dashboard
   ========================================================================== */
function renderDashboard() {
  const total = questoes.length;

  document.getElementById("meta-numero").textContent = `${total} / ${META_QUESTOES}`;
  document.getElementById("meta-pct").textContent = `${Math.min(100, Math.round((total / META_QUESTOES) * 100))}%`;

  const totalProva = questoes.filter(q => (q.origem || "prova") === "prova").length;
  const totalIA = total - totalProva;
  document.getElementById("meta-origem").textContent = total
    ? `${totalProva} de provas oficiais · ${totalIA} geradas por IA pra treino`
    : "";

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

  renderFamilias();

  // streak
  document.getElementById("streak-numero").textContent = calcularStreak() + (calcularStreak() === 1 ? " dia" : " dias");
}

function renderFamilias() {
  const container = document.getElementById("familias-lista");
  const porGrupo = {};
  questoes.forEach(q => {
    if (!q.grupo) return;
    const chave = q.materia + " · " + q.grupo;
    if (!porGrupo[chave]) porGrupo[chave] = { total: 0, erros: 0, acertos: 0, materia: q.materia, grupo: q.grupo, temOriginal: false, temIA: false };
    porGrupo[chave].total++;
    if (q.status === "errei" || q.status === "chute") porGrupo[chave].erros++;
    if (q.status === "acertei") porGrupo[chave].acertos++;
    if ((q.origem || "prova") === "prova") porGrupo[chave].temOriginal = true;
    if (q.origem === "ia") porGrupo[chave].temIA = true;
  });

  const familias = Object.values(porGrupo)
    .map(f => ({ ...f, taxaAcerto: Math.round((f.acertos / f.total) * 100) }))
    .sort((a, b) => a.taxaAcerto - b.taxaAcerto)
    .slice(0, 8);

  if (!familias.length) {
    container.innerHTML = '<p class="empty-state">Preencha o campo "Grupo / família da questão" ao registrar pra ver aqui o quanto você já dominou cada questão original + suas variações.</p>';
    return;
  }

  container.innerHTML = familias.map(f => `
    <div class="rank-row">
      <div class="rname">${escapeHtml(f.grupo)}
        <small>${titleCase(f.materia)} · ${f.total} questões${f.temOriginal ? " · tem original" : " · só variação IA"}</small>
      </div>
      <span class="rpct ${f.taxaAcerto >= 70 ? "ok" : ""}">${f.taxaAcerto}% acerto</span>
    </div>
  `).join("");
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
  const filtroOrigem = document.getElementById("filtro-origem").value;
  const filtroStatus = document.getElementById("filtro-status").value;
  const hoje = hojeISO();

  let lista = questoes.filter(q => {
    if (filtroStatus === "revisadas") return q.revisada;
    if (filtroStatus === "vencidas") return q.revisada && q.proximaRevisao && q.proximaRevisao <= hoje;
    if (filtroStatus === "todas") return !q.revisada;
    if (filtroStatus) return q.status === filtroStatus && !q.revisada;
    return (q.status === "errei" || q.status === "duvida") && !q.revisada;
  });
  if (filtroMateria) lista = lista.filter(q => q.materia === filtroMateria);
  if (filtroOrigem) lista = lista.filter(q => (q.origem || "prova") === filtroOrigem);
  if (filtroGrupoAtivo) lista = lista.filter(q => q.grupo === filtroGrupoAtivo);
  lista.sort((a, b) => b.criadoEm - a.criadoEm);

  const banner = document.getElementById("filtro-grupo-banner");
  if (filtroGrupoAtivo) {
    banner.hidden = false;
    banner.innerHTML = `<span>Filtrando pela família: <strong>${escapeHtml(filtroGrupoAtivo)}</strong></span><button id="btn-limpar-grupo">Limpar filtro</button>`;
  } else {
    banner.hidden = true;
    banner.innerHTML = "";
  }

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
        <div class="rev-top-left">
          <span class="rev-tag ${q.status}">${STATUS_LABEL[q.status]}</span>
          <span class="origem-badge origem-${q.origem || "prova"}">${q.origem === "ia" ? "IA" : "Prova"}</span>
          ${q.volatil ? '<span class="chip chip-alerta">⚠ pode estar desatualizado</span>' : ""}
        </div>
        <span class="rev-meta">${titleCase(q.materia)} · ${q.data}${q.aplicacao ? " · " + escapeHtml(q.aplicacao) : ""}${q.questaoPdf ? " · Q" + escapeHtml(q.questaoPdf) : ""}${q.codigo ? " · #" + escapeHtml(q.codigo) : ""}${q.proximaRevisao ? " · revisar em " + formatarDataBR(q.proximaRevisao) : ""}</span>
      </div>
      <span class="rev-assunto">${escapeHtml(q.assunto || "Sem assunto")}</span>
      ${q.grupo ? `<span class="chip chip-grupo" data-grupo="${escapeHtml(q.grupo)}">👪 ${escapeHtml(q.grupo)}</span>` : ""}
      ${q.motivoCategoria ? `<span class="rev-motivo"><b>${escapeHtml(MOTIVO_LABEL[q.motivoCategoria] || q.motivoCategoria)}</b>${q.motivo ? " — " + escapeHtml(q.motivo) : ""}</span>` : (q.motivo ? `<span class="rev-motivo">${escapeHtml(q.motivo)}</span>` : "")}

      ${(q.enunciado || q.explicacao || q.gabarito) ? `
      <details class="rev-conteudo">
        <summary>Ver questão completa</summary>
        <div class="rev-conteudo-body">
          ${q.enunciado ? `<p><span class="rc-label">Enunciado</span>${escapeHtml(q.enunciado)}</p>` : ""}
          ${temAlternativas(q.alternativas) ? `<ul>${["A","B","C","D","E"].filter(l => q.alternativas && q.alternativas[l]).map(l => {
            const classes = [];
            if (q.gabarito === l) classes.push("gabarito-correto");
            if (q.respostaMarcada === l && q.respostaMarcada !== q.gabarito) classes.push("resposta-marcada-errada");
            if (q.respostaMarcada === l && q.respostaMarcada === q.gabarito) classes.push("resposta-marcada-certa");
            return `<li class="${classes.join(" ")}">${l}) ${escapeHtml(q.alternativas[l])}${q.respostaMarcada === l ? " ← você marcou" : ""}</li>`;
          }).join("")}</ul>` : ""}
          ${q.respostaMarcada || q.gabarito ? `<p><span class="rc-label">Sua resposta / Gabarito</span>${q.respostaMarcada || "—"} / ${q.gabarito || "—"}</p>` : ""}
          ${q.explicacao ? `<div class="rc-explicacao"><span class="rc-label">Explicação / bizu</span>${escapeHtml(q.explicacao)}</div>` : ""}
        </div>
      </details>` : ""}

      <div class="rev-actions">
        ${q.codigo ? `<a href="${ESTRATEGIA_BASE}${encodeURIComponent(q.codigo)}/" target="_blank" rel="noopener">Abrir na fonte</a>` : ""}
        <button data-action="toggle">${q.revisada ? "Desmarcar revisão" : "Marcar como revisada"}</button>
        <span class="rev-sep"></span>
        <button class="btn-revisar-em" data-action="revisar" data-dias="1">+1 dia</button>
        <button class="btn-revisar-em" data-action="revisar" data-dias="3">+3 dias</button>
        <button class="btn-revisar-em" data-action="revisar" data-dias="7">+7 dias</button>
        <span class="rev-sep"></span>
        <button data-action="excluir">Excluir</button>
      </div>
    </div>
  `).join("");
}

function temAlternativas(alt) {
  if (!alt) return false;
  return ["A", "B", "C", "D", "E"].some(l => alt[l]);
}
function formatarDataBR(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

document.getElementById("lista-revisao").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip-grupo");
  if (chip) {
    filtroGrupoAtivo = chip.dataset.grupo;
    renderRevisao();
    return;
  }

  const btn = e.target.closest("button");
  if (!btn) return;
  const card = e.target.closest(".rev-card");
  const id = card.dataset.id;
  const q = questoes.find(q => q.id === id);
  if (!q) return;

  if (btn.dataset.action === "toggle") {
    q.revisada = !q.revisada;
    if (!q.revisada) q.proximaRevisao = null;
    saveData(questoes);
    renderRevisao();
    renderDashboard();
  }
  if (btn.dataset.action === "revisar") {
    const dias = parseInt(btn.dataset.dias, 10);
    q.revisada = true;
    q.proximaRevisao = somarDias(hojeISO(), dias);
    saveData(questoes);
    renderRevisao();
  }
  if (btn.dataset.action === "excluir") {
    if (confirm("Excluir este registro? Não dá pra desfazer.")) {
      questoes = questoes.filter(x => x.id !== id);
      saveData(questoes);
      renderRevisao();
      renderRecentes();
      renderDashboard();
    }
  }
});

document.getElementById("filtro-grupo-banner").addEventListener("click", (e) => {
  if (e.target.id === "btn-limpar-grupo") {
    filtroGrupoAtivo = "";
    renderRevisao();
  }
});

document.getElementById("filtro-materia").addEventListener("change", renderRevisao);
document.getElementById("filtro-origem").addEventListener("change", renderRevisao);
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
      const normalizados = dados.map(q => ({ origem: "prova", grupo: "", volatil: false, alternativas: {}, ...q }));
      const substituir = confirm(
        "Importar vai SOMAR estas questões às que já existem aqui.\n\nOK = somar aos dados atuais\nCancelar = substituir tudo pelos dados do arquivo"
      );
      questoes = substituir ? questoes.concat(normalizados) : normalizados;
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

document.getElementById("btn-limpar").addEventListener("click", () => {
  if (questoes.length === 0) {
    alert("Já não há nada registrado.");
    return;
  }
  const confirmar1 = confirm(
    `Isso vai apagar TODAS as ${questoes.length} questões salvas neste navegador (inclusive de matérias antigas).\n\nRecomendado: clique em "Exportar backup" antes, caso queira guardar algo.\n\nContinuar e apagar tudo?`
  );
  if (!confirmar1) return;
  const confirmar2 = confirm("Tem certeza mesmo? Essa ação não pode ser desfeita.");
  if (!confirmar2) return;
  questoes = [];
  saveData(questoes);
  renderRecentes();
  renderDashboard();
  renderRevisao();
  alert("Pronto, tudo limpo. Pode começar a registrar do zero.");
});

/* ==========================================================================
   Boot
   ========================================================================== */
popularMaterias();
atualizarListaAplicacoes();
renderRecentes();
renderDashboard();
