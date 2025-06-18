import React from "react";
import {
  Typography,
  Box,
  Paper,
  Avatar,
  Tooltip,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";

const abbreviateName = (name) => {
  if (!name || typeof name !== "string") return "N/A";
  const parts = name
    .trim()
    .split(" ")
    .filter((p) => p);
  if (parts.length > 1) {
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1].charAt(0);
    return `${firstName} ${lastInitial}.`;
  }
  return name;
};

function MatchCard({ match }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const homeScore = Number(match.home_team.score) || 0;
  const awayScore = Number(match.away_team.score) || 0;

  const isHomeWinner = homeScore > awayScore;
  const isAwayWinner = awayScore > homeScore;

  const TeamDisplay = ({ team, score, isWinner }) => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Avatar
        src={team.url_escudo}
        sx={{
          width: 48,
          height: 48,
          mb: 1,
          backgroundColor: "rgba(255,255,255,0.1)",
          p: 0.5,
        }}
        variant="rounded"
      />
      <Tooltip
        title={`${team.nome} • ${team.nome_cartola || ""}`}
        placement="top"
      >
        <Typography noWrap sx={{ fontWeight: 600, width: "100%" }}>
          {team.nome}
        </Typography>
      </Tooltip>
      <Typography variant="caption" color="text.secondary" noWrap>
        {abbreviateName(team.nome_cartola)}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          fontWeight: isWinner ? "bold" : 500,
          color: isWinner ? "success.main" : "text.primary",
          fontFamily: "monospace",
          mt: 1,
        }}
      >
        {score.toFixed(2)}
      </Typography>
    </Box>
  );

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Chip label={`Grupo ${match.group}`} size="small" variant="outlined" />
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          flexGrow: 1,
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        {/* Layout Mobile e Desktop condicional */}
        {isMobile ? (
          <>
            <TeamDisplay
              team={match.home_team}
              score={homeScore}
              isWinner={isHomeWinner}
            />
            <Divider sx={{ my: 2, width: "50%" }}>
              <Typography
                variant="caption"
                color="primary"
                sx={{ fontWeight: "bold" }}
              >
                VS
              </Typography>
            </Divider>
            <TeamDisplay
              team={match.away_team}
              score={awayScore}
              isWinner={isAwayWinner}
            />
          </>
        ) : (
          <>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TeamDisplay
                team={match.home_team}
                score={homeScore}
                isWinner={isHomeWinner}
              />
            </Box>
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }}>
              <Typography
                variant="caption"
                color="primary"
                sx={{ fontWeight: "bold" }}
              >
                VS
              </Typography>
            </Divider>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TeamDisplay
                team={match.away_team}
                score={awayScore}
                isWinner={isAwayWinner}
              />
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}

export default MatchCard;
