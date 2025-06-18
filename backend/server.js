// backend/server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3001;
const DB_PATH = './db.json';
const JWT_SECRET = 'sua-chave-secreta-super-segura-e-longa'; // Em produção, use uma variável de ambiente!

// --- Funções de DB (com suporte para 'users') ---
const readDB = () => {
    try {
        if (!fs.existsSync(DB_PATH)) {
            const initialData = { users: [], teams: [], settings: { group_stage_rounds: [], knockout_rounds: {} } };
            fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        parsed.users = parsed.users || [];
        parsed.teams = parsed.teams || [];
        parsed.settings = parsed.settings || { group_stage_rounds: [], knockout_rounds: {} };
        parsed.settings.group_stage_rounds = parsed.settings.group_stage_rounds || [];
        parsed.settings.knockout_rounds = parsed.settings.knockout_rounds || {};
        return parsed;
    } catch (error) {
        console.error("Erro crítico ao ler db.json, a retornar a um estado seguro:", error);
        return { users: [], teams: [], settings: { group_stage_rounds: [], knockout_rounds: {} } };
    }
};

const writeDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:3000', // Para desenvolvimento local
    'https://seu-frontend-url.vercel.app' // O URL que a Vercel lhe dará - adicione-o mais tarde
  ]
}));
app.use(express.json());

// =================================================================
// --- ROTAS DE AUTENTICAÇÃO ---
// =================================================================

app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' });
    }
    const db = readDB();
    if (db.users.find(u => u.username === username)) {
        return res.status(409).json({ message: 'Este nome de usuário já existe.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now().toString(), username, password: hashedPassword };
    db.users.push(newUser);
    writeDB(db);
    res.status(201).json({ message: 'Usuário registrado com sucesso!' });
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas.' });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        return res.status(401).json({ message: 'Credenciais inválidas.' });
    }
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
});

// =================================================================
// --- MIDDLEWARE DE VERIFICAÇÃO DE TOKEN ---
// =================================================================
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// =================================================================
// --- ROTAS DE ADMINISTRAÇÃO (PROTEGIDAS) ---
// =================================================================

app.post('/api/teams', verifyToken, (req, res) => {
    const db = readDB();
    const { cartola_id, nome, url_escudo, nome_cartola } = req.body;
    if (!cartola_id || !nome || !url_escudo) return res.status(400).json({ message: 'Dados incompletos do time.' });
    if (db.teams.some(team => team.cartola_id === cartola_id)) return res.status(409).json({ message: 'Este time já foi adicionado.' });
    const newTeam = { id: Date.now().toString(), cartola_id, nome, url_escudo, nome_cartola, group: null, pontuacoes: {} };
    db.teams.push(newTeam);
    writeDB(db);
    res.status(201).json(newTeam);
});

app.post('/api/teams/refresh-all', verifyToken, async (req, res) => {
    const db = readDB();
    const { teams } = db;
    if (!teams || teams.length === 0) return res.status(200).json({ message: 'Nenhum time para atualizar.' });
    try {
        const updatePromises = teams.map(async (team) => {
            try {
                const searchUrl = `https://api.cartolafc.globo.com/times?q=${encodeURIComponent(team.nome)}`;
                const response = await axios.get(searchUrl);
                const updatedData = response.data.find(foundTeam => foundTeam.time_id === team.cartola_id);
                if (updatedData) {
                    team.nome_cartola = updatedData.nome_cartola;
                    team.url_escudo = updatedData.url_escudo_png;
                    team.nome = updatedData.nome;
                }
                return team;
            } catch (error) {
                console.error(`Falha ao atualizar o time ${team.nome}. Mantendo dados antigos.`);
                return team;
            }
        });
        db.teams = await Promise.all(updatePromises);
        writeDB(db);
        res.status(200).json({ message: 'Dados dos times atualizados com sucesso.', teams: db.teams });
    } catch (error) {
        res.status(500).json({ message: 'Ocorreu um erro interno ao atualizar os dados.' });
    }
});


app.put('/api/teams/:id', verifyToken, (req, res) => {
    const db = readDB();
    const { id } = req.params;
    const { group } = req.body;
    const teamIndex = db.teams.findIndex(team => team.id === id);
    if (teamIndex === -1) return res.status(404).json({ message: 'Time não encontrado.' });
    db.teams[teamIndex].group = group;
    writeDB(db);
    res.status(200).json(db.teams[teamIndex]);
});

app.delete('/api/teams/:id', verifyToken, (req, res) => {
    const db = readDB();
    db.teams = db.teams.filter(team => team.id !== req.params.id);
    writeDB(db);
    res.status(204).send();
});

app.put('/api/settings', verifyToken, (req, res) => {
    const db = readDB();
    const { group_stage_rounds, knockout_rounds } = req.body;
    if (!db.settings) db.settings = {};
    if (group_stage_rounds !== undefined) {
        db.settings.group_stage_rounds = group_stage_rounds.filter(r => r && typeof r === 'number');
    }
    if (knockout_rounds !== undefined) {
        db.settings.knockout_rounds = knockout_rounds;
    }
    writeDB(db);
    res.status(200).json(db.settings);
});

app.post('/api/scores/refresh/group-stage', verifyToken, async (req, res) => {
    console.log("Iniciando busca de pontuações da Fase de Grupos...");
    const db = readDB();
    const { teams, settings } = db;
    const groupRounds = settings?.group_stage_rounds || [];

    if (!teams.length || !groupRounds.length) {
        return res.status(400).json({ message: "Configure times e rodadas de grupo antes de buscar." });
    }

    try {
        await fetchAndSaveScores(teams, groupRounds, db);
        res.status(200).json({ message: "Pontuações da Fase de Grupos atualizadas com sucesso!" });
    } catch (error) {
        console.error("Erro ao buscar scores da fase de grupos:", error);
        res.status(500).json({ message: "Ocorreu um erro durante a busca das pontuações." });
    }
});

app.post('/api/scores/refresh/knockout', verifyToken, async (req, res) => {
    console.log("Iniciando busca de pontuações do Mata-Mata...");
    try {
        let db = readDB();
        const koSettings = db.settings?.knockout_rounds;

        if (!koSettings || Object.keys(koSettings).length === 0) {
            return res.status(400).json({ message: "Configurações do mata-mata não definidas." });
        }
        
        const processStage = async (stageName, rounds) => {
            if (!rounds || rounds.length < 2) {
                console.log(`Rodadas para ${stageName} não configuradas. A pular.`);
                return;
            }
            const { [`${stageName}P`]: matches } = processarMataMata(db);
            const teamsInStage = matches.flatMap(m => [m.team1, m.team2]).filter(Boolean);
            
            if (teamsInStage.length > 0) {
                console.log(`Buscando scores de ${stageName}...`);
                await fetchAndSaveScores(teamsInStage, rounds, db);
                db = readDB();
            }
        };

        await processStage('oitavas', koSettings.oitavas);
        await processStage('quartas', koSettings.quartas);
        await processStage('semis', koSettings.semis);
        await processStage('final', koSettings.final);

        res.status(200).json({ message: "Busca de pontuações do mata-mata concluída com sucesso!" });
    } catch (error) {
        console.error("Erro na busca sequencial do mata-mata:", error);
        res.status(500).json({ message: "Ocorreu um erro na busca das pontuações do mata-mata." });
    }
});

// =================================================================
// --- ROTAS DE VISUALIZAÇÃO (PÚBLICAS) ---
// =================================================================

app.get('/api/search-teams', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: 'Um termo de busca é necessário.' });
    try {
        const url = `https://api.cartolafc.globo.com/times?q=${encodeURIComponent(q)}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Falha ao se comunicar com a API do Cartola.' });
    }
});

app.get('/api/teams', (req, res) => {
    res.json(readDB().teams);
});

app.get('/api/settings', (req, res) => {
    res.json(readDB().settings);
});

app.get('/api/fase-de-grupos', (req, res) => {
    const db = readDB();
    const { teams } = db;
    const groupRounds = db.settings?.group_stage_rounds || [];
    const resultados = teams.map(team => {
        const pontuacaoTotal = groupRounds.reduce((sum, rodada) => sum + (team.pontuacoes?.[`rodada_${rodada}`] || 0), 0);
        return { ...team, total: pontuacaoTotal };
    });
    res.json(resultados);
});

app.get('/api/confrontos', (req, res) => {
    const db = readDB();
    const { teams, settings } = db;
    const cartolaRounds = settings?.group_stage_rounds || [];
    const teamsByGroup = teams.reduce((acc, team) => { if (team.group) (acc[team.group] = acc[team.group] || []).push(team); return acc; }, {});
    const allMatches = [];
    for (const groupName in teamsByGroup) {
        if (teamsByGroup[groupName].length !== 4) continue;
        const [t1, t2, t3, t4] = teamsByGroup[groupName];
        const schedule = [
            { home: t1, away: t4 }, { home: t2, away: t3 }, { home: t1, away: t3 }, { home: t4, away: t2 },
            { home: t1, away: t2 }, { home: t3, away: t4 }, { home: t4, away: t1 }, { home: t3, away: t2 },
            { home: t3, away: t1 }, { home: t2, away: t4 }, { home: t2, away: t1 }, { home: t4, away: t3 },
        ];
        schedule.forEach((match, index) => {
            const leagueRound = Math.floor(index / 2) + 1;
            const cartolaRound = cartolaRounds[leagueRound - 1];
            allMatches.push({
                id: `${groupName}-r${leagueRound}-${match.home.id}-vs-${match.away.id}`, league_round: leagueRound,
                cartola_round: cartolaRound || 'A Definir', group: groupName,
                home_team: { ...match.home, score: cartolaRound ? match.home.pontuacoes?.[`rodada_${cartolaRound}`] || 0 : 0 },
                away_team: { ...match.away, score: cartolaRound ? match.away.pontuacoes?.[`rodada_${cartolaRound}`] || 0 : 0 },
            });
        });
    }
    res.json(allMatches);
});

app.get('/api/image-proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('URL da imagem é obrigatória');
    }
    try {
        const decodedUrl = decodeURIComponent(url);
        const response = await axios({
            method: 'get',
            url: decodedUrl,
            responseType: 'stream',
        });
        res.setHeader('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
    } catch (error) {
        console.error(`Erro no proxy de imagem para a URL: ${decodeURIComponent(url)}`, error.message);
        res.status(502).send('Falha ao buscar a imagem do servidor de origem.');
    }
});

app.get('/api/mata-mata', (req, res) => {
    const { oitavasP, quartasP, semisP, finalP, vFinal } = processarMataMata(readDB());
    res.json({
        oitavas: oitavasP, quartas: quartasP, semis: semisP,
        final: finalP, campeao: vFinal[0] || null,
    });
});

app.get('/api/mata-mata-confrontos', (req, res) => {
    const { oitavasP, quartasP, semisP, finalP } = processarMataMata(readDB());
    const responseData = {};
    if (oitavasP.some(m => m.team1 && m.team2)) responseData['Oitavas de Final'] = oitavasP;
    if (quartasP.some(m => m.team1 && m.team2)) responseData['Quartas de Final'] = quartasP;
    if (semisP.some(m => m.team1 && m.team2)) responseData['Semifinais'] = semisP;
    if (finalP.some(m => m.team1 && m.team2)) responseData['Final'] = finalP;
    res.json(responseData);
});


// =================================================================
// --- FUNÇÕES AUXILIARES ---
// =================================================================

const PONTUACAO_URL = 'https://api.cartolafc.globo.com/time/id/{time_id}/{rodada}';

async function getPontuacaoDaRodada(cartolaId, rodada) {
    if (!rodada || typeof rodada !== 'number') return 0;
    const url = PONTUACAO_URL.replace('{time_id}', cartolaId).replace('{rodada}', rodada);
    try {
        const response = await axios.get(url, { timeout: 5000 });
        return (response.data?.pontos !== undefined) ? response.data.pontos : 0;
    } catch (error) {
        console.error(`ERRO ao buscar URL: ${url}. Status: ${error.response?.status}. Retornando 0.`);
        return 0;
    }
}

async function fetchAndSaveScores(teamsToFetch, rounds, dbInstance) {
    const validRounds = rounds.filter(r => r && typeof r === 'number');
    if (!teamsToFetch || !teamsToFetch.length || !validRounds.length) {
        return;
    }

    for (const team of teamsToFetch) {
        const dbTeam = dbInstance.teams.find(t => t.id === team.id);
        if (!dbTeam) continue;

        if (!dbTeam.pontuacoes) dbTeam.pontuacoes = {};
        for (const rodada of validRounds) {
            console.log(`Buscando: Time ${dbTeam.nome}, Rodada ${rodada}`);
            await new Promise(resolve => setTimeout(resolve, 300));
            const pontos = await getPontuacaoDaRodada(dbTeam.cartola_id, rodada);
            dbTeam.pontuacoes[`rodada_${rodada}`] = pontos;
        }
    }
    writeDB(dbInstance);
}

function processarMataMata(db) {
    const { teams, settings } = db;
    const groupRounds = settings?.group_stage_rounds || [];
    const teamsWithTotals = teams.map(team => ({ ...team, total: groupRounds.reduce((sum, r) => sum + (team.pontuacoes?.[`rodada_${r}`] || 0), 0) }));
    const teamsByGroup = teamsWithTotals.reduce((acc, team) => { if (team.group) (acc[team.group] = acc[team.group] || []).push(team); return acc; }, {});
    for (const group in teamsByGroup) { teamsByGroup[group].sort((a, b) => b.total - a.total); }

    const oitavas = [
        { id: 'O1', team1: teamsByGroup['A']?.[0], team2: teamsByGroup['B']?.[1] }, { id: 'O2', team1: teamsByGroup['C']?.[0], team2: teamsByGroup['D']?.[1] },
        { id: 'O3', team1: teamsByGroup['E']?.[0], team2: teamsByGroup['F']?.[1] }, { id: 'O4', team1: teamsByGroup['G']?.[0], team2: teamsByGroup['H']?.[1] },
        { id: 'O5', team1: teamsByGroup['B']?.[0], team2: teamsByGroup['A']?.[1] }, { id: 'O6', team1: teamsByGroup['D']?.[0], team2: teamsByGroup['C']?.[1] },
        { id: 'O7', team1: teamsByGroup['F']?.[0], team2: teamsByGroup['E']?.[1] }, { id: 'O8', team1: teamsByGroup['H']?.[0], team2: teamsByGroup['G']?.[1] },
    ];

    const processarFase = (confrontos, rounds) => {
        const vencedores = [];
        for (const confronto of confrontos) {
            confronto.winnerTeam = null;
            if (!confronto.team1 || !confronto.team2) { vencedores.push(null); continue; }
            const rodadaIda = rounds?.[0];
            const rodadaVolta = rounds?.[1];
            const s1_ida = confronto.team1.pontuacoes?.[`rodada_${rodadaIda}`];
            const s2_ida = confronto.team2.pontuacoes?.[`rodada_${rodadaIda}`];
            const s1_volta = confronto.team1.pontuacoes?.[`rodada_${rodadaVolta}`];
            const s2_volta = confronto.team2.pontuacoes?.[`rodada_${rodadaVolta}`];

            confronto.scores = { ida: [s1_ida, s2_ida], volta: [s1_volta, s2_volta] };

            const allScoresPresent = [s1_ida, s2_ida, s1_volta, s2_volta].every(score => typeof score === 'number');
            if (!allScoresPresent) { vencedores.push(null); continue; }

            const agg1 = s1_ida + s1_volta;
            const agg2 = s2_ida + s2_volta;
            confronto.aggregates = [agg1, agg2];

            if (agg1 > agg2) { confronto.winnerTeam = confronto.team1; }
            else if (agg2 > agg1) { confronto.winnerTeam = confronto.team2; }
            else { confronto.winnerTeam = (confronto.team1.total || 0) >= (confronto.team2.total || 0) ? confronto.team1 : confronto.team2; }
            vencedores.push(confronto.winnerTeam);
        }
        return { confrontos, vencedores };
    };

    const { confrontos: oitavasP, vencedores: vOitavas } = processarFase(oitavas, settings.knockout_rounds?.oitavas);
    const quartas = [
        { id: 'Q1', team1: vOitavas[0], team2: vOitavas[1] }, { id: 'Q2', team1: vOitavas[2], team2: vOitavas[3] },
        { id: 'Q3', team1: vOitavas[4], team2: vOitavas[5] }, { id: 'Q4', team1: vOitavas[6], team2: vOitavas[7] },
    ];
    const { confrontos: quartasP, vencedores: vQuartas } = processarFase(quartas, settings.knockout_rounds?.quartas);
    const semis = [
        { id: 'S1', team1: vQuartas[0], team2: vQuartas[1] }, { id: 'S2', team1: vQuartas[2], team2: vQuartas[3] },
    ];
    const { confrontos: semisP, vencedores: vSemis } = processarFase(semis, settings.knockout_rounds?.semis);
    const final = [{ id: 'F1', team1: vSemis[0], team2: vSemis[1] }];
    const { confrontos: finalP, vencedores: vFinal } = processarFase(final, settings.knockout_rounds?.final);

    return { oitavasP, quartasP, semisP, finalP, vFinal };
}


// =================================================================
// --- INICIALIZAÇÃO DO SERVIDOR ---
// =================================================================

const PORT_TO_LISTEN = process.env.PORT || 3001;
app.listen(PORT_TO_LISTEN, () => console.log(`🚀 Servidor backend a rodar na porta ${PORT_TO_LISTEN}`));