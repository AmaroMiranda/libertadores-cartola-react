// src/pages/SorteioPage.js
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
  Dialog,
  DialogContent,
  DialogTitle,
  Slide,
  Divider,
} from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

// Efeito de transição para o Dialog (popup)
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Card para exibir o time sorteado no Dialog
const DrawnTeamCard = ({ team }) => (
  <Box textAlign="center" p={3}>
    <Avatar
      src={team.url_escudo}
      sx={{
        width: 120,
        height: 120,
        m: "auto",
        mb: 2,
        p: 1,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        border: "3px solid",
        borderColor: "primary.main",
      }}
      variant="rounded"
    />
    <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>
      {team.nome}
    </Typography>
    <Typography variant="h6" color="text.secondary">
      {team.nome_cartola}
    </Typography>
  </Box>
);

// Card para exibir um time dentro do seu grupo
const TimeCardInGroup = ({ team }) => (
  <Paper
    variant="outlined"
    sx={{
      display: "flex",
      alignItems: "center",
      p: 1.5,
      mb: 1,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      transition: "all 0.3s ease-in-out",
      "&:hover": {
        borderColor: "primary.main",
        transform: "scale(1.02)",
      },
    }}
  >
    <Avatar src={team.url_escudo} sx={{ width: 32, height: 32, mr: 2 }} />
    <Box>
      <Typography sx={{ fontWeight: 500, fontSize: "0.9rem" }}>
        {team.nome}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {team.nome_cartola}
      </Typography>
    </Box>
  </Paper>
);

// Componente principal da página de Sorteio
function SorteioPage() {
  const [allTeams, setAllTeams] = useState([]);
  const [teamsToDraw, setTeamsToDraw] = useState([]);
  const [groups, setGroups] = useState({});
  const [lastDrawnTeam, setLastDrawnTeam] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    type: "info",
  });

  const GROUP_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const TEAMS_PER_GROUP = 4;

  const initializeDraw = useCallback((teams) => {
    const initialGroups = GROUP_NAMES.reduce(
      (acc, name) => ({ ...acc, [name]: [] }),
      {}
    );
    setGroups(initialGroups);
    setTeamsToDraw([...teams].sort(() => Math.random() - 0.5)); // Embaralha os times no pote
    setLastDrawnTeam(null);
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/teams");
        const teamsWithoutGroup = response.data.filter(
          (team) => !team.group || team.group === "Sem Grupo"
        );
        if (teamsWithoutGroup.length !== 32) {
          setFeedback({
            open: true,
            message: `Atenção: Encontrados ${teamsWithoutGroup.length}/32 times sem grupo para o sorteio.`,
            type: "warning",
          });
        }
        setAllTeams(teamsWithoutGroup);
        initializeDraw(teamsWithoutGroup);
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

  const handleDrawOne = () => {
    if (isDrawing || teamsToDraw.length === 0) return;
    setIsDrawing(true);

    const remainingTeams = [...teamsToDraw];
    const drawnTeam = remainingTeams.shift(); // Pega o primeiro time da lista embaralhada

    setLastDrawnTeam(drawnTeam);

    // Animação: abre o dialog e fecha após um tempo
    setTimeout(() => setDialogOpen(true), 100);
    setTimeout(() => {
      setDialogOpen(false);
      placeTeamInGroup(drawnTeam);
      setTeamsToDraw(remainingTeams); // Atualiza o pote após a animação
    }, 2500);
  };

  const placeTeamInGroup = (drawnTeam) => {
    if (!drawnTeam) {
      setIsDrawing(false);
      return;
    }

    const drawnCount = allTeams.length - teamsToDraw.length;
    const groupIndex = Math.floor(drawnCount / TEAMS_PER_GROUP);
    const targetGroup = GROUP_NAMES[groupIndex];

    setGroups((currentGroups) => ({
      ...currentGroups,
      [targetGroup]: [...currentGroups[targetGroup], drawnTeam],
    }));

    if (teamsToDraw.length === 1) {
      // A verificação agora é 1 pois a atualização do estado é assíncrona
      setFeedback({
        open: true,
        message: "Sorteio concluído!",
        type: "success",
      });
    }

    setIsDrawing(false);
  };

  const handleSaveGroups = async () => {
    setIsSaving(true);
    setFeedback({ open: true, message: "Salvando grupos...", type: "info" });
    try {
      const groupAssignments = Object.entries(groups).flatMap(
        ([groupName, teams]) =>
          teams.map((team) => ({ teamId: team.id, group: groupName }))
      );
      if (groupAssignments.length !== allTeams.length) {
        throw new Error(
          "O sorteio não foi concluído. Salve apenas quando todos os times estiverem em grupos."
        );
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

      <Grid container spacing={3}>
        {/* Coluna do Pote e Ações */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, position: "sticky", top: "20px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Pote do Sorteio
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Times restantes: {teamsToDraw.length}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleDrawOne}
                disabled={isDrawing || teamsToDraw.length === 0}
                startIcon={<CasinoIcon />}
              >
                {isDrawing ? "Sorteando..." : "Sortear Próximo Time"}
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                onClick={handleSaveGroups}
                disabled={isDrawing || isSaving || teamsToDraw.length > 0}
                startIcon={
                  isSaving ? <CircularProgress size={20} /> : <SaveIcon />
                }
              >
                {isSaving ? "Salvando..." : "Salvar Grupos"}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="warning"
                onClick={() => initializeDraw(allTeams)}
                disabled={isDrawing}
                startIcon={<RestartAltIcon />}
              >
                Resetar Sorteio
              </Button>
            </Box>
            {teamsToDraw.length === 0 && !isDrawing && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Sorteio finalizado! Clique em "Salvar Grupos" para confirmar.
              </Alert>
            )}
            <Box
              sx={{
                mt: 2,
                maxHeight: "45vh",
                overflowY: "auto",
                p: 1,
                backgroundColor: "rgba(0,0,0,0.1)",
                borderRadius: 1,
              }}
            >
              {teamsToDraw.map((team) => (
                <Chip key={team.id} label={team.nome} sx={{ m: 0.5 }} />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Coluna dos Grupos */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {GROUP_NAMES.map((name) => (
              <Grid item xs={12} sm={6} key={name}>
                <Paper
                  elevation={2}
                  sx={{ p: 2, height: "100%", minHeight: 250 }}
                >
                  <Typography
                    variant="h5"
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: "primary.main",
                      mb: 2,
                      borderBottom: "2px solid",
                      borderColor: "divider",
                      pb: 1,
                    }}
                  >
                    Grupo {name}
                  </Typography>
                  <Box>
                    {groups[name] &&
                      groups[name].map((team) => (
                        <TimeCardInGroup key={team.id} team={team} />
                      ))}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Dialog da Animação */}
      <Dialog
        open={dialogOpen}
        TransitionComponent={Transition}
        keepMounted
        PaperProps={{
          sx: {
            backgroundColor: "background.paper",
            border: "2px solid",
            borderColor: "primary.main",
          },
        }}
      >
        <DialogTitle
          textAlign="center"
          sx={{ fontSize: "1.8rem", color: "text.secondary" }}
        >
          TIME SORTEADO!
        </DialogTitle>
        <DialogContent>
          {lastDrawnTeam && <DrawnTeamCard team={lastDrawnTeam} />}
        </DialogContent>
      </Dialog>

      {/* Snackbar para Feedbacks */}
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
