// api/server.js
// --- Dependências ---
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// --- Configuração da Aplicação ---
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

// --- Middlewares ---
const allowedOrigins = [
  'http://localhost:3000',
  'https://libertadores-cartola-frontend.onrender.com', // URL do Frontend na Render
  'https://cartola-libertadors.onrender.com' // Outro URL do Frontend na Render
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('A política de CORS para este site não permite acesso da Origem especificada.'), false);
  }
}));

app.use(express.json());

// --- Conexão com a Base de Dados MongoDB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado com sucesso à MongoDB Atlas!'))
  .catch(err => console.error('🔴 Falha ao conectar à MongoDB:', err));

// --- Definição dos Modelos (Schemas) ---
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', UserSchema);

const TeamSchema = new mongoose.Schema({
  cartola_id: { type: Number, required: true, unique: true },
  nome: { type: String, required: true },
  url_escudo: { type: String },
  nome_cartola: { type: String },
  group: { type: String, default: null, index: true },
  pontuacoes: { type: Map, of: Number, default: {} },
});
const Team = mongoose.model('Team', TeamSchema);

const SettingsSchema = new mongoose.Schema({
  singleton: { type: Boolean, default: true, unique: true },
  group_stage_rounds: { type: [Number], default: [] },
  knockout_rounds: {
    oitavas: [Number],
    quartas: [Number],
    semis: [Number],
    final: [Number],
  }
});
const Settings = mongoose.model('Settings', SettingsSchema);

// Rota de "saúde" para verificar se o servidor está no ar
app.get("/api", (req, res) => {
    res.json({ message: "API da Libertadores do Cartola está no ar!" });
});


// =================================================================
// --- ROTAS DE AUTENTICAÇÃO ---
// =================================================================
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Nome de utilizador e senha são obrigatórios.' });
    }
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'Este nome de utilizador já existe.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'Utilizador registado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao registar.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao fazer login.' });
    }
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
// --- FUNÇÕES AUXILIARES DE PONTUAÇÃO ---
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

async function fetchAndSaveScores(teamsToFetch, rounds) {
    const validRounds = rounds.filter(r => r && typeof r === 'number');
    if (!teamsToFetch || teamsToFetch.length === 0 || validRounds.length === 0) return;

    for (const team of teamsToFetch) {
        const teamDocument = await Team.findById(team._id);
        if(!teamDocument) continue;

        let hasChanged = false;
        for (const rodada of validRounds) {
            console.log(`Buscando: Time ${teamDocument.nome}, Rodada ${rodada}`);
            await new Promise(resolve => setTimeout(resolve, 250));
            const pontos = await getPontuacaoDaRodada(teamDocument.cartola_id, rodada);
            teamDocument.pontuacoes.set(`rodada_${rodada}`, pontos);
            hasChanged = true;
        }
        if(hasChanged) await teamDocument.save();
    }
}

// =================================================================
// --- ROTAS DE ADMINISTRAÇÃO (PROTEGIDAS) ---
// =================================================================

app.post('/api/teams', verifyToken, async (req, res) => {
    try {
        const { cartola_id, nome, url_escudo, nome_cartola } = req.body;
        if (!cartola_id || !nome) return res.status(400).json({ message: 'Dados incompletos.' });

        const existingTeam = await Team.findOne({ cartola_id });
        if (existingTeam) return res.status(409).json({ message: 'Time já adicionado.' });

        const newTeam = new Team({ cartola_id, nome, url_escudo, nome_cartola });
        await newTeam.save();
        res.status(201).json(newTeam);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar time.' });
    }
});

app.put('/api/teams/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { group } = req.body;
        const updatedTeam = await Team.findByIdAndUpdate(id, { group }, { new: true });
        if (!updatedTeam) return res.status(404).json({ message: 'Time não encontrado.' });
        res.json(updatedTeam);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar time.' });
    }
});

app.delete('/api/teams/:id', verifyToken, async (req, res) => {
    try {
        const deletedTeam = await Team.findByIdAndDelete(req.params.id);
        if (!deletedTeam) return res.status(404).json({ message: 'Time não encontrado.' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover time.' });
    }
});

app.post('/api/teams/refresh-all', verifyToken, async (req, res) => {
    try {
        const teams = await Team.find();
        if (!teams || teams.length === 0) return res.status(200).json({ message: 'Nenhum time para atualizar.' });

        for (const team of teams) {
            try {
                const searchUrl = `https://api.cartolafc.globo.com/times?q=${encodeURIComponent(team.nome)}`;
                const response = await axios.get(searchUrl);
                const updatedData = response.data.find(foundTeam => foundTeam.time_id === team.cartola_id);
                if (updatedData) {
                    team.nome_cartola = updatedData.nome_cartola;
                    team.url_escudo = updatedData.url_escudo_png;
                    team.nome = updatedData.nome;
                    await team.save();
                }
            } catch (error) {
                console.error(`Falha ao atualizar o time ${team.nome}. Mantendo dados antigos.`);
            }
        }
        res.status(200).json({ message: 'Dados dos times atualizados com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Ocorreu um erro interno ao atualizar os dados.' });
    }
});

app.put('/api/settings', verifyToken, async (req, res) => {
    try {
        const { group_stage_rounds, knockout_rounds } = req.body;
        const updatedSettings = await Settings.findOneAndUpdate(
            { singleton: true },
            { group_stage_rounds, knockout_rounds },
            { new: true, upsert: true }
        );
        res.json(updatedSettings);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar configurações.' });
    }
});

app.post('/api/scores/refresh/group-stage', verifyToken, async (req, res) => {
    console.log("Iniciando busca de pontuações da Fase de Grupos...");
    try {
        const teams = await Team.find();
        const settings = await Settings.findOne({ singleton: true });
        const groupRounds = settings?.group_stage_rounds || [];
        if (!teams.length || !groupRounds.length) {
            return res.status(400).json({ message: "Configure times e rodadas de grupo antes de buscar." });
        }
        await fetchAndSaveScores(teams, groupRounds);
        res.status(200).json({ message: "Pontuações da Fase de Grupos atualizadas com sucesso!" });
    } catch (error) {
        res.status(500).json({ message: "Ocorreu um erro durante a busca das pontuações." });
    }
});

app.post('/api/scores/refresh/knockout', verifyToken, async (req, res) => {
    console.log("Iniciando busca de pontuações do Mata-Mata...");
    try {
        const settings = await Settings.findOne({ singleton: true });
        const koSettings = settings?.knockout_rounds;
        if (!koSettings || Object.keys(koSettings).length === 0) {
            return res.status(400).json({ message: "Configurações do mata-mata não definidas." });
        }

        const processStage = async (stageName, rounds) => {
            if (!rounds || rounds.length < 2) {
                console.log(`Rodadas para ${stageName} não configuradas. A pular.`);
                return;
            }
            const { [`${stageName}P`]: matches } = await processarMataMata();
            const teamsInStage = matches.flatMap(m => [m.team1, m.team2]).filter(t => t && t._id);
            if (teamsInStage.length > 0) {
                const teamIds = [...new Set(teamsInStage.map(t => t._id.toString()))];
                const teamsToFetch = await Team.find({ '_id': { $in: teamIds } });
                await fetchAndSaveScores(teamsToFetch, rounds);
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
// --- ROTAS PÚBLICAS E DE DADOS ---
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

app.get('/api/teams', async (req, res) => {
    try {
        const teams = await Team.find().sort({ nome: 1 }).lean();
        const teamsWithId = teams.map(t => ({ ...t, id: t._id.toString() }));
        res.json(teamsWithId);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar times.' });
    }
});

app.get('/api/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne({ singleton: true }).lean();
        if (!settings) {
            const newSettings = new Settings({ singleton: true });
            settings = await newSettings.save();
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao obter configurações.' });
    }
});

app.get('/api/fase-de-grupos', async (req, res) => {
    try {
        const teams = await Team.find().lean();
        const settings = await Settings.findOne({ singleton: true }).lean();
        const groupRounds = settings?.group_stage_rounds || [];
        const resultados = teams.map(team => {
            const total = groupRounds.reduce((sum, rodada) => {
                // CORREÇÃO: Acessar pontuações como propriedades de objeto
                return sum + (team.pontuacoes[`rodada_${rodada}`] || 0);
            }, 0);
            return { ...team, id: team._id.toString(), total };
        });
        res.json(resultados);
    } catch (error) {
        console.error("Erro na rota /api/fase-de-grupos: ", error);
        res.status(500).json({ message: 'Erro ao processar fase de grupos.' });
    }
});

app.get('/api/confrontos', async (req, res) => {
    try {
        const teams = await Team.find().lean();
        const settings = await Settings.findOne({ singleton: true }).lean();
        const cartolaRounds = settings?.group_stage_rounds || [];
        const teamsByGroup = teams.reduce((acc, team) => {
            if (team.group) (acc[team.group] = acc[team.group] || []).push(team);
            return acc;
        }, {});

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
                    id: `${groupName}-r${leagueRound}-${match.home._id}-vs-${match.away._id}`,
                    league_round: leagueRound,
                    cartola_round: cartolaRound || 'A Definir',
                    group: groupName,
                    home_team: { ...match.home, id: match.home._id.toString(), score: cartolaRound ? match.home.pontuacoes?.[`rodada_${cartolaRound}`] || 0 : 0 },
                    away_team: { ...match.away, id: match.away._id.toString(), score: cartolaRound ? match.away.pontuacoes?.[`rodada_${cartolaRound}`] || 0 : 0 },
                });
            });
        }
        res.json(allMatches);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao gerar confrontos.' });
    }
});

// =================================================================
// --- LÓGICA DE PROCESSAMENTO DO MATA-MATA E ROTAS ---
// =================================================================

async function processarMataMata() {
    const teamsData = await Team.find().lean();
    const settingsData = await Settings.findOne({ singleton: true }).lean();
    
    const groupRounds = settingsData?.group_stage_rounds || [];
    const teamsWithTotals = teamsData.map(team => {
        const total = groupRounds.reduce((sum, r) => sum + (team.pontuacoes[`rodada_${r}`] || 0), 0);
        return { ...team, id: team._id.toString(), total };
    });
    
    const teamsByGroup = teamsWithTotals.reduce((acc, team) => {
        if (team.group) (acc[team.group] = acc[team.group] || []).push(team);
        return acc;
    }, {});
    
    for (const group in teamsByGroup) {
        teamsByGroup[group].sort((a, b) => b.total - a.total);
    }

    const oitavas = [
        { id: 'O1', team1: teamsByGroup['A']?.[0], team2: teamsByGroup['B']?.[1] }, { id: 'O2', team1: teamsByGroup['C']?.[0], team2: teamsByGroup['D']?.[1] },
        { id: 'O3', team1: teamsByGroup['E']?.[0], team2: teamsByGroup['F']?.[1] }, { id: 'O4', team1: teamsByGroup['G']?.[0], team2: teamsByGroup['H']?.[1] },
        { id: 'O5', team1: teamsByGroup['B']?.[0], team2: teamsByGroup['A']?.[1] }, { id: 'O6', team1: teamsByGroup['D']?.[0], team2: teamsByGroup['C']?.[1] },
        { id: 'O7', team1: teamsByGroup['F']?.[0], team2: teamsByGroup['E']?.[1] }, { id: 'O8', team1: teamsByGroup['H']?.[0], team2: teamsByGroup['G']?.[1] },
    ];
    
    const processarFase = (confrontos, roundsData) => {
        const vencedores = [];
        for (const confronto of confrontos) {
            confronto.winnerTeam = null;
            if (!confronto.team1 || !confronto.team2) {
                vencedores.push(null); continue;
            }
            const rodadaIda = roundsData?.[0];
            const rodadaVolta = roundsData?.[1];

            const s1_ida = confronto.team1.pontuacoes?.[`rodada_${rodadaIda}`];
            const s2_ida = confronto.team2.pontuacoes?.[`rodada_${rodadaIda}`];
            const s1_volta = confronto.team1.pontuacoes?.[`rodada_${rodadaVolta}`];
            const s2_volta = confronto.team2.pontuacoes?.[`rodada_${rodadaVolta}`];

            confronto.scores = { ida: [s1_ida, s2_ida], volta: [s1_volta, s2_volta] };
            
            const allScoresPresent = [s1_ida, s2_ida, s1_volta, s2_volta].every(score => typeof score === 'number');
            if (!allScoresPresent) {
                vencedores.push(null); continue;
            }
            
            const agg1 = s1_ida + s1_volta;
            const agg2 = s2_ida + s2_volta;
            confronto.aggregates = [agg1, agg2];
            
            if (agg1 > agg2) confronto.winnerTeam = confronto.team1;
            else if (agg2 > agg1) confronto.winnerTeam = confronto.team2;
            else confronto.winnerTeam = (confronto.team1.total || 0) >= (confronto.team2.total || 0) ? confronto.team1 : confronto.team2;
            
            vencedores.push(confronto.winnerTeam);
        }
        return { confrontos, vencedores };
    };
    
    const koRounds = settingsData?.knockout_rounds || {};
    const { confrontos: oitavasP, vencedores: vOitavas } = processarFase(oitavas, koRounds.oitavas);
    const quartas = [
        { id: 'Q1', team1: vOitavas[0], team2: vOitavas[1] }, { id: 'Q2', team1: vOitavas[2], team2: vOitavas[3] },
        { id: 'Q3', team1: vOitavas[4], team2: vOitavas[5] }, { id: 'Q4', team1: vOitavas[6], team2: vOitavas[7] },
    ];
    const { confrontos: quartasP, vencedores: vQuartas } = processarFase(quartas, koRounds.quartas);
    const semis = [
        { id: 'S1', team1: vQuartas[0], team2: vQuartas[1] }, { id: 'S2', team1: vQuartas[2], team2: vQuartas[3] },
    ];
    const { confrontos: semisP, vencedores: vSemis } = processarFase(semis, koRounds.semis);
    const final = [{ id: 'F1', team1: vSemis[0], team2: vSemis[1] }];
    const { confrontos: finalP, vencedores: vFinal } = processarFase(final, koRounds.final);
    
    return { oitavasP, quartasP, semisP, finalP, vFinal };
}

app.get('/api/mata-mata', async (req, res) => {
    try {
        const { oitavasP, quartasP, semisP, finalP, vFinal } = await processarMataMata();
        res.json({
            oitavas: oitavasP, quartas: quartasP, semis: semisP,
            final: finalP, campeao: vFinal[0] || null,
        });
    } catch (error) {
        console.error("Erro em /api/mata-mata:", error);
        res.status(500).json({ message: 'Erro ao gerar chaveamento.' });
    }
});

app.get('/api/mata-mata-confrontos', async (req, res) => {
    try {
        const { oitavasP, quartasP, semisP, finalP } = await processarMataMata();
        const responseData = {};
        if (oitavasP.some(m => m.team1 && m.team2)) responseData['Oitavas de Final'] = oitavasP;
        if (quartasP.some(m => m.team1 && m.team2)) responseData['Quartas de Final'] = quartasP;
        if (semisP.some(m => m.team1 && m.team2)) responseData['Semifinais'] = semisP;
        if (finalP.some(m => m.team1 && m.team2)) responseData['Final'] = finalP;
        res.json(responseData);
    } catch (error) {
        console.error("Erro em /api/mata-mata-confrontos:", error);
        res.status(500).json({ message: 'Erro ao gerar confrontos de mata-mata.' });
    }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => console.log(`🚀 Servidor backend a rodar na porta ${PORT}`));