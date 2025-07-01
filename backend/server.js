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
  'https://libertadores-cartola-frontend.onrender.com',
  'https://cartola-libertadors.onrender.com',
  'https://libertadores-cartola-react.onrender.com' // URL CORRETA ADICIONADA
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
    terceiro_lugar: [Number],
  }
});
const Settings = mongoose.model('Settings', SettingsSchema);

app.get('/api/image-proxy', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('URL da imagem é obrigatória');
  }

  try {
    const response = await axios({
      method: 'get',
      url: decodeURIComponent(url),
      responseType: 'stream',
    });

    // Define o tipo de conteúdo da resposta como o da imagem original
    res.setHeader('Content-Type', response.headers['content-type']);
    
    // Envia a imagem como resposta
    response.data.pipe(res);

  } catch (error) {
    console.error('Erro no proxy de imagem:', error.message);
    res.status(500).send('Falha ao carregar a imagem');
  }
});

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
        await processStage('terceiro_lugar', koSettings.terceiro_lugar);

        res.status(200).json({ message: "Busca de pontuações do mata-mata concluída com sucesso!" });
    } catch (error) {
        console.error("Erro na busca sequencial do mata-mata:", error);
        res.status(500).json({ message: "Ocorreu um erro na busca das pontuações do mata-mata." });
    }
});

app.post('/api/teams/assign-groups', verifyToken, async (req, res) => {
    const { assignments } = req.body; // Ex: [{ teamId: '...', group: 'A' }, ...]
    
    if (!Array.isArray(assignments)) {
        return res.status(400).json({ message: 'O corpo da requisição deve ser um array de atribuições.' });
    }

    try {
        const bulkOps = assignments.map(assignment => ({
            updateOne: {
                filter: { _id: assignment.teamId },
                update: { $set: { group: assignment.group } }
            }
        }));

        if (bulkOps.length > 0) {
            await Team.bulkWrite(bulkOps);
        }

        res.status(200).json({ message: 'Grupos atualizados com sucesso!' });
    } catch (error) {
        console.error("Erro ao salvar grupos em massa:", error);
        res.status(500).json({ message: 'Erro no servidor ao salvar os grupos.' });
    }
});

app.post('/api/teams/reset-groups', verifyToken, async (req, res) => {
    try {
        // Atualiza todos os documentos na coleção Team, definindo o campo 'group' como null
        const result = await Team.updateMany({}, { $set: { group: null } });
        
        res.status(200).json({ message: `Grupos de ${result.modifiedCount} times resetados com sucesso!` });
    } catch (error) {
        console.error("Erro ao resetar os grupos:", error);
        res.status(500).json({ message: 'Erro no servidor ao resetar os grupos.' });
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

        const teamsWithTotals = teams.map(team => {
            const total = groupRounds.reduce((sum, rodada) => {
                return sum + (team.pontuacoes[`rodada_${rodada}`] || 0);
            }, 0);
            return { ...team, id: team._id.toString(), total };
        });

        const grupos = teamsWithTotals.reduce((acc, time) => {
            const grupo = (time.group && typeof time.group === 'string' && time.group.trim() !== "") ? time.group : "Sem Grupo";
            (acc[grupo] = acc[grupo] || []).push(time);
            return acc;
        }, {});

        const confrontosDiretos = {};
        for (const groupName in grupos) {
            if (grupos[groupName].length !== 4) continue;
            
            grupos[groupName].sort((a, b) => a.nome.localeCompare(b.nome));
            const [t1, t2, t3, t4] = grupos[groupName];
            
            const schedule = [
                { home: t1, away: t4, roundIndex: 0 }, { home: t2, away: t3, roundIndex: 0 },
                { home: t1, away: t3, roundIndex: 1 }, { home: t4, away: t2, roundIndex: 1 },
                { home: t1, away: t2, roundIndex: 2 }, { home: t3, away: t4, roundIndex: 2 },
                { home: t4, away: t1, roundIndex: 3 }, { home: t3, away: t2, roundIndex: 3 },
                { home: t3, away: t1, roundIndex: 4 }, { home: t2, away: t4, roundIndex: 4 },
                { home: t2, away: t1, roundIndex: 5 }, { home: t4, away: t3, roundIndex: 5 },
            ];

            schedule.forEach(match => {
                const cartolaRound = groupRounds[match.roundIndex];
                if (!cartolaRound) return;

                const key1 = `${match.home.id}-${match.away.id}`;
                const scoreHome = match.home.pontuacoes[`rodada_${cartolaRound}`] || 0;
                const scoreAway = match.away.pontuacoes[`rodada_${cartolaRound}`] || 0;
                confrontosDiretos[key1] = (confrontosDiretos[key1] || 0) + (scoreHome - scoreAway);
            });
        }

        for (const nomeGrupo in grupos) {
            grupos[nomeGrupo].sort((a, b) => {
                const totalDiff = b.total - a.total;
                if (totalDiff !== 0) return totalDiff;

                const saldoA_vs_B = confrontosDiretos[`${a.id}-${b.id}`] || 0;
                const saldoB_vs_A = confrontosDiretos[`${b.id}-${a.id}`] || 0;
                const confrontoDiff = (saldoA_vs_B - saldoB_vs_A) * -1; // Invertido para desempate
                if (confrontoDiff !== 0) return confrontoDiff;

                const maxScoreA = Math.max(0, ...groupRounds.map(r => a.pontuacoes[`rodada_${r}`] || 0));
                const maxScoreB = Math.max(0, ...groupRounds.map(r => b.pontuacoes[`rodada_${r}`] || 0));
                const maxScoreDiff = maxScoreB - maxScoreA;
                if (maxScoreDiff !== 0) return maxScoreDiff;

                return 0;
            });
        }

        // A API da fase de grupos agora retorna um objeto de grupos, e não um array
        // O frontend em HomePage.js já espera este formato.
        const responseArray = Object.keys(grupos).map(key => grupos[key]).flat();
        res.json(responseArray);

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

            // Ordena os times para garantir uma ordem consistente
            teamsByGroup[groupName].sort((a, b) => a.nome.localeCompare(b.nome));
            const [t1, t2, t3, t4] = teamsByGroup[groupName];

            const schedule = [
                { home: t1, away: t4 }, { home: t2, away: t3 }, // Rodada 1
                { home: t1, away: t3 }, { home: t4, away: t2 }, // Rodada 2
                { home: t1, away: t2 }, { home: t3, away: t4 }, // Rodada 3
                { home: t4, away: t1 }, { home: t3, away: t2 }, // Rodada 4
                { home: t3, away: t1 }, { home: t2, away: t4 }, // Rodada 5
                { home: t2, away: t1 }, { home: t4, away: t3 }, // Rodada 6
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
        // A ordenação principal agora acontece na rota /fase-de-grupos
        // Aqui, apenas garantimos que os classificados sejam pegos corretamente
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
        const perdedores = [];
        for (const confronto of confrontos) {
            confronto.winnerTeam = null;
            if (!confronto.team1 || !confronto.team2) {
                vencedores.push(null); 
                perdedores.push(null);
                continue;
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
                vencedores.push(null);
                perdedores.push(null);
                continue;
            }
            
            const agg1 = s1_ida + s1_volta;
            const agg2 = s2_ida + s2_volta;
            confronto.aggregates = [agg1, agg2];
            
            if (agg1 > agg2) {
                confronto.winnerTeam = confronto.team1;
                vencedores.push(confronto.team1);
                perdedores.push(confronto.team2);
            } else if (agg2 > agg1) {
                confronto.winnerTeam = confronto.team2;
                vencedores.push(confronto.team2);
                perdedores.push(confronto.team1);
            } else {
                const winner = (confronto.team1.total || 0) >= (confronto.team2.total || 0) ? confronto.team1 : confronto.team2;
                const loser = winner.id === confronto.team1.id ? confronto.team2 : confronto.team1;
                confronto.winnerTeam = winner;
                vencedores.push(winner);
                perdedores.push(loser);
            }
        }
        return { confrontos, vencedores, perdedores };
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
    const { confrontos: semisP, vencedores: vSemis, perdedores: pSemis } = processarFase(semis, koRounds.semis);
    const final = [{ id: 'F1', team1: vSemis[0], team2: vSemis[1] }];
    const { confrontos: finalP, vencedores: vFinal } = processarFase(final, koRounds.final);

    const terceiroLugar = [{ id: 'T1', team1: pSemis[0], team2: pSemis[1] }];
    const { confrontos: terceiroLugarP, vencedores: vTerceiro } = processarFase(terceiroLugar, koRounds.terceiro_lugar);
    
    return { oitavasP, quartasP, semisP, finalP, vFinal, terceiroLugarP, vTerceiro };
}

app.get('/api/mata-mata', async (req, res) => {
    try {
       const { oitavasP, quartasP, semisP, finalP, vFinal, terceiroLugarP, vTerceiro } = await processarMataMata();
        res.json({
            oitavas: oitavasP,
            quartas: quartasP,
            semis: semisP,
            final: finalP,
            terceiroLugar: terceiroLugarP, 
            campeao: vFinal[0] || null,
            terceiro: vTerceiro[0] || null, 
        });
    } catch (error) {
        console.error("Erro em /api/mata-mata:", error);
        res.status(500).json({ message: 'Erro ao gerar chaveamento.' });
    }
});

app.get('/api/mata-mata-confrontos', async (req, res) => {
    try {
      const { oitavasP, quartasP, semisP, finalP, terceiroLugarP } = await processarMataMata();
        const responseData = {};
        if (oitavasP.some(m => m.team1 && m.team2)) responseData['Oitavas de Final'] = oitavasP;
        if (quartasP.some(m => m.team1 && m.team2)) responseData['Quartas de Final'] = quartasP;
        if (semisP.some(m => m.team1 && m.team2)) responseData['Semifinais'] = semisP;
        if (terceiroLugarP.some(m => m.team1 && m.team2)) responseData['Disputa de 3º Lugar'] = terceiroLugarP;
        if (finalP.some(m => m.team1 && m.team2)) responseData['Final'] = finalP;
        res.json(responseData);
    } catch (error) {
        console.error("Erro em /api/mata-mata-confrontos:", error);
        res.status(500).json({ message: 'Erro ao gerar confrontos de mata-mata.' });
    }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => console.log(`🚀 Servidor backend a rodar na porta ${PORT}`));