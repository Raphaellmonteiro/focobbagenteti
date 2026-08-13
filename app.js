/* ==========================================================================
   Matérias — edital BB Agente Comercial / Cesgranrio
   ========================================================================== */
const MATERIAS = {
  "LÍNGUA PORTUGUESA": "#2E5C8A",
  "LÍNGUA INGLESA": "#A8761F",
  "MATEMÁTICA": "#3A7D67",
  "ATUALIDADES DO MERCADO FINANCEIRO": "#B23A2E",
  "MATEMÁTICA FINANCEIRA": "#6B4C9A",
  "CONHECIMENTOS BANCÁRIOS": "#1E2A26",
  "CONHECIMENTOS DE INFORMÁTICA": "#2E5C8A",
  "VENDAS E NEGOCIAÇÃO": "#A8761F"
};

const STORAGE_KEY = "molde_questoes_v1";
const STORAGE_KEY_TEMPO = "molde_tempo_v1";
const STORAGE_KEY_CADERNO = "gabarito_caderno_v1"; // mesma chave do app antigo -> import direto

const STATUS_LABEL = { acertei: "Acertei", errei: "Errei", duvida: "Dúvida", chute: "Chute" };
const TIPO_LABEL = { original: "Original", variacao_a: "Variação A", variacao_b: "Variação B", variacao_c: "Variação C" };
const MOTIVO_LABEL = {
  nao_sabia: "(a) Não sabia o conteúdo",
  interpretei_mal: "(b) Interpretei mal o enunciado",
  pegadinha_comando: "(c) Caí na pegadinha do comando"
};

/* ==========================================================================
   Persistência
   ========================================================================== */
function loadData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function loadTempo() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY_TEMPO)) || {}; } catch { return {}; } }
function saveTempo(d) { localStorage.setItem(STORAGE_KEY_TEMPO, JSON.stringify(d)); }
function loadCaderno() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY_CADERNO)) || []; } catch { return []; } }
function saveCaderno(d) { localStorage.setItem(STORAGE_KEY_CADERNO, JSON.stringify(d)); }

let questoes = loadData();
let tempoEstudo = loadTempo(); // { "2026-08-12": minutos }
let cadernos = loadCaderno();

/* ==========================================================================
   Util
   ========================================================================== */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function hojeISO() { return new Date().toISOString().slice(0, 10); }
function escapeHtml(s) { return (s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function somarDias(iso, n) { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function formatarDataBR(iso) { const [y, m, d] = iso.split("-"); return `${d}/${m}`; }

/* ==========================================================================
   Setup selects / datalists
   ========================================================================== */
function popularSelectMaterias(sel, comTodas) {
  sel.innerHTML = "";
  if (comTodas) sel.innerHTML += `<option value="">Todas as matérias</option>`;
  Object.keys(MATERIAS).forEach(nome => sel.innerHTML += `<option value="${nome}">${nome}</option>`);
}
popularSelectMaterias(document.getElementById("materia"), false);
popularSelectMaterias(document.getElementById("filtro-materia"), true);
popularSelectMaterias(document.getElementById("caderno-filtro-materia"), true);
popularSelectMaterias(document.getElementById("caderno-materia"), false);
document.getElementById("caderno-materia").insertAdjacentHTML("afterbegin", `<option value="">Geral / livre</option>`);

function atualizarDatalists() {
  const grupos = [...new Set(questoes.map(q => q.grupo).filter(Boolean))];
  document.getElementById("grupo-list").innerHTML = grupos.map(g => `<option value="${escapeHtml(g)}">`).join("");
  const padroes = [...new Set(questoes.map(q => q.padrao).filter(Boolean))];
  document.getElementById("padrao-list").innerHTML = padroes.map(p => `<option value="${escapeHtml(p)}">`).join("");
}

/* ==========================================================================
   Tabs
   ========================================================================== */
document.getElementById("tabs").addEventListener("click", e => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
  if (btn.dataset.tab === "painel") renderPainel();
  if (btn.dataset.tab === "revisao") renderRevisao();
});

/* ==========================================================================
   Colar do PDF -> separar alternativas
   ========================================================================== */
document.getElementById("btn-colar-separar").addEventListener("click", () => {
  const bruto = document.getElementById("colar-bruto").value;
  const linhas = bruto.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const marcador = /^[\(\[]?([A-E])[\)\].\-–:]\s*/;
  let letras = { A: "", B: "", C: "", D: "", E: "" };
  let atual = null;
  let sobras = [];
  linhas.forEach(l => {
    const m = l.match(marcador);
    if (m) { atual = m[1]; letras[atual] = l.replace(marcador, "").trim(); }
    else if (atual) { letras[atual] += " " + l; }
    else sobras.push(l);
  });
  let achou = 0;
  ["a", "b", "c", "d", "e"].forEach((let_, i) => {
    const L = "ABCDE"[i];
    if (letras[L]) { document.getElementById("alt-" + let_).value = letras[L]; achou++; }
  });
  if (sobras.length) document.getElementById("enunciado").value = sobras.join(" ");
  document.getElementById("colar-pdf-status").textContent = achou ? `${achou} alternativas separadas` : "Não encontrei o padrão A) B) C)...";
});

/* ==========================================================================
   Status picker
   ========================================================================== */
let statusAtual = "";
document.getElementById("status-picker").addEventListener("click", e => {
  const b = e.target.closest(".bubble");
  if (!b) return;
  selecionarStatus(b.dataset.status);
});
function selecionarStatus(s) {
  statusAtual = s;
  document.querySelectorAll(".bubble").forEach(b => b.classList.toggle("active", b.dataset.status === s));
  document.getElementById("motivo-field").hidden = (s === "acertei" || s === "");
}
document.addEventListener("keydown", e => {
  if (!document.getElementById("panel-registrar").classList.contains("active")) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
  if (e.key === "1") selecionarStatus("acertei");
  if (e.key === "2") selecionarStatus("errei");
  if (e.key === "3") selecionarStatus("duvida");
  if (e.key === "4") selecionarStatus("chute");
});

/* ==========================================================================
   Contador de família
   ========================================================================== */
document.getElementById("grupo").addEventListener("input", atualizarContadorGrupo);
function atualizarContadorGrupo() {
  const g = document.getElementById("grupo").value.trim();
  const el = document.getElementById("grupo-contador");
  if (!g) { el.textContent = ""; return; }
  const n = questoes.filter(q => q.grupo === g).length;
  el.textContent = `${n} questão(ões) já nessa família`;
}

/* ==========================================================================
   Salvar questão
   ========================================================================== */
document.getElementById("form-questao").addEventListener("submit", e => {
  e.preventDefault();
  if (!statusAtual) { alert("Marca como você foi na questão (Acertei / Errei / Dúvida / Chute)."); return; }
  const q = {
    id: uid(),
    data: hojeISO(),
    materia: document.getElementById("materia").value,
    tipo: document.getElementById("tipo").value,
    grupo: document.getElementById("grupo").value.trim(),
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
    status: statusAtual,
    motivo: document.getElementById("motivo-categoria").value,
    padrao: document.getElementById("padrao").value.trim(),
    volatil: document.getElementById("volatil").checked
  };
  questoes.unshift(q);
  saveData(questoes);

  // reset parcial — mantém matéria, tipo e grupo pra próxima variação
  const materia = document.getElementById("materia").value;
  const tipo = document.getElementById("tipo").value;
  const grupo = document.getElementById("grupo").value;
  e.target.reset();
  document.getElementById("materia").value = materia;
  document.getElementById("tipo").value = tipo;
  document.getElementById("grupo").value = grupo;
  selecionarStatus("");
  atualizarContadorGrupo();
  atualizarDatalists();
  renderRecentes();
});

function renderRecentes() {
  const wrap = document.getElementById("lista-recentes");
  const lista = questoes.slice(0, 8);
  if (!lista.length) { wrap.innerHTML = `<p class="empty-state">Nenhuma questão registrada ainda.</p>`; return; }
  wrap.innerHTML = lista.map(q => `
    <div class="item-recente">
      <div class="item-recente-topo">
        <span class="item-materia" style="color:${MATERIAS[q.materia] || "#333"}">${q.materia}</span>
        <span class="stamp stamp-${q.status}">${STATUS_LABEL[q.status]}</span>
      </div>
      <div class="item-recente-topo" style="margin-top:4px;">
        <span class="item-tipo">${TIPO_LABEL[q.tipo]}${q.grupo ? " · " + escapeHtml(q.grupo) : ""}</span>
        <span class="item-tipo">${formatarDataBR(q.data)}</span>
      </div>
      ${q.padrao ? `<div class="item-padrao">${escapeHtml(q.padrao)}</div>` : ""}
      ${q.volatil ? `<p class="item-volatil">⚠ conteúdo pode ter mudado — confirme em fonte oficial</p>` : ""}
    </div>
  `).join("");
}
renderRecentes();
atualizarDatalists();

/* ==========================================================================
   Painel
   ========================================================================== */
function renderPainel() {
  const total = questoes.length;
  const acertos = questoes.filter(q => q.status === "acertei").length;
  document.getElementById("stat-acerto-geral").textContent = total ? Math.round(acertos / total * 100) + "%" : "—";
  document.getElementById("stat-total-questoes").textContent = `${total} questõe${total === 1 ? "" : "s"}`;

  // streak
  const dias = [...new Set(questoes.map(q => q.data))].sort().reverse();
  let streak = 0, cursor = hojeISO();
  if (dias.includes(cursor) || dias.includes(somarDias(cursor, -1))) {
    if (!dias.includes(cursor)) cursor = somarDias(cursor, -1);
    while (dias.includes(cursor)) { streak++; cursor = somarDias(cursor, -1); }
  }
  document.getElementById("streak-numero").textContent = `${streak} dia${streak === 1 ? "" : "s"}`;

  // por matéria
  const barsWrap = document.getElementById("materias-bars");
  const porMateria = Object.keys(MATERIAS).map(nome => {
    const qs = questoes.filter(q => q.materia === nome);
    const ac = qs.filter(q => q.status === "acertei").length;
    return { nome, total: qs.length, taxa: qs.length ? Math.round(ac / qs.length * 100) : null, cor: MATERIAS[nome] };
  }).filter(m => m.total > 0).sort((a, b) => (a.taxa ?? 100) - (b.taxa ?? 100));
  barsWrap.innerHTML = porMateria.length ? porMateria.map(m => `
    <div class="materia-bar-row">
      <span>${m.nome} <span style="color:var(--ink-faint)">(${m.total})</span></span>
      <div class="materia-bar-track"><div class="materia-bar-fill" style="width:${m.taxa}%;background:${m.cor}"></div></div>
      <span style="text-align:right;font-family:var(--font-mono)">${m.taxa}%</span>
    </div>`).join("") : `<p class="empty-state">Registre questões pra ver o desempenho por matéria.</p>`;

  // padrões da banca — cross-matéria
  const mapaPadroes = {};
  questoes.filter(q => q.padrao).forEach(q => {
    const chave = q.padrao.trim().toLowerCase();
    if (!mapaPadroes[chave]) mapaPadroes[chave] = { texto: q.padrao.trim(), count: 0, materias: new Set() };
    mapaPadroes[chave].count++;
    mapaPadroes[chave].materias.add(q.materia);
  });
  const padroesOrdenados = Object.values(mapaPadroes).sort((a, b) => b.count - a.count).slice(0, 12);
  document.getElementById("padroes-lista").innerHTML = padroesOrdenados.map(p => `
    <div class="ranking-item">
      <span>${escapeHtml(p.texto)}<br><span class="ranking-item-tags">${[...p.materias].join(" · ")}</span></span>
      <span class="ranking-item-count">${p.count}×</span>
    </div>`).join("");
  document.getElementById("padroes-vazio").hidden = padroesOrdenados.length > 0;

  // famílias
  const mapaFamilias = {};
  questoes.filter(q => q.grupo).forEach(q => {
    if (!mapaFamilias[q.grupo]) mapaFamilias[q.grupo] = { materia: q.materia, tipos: new Set() };
    mapaFamilias[q.grupo].tipos.add(q.tipo);
  });
  const familiasArr = Object.entries(mapaFamilias).sort((a, b) => b[1].tipos.size - a[1].tipos.size);
  document.getElementById("familias-lista").innerHTML = familiasArr.length ? familiasArr.map(([grupo, f]) => `
    <div class="familia-row">
      <span>${escapeHtml(grupo)} <span class="ranking-item-tags">— ${f.materia}</span></span>
      <div class="familia-dots">
        ${["original", "variacao_a", "variacao_b", "variacao_c"].map(t => `<span class="familia-dot ${f.tipos.has(t) ? "on" : ""}"></span>`).join("")}
      </div>
    </div>`).join("") : `<p class="empty-state">Nenhuma família iniciada. Preencha o campo "Família" ao registrar.</p>`;

  renderTempoEstudo();
}

/* ==========================================================================
   Tempo de estudo
   ========================================================================== */
let cronRodando = false, cronInicio = null, cronInterval = null;
document.getElementById("btn-estudo-timer-toggle").addEventListener("click", () => {
  if (!cronRodando) {
    cronRodando = true; cronInicio = Date.now();
    document.getElementById("btn-estudo-timer-toggle").textContent = "⏸ Pausar";
    cronInterval = setInterval(() => {
      const s = Math.floor((Date.now() - cronInicio) / 1000);
      document.getElementById("timer-display-estudo").textContent = formatarMMSS(s);
    }, 1000);
  } else {
    cronRodando = false;
    clearInterval(cronInterval);
    document.getElementById("btn-estudo-timer-toggle").textContent = "▶ Iniciar";
    const min = Math.round((Date.now() - cronInicio) / 60000);
    if (min > 0) { tempoEstudo[hojeISO()] = (tempoEstudo[hojeISO()] || 0) + min; saveTempo(tempoEstudo); }
    document.getElementById("timer-display-estudo").textContent = "00:00";
    renderTempoEstudo();
  }
});
function formatarMMSS(total) { const m = Math.floor(total / 60), s = total % 60; return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`; }

document.getElementById("tempo-estudo-data").value = hojeISO();
document.getElementById("btn-tempo-estudo-add").addEventListener("click", () => {
  const data = document.getElementById("tempo-estudo-data").value || hojeISO();
  const raw = document.getElementById("tempo-estudo-min").value.trim();
  let min = 0;
  if (/^\d+:\d{2}(:\d{2})?$/.test(raw)) {
    const partes = raw.split(":").map(Number);
    min = partes.length === 3 ? partes[0] * 60 + partes[1] + Math.round(partes[2] / 60) : partes[0] + Math.round(partes[1] / 60);
  } else if (/^\d+$/.test(raw)) { min = parseInt(raw, 10); }
  if (!min) return;
  tempoEstudo[data] = (tempoEstudo[data] || 0) + min;
  saveTempo(tempoEstudo);
  document.getElementById("tempo-estudo-min").value = "";
  renderTempoEstudo();
});

function renderTempoEstudo() {
  const hoje = tempoEstudo[hojeISO()] || 0;
  const semanaIni = somarDias(hojeISO(), -6);
  let semana = 0, total = 0;
  Object.entries(tempoEstudo).forEach(([d, m]) => { total += m; if (d >= semanaIni) semana += m; });
  const fmt = m => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${m}min`;
  document.getElementById("tempo-estudo-resumo").textContent = `Hoje: ${fmt(hoje)} · Semana: ${fmt(semana)} · Total: ${fmt(total)}`;
}
renderTempoEstudo();

/* ==========================================================================
   Revisão + Prática
   ========================================================================== */
function filtrarRevisao() {
  const materia = document.getElementById("filtro-materia").value;
  const status = document.getElementById("filtro-status").value;
  return questoes.filter(q => {
    if (materia && q.materia !== materia) return false;
    if (status) return q.status === status;
    return q.status === "errei" || q.status === "duvida";
  });
}
["filtro-materia", "filtro-status"].forEach(id => document.getElementById(id).addEventListener("change", renderRevisao));

function renderRevisao() {
  const lista = filtrarRevisao();
  const wrap = document.getElementById("lista-revisao");
  document.getElementById("revisao-vazio").hidden = lista.length > 0;
  document.getElementById("revisao-badge").hidden = true;
  const badgeN = questoes.filter(q => q.status === "errei" || q.status === "duvida").length;
  if (badgeN) { document.getElementById("revisao-badge").hidden = false; document.getElementById("revisao-badge").textContent = badgeN; }

  wrap.innerHTML = lista.map(q => `
    <div class="item-revisao">
      <div class="item-revisao-topo">
        <span class="item-materia" style="color:${MATERIAS[q.materia] || "#333"}">${q.materia}</span>
        <span class="stamp stamp-${q.status}">${STATUS_LABEL[q.status]}</span>
      </div>
      <div class="item-recente-topo" style="margin-top:4px;">
        <span class="item-tipo">${TIPO_LABEL[q.tipo]}${q.grupo ? " · " + escapeHtml(q.grupo) : ""}</span>
        <span class="item-tipo">${formatarDataBR(q.data)}</span>
      </div>
      ${q.enunciado ? `<p class="item-enunciado">${escapeHtml(q.enunciado)}</p>` : ""}
      ${q.motivo ? `<p class="item-enunciado"><b>${MOTIVO_LABEL[q.motivo]}</b></p>` : ""}
      ${q.padrao ? `<div class="item-padrao">${escapeHtml(q.padrao)}</div>` : ""}
      ${q.gabarito ? `<p class="item-tipo">Sua resposta: ${q.respostaMarcada || "—"} · Gabarito: ${q.gabarito}</p>` : ""}
    </div>`).join("");
}

let praticaLista = [], praticaIdx = 0, praticaAcertos = 0;
document.getElementById("btn-iniciar-pratica").addEventListener("click", () => {
  praticaLista = filtrarRevisao().filter(q => q.gabarito && (q.alternativas.A || q.alternativas.B));
  if (!praticaLista.length) { alert("Nenhuma questão com alternativas + gabarito nesse filtro."); return; }
  praticaIdx = 0; praticaAcertos = 0;
  document.getElementById("pratica-overlay").classList.add("open");
  renderQuestaoPratica();
});
document.getElementById("btn-pratica-sair").addEventListener("click", () => document.getElementById("pratica-overlay").classList.remove("open"));

function renderQuestaoPratica() {
  const q = praticaLista[praticaIdx];
  document.getElementById("pratica-progresso").textContent = `${praticaIdx + 1} / ${praticaLista.length}`;
  document.getElementById("pratica-placar").textContent = `${praticaAcertos} acertos`;
  const body = document.getElementById("pratica-body");
  body.innerHTML = `
    <p style="font-size:11px;color:var(--ink-faint);text-transform:uppercase;font-weight:700;">${q.materia}</p>
    <p style="margin-bottom:16px;">${escapeHtml(q.enunciado || "(sem enunciado)")}</p>
    <div id="pratica-alts"></div>
    <div id="pratica-explicacao" style="margin-top:14px;"></div>
  `;
  const altsWrap = document.getElementById("pratica-alts");
  "ABCDE".split("").forEach(letra => {
    if (!q.alternativas[letra]) return;
    const btn = document.createElement("button");
    btn.className = "pratica-alt-btn";
    btn.textContent = `${letra}) ${q.alternativas[letra]}`;
    btn.addEventListener("click", () => responderPratica(q, letra));
    altsWrap.appendChild(btn);
  });
}
function responderPratica(q, letra) {
  document.querySelectorAll(".pratica-alt-btn").forEach(b => b.disabled = true);
  document.querySelectorAll(".pratica-alt-btn").forEach((b, i) => {
    const l = "ABCDE"[i];
    if (l === q.gabarito) b.classList.add("correta");
    else if (l === letra) b.classList.add("errada");
  });
  if (letra === q.gabarito) praticaAcertos++;
  document.getElementById("pratica-explicacao").innerHTML = q.padrao ? `<div class="item-padrao">${escapeHtml(q.padrao)}</div>` : "";
  const nextBtn = document.createElement("button");
  nextBtn.className = "btn-primary"; nextBtn.style.marginTop = "14px";
  nextBtn.textContent = praticaIdx + 1 < praticaLista.length ? "Próxima →" : "Finalizar";
  nextBtn.onclick = () => {
    if (praticaIdx + 1 < praticaLista.length) { praticaIdx++; renderQuestaoPratica(); }
    else document.getElementById("pratica-overlay").classList.remove("open");
  };
  document.getElementById("pratica-explicacao").appendChild(nextBtn);
}

/* ==========================================================================
   Caderno
   ========================================================================== */
let cadernoAtualId = null;

function renderCadernoLista() {
  const filtro = document.getElementById("caderno-filtro-materia").value;
  const wrap = document.getElementById("caderno-lista");
  const lista = cadernos.filter(c => !filtro || c.materia === filtro).sort((a, b) => (b.atualizadoEm || 0) - (a.atualizadoEm || 0));
  document.getElementById("caderno-lista-vazio").hidden = lista.length > 0;
  wrap.innerHTML = lista.map(c => `
    <div class="caderno-item ${c.id === cadernoAtualId ? "active" : ""}" data-id="${c.id}">
      <div class="caderno-item-titulo">${escapeHtml(c.titulo || "(sem título)")}</div>
      <div class="caderno-item-materia">${c.materia || "Geral"}</div>
    </div>`).join("");
  wrap.querySelectorAll(".caderno-item").forEach(el => el.addEventListener("click", () => abrirCaderno(el.dataset.id)));
}

document.getElementById("caderno-filtro-materia").addEventListener("change", renderCadernoLista);

document.getElementById("btn-caderno-nova").addEventListener("click", () => {
  const c = { id: uid(), titulo: "Nova folha", materia: "", conteudo: "", atualizadoEm: Date.now() };
  cadernos.unshift(c); saveCaderno(cadernos);
  renderCadernoLista(); abrirCaderno(c.id);
});

function abrirCaderno(id) {
  cadernoAtualId = id;
  const c = cadernos.find(x => x.id === id);
  document.getElementById("caderno-sem-selecao").hidden = true;
  document.getElementById("caderno-editor").hidden = false;
  document.getElementById("caderno-titulo").value = c.titulo || "";
  document.getElementById("caderno-materia").value = c.materia || "";
  document.getElementById("caderno-area").innerHTML = c.conteudo || "";
  renderCadernoLista();
}

function salvarCadernoAtual() {
  const c = cadernos.find(x => x.id === cadernoAtualId);
  if (!c) return;
  c.titulo = document.getElementById("caderno-titulo").value;
  c.materia = document.getElementById("caderno-materia").value;
  c.conteudo = document.getElementById("caderno-area").innerHTML;
  c.atualizadoEm = Date.now();
  saveCaderno(cadernos);
  document.getElementById("caderno-salvo").textContent = "Salvo " + new Date().toLocaleTimeString("pt-BR").slice(0, 5);
  renderCadernoLista();
}
let salvarTimeout;
function agendarSalvar() { clearTimeout(salvarTimeout); salvarTimeout = setTimeout(salvarCadernoAtual, 500); }
["input", "change"].forEach(ev => {
  document.getElementById("caderno-titulo").addEventListener(ev, agendarSalvar);
  document.getElementById("caderno-materia").addEventListener(ev, agendarSalvar);
  document.getElementById("caderno-area").addEventListener(ev, agendarSalvar);
});

document.getElementById("btn-caderno-excluir").addEventListener("click", () => {
  if (!cadernoAtualId || !confirm("Excluir essa folha?")) return;
  cadernos = cadernos.filter(c => c.id !== cadernoAtualId);
  saveCaderno(cadernos);
  cadernoAtualId = null;
  document.getElementById("caderno-editor").hidden = true;
  document.getElementById("caderno-sem-selecao").hidden = false;
  renderCadernoLista();
});

document.querySelectorAll(".caderno-swatch").forEach(sw => {
  sw.addEventListener("click", () => document.execCommand("hiliteColor", false, sw.dataset.marca));
});
document.getElementById("btn-caderno-sem-grifo").addEventListener("click", () => document.execCommand("hiliteColor", false, "transparent"));
document.getElementById("btn-caderno-bold").addEventListener("click", () => document.execCommand("bold"));
document.getElementById("btn-caderno-italic").addEventListener("click", () => document.execCommand("italic"));
document.getElementById("btn-caderno-underline").addEventListener("click", () => document.execCommand("underline"));

let leituraIdx = 0, leituraLista = [];
document.getElementById("btn-caderno-leitura").addEventListener("click", () => {
  const filtro = document.getElementById("caderno-filtro-materia").value;
  leituraLista = cadernos.filter(c => !filtro || c.materia === filtro);
  if (!leituraLista.length) { alert("Nenhuma folha pra mostrar."); return; }
  leituraIdx = 0;
  document.getElementById("leitura-overlay").classList.add("open");
  renderLeitura();
});
document.getElementById("btn-leitura-fechar").addEventListener("click", () => document.getElementById("leitura-overlay").classList.remove("open"));
document.getElementById("btn-leitura-anterior").addEventListener("click", () => { if (leituraIdx > 0) { leituraIdx--; renderLeitura(); } });
document.getElementById("btn-leitura-proxima").addEventListener("click", () => { if (leituraIdx < leituraLista.length - 1) { leituraIdx++; renderLeitura(); } });
function renderLeitura() {
  const c = leituraLista[leituraIdx];
  document.getElementById("leitura-titulo").textContent = c.titulo;
  document.getElementById("leitura-conteudo").innerHTML = c.conteudo;
  document.getElementById("leitura-contador").textContent = `${leituraIdx + 1} / ${leituraLista.length}`;
}
document.getElementById("btn-leitura-imprimir").addEventListener("click", () => {
  const area = document.getElementById("caderno-print-area");
  area.innerHTML = leituraLista.map(c => `<div style="page-break-after:always;padding:30px;"><h2>${escapeHtml(c.titulo)}</h2>${c.conteudo}</div>`).join("");
  window.print();
});

/* ==========================================================================
   Backup
   ========================================================================== */
document.getElementById("btn-exportar").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ questoes, tempoEstudo, cadernos }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `molde-backup-${hojeISO()}.json`;
  a.click();
});
document.getElementById("input-importar").addEventListener("change", e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (Array.isArray(data.questoes)) { questoes = data.questoes; saveData(questoes); }
      if (data.tempoEstudo) { tempoEstudo = data.tempoEstudo; saveTempo(tempoEstudo); }
      if (Array.isArray(data.cadernos)) { cadernos = data.cadernos; saveCaderno(cadernos); }
      alert("Backup importado.");
      renderRecentes(); atualizarDatalists(); renderCadernoLista(); renderPainel();
    } catch { alert("Arquivo inválido."); }
  };
  reader.readAsText(file);
});
document.getElementById("btn-limpar").addEventListener("click", () => {
  if (!confirm("Isso apaga TODAS as questões e tempo de estudo (o caderno fica intacto). Confirma?")) return;
  questoes = []; saveData(questoes);
  tempoEstudo = {}; saveTempo(tempoEstudo);
  renderRecentes(); atualizarDatalists(); renderPainel();
});

/* ==========================================================================
   Init
   ========================================================================== */
renderCadernoLista();
