import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
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
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import MatchCard from "../components/MatchCard";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import RelatorioConfrontosDocument from "../components/pdf/RelatorioConfrontosDocument";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

function ConfrontosPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  // NOVO: Estado para controlar a rodada selecionada
  const [selectedRound, setSelectedRound] = useState("all");

  useEffect(() => {
    const fetchConfrontos = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`${API_URL}/api/confrontos`);
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

  const matchesByRound = useMemo(() => {
    return matches.reduce((acc, match) => {
      const roundTitle = `Rodada ${match.league_round} (Cartola R${match.cartola_round})`;
      (acc[roundTitle] = acc[roundTitle] || []).push(match);
      return acc;
    }, {});
  }, [matches]);

  // Lógica de geração de PDF atualizada
  const handleGeneratePdf = async () => {
    if (selectedRound === "" || !matchesByRound) return;
    setIsGeneratingPdf(true);

    try {
      let dataForPdf = matchesByRound;
      let fileName = "relatorio-confrontos-todos.pdf";

      // Filtra os dados se uma rodada específica for selecionada
      if (selectedRound !== "all") {
        dataForPdf = { [selectedRound]: matchesByRound[selectedRound] };
        const roundNumber =
          matchesByRound[selectedRound][0]?.league_round || "rodada";
        fileName = `relatorio-confrontos-rodada-${roundNumber}.pdf`;
      }

      const doc = (
        <RelatorioConfrontosDocument
          matchesByRound={dataForPdf}
          apiUrl={API_URL}
        />
      );
      const blob = await pdf(doc).toBlob();
      saveAs(blob, fileName);
    } catch (e) {
      console.error("Erro ao gerar PDF dos confrontos:", e);
      setError("Ocorreu um erro ao gerar o PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const podeGerarPdf = !loading && !error && matches.length > 0;
  const roundKeys = Object.keys(matchesByRound).sort();

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
          Confrontos da Fase de Grupos
        </Typography>

        {/* NOVO: Controles de exportação com seletor de rodada */}
        {podeGerarPdf && (
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Exportar Rodada</InputLabel>
              <Select
                value={selectedRound}
                label="Exportar Rodada"
                onChange={(e) => setSelectedRound(e.target.value)}
              >
                <MenuItem value="all">
                  <em>Todas as Rodadas</em>
                </MenuItem>
                {roundKeys.map((key) => (
                  <MenuItem key={key} value={key}>
                    {key}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
              startIcon={
                isGeneratingPdf ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <DownloadIcon />
                )
              }
            >
              {isGeneratingPdf ? "Gerando..." : "Exportar"}
            </Button>
          </Box>
        )}
      </Box>

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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4, mt: 4 }}>
          {roundKeys.length > 0 ? (
            roundKeys.map((roundName) => (
              <Paper key={roundName} elevation={3} sx={{ overflow: "hidden" }}>
                <Typography
                  variant="h6"
                  sx={{
                    p: 2,
                    borderBottom: "2px solid",
                    borderColor: "primary.main",
                    textTransform: "uppercase",
                  }}
                >
                  {roundName}
                </Typography>
                <Grid container spacing={2} sx={{ p: 2 }}>
                  {matchesByRound[roundName]
                    .sort((a, b) => a.group.localeCompare(b.group))
                    .map((match) => (
                      <Grid item xs={12} sm={6} lg={4} key={match.id}>
                        <MatchCard match={match} />
                      </Grid>
                    ))}
                </Grid>
              </Paper>
            ))
          ) : (
            <Alert severity="info">
              Nenhum confronto gerado. Verifique se há grupos completos de 4
              times e 6 rodadas configuradas no Painel de Controlo.
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}

export default ConfrontosPage;
