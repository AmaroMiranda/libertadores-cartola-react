// src/pages/MataMataConfrontosPage.js
import React, { useState, useEffect } from "react";
// import axios from "axios"; // JÁ NÃO É NECESSÁRIO
import api from "../services/api"; // IMPORTAÇÃO DO NOVO CLIENTE
import {
  Typography,
  CircularProgress,
  Box,
  Alert,
  Paper,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import KnockoutMatchCard from "../components/KnockoutMatchCard";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import RelatorioMataMataDocument from "../components/pdf/RelatorioMataMataDocument";

// const API_URL = ...; // JÁ NÃO É NECESSÁRIO

function MataMataConfrontosPage() {
  const [matchesByStage, setMatchesByStage] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedStage, setSelectedStage] = useState("all");

  const stageOrder = [
    "Oitavas de Final",
    "Quartas de Final",
    "Semifinais",
    "Disputa de 3º Lugar", // Adicionado
    "Final",
  ];

  useEffect(() => {
    const fetchKnockoutMatches = async () => {
      setLoading(true);
      setError("");
      try {
        // A chamada agora usa o cliente API centralizado
        const response = await api.get("/mata-mata-confrontos");
        setMatchesByStage(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Não foi possível carregar os confrontos do mata-mata."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchKnockoutMatches();
  }, []);

  const handleGeneratePdf = async () => {
    if (selectedStage === "" || !matchesByStage) return;
    setIsGeneratingPdf(true);
    try {
      let dataForPdf = matchesByStage;
      let stageOrderForPdf = stageOrder;
      let fileName = "relatorio-mata-mata-geral.pdf";

      if (selectedStage !== "all") {
        dataForPdf = { [selectedStage]: matchesByStage[selectedStage] };
        stageOrderForPdf = [selectedStage];
        const stageFileName = selectedStage
          .toLowerCase()
          .replace(" de ", "-")
          .replace(" ", "-");
        fileName = `relatorio-mata-mata-${stageFileName}.pdf`;
      }

      // Garante que o URL base passado para o PDF não tenha o /api duplicado.
      const API_BASE_URL = api.defaults.baseURL.replace("/api", "");

      const doc = (
        <RelatorioMataMataDocument
          matchesByStage={dataForPdf}
          stageOrder={stageOrderForPdf}
          apiUrl={API_BASE_URL} // Passando a URL base da API correta
        />
      );
      const blob = await pdf(doc).toBlob();
      saveAs(blob, fileName);
    } catch (e) {
      console.error("Erro ao gerar PDF do Mata-Mata:", e);
      setError("Ocorreu um erro ao gerar o PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const podeGerarPdf =
    !loading && !error && Object.keys(matchesByStage).length > 0;

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
          Confrontos do Mata-Mata
        </Typography>
        {podeGerarPdf && (
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <FormControl sx={{ minWidth: 220 }} size="small">
              <InputLabel>Exportar Fase</InputLabel>
              <Select
                value={selectedStage}
                label="Exportar Fase"
                onChange={(e) => setSelectedStage(e.target.value)}
              >
                <MenuItem value="all">
                  <em>Todas as Fases</em>
                </MenuItem>
                {stageOrder
                  .filter((stage) => matchesByStage[stage])
                  .map((key) => (
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
          <CircularProgress color="primary" />
          <Typography sx={{ mt: 2 }}>Carregando confrontos...</Typography>
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {!loading && !error && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 5, mt: 4 }}>
          {Object.keys(matchesByStage).length > 0 ? (
            stageOrder
              .filter((stageName) => matchesByStage[stageName])
              .map((stageName) => (
                <Paper
                  key={stageName}
                  elevation={3}
                  sx={{ overflow: "hidden" }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      p: 2,
                      color: "primary.main",
                      backgroundColor: "rgba(0, 229, 255, 0.1)",
                      borderBottom: "2px solid",
                      borderColor: "primary.main",
                      textTransform: "uppercase",
                    }}
                  >
                    {stageName}
                  </Typography>
                  <Box p={{ xs: 2, sm: 3 }}>
                    <Grid container spacing={3} alignItems="stretch">
                      {matchesByStage[stageName].map((match, index) => (
                        <Grid
                          item
                          key={match.id || index}
                          xs={12}
                          md={stageName === "Final" ? 12 : 6}
                        >
                          <Box
                            sx={{
                              height: "100%",
                              maxWidth:
                                stageName === "Final" ? "800px" : "none",
                              width: "100%",
                              margin: stageName === "Final" ? "auto" : "0",
                            }}
                          >
                            <KnockoutMatchCard
                              match={match}
                              title={
                                stageName === "Final"
                                  ? "A Grande Final"
                                  : `Confronto ${index + 1}`
                              }
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Paper>
              ))
          ) : (
            <Alert severity="info">
              Nenhum confronto de mata-mata encontrado.
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}

export default MataMataConfrontosPage;
