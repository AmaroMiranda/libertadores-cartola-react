// src/pages/AdminPage.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import api from "../services/api";
import {
  Container,
  Typography,
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Alert,
  CircularProgress,
  ListItemButton,
  IconButton,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  useTheme,
  useMediaQuery,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CasinoIcon from "@mui/icons-material/Casino";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import RelatorioTimesAdminDocument from "../components/pdf/RelatorioTimesAdminDocument";
import ShareIcon from "@mui/icons-material/Share";

// Componente para o Painel de Configurações
const SettingsPanel = ({
  rounds,
  knockoutRounds,
  onRoundsChange,
  onKoRoundsChange,
  onSave,
}) => (
  <Paper
    elevation={2}
    component="form"
    onSubmit={onSave}
    sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}
  >
    <Typography variant="h6" gutterBottom>
      1. Configurar Rodadas
    </Typography>
    <TextField
      label="Fase de Grupos (6 rodadas, separadas por vírgula)"
      placeholder="Ex: 1, 2, 3, 4, 5, 6"
      value={rounds}
      onChange={onRoundsChange}
      fullWidth
      margin="normal"
    />
    <Divider sx={{ my: 2 }}>Mata-Mata (Ida e Volta)</Divider>
    <Grid container spacing={2}>
      {Object.keys(knockoutRounds).map((stage) => (
        <Grid item xs={12} sm={6} md={3} key={stage}>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ textTransform: "capitalize" }}
          >
            {stage === "terceiro_lugar" ? "3º Lugar" : stage}
          </Typography>
          <TextField
            label="Ida"
            name={`${stage}-ida`}
            value={knockoutRounds[stage].ida}
            onChange={(e) => onKoRoundsChange(e, stage, "ida")}
            type="number"
            fullWidth
            size="small"
            sx={{ mb: 1 }}
          />
          <TextField
            label="Volta"
            name={`${stage}-volta`}
            value={knockoutRounds[stage].volta}
            onChange={(e) => onKoRoundsChange(e, stage, "volta")}
            type="number"
            fullWidth
            size="small"
          />
        </Grid>
      ))}
    </Grid>
    <Button
      type="submit"
      variant="contained"
      color="primary"
      fullWidth
      sx={{ mt: 3 }}
    >
      Salvar Todas as Configurações
    </Button>
  </Paper>
);

// Componente para o Painel de Busca de Pontuações
const ScoresPanel = ({
  onFetchGroup,
  onFetchKnockout,
  isFetchingGroup,
  isFetchingKnockout,
}) => (
  <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
    <Typography variant="h6" gutterBottom>
      2. Buscar Pontuações
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Busque as pontuações de forma separada para cada fase da competição. O
      processo pode demorar.
    </Typography>
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          onClick={onFetchGroup}
          disabled={isFetchingGroup || isFetchingKnockout}
          startIcon={
            isFetchingGroup ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <CloudDownloadIcon />
            )
          }
        >
          {isFetchingGroup ? "Buscando..." : "Pontos (Fase de Grupos)"}
        </Button>
      </Grid>
      <Grid item xs={12} md={6}>
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          onClick={onFetchKnockout}
          disabled={isFetchingGroup || isFetchingKnockout}
          startIcon={
            isFetchingKnockout ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <CloudDownloadIcon />
            )
          }
        >
          {isFetchingKnockout ? "Buscando..." : "Pontos (Mata-Mata)"}
        </Button>
      </Grid>
    </Grid>
  </Paper>
);

// Componente para o Painel de Gestão de Times
const TeamsPanel = ({
  teams,
  teamFilter,
  onTeamFilterChange,
  onRefresh,
  isRefreshing,
  onSearch,
  onAdd,
  onDelete,
  onGroupChange,
  searchTerm,
  searchResults,
  isLoadingSearch,
  showFeedback,
}) => {
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleDeleteClick = (team) => setTeamToDelete(team);
  const handleDeleteConfirm = () => {
    if (teamToDelete) onDelete(teamToDelete.id);
    setTeamToDelete(null);
  };
  const handleDeleteCancel = () => setTeamToDelete(null);

  const handleGeneratePdf = async () => {
    if (!teams || teams.length === 0) return;
    setIsGeneratingPdf(true);
    showFeedback("info", "Gerando PDF da lista de times...");

    try {
      const API_BASE_URL = api.defaults.baseURL.replace("/api", "");

      const doc = (
        <RelatorioTimesAdminDocument teams={teams} apiUrl={API_BASE_URL} />
      );
      const blob = await pdf(doc).toBlob();
      saveAs(blob, "relatorio-times-admin.pdf");
      showFeedback("success", "PDF gerado com sucesso!");
    } catch (e) {
      console.error("Erro ao gerar PDF da lista de times:", e);
      showFeedback("error", "Ocorreu um erro ao gerar o PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h5" component="h2">
          3. Gerir Times ({teams.length})
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            onClick={onRefresh}
            disabled={isRefreshing || teams.length === 0}
            startIcon={
              isRefreshing ? <CircularProgress size={20} /> : <RefreshIcon />
            }
          >
            {isRefreshing ? "Atualizando..." : "Atualizar Dados"}
          </Button>

          <Button
            variant="contained"
            color="secondary"
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf || teams.length === 0}
            startIcon={
              isGeneratingPdf ? <CircularProgress size={20} /> : <ShareIcon />
            }
          >
            {isGeneratingPdf ? "Gerando..." : "Exportar PDF"}
          </Button>
        </Box>
      </Box>

      <Paper elevation={2} sx={{ p: 2, mb: 1, position: "relative" }}>
        <Typography variant="subtitle1" gutterBottom>
          Adicionar Novo Time
        </Typography>
        <TextField
          label="Digite o nome de um time do Cartola para buscar..."
          value={searchTerm}
          onChange={onSearch}
          fullWidth
          autoComplete="off"
        />
        {isLoadingSearch && (
          <CircularProgress
            size={24}
            sx={{ position: "absolute", top: "60%", right: 16, mt: "-12px" }}
          />
        )}
      </Paper>

      {searchResults.length > 0 && (
        <Paper
          sx={{
            maxHeight: 300,
            overflow: "auto",
            mb: 4,
            position: "relative",
            zIndex: 1200,
          }}
        >
          <List>
            {searchResults.map((team) => (
              <ListItemButton key={team.time_id} onClick={() => onAdd(team)}>
                <ListItemAvatar>
                  <Avatar src={team.url_escudo_png} />
                </ListItemAvatar>
                <ListItemText
                  primary={team.nome}
                  secondary={`Cartoleiro: ${team.nome_cartola}`}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 4 }}>
        Times na Competição
      </Typography>

      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Filtrar times por nome, cartoleiro ou grupo..."
          value={teamFilter}
          onChange={onTeamFilterChange}
          fullWidth
          autoComplete="off"
        />
      </Paper>

      <List component={Paper} elevation={2} sx={{ p: 0 }}>
        {teams.length > 0 ? (
          teams.map((team, index) => (
            <React.Fragment key={team.id}>
              <ListItem sx={{ pb: isMobile ? 1 : 2, pt: 2, flexWrap: "wrap" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    gap: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    component="span"
                    sx={{
                      fontWeight: "bold",
                      color: "text.secondary",
                      width: "30px",
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}.
                  </Typography>
                  <ListItemAvatar>
                    <Avatar src={team.url_escudo} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={team.nome}
                    secondary={team.nome_cartola || "N/A"}
                    primaryTypographyProps={{ noWrap: true }}
                    secondaryTypographyProps={{ noWrap: true }}
                    sx={{ flexGrow: 1 }}
                  />
                  {!isMobile && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel>Grupo</InputLabel>
                        <Select
                          value={team.group || "none"}
                          label="Grupo"
                          onChange={(e) =>
                            onGroupChange(team.id, e.target.value)
                          }
                        >
                          <MenuItem value="none">
                            <em>Nenhum</em>
                          </MenuItem>
                          {["A", "B", "C", "D", "E", "F", "G", "H"].map((g) => (
                            <MenuItem key={g} value={g}>
                              {g}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteClick(team)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                {isMobile && (
                  <Box
                    sx={{
                      display: "flex",
                      width: "100%",
                      pt: 1.5,
                      gap: 1,
                      pl: "56px",
                    }}
                  >
                    <FormControl fullWidth size="small">
                      <InputLabel>Grupo</InputLabel>
                      <Select
                        value={team.group || "none"}
                        label="Grupo"
                        onChange={(e) => onGroupChange(team.id, e.target.value)}
                      >
                        <MenuItem value="none">
                          <em>Nenhum</em>
                        </MenuItem>
                        {["A", "B", "C", "D", "E", "F", "G", "H"].map((g) => (
                          <MenuItem key={g} value={g}>
                            {g}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <IconButton
                      aria-label="delete"
                      onClick={() => handleDeleteClick(team)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </ListItem>
              {index < teams.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))
        ) : (
          <ListItem>
            <ListItemText primary="Nenhum time corresponde ao filtro." />
          </ListItem>
        )}
      </List>

      <Dialog open={!!teamToDelete} onClose={handleDeleteCancel}>
        <DialogTitle>Confirmar Remoção</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem a certeza que deseja remover o time "{teamToDelete?.nome}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Componente Principal da Página
function AdminPage() {
  const [myTeams, setMyTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [rounds, setRounds] = useState("");
  const [knockoutRounds, setKnockoutRounds] = useState({
    oitavas: { ida: "", volta: "" },
    quartas: { ida: "", volta: "" },
    semis: { ida: "", volta: "" },
    terceiro_lugar: { ida: "", volta: "" },
    final: { ida: "", volta: "" },
  });
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingGroupScores, setIsFetchingGroupScores] = useState(false);
  const [isFetchingKnockoutScores, setIsFetchingKnockoutScores] =
    useState(false);
  const [teamFilter, setTeamFilter] = useState("");
  const [feedback, setFeedback] = useState({
    open: false,
    type: "info",
    message: "",
  });
  const [resetGroupsDialogOpen, setResetGroupsDialogOpen] = useState(false);

  const showFeedback = (type, message) =>
    setFeedback({ open: true, type, message });

  const fetchMyTeams = useCallback(async () => {
    try {
      const response = await api.get("/teams");
      setMyTeams(
        (response.data || []).sort((a, b) => a.nome.localeCompare(b.nome))
      );
    } catch (err) {
      showFeedback("error", "Falha ao carregar a lista de times.");
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get("/settings");
      const { group_stage_rounds = [], knockout_rounds = {} } =
        response.data || {};
      setRounds(group_stage_rounds.join(", "));
      setKnockoutRounds({
        oitavas: {
          ida: knockout_rounds.oitavas?.[0] || "",
          volta: knockout_rounds.oitavas?.[1] || "",
        },
        quartas: {
          ida: knockout_rounds.quartas?.[0] || "",
          volta: knockout_rounds.quartas?.[1] || "",
        },
        semis: {
          ida: knockout_rounds.semis?.[0] || "",
          volta: knockout_rounds.semis?.[1] || "",
        },
        final: {
          ida: knockout_rounds.final?.[0] || "",
          volta: knockout_rounds.final?.[1] || "",
        },
        terceiro_lugar: {
          ida: knockout_rounds.terceiro_lugar?.[0] || "",
          volta: knockout_rounds.terceiro_lugar?.[1] || "",
        },
      });
    } catch (err) {
      showFeedback("error", "Falha ao carregar as configurações.");
    }
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    showFeedback("info", "Salvando configurações...");
    try {
      const groupRounds = rounds
        .split(",")
        .map((r) => parseInt(r.trim(), 10))
        .filter((r) => !isNaN(r) && r > 0);
      const parseRound = (val) => {
        const num = parseInt(val, 10);
        return !isNaN(num) && num > 0 ? num : null;
      };
      const koRoundsPayload = {
        oitavas: [
          parseRound(knockoutRounds.oitavas.ida),
          parseRound(knockoutRounds.oitavas.volta),
        ],
        quartas: [
          parseRound(knockoutRounds.quartas.ida),
          parseRound(knockoutRounds.quartas.volta),
        ],
        semis: [
          parseRound(knockoutRounds.semis.ida),
          parseRound(knockoutRounds.semis.volta),
        ],
        final: [
          parseRound(knockoutRounds.final.ida),
          parseRound(knockoutRounds.final.volta),
        ],
        terceiro_lugar: [
          parseRound(knockoutRounds.terceiro_lugar.ida),
          parseRound(knockoutRounds.terceiro_lugar.volta),
        ],
      };
      await api.put("/settings", {
        group_stage_rounds: groupRounds,
        knockout_rounds: koRoundsPayload,
      });
      showFeedback("success", "Configurações salvas com sucesso!");
    } catch (err) {
      showFeedback(
        "error",
        err.response?.data?.message || "Erro ao salvar as configurações."
      );
    }
  };

  const handleFetchGroupScores = async () => {
    setIsFetchingGroupScores(true);
    showFeedback("info", "Iniciando busca (Fase de Grupos)...");
    try {
      const response = await api.post("/scores/refresh/group-stage");
      showFeedback("success", response.data.message);
    } catch (err) {
      showFeedback(
        "error",
        err.response?.data?.message || "Ocorreu um erro na busca."
      );
    } finally {
      setIsFetchingGroupScores(false);
    }
  };

  const handleFetchKnockoutScores = async () => {
    setIsFetchingKnockoutScores(true);
    showFeedback("info", "Iniciando busca (Mata-Mata)... Isso pode demorar.");
    try {
      const response = await api.post("/scores/refresh/knockout");
      showFeedback("success", response.data.message);
    } catch (err) {
      showFeedback(
        "error",
        err.response?.data?.message || "Ocorreu um erro na busca."
      );
    } finally {
      setIsFetchingKnockoutScores(false);
    }
  };

  const handleAddTeam = async (teamToAdd) => {
    try {
      const newTeamData = {
        cartola_id: teamToAdd.time_id,
        nome: teamToAdd.nome,
        url_escudo: teamToAdd.url_escudo_png,
        nome_cartola: teamToAdd.nome_cartola,
      };
      await api.post("/teams", newTeamData);
      setSearchTerm("");
      setSearchResults([]);
      fetchMyTeams();
      showFeedback("success", `Time "${teamToAdd.nome}" adicionado!`);
    } catch (err) {
      showFeedback(
        "error",
        err.response?.data?.message || "Falha ao adicionar o time."
      );
    }
  };

  const handleDeleteTeam = async (id) => {
    try {
      await api.delete(`/teams/${id}`);
      fetchMyTeams();
      showFeedback("success", "Time removido com sucesso!");
    } catch (err) {
      showFeedback("error", "Falha ao remover o time.");
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    showFeedback("info", "Atualizando dados de todos os times...");
    try {
      await api.post("/teams/refresh-all");
      fetchMyTeams();
      showFeedback("success", "Dados dos times atualizados!");
    } catch (err) {
      showFeedback("error", "Falha ao atualizar os dados dos times.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGroupChange = async (teamId, newGroupValue) => {
    const originalTeams = [...myTeams];
    const newGroup = newGroupValue === "none" ? null : newGroupValue;
    const updatedTeams = myTeams.map((t) =>
      t.id === teamId ? { ...t, group: newGroup } : t
    );
    setMyTeams(updatedTeams);
    try {
      await api.put(`/teams/${teamId}`, { group: newGroup });
      showFeedback("success", "Grupo do time atualizado.");
    } catch (err) {
      showFeedback("error", "Falha ao atualizar o grupo do time. Revertendo.");
      setMyTeams(originalTeams);
    }
  };

  const handleResetGroups = async () => {
    setResetGroupsDialogOpen(false);
    showFeedback("info", "Resetando todos os grupos...");
    try {
      const response = await api.post("/teams/reset-groups");
      showFeedback("success", response.data.message);
      fetchMyTeams();
    } catch (err) {
      showFeedback(
        "error",
        err.response?.data?.message || "Ocorreu um erro ao resetar os grupos."
      );
    }
  };

  const handleKnockoutRoundChange = (e, stage, leg) => {
    const { value } = e.target;
    setKnockoutRounds((prev) => ({
      ...prev,
      [stage]: { ...prev[stage], [leg]: value },
    }));
  };

  const filteredTeams = useMemo(() => {
    if (!teamFilter) {
      return myTeams;
    }
    const filterText = teamFilter.toLowerCase();
    return myTeams.filter(
      (team) =>
        team.nome.toLowerCase().includes(filterText) ||
        (team.nome_cartola &&
          team.nome_cartola.toLowerCase().includes(filterText)) ||
        (team.group && team.group.toLowerCase() === filterText)
    );
  }, [myTeams, teamFilter]);

  useEffect(() => {
    fetchMyTeams();
    fetchSettings();
  }, [fetchMyTeams, fetchSettings]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsLoadingSearch(true);
      try {
        const response = await api.get(`/search-teams?q=${searchTerm}`);
        setSearchResults(response.data);
      } catch (err) {
        showFeedback("error", "Não foi possível buscar os times.");
      } finally {
        setIsLoadingSearch(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Painel de Gestão
      </Typography>

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

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Gestão dos Grupos
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            component={RouterLink}
            to="/admin/sorteio"
            variant="contained"
            color="primary"
            startIcon={<CasinoIcon />}
          >
            Ir para a Página de Sorteio
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setResetGroupsDialogOpen(true)}
            startIcon={<RestartAltIcon />}
          >
            Resetar Todos os Grupos
          </Button>
        </Box>
      </Paper>

      <SettingsPanel
        rounds={rounds}
        knockoutRounds={knockoutRounds}
        onRoundsChange={(e) => setRounds(e.target.value)}
        onKoRoundsChange={handleKnockoutRoundChange}
        onSave={handleSaveSettings}
      />

      <ScoresPanel
        onFetchGroup={handleFetchGroupScores}
        onFetchKnockout={handleFetchKnockoutScores}
        isFetchingGroup={isFetchingGroupScores}
        isFetchingKnockout={isFetchingKnockoutScores}
      />

      <Divider sx={{ my: 4 }} />

      <TeamsPanel
        teams={filteredTeams}
        teamFilter={teamFilter}
        onTeamFilterChange={(e) => setTeamFilter(e.target.value)}
        isRefreshing={isRefreshing}
        onRefresh={handleRefreshAll}
        onSearch={(e) => setSearchTerm(e.target.value)}
        searchTerm={searchTerm}
        searchResults={searchResults}
        isLoadingSearch={isLoadingSearch}
        onAdd={handleAddTeam}
        onDelete={handleDeleteTeam}
        onGroupChange={handleGroupChange}
        showFeedback={showFeedback}
      />

      <Dialog
        open={resetGroupsDialogOpen}
        onClose={() => setResetGroupsDialogOpen(false)}
      >
        <DialogTitle>Confirmar Ação</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja resetar todos os grupos? Esta ação removerá
            todos os times de seus grupos atuais e não pode ser desfeita. Você
            precisará realizar um novo sorteio.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetGroupsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleResetGroups} color="error" autoFocus>
            Sim, Resetar Grupos
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminPage;
