// shared-storage.js
// As duas páginas (dashboard e Banco de Questões) salvam no MESMO objeto do localStorage,
// cada uma cuidando só dos seus campos. Por isso o save aqui é sempre um MERGE (lê o que
// já existe, atualiza só as chaves passadas, escreve de volta) — nunca um "substituir tudo",
// senão uma página apagaria os dados salvos pela outra.
const SHARED_STORAGE_KEY = 'bb_study_state_v5';

function loadSharedState() {
    try {
        const raw = localStorage.getItem(SHARED_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        console.warn('Não foi possível ler o estado salvo, iniciando vazio.', e);
        return {};
    }
}

function saveSharedState(partialUpdates) {
    const current = loadSharedState();
    const merged = Object.assign({}, current, partialUpdates);
    localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(merged));
}
