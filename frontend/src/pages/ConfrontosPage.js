// src/pages/ConfrontosPage.js
import React, { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import {
  Typography,
  CircularProgress,
  Box,
  Alert,
  Grid,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  TextField,
  InputAdornment, // Importar
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search"; // Importar
import DownloadIcon from "@mui/icons-material/Download";
import ShareIcon from "@mui/icons-material/Share";
import MatchCard from "../components/MatchCard";
import { pdf } from "@react-pdf/renderer";
import { savePdf } from "../utils/download";
import RelatorioConfrontosDocument from "../components/pdf/RelatorioConfrontosDocument";
import RelatorioConfrontosSimplesDocument from "../components/pdf/RelatorioConfrontosSimplesDocument";

function ConfrontosPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingSimplePdf, setIsGeneratingSimplePdf] = useState(false);
  const [selectedRound, setSelectedRound] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    type: "info",
  });

  const showFeedback = (type, message) =>
    setFeedback({ open: true, type, message });

  useEffect(() => {
    const fetchConfrontos = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/confrontos");
        setMatches(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Não foi possível carregar os confrontos."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchConfrontos();
  }, []);

  const matchesByRoundAndGroup = useMemo(() => {
    let filteredMatches =
      selectedRound === "all"
        ? matches
        : matches.filter(
            (match) => `Rodada ${match.league_round}` === selectedRound
          );

    if (searchTerm.trim() !== "") {
      const lowercasedFilter = searchTerm.toLowerCase();
      filteredMatches = filteredMatches.filter(
        (match) =>
          match.home_team.nome.toLowerCase().includes(lowercasedFilter) ||
          match.away_team.nome.toLowerCase().includes(lowercasedFilter) ||
          match.group.toLowerCase().includes(lowercasedFilter)
      );
    }

    return filteredMatches.reduce((acc, match) => {
      const roundTitle = `Rodada ${match.league_round}`;
      if (!acc[roundTitle]) {
        acc[roundTitle] = {};
      }
      if (!acc[roundTitle][match.group]) {
        acc[roundTitle][match.group] = [];
      }
      acc[roundTitle][match.group].push(match);
      return acc;
    }, {});
  }, [matches, selectedRound, searchTerm]);

  const handleGeneratePdf = async () => {
    const originalMatchesByRound = matches.reduce((acc, match) => {
      const roundTitle = `Rodada ${match.league_round}`;
      (acc[roundTitle] = acc[roundTitle] || []).push(match);
      return acc;
    }, {});

    if (selectedRound === "" || !Object.keys(originalMatchesByRound).length)
      return;
    setIsGeneratingPdf(true);
    try {
      let dataForPdf = originalMatchesByRound;
      let fileName = "relatorio-confrontos-todos.pdf";
      if (selectedRound !== "all") {
        dataForPdf = { [selectedRound]: originalMatchesByRound[selectedRound] };
        fileName = `relatorio-confrontos-${selectedRound
          .toLowerCase()
          .replace(" ", "-")}.pdf`;
      }
      const API_BASE_URL = api.defaults.baseURL.replace("/api", "");
      const doc = (
        <RelatorioConfrontosDocument
          matchesByRound={dataForPdf}
          apiUrl={API_BASE_URL}
        />
      );
      const blob = await pdf(doc).toBlob();
      await savePdf(blob, fileName, showFeedback);
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
      showFeedback("error", "Falha ao gerar o PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleGenerateSimplePdf = async () => {
    const originalMatchesByRound = matches.reduce((acc, match) => {
      const roundTitle = `Rodada ${match.league_round}`;
      (acc[roundTitle] = acc[roundTitle] || []).push(match);
      return acc;
    }, {});

    if (selectedRound === "" || !Object.keys(originalMatchesByRound).length)
      return;
    setIsGeneratingSimplePdf(true);
    try {
      let dataForPdf = originalMatchesByRound;
      let fileName = "relatorio-confrontos-simples-todos.pdf";
      if (selectedRound !== "all") {
        dataForPdf = { [selectedRound]: originalMatchesByRound[selectedRound] };
        fileName = `relatorio-confrontos-simples-${selectedRound
          .toLowerCase()
          .replace(" ", "-")}.pdf`;
      }
      const API_BASE_URL = api.defaults.baseURL.replace("/api", "");
      const doc = (
        <RelatorioConfrontosSimplesDocument
          matchesByRound={dataForPdf}
          apiUrl={API_BASE_URL}
        />
      );
      const blob = await pdf(doc).toBlob();
      await savePdf(blob, fileName, showFeedback);
    } catch (e) {
      console.error("Erro ao gerar PDF simples:", e);
      showFeedback("error", "Falha ao gerar o PDF simplificado.");
    } finally {
      setIsGeneratingSimplePdf(false);
    }
  };

  const allRoundKeys = useMemo(
    () =>
      [...new Set(matches.map((match) => `Rodada ${match.league_round}`))].sort(
        (a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0])
      ),
    [matches]
  );

  const roundKeys = Object.keys(matchesByRoundAndGroup).sort(
    (a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0])
  );
  const podeGerarPdf = !loading && !error && matches.length > 0;

  return (
    <Box>
      <Typography
        variant="h4"
        component="h1"
        sx={{ fontWeight: "bold", mb: 4 }}
      >
        Confrontos da Fase de Grupos
      </Typography>

      {podeGerarPdf && (
        <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                label="Buscar por time ou grupo..."
                variant="outlined"
                fullWidth
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filtrar por Rodada</InputLabel>
                <Select
                  value={selectedRound}
                  label="Filtrar por Rodada"
                  onChange={(e) => setSelectedRound(e.target.value)}
                >
                  <MenuItem value="all">
                    <em>Todas as Rodadas</em>
                  </MenuItem>
                  {allRoundKeys.map((key) => (
                    <MenuItem key={key} value={key}>
                      {key}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleGeneratePdf}
                  disabled={isGeneratingPdf || isGeneratingSimplePdf}
                  startIcon={
                    isGeneratingPdf ? (
                      <CircularProgress size={20} />
                    ) : (
                      <DownloadIcon />
                    )
                  }
                >
                  Completo
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  onClick={handleGenerateSimplePdf}
                  disabled={isGeneratingSimplePdf || isGeneratingPdf}
                  startIcon={
                    isGeneratingSimplePdf ? (
                      <CircularProgress size={20} />
                    ) : (
                      <ShareIcon />
                    )
                  }
                >
                  Confrontos
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {loading && (
        <Box display="flex" flexDirection="column" alignItems="center" my={5}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>
            A gerar e buscar resultados dos confrontos...
          </Typography>
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {!loading && !error && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 5, mt: 2 }}>
          {roundKeys.length > 0 ? (
            roundKeys.map((roundName) => (
              <Paper key={roundName} elevation={3} sx={{ overflow: "hidden" }}>
                <Typography
                  variant="h5"
                  sx={{
                    p: 2,
                    borderBottom: "2px solid",
                    borderColor: "primary.main",
                    textTransform: "uppercase",
                  }}
                >
                  {roundName}
                </Typography>
                <Box sx={{ p: { xs: 1, sm: 2 } }}>
                  {Object.keys(matchesByRoundAndGroup[roundName])
                    .sort()
                    .map((groupName) => (
                      <Box
                        key={groupName}
                        sx={{ mb: 4, "&:last-child": { mb: 0 } }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color: "primary.main",
                            mb: 2,
                            pl: 1,
                            fontWeight: "bold",
                          }}
                        >
                          Grupo {groupName}
                        </Typography>
                        <Grid container spacing={2}>
                          {matchesByRoundAndGroup[roundName][groupName].map(
                            (match) => (
                              <Grid item xs={12} md={6} key={match.id}>
                                <MatchCard match={match} />
                              </Grid>
                            )
                          )}
                        </Grid>
                      </Box>
                    ))}
                </Box>
              </Paper>
            ))
          ) : (
            <Alert severity="info">
              Nenhum confronto encontrado para os filtros aplicados.
            </Alert>
          )}
        </Box>
      )}
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

export default ConfrontosPage;
