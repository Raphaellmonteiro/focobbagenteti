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
// Português, Inglês, Matemática, Atualidades, Estatística e Bancários seguem o SUMÁRIO OFICIAL
// da apostila (Nova Concursos, 2021) que você enviou — inclui a página onde cada capítulo começa,
// pra você saber exatamente onde ler no seu material. TI não está impressa nessa apostila (vem
// como curso em vídeo à parte no material original), então segue os itens do edital.
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
        'Compreensão de Textos — p. 11',
        'Ortografia Oficial — p. 14',
        'Classe e Emprego de Palavras — p. 16',
        'Emprego do Acento Indicativo de Crase — p. 33',
        'Sintaxe da Oração e do Período — p. 35',
        'Emprego dos Sinais de Pontuação — p. 46',
        'Concordância Verbal e Nominal — p. 49',
        'Regência Verbal e Nominal — p. 54',
        'Colocação Pronominal (próclise, mesóclise, ênclise) — p. 56'
    ],
    matematica: [
        'Números Inteiros, Racionais, Reais e Contagem — p. 121',
        'Sistema Legal de Medidas — p. 127',
        'Razões, Proporções, Regra de Três e Porcentagem — p. 128',
        'Lógica Proposicional — p. 138',
        'Noções de Conjuntos — p. 144',
        'Relações e Funções (Polinomiais, Exponenciais, Logarítmicas) — p. 149',
        'Matrizes — p. 166',
        'Determinantes — p. 169',
        'Sistemas Lineares — p. 172',
        'Sequências — p. 176',
        'Progressões Aritméticas e Geométricas — p. 178',
        'Representação Tabular e Gráfica — p. 193',
        'Medidas de Tendência Central (média, mediana, moda) — p. 193',
        'Dispersão (amplitude, variância, desvio padrão) — p. 196',
        'Variáveis Aleatórias e Distribuição de Probabilidade — p. 206',
        'Teorema de Bayes — p. 207',
        'Probabilidade Condicional — p. 210',
        'Variância e Covariância — p. 213',
        'Correlação Linear Simples — p. 214',
        'Distribuição Binomial e Normal — p. 220',
        'Amostragem e Inferência Estatística — p. 222'
    ],
    bancarios: [
        'Políticas Econômicas — p. 240',
        'Sistema Financeiro Nacional — p. 246',
        'Instituições Financeiras — p. 255',
        'Mercado de Crédito (operações ativas e garantias) — p. 261',
        'Produtos e Serviços Bancários — p. 273',
        'Mercado de Capitais — p. 287',
        'Mercado de Câmbio — p. 298',
        'Lavagem de Dinheiro/Capitais e Legislações — p. 302',
        'Autorregulação Bancária — p. 311',
        'Lei Complementar 105/2001 (Sigilo Bancário) — p. 312',
        'LGPD — Lei nº 13.709/2018 — p. 315',
        'Legislação Anticorrupção — p. 321',
        'Segurança Cibernética — Resolução nº 4.658/2018 — p. 330',
        'Ética Aplicada (ética empresarial e profissional) — p. 334',
        'Código de Ética e Resp. Socioambiental do BB (on-line) — p. 339'
    ],
    ingles: [
        'Vocabulário Fundamental p/ Compreensão de Textos — p. 87',
        'Aspectos Gramaticais Básicos p/ Compreensão de Textos — p. 94'
    ],
    atualidades: [
        'Internet Banking / Banco Digital — p. 186',
        'Mobile Banking — p. 186',
        'Open Banking e Novos Modelos de Negócio — p. 186',
        'Segmentação e Interações Digitais — p. 187',
        'Arranjos de Pagamentos — p. 189',
        'PIX — Pagamentos Instantâneos — p. 190'
    ]
};
