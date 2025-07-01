// src/pages/HomePage.js
import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import TabelaGrupo from "../components/TabelaGrupo";
import {
  Typography,
  CircularProgress,
  Box,
  Alert,
  Button,
  Snackbar, // Importe o Snackbar
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { pdf } from "@react-pdf/renderer";
import { savePdf } from "../utils/download"; // A função que já criamos
import RelatorioGruposDocument from "../components/pdf/RelatorioGruposDocument";

function HomePage() {
  const [grupos, setGrupos] = useState({});
  const [settings, setSettings] = useState({ group_stage_rounds: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    type: "info",
  });

  const showFeedback = (type, message) =>
    setFeedback({ open: true, type, message });

  const fetchResultados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resultadosRes, settingsRes] = await Promise.all([
        api.get("/fase-de-grupos"),
        api.get("/settings"),
      ]);
      const resultadosData = resultadosRes.data || [];
      const gruposData = resultadosData.reduce((acc, time) => {
        const grupo =
          time.group &&
          typeof time.group === "string" &&
          time.group.trim() !== ""
            ? time.group
            : "Sem Grupo";
        (acc[grupo] = acc[grupo] || []).push(time);
        return acc;
      }, {});
      setGrupos(gruposData);
      setSettings(settingsRes.data || { group_stage_rounds: [] });
    } catch (err) {
      setError(
        "Não foi possível carregar os resultados. Verifique se o servidor está a ser executado."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResultados();
  }, [fetchResultados]);

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const API_BASE_URL = api.defaults.baseURL.replace("/api", "");
      const doc = (
        <RelatorioGruposDocument
          grupos={grupos}
          rounds={settings.group_stage_rounds || []}
          apiUrl={API_BASE_URL}
        />
      );
      const blob = await pdf(doc).toBlob();
      await savePdf(
        blob,
        "classificacao-libertadores-cartola.pdf",
        showFeedback
      );
    } catch (pdfError) {
      console.error("Erro ao gerar o PDF:", pdfError);
      showFeedback("error", "Ocorreu um erro ao gerar o PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const podeGerarPdf = !loading && !error && Object.keys(grupos).length > 0;

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
          Classificação da Fase de Grupos
        </Typography>

        {podeGerarPdf && (
          <Button
            variant="contained"
            startIcon={
              isGeneratingPdf ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <DownloadIcon />
              )
            }
            disabled={isGeneratingPdf}
            onClick={handleGeneratePdf}
          >
            {isGeneratingPdf ? "A Gerar PDF..." : "Exportar PDF"}
          </Button>
        )}
      </Box>

      {loading && (
        <Box display="flex" flexDirection="column" alignItems="center" my={5}>
          <CircularProgress color="primary" />
          <Typography sx={{ mt: 2 }}>A carregar resultados...</Typography>
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {!loading && !error && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            gap: 3,
          }}
        >
          {Object.keys(grupos).length > 0 &&
          Object.values(grupos).some((g) => g.length > 0) ? (
            Object.keys(grupos)
              .sort()
              .map((nomeGrupo) => {
                if (grupos[nomeGrupo].length === 0) return null;
                return (
                  <TabelaGrupo
                    key={nomeGrupo}
                    nomeGrupo={nomeGrupo}
                    times={grupos[nomeGrupo]}
                    rounds={settings.group_stage_rounds || []}
                  />
                );
              })
          ) : (
            <Alert severity="info" sx={{ gridColumn: "1 / -1" }}>
              Nenhum resultado para exibir.
            </Alert>
          )}
        </Box>
      )}
      {/* Snackbar para exibir feedbacks */}
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

export default HomePage;
