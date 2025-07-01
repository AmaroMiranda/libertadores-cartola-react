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
  Dialog,
  DialogContent,
  DialogTitle,
  Slide,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
} from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import { pdf } from "@react-pdf/renderer";
import { savePdf } from "../utils/download";
import RelatorioSorteioDocument from "../components/pdf/RelatorioSorteioDocument";

// Efeito de transição para os Dialogs
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
  const [drawDialogOpen, setDrawDialogOpen] = useState(false);
  const [potDialogOpen, setPotDialogOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    type: "info",
  });

  const GROUP_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const TEAMS_PER_GROUP = 4;

  const showFeedback = (type, message) =>
    setFeedback({ open: true, type, message });

  const initializeDraw = useCallback((teams) => {
    const initialGroups = GROUP_NAMES.reduce(
      (acc, name) => ({ ...acc, [name]: [] }),
      {}
    );
    setGroups(initialGroups);
    setTeamsToDraw([...teams].sort(() => Math.random() - 0.5));
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
          showFeedback(
            "warning",
            `Atenção: Encontrados ${teamsWithoutGroup.length}/32 times sem grupo para o sorteio.`
          );
        }
        setAllTeams(teamsWithoutGroup);
        initializeDraw(teamsWithoutGroup);
      } catch (err) {
        showFeedback("error", "Erro ao carregar times.");
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
    const drawnTeam = remainingTeams.shift();

    setLastDrawnTeam(drawnTeam);

    setTimeout(() => {
      placeTeamInGroup(drawnTeam);
      setDrawDialogOpen(true);
    }, 100);

    setTimeout(() => {
      setDrawDialogOpen(false);
      setTeamsToDraw(remainingTeams);
      setIsDrawing(false);
    }, 2000);
  };

  const placeTeamInGroup = (drawnTeam) => {
    if (!drawnTeam) return;

    setGroups((currentGroups) => {
      // AQUI ESTÁ A CORREÇÃO PRINCIPAL:
      // Contamos os times já alocados para saber qual é o próximo.
      const drawnCount = Object.values(currentGroups).flat().length;
      const groupIndex = Math.floor(drawnCount / TEAMS_PER_GROUP);
      const targetGroup = GROUP_NAMES[groupIndex];

      // Se o grupo de destino não existir ou estiver cheio (salvaguarda)
      if (!targetGroup || currentGroups[targetGroup].length >= TEAMS_PER_GROUP) {
        console.error("Erro de lógica no sorteio: Grupo alvo inválido.");
        return currentGroups; // Retorna o estado atual sem mudanças
      }

      if (drawnCount === allTeams.length - 1) {
        showFeedback("success", "Sorteio concluído!");
      }

      return {
        ...currentGroups,
        [targetGroup]: [...currentGroups[targetGroup], drawnTeam],
      };
    });
  };

  const handleSaveGroups = async () => {
    setIsSaving(true);
    showFeedback("info", "Salvando grupos...");
    try {
      const groupAssignments = Object.entries(groups).flatMap(
        ([groupName, teams]) =>
          teams.map((team) => ({ teamId: team.id, group: groupName }))
      );

      if (groupAssignments.length !== allTeams.length) {
        throw new Error(
          `O sorteio não foi concluído. Apenas ${groupAssignments.length}/${allTeams.length} times foram alocados.`
        );
      }
      await api.post("/teams/assign-groups", { assignments: groupAssignments });
      showFeedback("success", "Grupos salvos com sucesso!");
    } catch (err) {
      showFeedback(
        "error",
        err.message || "Erro ao salvar os grupos."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (teamsToDraw.length > 0) {
      showFeedback("warning", "Conclua o sorteio para exportar o resultado.");
      return;
    }
    setIsGeneratingPdf(true);
    try {
      const API_BASE_URL = api.defaults.baseURL.replace("/api", "");
      const doc = (
        <RelatorioSorteioDocument groups={groups} apiUrl={API_BASE_URL} />
      );
      const blob = await pdf(doc).toBlob();
      await savePdf(blob, "resultado-sorteio-grupos.pdf", showFeedback);
    } catch (e) {
      console.error("Erro ao gerar PDF do sorteio:", e);
      showFeedback("error", "Ocorreu um erro ao gerar o PDF.");
    } finally {
      setIsGeneratingPdf(false);
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
                variant="contained"
                color="success"
                onClick={handleExportPdf}
                disabled={
                  isDrawing || isGeneratingPdf || teamsToDraw.length > 0
                }
                startIcon={
                  isGeneratingPdf ? (
                    <CircularProgress size={20} />
                  ) : (
                    <DownloadIcon />
                  )
                }
              >
                {isGeneratingPdf ? "Gerando PDF..." : "Exportar Resultado"}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="info"
                onClick={() => setPotDialogOpen(true)}
                startIcon={<VisibilityIcon />}
              >
                Visualizar Pote
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
                Sorteio finalizado! Clique em "Salvar Grupos" ou "Exportar
                Resultado".
              </Alert>
            )}
          </Paper>
        </Grid>

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

      {/* Dialog da Animação de Sorteio */}
      <Dialog
        open={drawDialogOpen}
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

      {/* Dialog para Visualizar o Pote */}
      <Dialog
        open={potDialogOpen}
        onClose={() => setPotDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Times no Pote ({teamsToDraw.length})
          <IconButton
            onClick={() => setPotDialogOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <List>
            {teamsToDraw.map((team) => (
              <ListItem key={team.id}>
                <ListItemAvatar>
                  <Avatar src={team.url_escudo} />
                </ListItemAvatar>
                <ListItemText
                  primary={team.nome}
                  secondary={team.nome_cartola}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      {/* Snackbar para Feedbacks */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={() => setFeedback({ ...feedback, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setFeedback({ ...feedback, open: false })}
          severity={feedback.type || "info"}
          sx={{ width: "100%" }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SorteioPage;