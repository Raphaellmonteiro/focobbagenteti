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
const STORAGE_KEY_CONFIG = "gabarito_config_v1";
const STORAGE_KEY_BIZUS = "gabarito_bizus_v1";
const STORAGE_KEY_TEMPO = "gabarito_tempo_v1";
const STORAGE_KEY_CADERNO = "gabarito_caderno_v1";
const ESTRATEGIA_BASE = "https://concursos.estrategia.com/questoes/";
const TOTAL_QUESTOES_PROVA = 70; // 70 questões objetivas nos últimos editais BB/Cesgranrio — confirme no edital vigente

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
      const dados = JSON.parse(legado).map(q => ({ origem: "prova", grupo: "", volatil: false, imagem: "", imagemTipo: "", ...q }));
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

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    return raw ? JSON.parse(raw) : { tempoProvaMin: 240 };
  } catch (e) {
    return { tempoProvaMin: 240 };
  }
}
function saveConfig(cfg) {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cfg));
}
let config = loadConfig();

function loadBizus() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BIZUS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Erro ao ler bizus salvos:", e);
    return [];
  }
}
function saveBizus(data) {
  localStorage.setItem(STORAGE_KEY_BIZUS, JSON.stringify(data));
}
let bizus = loadBizus();
let bizuEditandoId = null;

function loadTempoEstudo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEMPO);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Erro ao ler tempo de estudo salvo:", e);
    return {};
  }
}
function saveTempoEstudo(data) {
  localStorage.setItem(STORAGE_KEY_TEMPO, JSON.stringify(data));
}
let tempoEstudo = loadTempoEstudo(); // { "YYYY-MM-DD": minutos }

function loadCaderno() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CADERNO);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Erro ao ler o caderno salvo:", e);
    return [];
  }
}
function saveCaderno(data) {
  localStorage.setItem(STORAGE_KEY_CADERNO, JSON.stringify(data));
}
let cadernoPaginas = loadCaderno();
let cadernoPaginaAtualId = null;
function adicionarMinutosEstudo(dataISO, minutos) {
  if (!dataISO || !minutos) return;
  tempoEstudo[dataISO] = (tempoEstudo[dataISO] || 0) + minutos;
  saveTempoEstudo(tempoEstudo);
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
  const bizuMateria = document.getElementById("bizu-materia");
  const bizuFiltroMateria = document.getElementById("bizu-filtro-materia");
  const timerMateria = document.getElementById("timer-materia");
  const cadernoMateria = document.getElementById("caderno-materia");
  const cadernoFiltroMateria = document.getElementById("caderno-filtro-materia");
  Object.keys(MATERIAS).forEach(nome => {
    const opt = document.createElement("option");
    opt.value = nome; opt.textContent = titleCase(nome);
    select.appendChild(opt);

    filtroMateria.appendChild(opt.cloneNode(true));
    bizuMateria.appendChild(opt.cloneNode(true));
    bizuFiltroMateria.appendChild(opt.cloneNode(true));
    timerMateria.appendChild(opt.cloneNode(true));
    cadernoMateria.appendChild(opt.cloneNode(true));
    cadernoFiltroMateria.appendChild(opt.cloneNode(true));
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

function buscarTextoBasePorGrupo(grupoValor) {
  if (!grupoValor) return "";
  const achada = questoes.find(q => q.grupo === grupoValor && q.textoBase);
  return achada ? achada.textoBase : "";
}

function tentarPreencherTextoBase() {
  const grupoValor = document.getElementById("grupo").value.trim();
  const campoTexto = document.getElementById("texto-base");
  const hint = document.getElementById("texto-base-hint");
  if (!grupoValor || campoTexto.value.trim()) {
    hint.hidden = true;
    return;
  }
  const textoEncontrado = buscarTextoBasePorGrupo(grupoValor);
  if (textoEncontrado) {
    campoTexto.value = textoEncontrado;
    hint.hidden = false;
  }
}
document.getElementById("grupo").addEventListener("change", tentarPreencherTextoBase);
document.getElementById("grupo").addEventListener("blur", tentarPreencherTextoBase);
document.getElementById("texto-base").addEventListener("input", () => {
  document.getElementById("texto-base-hint").hidden = true;
});

/* ==========================================================================
   Contador de família (quantas questões já tem nesse Grupo)
   ========================================================================== */
function atualizarContadorGrupo() {
  const grupoValor = document.getElementById("grupo").value.trim();
  const materiaValor = document.getElementById("materia").value;
  const el = document.getElementById("grupo-contador");
  if (!grupoValor) { el.hidden = true; return; }
  const count = questoes.filter(q => q.grupo === grupoValor && q.materia === materiaValor).length;
  el.hidden = false;
  if (count === 0) {
    el.textContent = "Essa vai ser a 1ª questão dessa família (a original). Depois use o mesmo Grupo pras 3 variações da IA.";
  } else if (count < 4) {
    el.textContent = `Essa família já tem ${count} questão${count > 1 ? "ões" : ""} registrada${count > 1 ? "s" : ""}. Meta: 4 (1 original + 3 variações).`;
  } else {
    el.textContent = `✓ Família completa: ${count} questões registradas.`;
  }
}
document.getElementById("grupo").addEventListener("input", atualizarContadorGrupo);
document.getElementById("grupo").addEventListener("change", atualizarContadorGrupo);

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
document.getElementById("bizu-materia").addEventListener("change", (e) => {
  atualizarListaAssuntosBizu(e.target.value);
});
function atualizarListaAssuntosBizu(materiaNome) {
  const datalist = document.getElementById("bizu-assunto-list");
  datalist.innerHTML = "";
  const topicos = MATERIAS[materiaNome]?.topicos || [];
  const daQuestoes = questoes.filter(q => q.materia === materiaNome && q.assunto).map(q => q.assunto);
  const jaUsados = [...new Set([...topicos, ...daQuestoes])].sort();
  jaUsados.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    datalist.appendChild(opt);
  });
}

document.getElementById("origem").addEventListener("change", toggleOrigemFields);
function toggleOrigemFields() {
  const isIA = document.getElementById("origem").value === "ia";
  document.getElementById("row-prova").hidden = isIA;
  document.getElementById("row-prova-fonte").hidden = isIA;
}
toggleOrigemFields();

/* ==========================================================================
   Cronômetro por questão (estratégia de ritmo)
   ========================================================================== */
let timerSegundos = 0;
let timerRodando = false;
let timerIntervalo = null;

function formatarMMSS(totalSegundos) {
  const m = Math.floor(totalSegundos / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSegundos % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
function parseMMSS(texto) {
  const partes = texto.trim().split(":");
  if (partes.length === 2) {
    const m = parseInt(partes[0], 10) || 0;
    const s = parseInt(partes[1], 10) || 0;
    return m * 60 + s;
  }
  const s = parseInt(texto, 10);
  return isNaN(s) ? 0 : s;
}
function metaSegundosPorQuestao() {
  return Math.round((config.tempoProvaMin * 60) / TOTAL_QUESTOES_PROVA);
}
function atualizarTimerMeta() {
  const meta = metaSegundosPorQuestao();
  document.getElementById("timer-meta-texto").textContent = `meta: ${formatarMMSS(meta)} / questão`;
}
function renderTimerDisplay() {
  document.getElementById("timer-display").textContent = formatarMMSS(timerSegundos);
  document.getElementById("tempo-manual").value = formatarMMSS(timerSegundos);
  const meta = metaSegundosPorQuestao();
  const display = document.getElementById("timer-display");
  display.classList.toggle("timer-estourado", timerSegundos > meta && meta > 0);
}
document.getElementById("btn-timer-toggle").addEventListener("click", () => {
  timerRodando = !timerRodando;
  const btn = document.getElementById("btn-timer-toggle");
  if (timerRodando) {
    btn.textContent = "⏸ Pausar";
    timerIntervalo = setInterval(() => {
      timerSegundos++;
      renderTimerDisplay();
    }, 1000);
  } else {
    btn.textContent = "▶ Iniciar";
    clearInterval(timerIntervalo);
  }
});
document.getElementById("btn-timer-reset").addEventListener("click", () => {
  timerSegundos = 0;
  timerRodando = false;
  clearInterval(timerIntervalo);
  document.getElementById("btn-timer-toggle").textContent = "▶ Iniciar";
  renderTimerDisplay();
});
document.getElementById("tempo-manual").addEventListener("input", (e) => {
  timerSegundos = parseMMSS(e.target.value);
  const meta = metaSegundosPorQuestao();
  document.getElementById("timer-display").textContent = formatarMMSS(timerSegundos);
  document.getElementById("timer-display").classList.toggle("timer-estourado", timerSegundos > meta && meta > 0);
});
function resetarTimerParaProximaQuestao() {
  timerSegundos = 0;
  timerRodando = false;
  clearInterval(timerIntervalo);
  document.getElementById("btn-timer-toggle").textContent = "▶ Iniciar";
  renderTimerDisplay();
}
atualizarTimerMeta();
renderTimerDisplay();

document.getElementById("btn-timer-ir-registrar").addEventListener("click", () => {
  const materiaEscolhida = document.getElementById("timer-materia").value;
  if (!materiaEscolhida) {
    alert("Escolha a matéria da questão no cronômetro antes de registrar.");
    return;
  }
  document.getElementById("materia").value = materiaEscolhida;
  atualizarListaAssuntos(materiaEscolhida);
  atualizarListaGrupos(materiaEscolhida);
  document.getElementById("timer-lembrete-registrar").hidden = false;
  document.querySelector('.tab[data-tab="registrar"]').click();
  document.getElementById("assunto").focus();
});

document.getElementById("data").valueAsDate = new Date();

/* ==========================================================================
   Imagem / print da questão (colar, arrastar ou linkar)
   ========================================================================== */
let imagemAtual = ""; // data URL da imagem colada/arrastada (redimensionada)

const elDropzone = document.getElementById("imagem-dropzone");
const elDropzoneVazia = document.getElementById("imagem-dropzone-empty");
const elPreviewWrap = document.getElementById("imagem-preview-wrap");
const elPreview = document.getElementById("imagem-preview");
const elImagemLink = document.getElementById("imagem-link");

function processarArquivoImagem(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maxLargura = 1000;
      const escala = Math.min(1, maxLargura / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      imagemAtual = canvas.toDataURL("image/jpeg", 0.75);
      mostrarPreviewImagem(imagemAtual);
      elImagemLink.value = "";
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
function mostrarPreviewImagem(src) {
  elPreview.src = src;
  elDropzoneVazia.hidden = true;
  elPreviewWrap.hidden = false;
}
function limparImagem() {
  imagemAtual = "";
  elPreview.src = "";
  elDropzoneVazia.hidden = false;
  elPreviewWrap.hidden = true;
}
elDropzone.addEventListener("paste", (e) => {
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (const item of items) {
    if (item.type && item.type.startsWith("image/")) {
      processarArquivoImagem(item.getAsFile());
      e.preventDefault();
      break;
    }
  }
});
elDropzone.addEventListener("click", () => elDropzone.focus());
elDropzone.addEventListener("dragover", (e) => { e.preventDefault(); elDropzone.classList.add("dragover"); });
elDropzone.addEventListener("dragleave", () => elDropzone.classList.remove("dragover"));
elDropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  elDropzone.classList.remove("dragover");
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) processarArquivoImagem(file);
});
document.getElementById("btn-remover-imagem").addEventListener("click", limparImagem);
elImagemLink.addEventListener("input", () => {
  if (elImagemLink.value.trim()) limparImagem();
});

/* ==========================================================================
   Lightbox (ver imagem ampliada)
   ========================================================================== */
function abrirLightbox(src) {
  if (!src) return;
  document.getElementById("lightbox-img").src = src;
  document.getElementById("lightbox").classList.add("aberta");
}
document.getElementById("pratica-body").addEventListener("click", (e) => {
  const img = e.target.closest('[data-action="ver-imagem"]');
  if (img) abrirLightbox(img.src);
});

document.getElementById("lightbox").addEventListener("click", () => {
  document.getElementById("lightbox").classList.remove("aberta");
});

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
  if (btn.dataset.tab === "bizus") renderBizus();
  if (btn.dataset.tab === "caderno") renderCadernoLista();
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
    textoBase: document.getElementById("texto-base").value.trim(),
    alternativas: {
      A: document.getElementById("alt-a").value.trim(),
      B: document.getElementById("alt-b").value.trim(),
      C: document.getElementById("alt-c").value.trim(),
      D: document.getElementById("alt-d").value.trim(),
      E: document.getElementById("alt-e").value.trim()
    },
    respostaMarcada: document.getElementById("resposta-marcada").value,
    gabarito: document.getElementById("gabarito").value,
    tempoSegundos: timerSegundos,
    explicacao: document.getElementById("explicacao").value.trim(),
    imagem: imagemAtual || elImagemLink.value.trim(),
    imagemTipo: imagemAtual ? "upload" : (elImagemLink.value.trim() ? "link" : ""),
    revisada: false,
    proximaRevisao: null,
    criadoEm: Date.now()
  };

  questoes.push(registro);
  saveData(questoes);
  renderRecentes();
  atualizarListaAplicacoes();
  renderDashboard();

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
  tentarPreencherTextoBase();
  document.getElementById("banca").value = "Cesgranrio";
  document.getElementById("aplicacao").value = origem === "prova" ? aplicacao : "";
  document.getElementById("data").valueAsDate = new Date();
  document.getElementById("volatil").checked = volatil;
  resetarTimerParaProximaQuestao();
  limparImagem();
  atualizarContadorGrupo();
  document.getElementById("timer-lembrete-registrar").hidden = true;

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
    <div class="item-recente" data-id="${q.id}">
      <span class="dot" style="background:${corStatus(q.status)}"></span>
      ${imagemThumbHtml(q)}
      <div class="info">
        <b>${escapeHtml(q.assunto || q.materia)}</b>
        <span>${titleCase(q.materia)} · ${STATUS_LABEL[q.status]}</span>
        ${q.aplicacao ? `<span class="chip">${escapeHtml(q.aplicacao)}${q.questaoPdf ? " · Q" + escapeHtml(q.questaoPdf) : ""}</span>` : ""}
        ${q.grupo ? `<span class="chip">${escapeHtml(q.grupo)}</span>` : ""}
      </div>
      <span class="origem-badge origem-${q.origem || "prova"}">${q.origem === "ia" ? "IA" : "Prova"}</span>
      ${q.codigo ? `<span class="codigo">#${escapeHtml(q.codigo)}</span>` : ""}
      <button type="button" class="btn-duplicar" data-action="duplicar" title="Criar variação a partir desta questão">➕ Variação</button>
    </div>
  `).join("");
}

/* miniatura de imagem, se houver, usada nas listas de recentes e revisão */
function imagemThumbHtml(q) {
  if (!q.imagem) return "";
  if (q.imagemTipo === "link") {
    return `<a class="chip chip-imagem" href="${escapeHtml(q.imagem)}" target="_blank" rel="noopener">🔗 imagem</a>`;
  }
  return `<img class="thumb-mini" src="${q.imagem}" data-action="ver-imagem" alt="Print da questão" title="Ver ampliada">`;
}

document.getElementById("lista-recentes").addEventListener("click", (e) => {
  const img = e.target.closest('[data-action="ver-imagem"]');
  if (img) { abrirLightbox(img.src); return; }
  const btn = e.target.closest('[data-action="duplicar"]');
  if (!btn) return;
  const item = e.target.closest(".item-recente");
  duplicarComoVariacao(item.dataset.id);
});

/* ==========================================================================
   Nova variação a partir de uma questão existente
   Pré-preenche o formulário (matéria, assunto, grupo, texto-base, enunciado,
   alternativas) pra você só ajustar com a variação que a IA gerou e marcar
   o status — sem digitar tudo de novo.
   ========================================================================== */
function duplicarComoVariacao(id) {
  const original = questoes.find(q => q.id === id);
  if (!original) return;

  document.querySelector('.tab[data-tab="registrar"]').click();

  document.getElementById("materia").value = original.materia;
  atualizarListaAssuntos(original.materia);
  atualizarListaGrupos(original.materia);
  document.getElementById("assunto").value = original.assunto || "";
  document.getElementById("origem").value = "ia";
  toggleOrigemFields();
  document.getElementById("aplicacao").value = original.aplicacao || "";
  document.getElementById("banca").value = original.banca || "Cesgranrio";

  let grupoValor = original.grupo;
  if (!grupoValor) {
    grupoValor = [original.assunto, original.questaoPdf ? "Q" + original.questaoPdf : (original.codigo ? "#" + original.codigo : "")]
      .filter(Boolean).join(" · ");
  }
  document.getElementById("grupo").value = grupoValor;

  document.getElementById("texto-base").value = original.textoBase || "";
  document.getElementById("texto-base-hint").hidden = true;
  document.getElementById("enunciado").value = original.enunciado || "";
  document.getElementById("alt-a").value = (original.alternativas && original.alternativas.A) || "";
  document.getElementById("alt-b").value = (original.alternativas && original.alternativas.B) || "";
  document.getElementById("alt-c").value = (original.alternativas && original.alternativas.C) || "";
  document.getElementById("alt-d").value = (original.alternativas && original.alternativas.D) || "";
  document.getElementById("alt-e").value = (original.alternativas && original.alternativas.E) || "";
  document.getElementById("resposta-marcada").value = "";
  document.getElementById("gabarito").value = "";
  document.getElementById("explicacao").value = "";
  document.getElementById("codigo").value = "";
  document.getElementById("questao-pdf").value = "";
  document.getElementById("data").valueAsDate = new Date();
  document.getElementById("volatil").checked = !!original.volatil;
  limparImagem();
  resetarTimerParaProximaQuestao();

  statusSelecionado = null;
  document.querySelectorAll(".bubble").forEach(b => b.classList.remove("selected"));
  document.getElementById("motivo-field").hidden = true;

  atualizarContadorGrupo();
  const enunciadoEl = document.getElementById("enunciado");
  enunciadoEl.focus();
  enunciadoEl.scrollIntoView({ behavior: "smooth", block: "center" });
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
  renderRitmo();
  renderPrioridade();

  // streak
  document.getElementById("streak-numero").textContent = calcularStreak() + (calcularStreak() === 1 ? " dia" : " dias");

  renderTempoEstudo();
  atualizarBadgeRevisao();
}

function atualizarBadgeRevisao() {
  const hoje = hojeISO();
  const pendentes = questoes.filter(q => {
    if (q.revisada) return q.proximaRevisao && q.proximaRevisao <= hoje; // vencidas
    return q.status === "errei" || q.status === "duvida";
  }).length;
  const badge = document.getElementById("revisao-badge");
  badge.hidden = pendentes === 0;
  badge.textContent = pendentes > 99 ? "99+" : pendentes;
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
      <span class="badge-contagem ${f.total >= 4 ? "badge-completa" : ""}">${f.total}/4</span>
      <span class="rpct ${f.taxaAcerto >= 70 ? "ok" : ""}">${f.taxaAcerto}% acerto</span>
    </div>
  `).join("");
}

/* ==========================================================================
   Ritmo de prova (cronômetro) e Prioridade de ataque
   ========================================================================== */
function renderRitmo() {
  const inputMin = document.getElementById("tempo-prova-min");
  if (document.activeElement !== inputMin) inputMin.value = config.tempoProvaMin;
  const metaSeg = metaSegundosPorQuestao();
  atualizarTimerMeta();

  const comTempo = questoes.filter(q => q.tempoSegundos > 0);
  const resumoEl = document.getElementById("ritmo-resumo");
  if (!comTempo.length) {
    resumoEl.textContent = `Meta por questão: ${formatarMMSS(metaSeg)} (${TOTAL_QUESTOES_PROVA} questões em ${config.tempoProvaMin} min). Use o cronômetro no registro pra começar a medir.`;
    document.getElementById("ritmo-bars").innerHTML = "";
    return;
  }
  const mediaGeral = Math.round(comTempo.reduce((s, q) => s + q.tempoSegundos, 0) / comTempo.length);
  const diff = mediaGeral - metaSeg;
  resumoEl.innerHTML = diff <= 0
    ? `Sua média geral é <b>${formatarMMSS(mediaGeral)}</b>, dentro da meta de ${formatarMMSS(metaSeg)}/questão. Ritmo ok.`
    : `Sua média geral é <b>${formatarMMSS(mediaGeral)}</b>, ${formatarMMSS(diff)} acima da meta de ${formatarMMSS(metaSeg)}/questão.`;

  const porMateria = Object.keys(MATERIAS).map(nome => {
    const qs = questoes.filter(q => q.materia === nome && q.tempoSegundos > 0);
    if (!qs.length) return null;
    const media = Math.round(qs.reduce((s, q) => s + q.tempoSegundos, 0) / qs.length);
    return { nome, media, total: qs.length, cor: MATERIAS[nome].cor, acima: media > metaSeg };
  }).filter(Boolean);

  document.getElementById("ritmo-bars").innerHTML = porMateria.length
    ? porMateria.map(m => {
        const pct = Math.min(150, Math.round((m.media / metaSeg) * 100));
        return `
    <div class="mbar-row">
      <span class="mbar-label">${titleCase(m.nome)}</span>
      <div class="mbar-track"><div class="mbar-fill ${m.acima ? "mbar-lento" : ""}" style="width:${Math.min(100, pct)}%; background:${m.acima ? "var(--errei)" : m.cor}"></div></div>
      <span class="mbar-pct">${formatarMMSS(m.media)}${m.acima ? " ⚠" : ""}</span>
    </div>`;
      }).join("")
    : "";
}

document.getElementById("tempo-prova-min").addEventListener("change", (e) => {
  const val = parseInt(e.target.value, 10);
  config.tempoProvaMin = (val && val > 0) ? val : 240;
  saveConfig(config);
  renderRitmo();
});

function renderPrioridade() {
  const metaSeg = metaSegundosPorQuestao();
  const porMateria = {};
  questoes.forEach(q => {
    if (!porMateria[q.materia]) porMateria[q.materia] = { total: 0, erros: 0, tempos: [] };
    porMateria[q.materia].total++;
    if (q.status === "errei" || q.status === "chute") porMateria[q.materia].erros++;
    if (q.tempoSegundos > 0) porMateria[q.materia].tempos.push(q.tempoSegundos);
  });

  const lista = Object.entries(porMateria)
    .filter(([, d]) => d.total >= 3)
    .map(([materia, d]) => {
      const taxaErro = d.erros / d.total;
      const mediaTempo = d.tempos.length ? d.tempos.reduce((a, b) => a + b, 0) / d.tempos.length : null;
      const lentidao = mediaTempo ? Math.max(0, (mediaTempo - metaSeg) / metaSeg) : 0;
      const score = taxaErro * 0.7 + Math.min(1, lentidao) * 0.3;
      let motivo;
      if (taxaErro >= 0.4 && lentidao > 0.15) motivo = "erra bastante e ainda demora acima da meta — prioridade máxima";
      else if (taxaErro >= 0.4) motivo = "erra bastante, mas o tempo tá ok — foco em teoria";
      else if (lentidao > 0.15) motivo = "acerta razoável, mas devagar — foco em ritmo/atalhos";
      else motivo = "sob controle";
      return { materia, taxaErro, mediaTempo, score, motivo, total: d.total };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const el = document.getElementById("prioridade-lista");
  el.innerHTML = lista.length
    ? lista.map(m => `
      <div class="rank-row">
        <div class="rname">${titleCase(m.materia)}
          <small>${m.total} questões · ${Math.round(m.taxaErro * 100)}% erro${m.mediaTempo ? " · média " + formatarMMSS(Math.round(m.mediaTempo)) : " · sem tempo registrado"} — ${m.motivo}</small>
        </div>
        <span class="rpct ${m.score < 0.25 ? "ok" : ""}">${Math.round(m.score * 100)}</span>
      </div>
    `).join("")
    : '<p class="empty-state">Registre pelo menos 3 questões de uma matéria (com cronômetro, se possível) pra aparecer aqui.</p>';
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
   Tempo de estudo — cronômetro de sessão + lançamento manual + edição por dia
   Guarda minutos por data (independente das questões), pra você ver
   quantos dias estudou e quanto tempo, e poder corrigir um dia se precisar.
   ========================================================================== */
let estudoSegundos = 0;
let estudoRodando = false;
let estudoIntervalo = null;

function formatarHM(totalMinutos) {
  const h = Math.floor(totalMinutos / 60);
  const m = Math.round(totalMinutos % 60);
  if (h === 0) return `${m}min`;
  return `${h}h${m > 0 ? " " + m + "min" : ""}`;
}
function renderTimerEstudoDisplay() {
  document.getElementById("timer-display-estudo").textContent = formatarMMSS(estudoSegundos);
}
document.getElementById("btn-estudo-timer-toggle").addEventListener("click", () => {
  estudoRodando = !estudoRodando;
  const btn = document.getElementById("btn-estudo-timer-toggle");
  if (estudoRodando) {
    btn.textContent = "⏸ Pausar";
    estudoIntervalo = setInterval(() => {
      estudoSegundos++;
      renderTimerEstudoDisplay();
    }, 1000);
  } else {
    btn.textContent = "▶ Iniciar";
    clearInterval(estudoIntervalo);
    // ao pausar, lança o tempo dessa sessão no dia de hoje e zera o cronômetro
    const minutos = Math.round(estudoSegundos / 60);
    if (minutos > 0) {
      adicionarMinutosEstudo(hojeISO(), minutos);
      renderTempoEstudo();
    }
    estudoSegundos = 0;
    renderTimerEstudoDisplay();
  }
});
document.getElementById("btn-estudo-timer-zerar").addEventListener("click", () => {
  if (estudoRodando && estudoSegundos > 10 && !confirm("Descartar o tempo da sessão atual sem salvar?")) return;
  estudoSegundos = 0;
  estudoRodando = false;
  clearInterval(estudoIntervalo);
  document.getElementById("btn-estudo-timer-toggle").textContent = "▶ Iniciar";
  renderTimerEstudoDisplay();
});

document.getElementById("tempo-estudo-data").valueAsDate = new Date();
document.getElementById("btn-tempo-estudo-add").addEventListener("click", () => {
  const data = document.getElementById("tempo-estudo-data").value || hojeISO();
  const min = parseInt(document.getElementById("tempo-estudo-min").value, 10);
  if (!min || min <= 0) {
    alert("Informe quantos minutos você estudou.");
    return;
  }
  adicionarMinutosEstudo(data, min);
  document.getElementById("tempo-estudo-min").value = "";
  renderTempoEstudo();
});

function calcularStreakTempo() {
  const dias = Object.keys(tempoEstudo).filter(d => tempoEstudo[d] > 0);
  if (!dias.length) return 0;
  const diasSet = new Set(dias);
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (diasSet.has(iso)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0 && iso === hojeISO()) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    } else {
      break;
    }
  }
  return streak;
}

function renderTempoEstudo() {
  const dias = Object.keys(tempoEstudo).filter(d => tempoEstudo[d] > 0).sort();
  const hoje = hojeISO();
  const totalMin = dias.reduce((s, d) => s + tempoEstudo[d], 0);
  const minutosHoje = tempoEstudo[hoje] || 0;

  const seteDiasAtras = somarDias(hoje, -6);
  const minutosSemana = dias.filter(d => d >= seteDiasAtras && d <= hoje).reduce((s, d) => s + tempoEstudo[d], 0);

  const resumoEl = document.getElementById("tempo-estudo-resumo");
  resumoEl.innerHTML = dias.length
    ? `Hoje: <b>${formatarHM(minutosHoje)}</b> · Esta semana: <b>${formatarHM(minutosSemana)}</b> · Total: <b>${formatarHM(totalMin)}</b> · <b>${dias.length}</b> dia${dias.length > 1 ? "s" : ""} estudado${dias.length > 1 ? "s" : ""} · sequência: <b>${calcularStreakTempo()}</b> dia${calcularStreakTempo() === 1 ? "" : "s"}`
    : "Nenhum tempo lançado ainda. Use o cronômetro acima ou lance manualmente.";

  // barras dos últimos 7 dias
  const semanaEl = document.getElementById("tempo-estudo-semana");
  const ultimos7 = [];
  for (let i = 6; i >= 0; i--) ultimos7.push(somarDias(hoje, -i));
  const maxSemana = Math.max(1, ...ultimos7.map(d => tempoEstudo[d] || 0));
  const diasSemanaLabel = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  semanaEl.innerHTML = ultimos7.map(d => {
    const min = tempoEstudo[d] || 0;
    const pct = Math.round((min / maxSemana) * 100);
    const label = diasSemanaLabel[new Date(d + "T00:00:00").getDay()];
    return `
      <div class="mbar-row">
        <span class="mbar-label">${label} · ${formatarDataBR(d)}${d === hoje ? " (hoje)" : ""}</span>
        <div class="mbar-track"><div class="mbar-fill" style="width:${pct}%; background:var(--acertei)"></div></div>
        <span class="mbar-pct">${min ? formatarHM(min) : "—"}</span>
      </div>`;
  }).join("");

  // lista editável de todos os dias com lançamento
  const listaEl = document.getElementById("tempo-estudo-dias");
  const recentes = [...dias].reverse().slice(0, 20);
  listaEl.innerHTML = recentes.length
    ? recentes.map(d => `
      <div class="rank-row" data-data="${d}">
        <div class="rname">${formatarDataBR(d)}${d === hoje ? " · hoje" : ""}</div>
        <span class="rpct ok">${formatarHM(tempoEstudo[d])}</span>
        <button type="button" class="btn-duplicar" data-action="editar-tempo" style="margin-left:8px;">Editar</button>
        <button type="button" class="btn-duplicar" data-action="excluir-tempo" style="margin-left:6px; color:var(--errei); background:var(--errei-bg);">Excluir</button>
      </div>`).join("")
    : "";
}
document.getElementById("tempo-estudo-dias").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const row = e.target.closest("[data-data]");
  const data = row.dataset.data;
  if (btn.dataset.action === "editar-tempo") {
    const atual = tempoEstudo[data] || 0;
    const novo = prompt(`Editar minutos estudados em ${formatarDataBR(data)}:`, atual);
    if (novo === null) return;
    const min = parseInt(novo, 10);
    if (isNaN(min) || min < 0) { alert("Digite um número válido de minutos."); return; }
    if (min === 0) delete tempoEstudo[data]; else tempoEstudo[data] = min;
    saveTempoEstudo(tempoEstudo);
    renderTempoEstudo();
  }
  if (btn.dataset.action === "excluir-tempo") {
    if (confirm(`Excluir o registro de ${formatarDataBR(data)}?`)) {
      delete tempoEstudo[data];
      saveTempoEstudo(tempoEstudo);
      renderTempoEstudo();
    }
  }
});

/* ==========================================================================
   Revisão
   ========================================================================== */
function filtrarQuestoesRevisao() {
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
  return lista;
}

function renderRevisao() {
  const lista = filtrarQuestoesRevisao();

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
      ${bizusHtml(q)}
      ${q.imagemTipo === "upload" ? `<img class="thumb-mini thumb-rev" src="${q.imagem}" data-action="ver-imagem" alt="Print da questão" title="Ver ampliada">` : (q.imagemTipo === "link" ? `<a class="chip chip-imagem" href="${escapeHtml(q.imagem)}" target="_blank" rel="noopener">🔗 imagem</a>` : "")}
      ${q.motivoCategoria ? `<span class="rev-motivo"><b>${escapeHtml(MOTIVO_LABEL[q.motivoCategoria] || q.motivoCategoria)}</b>${q.motivo ? " — " + escapeHtml(q.motivo) : ""}</span>` : (q.motivo ? `<span class="rev-motivo">${escapeHtml(q.motivo)}</span>` : "")}

      ${(q.enunciado || q.explicacao || q.gabarito || q.textoBase) ? `
      <details class="rev-conteudo">
        <summary>Ver questão completa</summary>
        <div class="rev-conteudo-body">
          ${q.textoBase ? `<details class="rc-texto-base"><summary><span class="rc-label">Texto de apoio</span> (clique pra abrir)</summary><p>${escapeHtml(q.textoBase)}</p></details>` : ""}
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
        <button data-action="duplicar" title="Criar variação a partir desta questão">➕ Nova variação</button>
        <button data-action="bizu" title="Salvar o macete dessa questão pra revisar depois">📌 Criar bizu</button>
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
  const img = e.target.closest('[data-action="ver-imagem"]');
  if (img) { abrirLightbox(img.src); return; }

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
  if (btn.dataset.action === "duplicar") {
    duplicarComoVariacao(id);
  }
  if (btn.dataset.action === "bizu") {
    abrirFormBizuAPartirDe(q);
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
   Modo de prática — responder as questões direto pelo software
   Usa exatamente o mesmo filtro (matéria / origem / status) que está
   selecionado na aba Revisão no momento em que você clica em "Praticar".
   ========================================================================== */
let sessaoPratica = [];
let sessaoIndex = 0;
let sessaoStats = { acertos: 0, erros: 0 };

let overlayModoAtual = "questoes";

document.getElementById("btn-iniciar-pratica").addEventListener("click", () => {
  sessaoPratica = filtrarQuestoesRevisao();
  if (!sessaoPratica.length) {
    alert("Nenhuma questão com esse filtro pra praticar. Ajuste a matéria/status ali em cima.");
    return;
  }
  overlayModoAtual = "questoes";
  sessaoIndex = 0;
  sessaoStats = { acertos: 0, erros: 0 };
  document.getElementById("pratica-overlay").classList.add("aberta");
  renderQuestaoPratica();
});

document.getElementById("btn-pratica-sair").addEventListener("click", () => {
  if (overlayModoAtual === "bizus") fecharPraticaBizus();
  else fecharPratica();
});

function fecharPratica() {
  document.getElementById("pratica-overlay").classList.remove("aberta");
  saveData(questoes);
  renderRevisao();
  renderDashboard();
  renderRecentes();
}

function atualizarPlacarPratica() {
  const feitas = sessaoStats.acertos + sessaoStats.erros;
  const pct = feitas ? Math.round((sessaoStats.acertos / feitas) * 100) : 0;
  document.getElementById("pratica-placar").textContent =
    feitas ? `✓ ${sessaoStats.acertos} · ✕ ${sessaoStats.erros} · ${pct}%` : "";
}

function renderQuestaoPratica() {
  const body = document.getElementById("pratica-body");
  const progresso = document.getElementById("pratica-progresso");
  atualizarPlacarPratica();

  if (sessaoIndex >= sessaoPratica.length) {
    const feitas = sessaoStats.acertos + sessaoStats.erros;
    const pct = feitas ? Math.round((sessaoStats.acertos / feitas) * 100) : 0;
    progresso.textContent = "Concluído";
    body.innerHTML = `
      <div class="pratica-fim">
        <h3>Sessão concluída 🎯</h3>
        <p>${sessaoStats.acertos} acertos · ${sessaoStats.erros} erros de ${sessaoPratica.length} questões — ${pct}% de aproveitamento</p>
        <button type="button" class="btn-primary" id="btn-pratica-fechar" style="width:auto; padding:12px 26px;">Fechar</button>
      </div>`;
    document.getElementById("btn-pratica-fechar").addEventListener("click", fecharPratica);
    return;
  }

  const q = sessaoPratica[sessaoIndex];
  progresso.textContent = `${sessaoIndex + 1} / ${sessaoPratica.length}`;
  const temQuiz = temAlternativas(q.alternativas) && q.gabarito;

  body.innerHTML = `
    <div class="pratica-meta">${titleCase(q.materia)}${q.assunto ? " · " + escapeHtml(q.assunto) : ""}${q.grupo ? " · 👪 " + escapeHtml(q.grupo) : ""}</div>
    ${q.textoBase ? `<details class="rc-texto-base"><summary>Texto de apoio (clique pra abrir)</summary><p>${escapeHtml(q.textoBase)}</p></details>` : ""}
    <p class="pratica-enunciado">${escapeHtml(q.enunciado || q.assunto || "Sem enunciado registrado — avalie de memória.")}</p>
    ${bizusRelacionados(q).length ? `<details class="bizu-pratica-details"><summary>📌 Ver bizu${bizusRelacionados(q).length > 1 ? "s" : ""} salvo${bizusRelacionados(q).length > 1 ? "s" : ""} desse assunto</summary>${bizusHtml(q)}</details>` : ""}
    ${temQuiz ? `
      <div class="pratica-alternativas" id="pratica-alternativas">
        ${["A", "B", "C", "D", "E"].filter(l => q.alternativas[l]).map(l => `
          <button type="button" class="pratica-alt" data-letra="${l}">${l}) ${escapeHtml(q.alternativas[l])}</button>
        `).join("")}
      </div>
      <div class="pratica-resultado" id="pratica-resultado" hidden></div>
    ` : `
      <p class="field-hint">Essa questão não tem alternativas + gabarito completos registrados — avalie você mesmo:</p>
      <div class="status-picker" id="pratica-status-picker">
        <button type="button" class="bubble bubble-acertei" data-status="acertei"><span class="bubble-mark">✓</span><span>Acertei</span></button>
        <button type="button" class="bubble bubble-errei" data-status="errei"><span class="bubble-mark">✕</span><span>Errei</span></button>
        <button type="button" class="bubble bubble-duvida" data-status="duvida"><span class="bubble-mark">?</span><span>Dúvida</span></button>
        <button type="button" class="bubble bubble-chute" data-status="chute"><span class="bubble-mark">⚄</span><span>Chute</span></button>
      </div>
      ${q.explicacao ? `<div class="rc-explicacao pratica-resultado" id="pratica-resultado" hidden><span class="rc-label">Explicação / bizu</span>${escapeHtml(q.explicacao)}</div>` : `<div id="pratica-resultado" hidden></div>`}
    `}
    <div class="pratica-nav" id="pratica-nav" hidden>
      <button type="button" class="btn-secondary" id="btn-pratica-proxima">${sessaoIndex + 1 < sessaoPratica.length ? "Próxima →" : "Ver resultado →"}</button>
    </div>
  `;

  if (temQuiz) {
    document.querySelectorAll(".pratica-alt").forEach(btn => {
      btn.addEventListener("click", () => responderPratica(q, btn.dataset.letra));
    });
  } else {
    document.querySelectorAll("#pratica-status-picker .bubble").forEach(btn => {
      btn.addEventListener("click", () => registrarStatusPratica(q, btn.dataset.status));
    });
  }

  const navBtn = document.getElementById("pratica-nav");
  navBtn.addEventListener("click", (e) => {
    if (e.target.closest("#btn-pratica-proxima")) {
      sessaoIndex++;
      renderQuestaoPratica();
    }
  });
}

function responderPratica(q, letra) {
  document.querySelectorAll(".pratica-alt").forEach(b => {
    b.disabled = true;
    if (b.dataset.letra === q.gabarito) b.classList.add("correta");
    if (b.dataset.letra === letra && letra !== q.gabarito) b.classList.add("errada");
  });
  const acertou = letra === q.gabarito;
  q.respostaMarcada = letra;
  q.status = acertou ? "acertei" : "errei";
  if (acertou) sessaoStats.acertos++; else sessaoStats.erros++;
  saveData(questoes);

  const resultadoEl = document.getElementById("pratica-resultado");
  resultadoEl.hidden = false;
  resultadoEl.innerHTML = `
    <p class="${acertou ? "pratica-ok" : "pratica-errou"}">${acertou ? "✓ Você acertou!" : "✕ Você errou. Gabarito: " + q.gabarito}</p>
    ${q.explicacao ? `<div class="rc-explicacao"><span class="rc-label">Explicação / bizu</span>${escapeHtml(q.explicacao)}</div>` : ""}
  `;
  document.getElementById("pratica-nav").hidden = false;
  atualizarPlacarPratica();
}

function registrarStatusPratica(q, status) {
  q.status = status;
  if (status === "acertei") sessaoStats.acertos++;
  else if (status === "errei") sessaoStats.erros++;
  saveData(questoes);

  document.querySelectorAll("#pratica-status-picker .bubble").forEach(b => {
    b.disabled = true;
    b.style.pointerEvents = "none";
    b.classList.toggle("selected", b.dataset.status === status);
  });
  const resultadoEl = document.getElementById("pratica-resultado");
  if (resultadoEl) resultadoEl.hidden = false;
  document.getElementById("pratica-nav").hidden = false;
  atualizarPlacarPratica();
}

function bizusRelacionados(q) {
  if (!q || !q.materia) return [];
  const assuntoQ = (q.assunto || "").trim().toLowerCase();
  return bizus.filter(b => b.materia === q.materia &&
    (!b.assunto || b.assunto.trim().toLowerCase() === assuntoQ));
}
function bizusHtml(q) {
  const relacionados = bizusRelacionados(q);
  if (!relacionados.length) return "";
  return `
    <div class="bizu-relacionado-box">
      <span class="rc-label">📌 Bizu${relacionados.length > 1 ? "s" : ""} salvo${relacionados.length > 1 ? "s" : ""} pra isso</span>
      ${relacionados.map(b => `
        <div class="bizu-mini">
          <b>${escapeHtml(b.titulo)}</b>
          ${b.texto ? `<p>${escapeHtml(b.texto)}</p>` : ""}
          ${b.imagemTipo === "upload" ? `<img class="thumb-mini thumb-rev" src="${b.imagem}" data-action="ver-imagem" alt="Print do bizu" title="Ver ampliada">` : (b.imagemTipo === "link" ? `<a class="chip chip-imagem" href="${escapeHtml(b.imagem)}" target="_blank" rel="noopener">🔗 imagem</a>` : "")}
        </div>
      `).join("")}
    </div>`;
}

/* ==========================================================================
   Bizus / macetes — banco de mnemônicos e prints por matéria
   Pensado pra matérias tipo inglês, onde o problema não é achar a questão
   de novo, e sim lembrar da regra/armadilha na hora da prova.
   ========================================================================== */
let imagemAtualBizu = "";
const elBizuDropzone = document.getElementById("bizu-imagem-dropzone");
const elBizuDropzoneVazia = document.getElementById("bizu-imagem-dropzone-empty");
const elBizuPreviewWrap = document.getElementById("bizu-imagem-preview-wrap");
const elBizuPreview = document.getElementById("bizu-imagem-preview");
const elBizuImagemLink = document.getElementById("bizu-imagem-link");

function processarArquivoImagemBizu(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maxLargura = 1000;
      const escala = Math.min(1, maxLargura / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      imagemAtualBizu = canvas.toDataURL("image/jpeg", 0.75);
      mostrarPreviewImagemBizu(imagemAtualBizu);
      elBizuImagemLink.value = "";
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
function mostrarPreviewImagemBizu(src) {
  elBizuPreview.src = src;
  elBizuDropzoneVazia.hidden = true;
  elBizuPreviewWrap.hidden = false;
}
function limparImagemBizu() {
  imagemAtualBizu = "";
  elBizuPreview.src = "";
  elBizuDropzoneVazia.hidden = false;
  elBizuPreviewWrap.hidden = true;
}
elBizuDropzone.addEventListener("paste", (e) => {
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (const item of items) {
    if (item.type && item.type.startsWith("image/")) {
      processarArquivoImagemBizu(item.getAsFile());
      e.preventDefault();
      break;
    }
  }
});
elBizuDropzone.addEventListener("click", () => elBizuDropzone.focus());
elBizuDropzone.addEventListener("dragover", (e) => { e.preventDefault(); elBizuDropzone.classList.add("dragover"); });
elBizuDropzone.addEventListener("dragleave", () => elBizuDropzone.classList.remove("dragover"));
elBizuDropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  elBizuDropzone.classList.remove("dragover");
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) processarArquivoImagemBizu(file);
});
document.getElementById("btn-bizu-remover-imagem").addEventListener("click", limparImagemBizu);
elBizuImagemLink.addEventListener("input", () => {
  if (elBizuImagemLink.value.trim()) limparImagemBizu();
});

function limparFormBizu() {
  bizuEditandoId = null;
  document.getElementById("form-bizu").reset();
  document.getElementById("bizu-form-titulo").textContent = "Novo bizu / macete";
  document.getElementById("btn-bizu-salvar").textContent = "Salvar bizu";
  document.getElementById("btn-bizu-cancelar-edicao").hidden = true;
  limparImagemBizu();
}

document.getElementById("form-bizu").addEventListener("submit", (e) => {
  e.preventDefault();
  const materia = document.getElementById("bizu-materia").value;
  const titulo = document.getElementById("bizu-titulo").value.trim();
  if (!materia || !titulo) {
    alert("Escolha a matéria e escreva um título curto pro bizu.");
    return;
  }
  const dados = {
    materia,
    assunto: document.getElementById("bizu-assunto").value.trim(),
    titulo,
    texto: document.getElementById("bizu-texto").value.trim(),
    imagem: imagemAtualBizu || elBizuImagemLink.value.trim(),
    imagemTipo: imagemAtualBizu ? "upload" : (elBizuImagemLink.value.trim() ? "link" : "")
  };

  if (bizuEditandoId) {
    const alvo = bizus.find(b => b.id === bizuEditandoId);
    Object.assign(alvo, dados);
  } else {
    bizus.push({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
      ...dados,
      criadoEm: Date.now(),
      vezesRevisado: 0
    });
  }
  saveBizus(bizus);
  limparFormBizu();
  renderBizus();
});

document.getElementById("btn-bizu-cancelar-edicao").addEventListener("click", limparFormBizu);

function abrirFormBizuAPartirDe(q) {
  document.querySelector('.tab[data-tab="bizus"]').click();
  limparFormBizu();
  document.getElementById("bizu-materia").value = q.materia;
  atualizarListaAssuntosBizu(q.materia);
  document.getElementById("bizu-assunto").value = q.assunto || "";
  document.getElementById("bizu-titulo").value = q.assunto || titleCase(q.materia);
  document.getElementById("bizu-texto").value = q.explicacao || q.motivo || "";
  if (q.imagem) {
    if (q.imagemTipo === "upload") {
      imagemAtualBizu = q.imagem;
      mostrarPreviewImagemBizu(q.imagem);
    } else if (q.imagemTipo === "link") {
      elBizuImagemLink.value = q.imagem;
    }
  }
  document.getElementById("bizu-titulo").focus();
}

function editarBizu(id) {
  const b = bizus.find(x => x.id === id);
  if (!b) return;
  bizuEditandoId = id;
  document.getElementById("bizu-materia").value = b.materia;
  atualizarListaAssuntosBizu(b.materia);
  document.getElementById("bizu-assunto").value = b.assunto || "";
  document.getElementById("bizu-titulo").value = b.titulo;
  document.getElementById("bizu-texto").value = b.texto || "";
  limparImagemBizu();
  if (b.imagem) {
    if (b.imagemTipo === "upload") { imagemAtualBizu = b.imagem; mostrarPreviewImagemBizu(b.imagem); }
    else if (b.imagemTipo === "link") { elBizuImagemLink.value = b.imagem; }
  }
  document.getElementById("bizu-form-titulo").textContent = "Editar bizu";
  document.getElementById("btn-bizu-salvar").textContent = "Salvar alterações";
  document.getElementById("btn-bizu-cancelar-edicao").hidden = false;
  document.getElementById("bizu-titulo").scrollIntoView({ behavior: "smooth", block: "center" });
}

function renderBizus() {
  const filtro = document.getElementById("bizu-filtro-materia").value;
  const container = document.getElementById("lista-bizus");
  const vazio = document.getElementById("bizus-vazio");
  const lista = bizus.filter(b => !filtro || b.materia === filtro)
    .sort((a, b) => (a.materia + a.titulo).localeCompare(b.materia + b.titulo));

  if (!lista.length) {
    container.innerHTML = "";
    vazio.hidden = false;
    return;
  }
  vazio.hidden = true;

  container.innerHTML = lista.map(b => `
    <div class="rev-card" data-id="${b.id}">
      <div class="rev-top">
        <div class="rev-top-left">
          <span class="chip">${titleCase(b.materia)}</span>
        </div>
        ${b.vezesRevisado ? `<span class="rev-meta">revisado ${b.vezesRevisado}x</span>` : ""}
      </div>
      <span class="rev-assunto">${escapeHtml(b.titulo)}</span>
      ${b.assunto ? `<span class="chip chip-grupo">${escapeHtml(b.assunto)}</span>` : ""}
      ${b.texto ? `<p style="margin:8px 2px; font-size:13.5px; color:var(--text); line-height:1.5; white-space:pre-wrap;">${escapeHtml(b.texto)}</p>` : ""}
      ${b.imagemTipo === "upload" ? `<img class="thumb-mini thumb-rev" src="${b.imagem}" data-action="ver-imagem" alt="Print do bizu" title="Ver ampliada">` : (b.imagemTipo === "link" ? `<a class="chip chip-imagem" href="${escapeHtml(b.imagem)}" target="_blank" rel="noopener">🔗 imagem</a>` : "")}
      <div class="rev-actions">
        <button data-action="editar">Editar</button>
        <button data-action="excluir">Excluir</button>
      </div>
    </div>
  `).join("");
}
document.getElementById("bizu-filtro-materia").addEventListener("change", renderBizus);

document.getElementById("lista-bizus").addEventListener("click", (e) => {
  const img = e.target.closest('[data-action="ver-imagem"]');
  if (img) { abrirLightbox(img.src); return; }
  const btn = e.target.closest("button");
  if (!btn) return;
  const card = e.target.closest(".rev-card");
  const id = card.dataset.id;

  if (btn.dataset.action === "editar") editarBizu(id);
  if (btn.dataset.action === "excluir") {
    if (confirm("Excluir esse bizu? Não dá pra desfazer.")) {
      bizus = bizus.filter(b => b.id !== id);
      saveBizus(bizus);
      renderBizus();
    }
  }
});

/* ---- Revisão rápida dos bizus (modo flashcard, usa o mesmo overlay da prática) ---- */
let sessaoBizus = [];
let sessaoBizuIndex = 0;
let sessaoBizuRevelado = false;

document.getElementById("btn-revisar-bizus").addEventListener("click", () => {
  const filtro = document.getElementById("bizu-filtro-materia").value;
  sessaoBizus = bizus.filter(b => !filtro || b.materia === filtro);
  if (!sessaoBizus.length) {
    alert("Nenhum bizu salvo com esse filtro ainda.");
    return;
  }
  // embaralha pra não decorar a ordem
  sessaoBizus = [...sessaoBizus].sort(() => Math.random() - 0.5);
  overlayModoAtual = "bizus";
  sessaoBizuIndex = 0;
  sessaoBizuRevelado = false;
  document.getElementById("pratica-overlay").classList.add("aberta");
  renderBizuPratica();
});

function renderBizuPratica() {
  const body = document.getElementById("pratica-body");
  const progresso = document.getElementById("pratica-progresso");
  document.getElementById("pratica-placar").textContent = "";

  if (sessaoBizuIndex >= sessaoBizus.length) {
    progresso.textContent = "Concluído";
    body.innerHTML = `
      <div class="pratica-fim">
        <h3>Revisão concluída 📌</h3>
        <p>Você passou pelos ${sessaoBizus.length} bizus desse filtro.</p>
        <button type="button" class="btn-primary" id="btn-bizu-pratica-fechar" style="width:auto; padding:12px 26px;">Fechar</button>
      </div>`;
    document.getElementById("btn-bizu-pratica-fechar").addEventListener("click", fecharPraticaBizus);
    return;
  }

  const b = sessaoBizus[sessaoBizuIndex];
  progresso.textContent = `${sessaoBizuIndex + 1} / ${sessaoBizus.length}`;
  sessaoBizuRevelado = false;

  body.innerHTML = `
    <div class="pratica-meta">${titleCase(b.materia)}${b.assunto ? " · " + escapeHtml(b.assunto) : ""}</div>
    <p class="pratica-enunciado">${escapeHtml(b.titulo)}</p>
    <div id="bizu-pratica-conteudo" hidden>
      ${b.texto ? `<div class="rc-explicacao"><span class="rc-label">Macete</span>${escapeHtml(b.texto)}</div>` : ""}
      ${b.imagemTipo === "upload" ? `<img class="thumb-rev" style="width:100%; height:auto; max-height:320px; object-fit:contain; margin-top:10px;" src="${b.imagem}" alt="Print do bizu">` : (b.imagemTipo === "link" ? `<p style="margin-top:10px;"><a href="${escapeHtml(b.imagem)}" target="_blank" rel="noopener">🔗 ver imagem</a></p>` : "")}
      ${!b.texto && !b.imagem ? '<p class="empty-state">Sem detalhes salvos além do título.</p>' : ""}
    </div>
    <div class="pratica-nav">
      <button type="button" class="btn-secondary" id="btn-bizu-revelar">Mostrar macete</button>
      <button type="button" class="btn-secondary" id="btn-bizu-proximo" hidden>${sessaoBizuIndex + 1 < sessaoBizus.length ? "Próximo →" : "Ver fim →"}</button>
    </div>
  `;

  document.getElementById("btn-bizu-revelar").addEventListener("click", () => {
    document.getElementById("bizu-pratica-conteudo").hidden = false;
    document.getElementById("btn-bizu-revelar").hidden = true;
    document.getElementById("btn-bizu-proximo").hidden = false;
    b.vezesRevisado = (b.vezesRevisado || 0) + 1;
    saveBizus(bizus);
  });
  document.getElementById("btn-bizu-proximo").addEventListener("click", () => {
    sessaoBizuIndex++;
    renderBizuPratica();
  });
}

function fecharPraticaBizus() {
  document.getElementById("pratica-overlay").classList.remove("aberta");
  renderBizus();
}

/* ==========================================================================
   Backup: exportar / importar
   ========================================================================== */
document.getElementById("btn-exportar").addEventListener("click", () => {
  const backup = { questoes, bizus, tempoEstudo, config, cadernoPaginas };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
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
      const bruto = JSON.parse(reader.result);
      // aceita tanto o formato novo ({questoes, bizus, tempoEstudo}) quanto o antigo (array puro de questões)
      const dadosQuestoes = Array.isArray(bruto) ? bruto : (bruto.questoes || []);
      const dadosBizus = Array.isArray(bruto) ? [] : (bruto.bizus || []);
      const dadosTempo = Array.isArray(bruto) ? {} : (bruto.tempoEstudo || {});
      const dadosCaderno = Array.isArray(bruto) ? [] : (bruto.cadernoPaginas || []);
      if (!Array.isArray(dadosQuestoes)) throw new Error("Formato inválido");

      const normalizados = dadosQuestoes.map(q => ({ origem: "prova", grupo: "", volatil: false, alternativas: {}, imagem: "", imagemTipo: "", ...q }));
      const substituir = confirm(
        "Importar vai SOMAR estas questões, bizus e tempo de estudo aos que já existem aqui.\n\nOK = somar aos dados atuais\nCancelar = substituir tudo pelos dados do arquivo"
      );
      questoes = substituir ? questoes.concat(normalizados) : normalizados;
      bizus = substituir ? bizus.concat(dadosBizus) : dadosBizus;
      cadernoPaginas = substituir ? cadernoPaginas.concat(dadosCaderno) : dadosCaderno;
      saveCaderno(cadernoPaginas);
      if (substituir) {
        Object.entries(dadosTempo).forEach(([data, min]) => adicionarMinutosEstudo(data, min));
      } else {
        tempoEstudo = dadosTempo;
        saveTempoEstudo(tempoEstudo);
      }
      saveData(questoes);
      saveBizus(bizus);
      renderRecentes();
      renderDashboard();
      renderRevisao();
      renderBizus();
      renderCadernoLista();
      alert("Backup importado com sucesso.");
    } catch (err) {
      alert("Não consegui ler esse arquivo. Confira se é um backup exportado por aqui.");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

document.getElementById("btn-limpar").addEventListener("click", () => {
  if (questoes.length === 0 && bizus.length === 0 && Object.keys(tempoEstudo).length === 0 && cadernoPaginas.length === 0) {
    alert("Já não há nada registrado.");
    return;
  }
  const confirmar1 = confirm(
    `Isso vai apagar TODAS as ${questoes.length} questões, ${bizus.length} bizus, ${cadernoPaginas.length} folhas do caderno e o tempo de estudo salvos neste navegador.\n\nRecomendado: clique em "Exportar backup" antes, caso queira guardar algo.\n\nContinuar e apagar tudo?`
  );
  if (!confirmar1) return;
  const confirmar2 = confirm("Tem certeza mesmo? Essa ação não pode ser desfeita.");
  if (!confirmar2) return;
  questoes = [];
  bizus = [];
  tempoEstudo = {};
  cadernoPaginas = [];
  cadernoPaginaAtualId = null;
  saveData(questoes);
  saveBizus(bizus);
  saveTempoEstudo(tempoEstudo);
  saveCaderno(cadernoPaginas);
  renderRecentes();
  renderDashboard();
  renderRevisao();
  renderBizus();
  renderCadernoLista();
  alert("Pronto, tudo limpo. Pode começar a registrar do zero.");
});

/* ==========================================================================
   Caderno virtual — folhas livres pra colar texto, grifar e anotar
   ========================================================================== */
const elCadernoLista = document.getElementById("caderno-lista");
const elCadernoListaVazio = document.getElementById("caderno-lista-vazio");
const elCadernoEditor = document.getElementById("caderno-editor");
const elCadernoSemSelecao = document.getElementById("caderno-sem-selecao");
const elCadernoTitulo = document.getElementById("caderno-titulo");
const elCadernoMateria = document.getElementById("caderno-materia");
const elCadernoArea = document.getElementById("caderno-area");
const elCadernoSalvo = document.getElementById("caderno-salvo");

function paginaAtual() {
  return cadernoPaginas.find(p => p.id === cadernoPaginaAtualId) || null;
}

function renderCadernoLista() {
  const filtro = document.getElementById("caderno-filtro-materia").value;
  const ordenadas = [...cadernoPaginas]
    .filter(p => !filtro || p.materia === filtro)
    .sort((a, b) => b.atualizadoEm - a.atualizadoEm);

  elCadernoListaVazio.hidden = cadernoPaginas.length > 0;
  elCadernoLista.innerHTML = ordenadas.map(p => {
    const cor = p.materia && MATERIAS[p.materia] ? MATERIAS[p.materia].cor : "var(--text-faint)";
    const textoPlano = (p.html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return `
      <div class="caderno-item ${p.id === cadernoPaginaAtualId ? "selecionada" : ""}" data-id="${p.id}">
        <div class="caderno-item-top">
          <span class="caderno-item-dot" style="background:${cor}"></span>
          <span class="caderno-item-titulo">${escapeHtml(p.titulo || "Sem título")}</span>
        </div>
        <div class="caderno-item-preview">${escapeHtml(textoPlano || "(folha em branco)")}</div>
        <div class="caderno-item-data">${new Date(p.atualizadoEm).toLocaleDateString("pt-BR")}</div>
      </div>`;
  }).join("");

  if (cadernoPaginaAtualId && !cadernoPaginas.some(p => p.id === cadernoPaginaAtualId)) {
    cadernoPaginaAtualId = null;
  }
  if (!cadernoPaginaAtualId) {
    elCadernoEditor.hidden = true;
    elCadernoSemSelecao.hidden = false;
  }
}

function abrirPaginaCaderno(id) {
  cadernoPaginaAtualId = id;
  const p = paginaAtual();
  if (!p) return;
  elCadernoSemSelecao.hidden = true;
  elCadernoEditor.hidden = false;
  elCadernoTitulo.value = p.titulo || "";
  elCadernoMateria.value = p.materia || "";
  elCadernoArea.innerHTML = p.html || "";
  elCadernoSalvo.textContent = "";
  renderCadernoLista();
}

document.getElementById("btn-caderno-nova").addEventListener("click", () => {
  const pagina = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
    titulo: "",
    materia: "",
    html: "",
    criadoEm: Date.now(),
    atualizadoEm: Date.now()
  };
  cadernoPaginas.push(pagina);
  saveCaderno(cadernoPaginas);
  abrirPaginaCaderno(pagina.id);
  elCadernoTitulo.focus();
});

document.getElementById("caderno-filtro-materia").addEventListener("change", renderCadernoLista);

elCadernoLista.addEventListener("click", (e) => {
  const item = e.target.closest(".caderno-item");
  if (!item) return;
  abrirPaginaCaderno(item.dataset.id);
});

function salvarPaginaAtual() {
  const p = paginaAtual();
  if (!p) return;
  p.titulo = elCadernoTitulo.value.trim();
  p.materia = elCadernoMateria.value;
  p.html = elCadernoArea.innerHTML;
  p.atualizadoEm = Date.now();
  saveCaderno(cadernoPaginas);
  elCadernoSalvo.textContent = "Salvo ✓ " + new Date(p.atualizadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
let cadernoSalvarTimeout = null;
function salvarPaginaAtualDebounced() {
  clearTimeout(cadernoSalvarTimeout);
  cadernoSalvarTimeout = setTimeout(salvarPaginaAtual, 500);
}

elCadernoTitulo.addEventListener("input", () => {
  salvarPaginaAtualDebounced();
  renderCadernoLista();
});
elCadernoMateria.addEventListener("change", () => {
  salvarPaginaAtual();
  renderCadernoLista();
});
elCadernoArea.addEventListener("input", () => {
  salvarPaginaAtualDebounced();
});

// cola só o texto puro, sem trazer formatação/estilo de fora — fica livre
// pra grifar do jeito que quiser dentro do caderno
elCadernoArea.addEventListener("paste", (e) => {
  e.preventDefault();
  const texto = (e.clipboardData || window.clipboardData).getData("text/plain");
  document.execCommand("insertText", false, texto);
});

document.getElementById("btn-caderno-excluir").addEventListener("click", () => {
  const p = paginaAtual();
  if (!p) return;
  if (!confirm(`Excluir a folha "${p.titulo || "sem título"}"? Essa ação não pode ser desfeita.`)) return;
  cadernoPaginas = cadernoPaginas.filter(x => x.id !== p.id);
  saveCaderno(cadernoPaginas);
  cadernoPaginaAtualId = null;
  renderCadernoLista();
});

// ferramentas de grifo/formatação — agem sobre o trecho selecionado no caderno
function aplicarNoCaderno(comando, valor) {
  elCadernoArea.focus();
  document.execCommand(comando, false, valor);
  salvarPaginaAtualDebounced();
}
document.getElementById("caderno-marcadores").addEventListener("click", (e) => {
  const swatch = e.target.closest(".caderno-swatch");
  if (swatch) aplicarNoCaderno("hiliteColor", swatch.dataset.marca);
});
document.getElementById("btn-caderno-sem-grifo").addEventListener("click", () => aplicarNoCaderno("hiliteColor", "transparent"));
document.getElementById("btn-caderno-bold").addEventListener("click", () => aplicarNoCaderno("bold"));
document.getElementById("btn-caderno-italic").addEventListener("click", () => aplicarNoCaderno("italic"));
document.getElementById("btn-caderno-underline").addEventListener("click", () => aplicarNoCaderno("underline"));
document.getElementById("btn-caderno-limpar").addEventListener("click", () => aplicarNoCaderno("removeFormat"));

/* ==========================================================================
   Boot
   ========================================================================== */
popularMaterias();
atualizarListaAplicacoes();
renderRecentes();
renderDashboard();
renderBizus();
renderCadernoLista();
renderTimerEstudoDisplay();
