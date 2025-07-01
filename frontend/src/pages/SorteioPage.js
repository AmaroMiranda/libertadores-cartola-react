// frontend/src/pages/SorteioPage.js
import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import {
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
} from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

// Componente para exibir um único time sorteado
const TimeCardSorteio = ({ team, isVisible }) => (
  <Paper
    variant="outlined"
    sx={{
      display: "flex",
      alignItems: "center",
      p: 1.5,
      mb: 1,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
    }}
  >
    <Avatar src={team.url_escudo} sx={{ width: 32, height: 32, mr: 2 }} />
    <Box>
      <Typography sx={{ fontWeight: 500 }}>{team.nome}</Typography>
      <Typography variant="caption" color="text.secondary">
        {team.nome_cartola}
      </Typography>
    </Box>
  </Paper>
);

// Componente principal da página
function SorteioPage() {
  const [allTeams, setAllTeams] = useState([]);
  const [teamsToDraw, setTeamsToDraw] = useState([]);
  const [groups, setGroups] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    type: "info",
  });

  const GROUP_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H"];

  // Função para inicializar/resetar o sorteio
  const initializeDraw = useCallback((teams) => {
    const initialGroups = GROUP_NAMES.reduce((acc, name) => {
      acc[name] = [];
      return acc;
    }, {});
    setGroups(initialGroups);
    setTeamsToDraw([...teams].sort(() => Math.random() - 0.5)); // Embaralha os times
  }, []);

  // Busca inicial dos times
  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/teams");
        const teamsData = response.data.filter(
          (team) => team.group === null || team.group === "Sem Grupo"
        );
        setAllTeams(teamsData);
        initializeDraw(teamsData);
      } catch (err) {
        setFeedback({
          open: true,
          message: "Erro ao carregar times.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeams();
  }, [initializeDraw]);

  // A Mágica da Animação: Sorteia um time de cada vez
  const handleDraw = () => {
    if (teamsToDraw.length === 0) {
      setFeedback({
        open: true,
        message: "Todos os times já foram sorteados!",
        type: "success",
      });
      return;
    }
    setIsDrawing(true);

    const drawInterval = setInterval(() => {
      setTeamsToDraw((currentTeams) => {
        if (currentTeams.length === 0) {
          clearInterval(drawInterval);
          setIsDrawing(false);
          setFeedback({
            open: true,
            message: "Sorteio concluído!",
            type: "success",
          });
          return [];
        }

        const newTeamsToDraw = [...currentTeams];
        const drawnTeam = newTeamsToDraw.pop();

        setGroups((currentGroups) => {
          const newGroups = { ...currentGroups };
          const targetGroupIndex =
            (allTeams.length - newTeamsToDraw.length - 1) % GROUP_NAMES.length;
          const targetGroup = GROUP_NAMES[targetGroupIndex];
          newGroups[targetGroup].push({ ...drawnTeam, isVisible: true });
          return newGroups;
        });

        return newTeamsToDraw;
      });
    }, 400); // Intervalo para a animação
  };

  // Salva o resultado no backend
  const handleSaveGroups = async () => {
    setIsSaving(true);
    setFeedback({ open: true, message: "Salvando grupos...", type: "info" });
    try {
      const groupAssignments = Object.entries(groups).flatMap(
        ([groupName, teams]) =>
          teams.map((team) => ({ teamId: team.id, group: groupName }))
      );

      if (groupAssignments.length === 0) {
        throw new Error("Nenhum time foi sorteado para ser salvo.");
      }

      await api.post("/teams/assign-groups", { assignments: groupAssignments });
      setFeedback({
        open: true,
        message: "Grupos salvos com sucesso!",
        type: "success",
      });
    } catch (err) {
      setFeedback({
        open: true,
        message: err.response?.data?.message || "Erro ao salvar os grupos.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" my={5}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: "bold" }}
      >
        Sorteio dos Grupos
      </Typography>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Ações
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            onClick={handleDraw}
            disabled={isDrawing || teamsToDraw.length === 0}
            startIcon={<CasinoIcon />}
          >
            {isDrawing ? "Sorteando..." : "Iniciar Sorteio"}
          </Button>
          <Button
            variant="outlined"
            onClick={() => initializeDraw(allTeams)}
            disabled={isDrawing}
            startIcon={<RestartAltIcon />}
          >
            Resetar
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSaveGroups}
            disabled={isDrawing || isSaving || teamsToDraw.length > 0}
            startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {isSaving ? "Salvando..." : "Salvar Grupos"}
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6">
              Times a Sortear ({teamsToDraw.length})
            </Typography>
            <Box sx={{ mt: 2, maxHeight: "60vh", overflowY: "auto" }}>
              {teamsToDraw.map((team) => (
                <Chip key={team.id} label={team.nome} sx={{ m: 0.5 }} />
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            {GROUP_NAMES.map((name) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={name}>
                <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
                  <Typography
                    variant="h6"
                    align="center"
                    sx={{ color: "primary.main", mb: 1.5 }}
                  >
                    Grupo {name}
                  </Typography>
                  {groups[name] &&
                    groups[name].map((team) => (
                      <TimeCardSorteio
                        key={team.id}
                        team={team}
                        isVisible={team.isVisible}
                      />
                    ))}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback({ ...feedback, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setFeedback({ ...feedback, open: false })}
          severity={feedback.type}
          sx={{ width: "100%" }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SorteioPage;
