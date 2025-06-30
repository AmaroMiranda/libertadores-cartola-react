// src/pages/MataMataPage.js
import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import {
  Typography,
  CircularProgress,
  Box,
  Alert,
  Paper,
  useTheme,
  useMediaQuery,
  Grid,
  Divider,
} from "@mui/material";
import SwipeLeftIcon from "@mui/icons-material/SwipeLeft";
import BracketMatch from "../components/BracketMatch";
import ChampionColumn from "../components/ChampionColumn";

const Connector = ({ row, col, span, isWinnerPath }) => (
    <Box sx={{ gridColumn: col, gridRow: `${row} / span ${span}`, display: "flex", alignItems: "center", transition: "all 0.3s ease-in-out", }}>
        <Box sx={{ width: "50%", height: "2px", bgcolor: isWinnerPath ? "primary.main" : "divider", }} />
        <Box sx={{ width: "50%", height: "100%", border: "2px solid", borderColor: isWinnerPath ? "primary.main" : "divider", borderLeft: "none", borderRadius: "0 8px 8px 0", }} />
    </Box>
);

const MainBracket = ({ stages, campeao }) => {
    const initialMatches = stages.find(s => s.key === 'oitavas')?.matches.length || 0;
    if (initialMatches === 0) return null;

    const totalRows = initialMatches * 2;
    const stageCount = stages.length;

    return (
        <Paper elevation={3} sx={{ p: { xs: 1, sm: 2, md: 3 }, overflowX: "auto" }}>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${stageCount}, minmax(300px, 1fr) 50px) minmax(280px, 1fr)`,
                    gridTemplateRows: `auto repeat(${totalRows}, 1fr)`,
                    gap: "10px 0",
                    alignItems: "center",
                    minWidth: "fit-content",
                }}
            >
                {/* Titles */}
                {stages.map((stage, stageIndex) => (
                    <Typography key={`title-${stage.key}`} variant="h6" sx={{ gridColumn: stageIndex * 2 + 1, gridRow: 1, textAlign: 'center', fontWeight: 'bold', color: 'text.secondary', alignSelf: 'end', pb: 2 }}>
                        {stage.title}
                    </Typography>
                ))}
                <Typography variant="h6" sx={{ gridColumn: stageCount * 2 + 1, gridRow: 1, textAlign: 'center', fontWeight: 'bold', color: 'text.secondary', alignSelf: 'end', pb: 2 }}>
                    Campeão
                </Typography>

                {/* Matches and Connectors */}
                {stages.flatMap((stage, stageIndex) => {
                    const rowMultiplier = 2 ** (stageIndex + 1);
                    const elements = [];
                    stage.matches.forEach((match, matchIndex) => {
                        const rowStart = matchIndex * rowMultiplier + rowMultiplier / 2 + 1;
                        let matchTitle = "";
                        switch (stage.key) {
                            case "final": matchTitle = "A Grande Final"; break;
                            case "semis": matchTitle = `Semifinal ${matchIndex + 1}`; break;
                            case "quartas": matchTitle = `Quartas ${matchIndex + 1}`; break;
                            case "oitavas": matchTitle = `Oitavas ${matchIndex + 1}`; break;
                            default: matchTitle = `Confronto ${matchIndex + 1}`;
                        }
                        elements.push(
                            <Box key={`${stage.key}-${matchIndex}`} sx={{ gridColumn: stageIndex * 2 + 1, gridRow: `${rowStart} / span 2`, alignSelf: 'center', justifySelf: 'center' }}>
                                <BracketMatch match={match} title={matchTitle} />
                            </Box>
                        );
                        if (stageIndex < stageCount - 1) {
                            const nextStage = stages[stageIndex + 1];
                            const nextMatchIndex = Math.floor(matchIndex / 2);
                            const nextMatch = nextStage?.matches[nextMatchIndex];
                            const isWinnerPath = match.winnerTeam && (match.winnerTeam.id === nextMatch?.team1?.id || match.winnerTeam.id === nextMatch?.team2?.id);
                            elements.push(
                                <Connector key={`conn-${stage.key}-${matchIndex}`} row={rowStart} col={stageIndex * 2 + 2} span={2} isWinnerPath={isWinnerPath} />
                            );
                        }
                    });
                    return elements;
                })}

                {/* Champion Column */}
                <Box sx={{ gridColumn: stageCount * 2 + 1, gridRow: `2 / span ${totalRows}`, display: 'flex', alignItems: 'center', justifySelf: 'center' }}>
                    <ChampionColumn campeao={campeao} title="Campeão" />
                </Box>
            </Box>
        </Paper>
    );
};


function MataMataPage() {
  const [bracketData, setBracketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("lg"));

  const fetchBracket = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/mata-mata");
      setBracketData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Falha ao carregar o chaveamento."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBracket();
  }, [fetchBracket]);

  const mainStages = bracketData
    ? [
        { key: "oitavas", title: "Oitavas de Final", matches: bracketData.oitavas },
        { key: "quartas", title: "Quartas de Final", matches: bracketData.quartas },
        { key: "semis", title: "Semifinais", matches: bracketData.semis },
        { key: "final", title: "Final", matches: bracketData.final },
      ].filter((s) => s && s.matches && s.matches.length > 0)
    : [];
    
  const terceiroLugarMatch = bracketData?.terceiroLugar?.[0];

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
        <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
          Fase de Mata-Mata
        </Typography>
      </Box>

      {isSmallScreen && !loading && bracketData && (
        <Alert severity="info" icon={<SwipeLeftIcon />} sx={{ mb: 2 }}>
          Arraste para o lado para ver todas as fases do chaveamento.
        </Alert>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress color="primary" />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && bracketData && (
        <>
            <MainBracket stages={mainStages} campeao={bracketData.campeao} />

            {terceiroLugarMatch && (
                <Paper elevation={3} sx={{ mt: 4, p: { xs: 2, sm: 3 } }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.secondary', textAlign: 'center', mb: 2 }}>
                        Disputa pelo 3º Lugar
                    </Typography>
                    <Grid container spacing={2} justifyContent="center" alignItems="center">
                        <Grid item xs={12} md={6} lg={5}>
                            <BracketMatch match={terceiroLugarMatch} title="Confronto" />
                        </Grid>
                        <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Divider orientation={isSmallScreen ? 'horizontal' : 'vertical'} flexItem />
                        </Grid>
                        <Grid item xs={12} md={5} lg={4}>
                            <ChampionColumn campeao={bracketData.terceiro} title="3º Lugar" />
                        </Grid>
                    </Grid>
                </Paper>
            )}
        </>
      )}
    </Box>
  );
}

export default MataMataPage;
