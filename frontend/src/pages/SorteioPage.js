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
  Dialog,
  DialogContent,
  DialogTitle,
  Slide,
} from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

// Efeito de transição para o Dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Card para o time sorteado no Dialog
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
    const initialGroups = GROUP_NAMES.reduce((acc, name) => {
      acc[name] = [];
      return acc;
    }, {});
    setGroups(initialGroups);
    // Embaralha os times para o sorteio
    setTeamsToDraw([...teams].sort(() => Math.random() - 0.5));
    setLastDrawnTeam(null);
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/teams");
        // Filtra times que ainda não têm grupo definido
        const teamsWithoutGroup = response.data.filter(
          (team) => !team.group || team.group === "Sem Grupo"
        );
        if (teamsWithoutGroup.length !== 32) {
          setFeedback({
            open: true,
            message: `Atenção: Encontrados ${teamsWithoutGroup.length}/32 times sem grupo.`,
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

  // Sorteia UM time
  const handleDrawOne = () => {
    if (isDrawing) return;
    setIsDrawing(true);

    const remainingTeams = [...teamsToDraw];
    const drawnTeam = remainingTeams.pop();
    setLastDrawnTeam(drawnTeam);
    setTeamsToDraw(remainingTeams);

    // Animação: abre o dialog e fecha após um tempo
    setTimeout(() => setDialogOpen(true), 100);
    setTimeout(() => {
      setDialogOpen(false);
      placeTeamInGroup(drawnTeam);
    }, 2500); // Duração da animação do sorteio
  };

  // Coloca o time sorteado no grupo correto
  const placeTeamInGroup = (drawnTeam) => {
    if (!drawnTeam) {
      setIsDrawing(false);
      return;
    }

    const drawnCount = allTeams.length - teamsToDraw.length - 1;
    const groupIndex = Math.floor(drawnCount / TEAMS_PER_GROUP);
    const targetGroup = GROUP_NAMES[groupIndex];

    setGroups((currentGroups) => {
      const newGroups = { ...currentGroups };
      newGroups[targetGroup] = [...newGroups[targetGroup], drawnTeam];
      return newGroups;
    });

    if (teamsToDraw.length === 0) {
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
          Times no Pote: {teamsToDraw.length}
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Button
            variant="contained"
            onClick={handleDrawOne}
            disabled={isDrawing || teamsToDraw.length === 0}
            startIcon={<CasinoIcon />}
          >
            {isDrawing ? "Sorteando..." : "Sortear Próximo Time"}
          </Button>
          <Button
            variant="outlined"
            color="warning"
            onClick={() => initializeDraw(allTeams)}
            disabled={isDrawing}
            startIcon={<RestartAltIcon />}
          >
            Resetar Sorteio
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
        {teamsToDraw.length === 0 && !isDrawing && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Sorteio finalizado! Clique em "Salvar Grupos" para confirmar.
          </Alert>
        )}
      </Paper>

      {/* Grid dos Grupos */}
      <Grid container spacing={3}>
        {GROUP_NAMES.map((name) => (
          <Grid item xs={12} sm={6} lg={3} key={name}>
            <Paper elevation={2} sx={{ p: 2, height: "100%", minHeight: 250 }}>
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
                    <TimeCardSorteio
                      key={team.id}
                      team={team}
                      isVisible={true}
                    />
                  ))}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Dialog da Animação */}
      <Dialog
        open={dialogOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setDialogOpen(false)}
        aria-describedby="drawn-team-dialog"
        PaperProps={{ sx: { backgroundColor: "background.paper" } }}
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
