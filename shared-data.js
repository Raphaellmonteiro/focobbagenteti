// shared-data.js
// Dados usados tanto no dashboard (app.js) quanto no Banco de Questões (banco-questoes.js).
// Fica num arquivo só pra matéria/tópico do edital nunca ficar dessincronizado entre as duas páginas.

const SUBJECT_MAP = {
    ti: 'Tecnologia da Informação',
    portugues: 'Língua Portuguesa',
    matematica: 'Matemática & Estatística',
    bancarios: 'Conhecimentos Bancários',
    ingles: 'Língua Inglesa',
    atualidades: 'Atualidades Financeiras'
};

const SUBJECT_ICONS = {
    ti: '💻',
    portugues: '📖',
    matematica: '📐',
    bancarios: '🏦',
    ingles: '🇬🇧',
    atualidades: '📰'
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
