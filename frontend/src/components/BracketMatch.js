import React from "react";
import {
  Typography,
  Box,
  Paper,
  Avatar,
  Tooltip,
  Divider,
} from "@mui/material";

const BracketMatch = ({ match, title }) => {
  const { team1, team2, aggregates, scores, winnerTeam } = match || {};

  const TeamLine = ({
    team,
    aggregateScore,
    idaScore,
    voltaScore,
    isWinner,
  }) => {
    const hasScores =
      typeof idaScore === "number" || typeof voltaScore === "number";

    if (!team) {
      return (
        <Box
          sx={{ p: 1, height: "68px", display: "flex", alignItems: "center" }}
        >
          <Typography
            variant="body2"
            sx={{ fontStyle: "italic", color: "text.secondary" }}
          >
            Aguardando...
          </Typography>
        </Box>
      );
    }
    return (
      <Box sx={{ display: "flex", alignItems: "center", p: "8px 12px" }}>
        <Avatar
          src={team.url_escudo}
          variant="rounded"
          sx={{
            width: 32,
            height: 32,
            mr: 1.5,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            p: 0.25,
            flexShrink: 0,
          }}
        />
        <Tooltip
          title={`${team.nome} • ${team.nome_cartola || "N/A"}`}
          placement="top-start"
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                fontWeight: isWinner ? 600 : 400,
                fontSize: "0.9rem",
                lineHeight: 1.3,
                opacity: winnerTeam && !isWinner ? 0.6 : 1,
              }}
            >
              {team.nome}
            </Typography>
            {hasScores && (
              <Box sx={{ display: "flex", gap: 1.5, opacity: 0.7 }}>
                <Typography variant="caption" color="text.secondary">
                  Ida:{" "}
                  <Typography
                    component="span"
                    sx={{ fontFamily: "monospace", color: "text.primary" }}
                  >
                    {typeof idaScore === "number" ? idaScore.toFixed(2) : "-"}
                  </Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Volta:{" "}
                  <Typography
                    component="span"
                    sx={{ fontFamily: "monospace", color: "text.primary" }}
                  >
                    {typeof voltaScore === "number"
                      ? voltaScore.toFixed(2)
                      : "-"}
                  </Typography>
                </Typography>
              </Box>
            )}
          </Box>
        </Tooltip>
        <Typography
          sx={{
            width: "60px",
            textAlign: "right",
            fontWeight: isWinner ? "bold" : "normal",
            fontSize: "1rem",
            color: isWinner ? "success.main" : "text.secondary",
            opacity: winnerTeam && !isWinner ? 0.6 : 1,
            fontFamily: "monospace",
            flexShrink: 0,
          }}
        >
          {typeof aggregateScore === "number" ? aggregateScore.toFixed(2) : "-"}
        </Typography>
      </Box>
    );
  };

  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        width: { xs: 300, sm: 340 },
        transition: "border-color 0.3s, box-shadow 0.3s",
        borderColor: winnerTeam ? "success.main" : "divider",
        boxShadow: winnerTeam
          ? { xs: "none", sm: `0 0 12px ${theme.palette.success.main}` }
          : "none",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "background.paper",
        display: "flex",
        flexDirection: "column",
      })}
    >
      {title && (
        <Box
          sx={{
            p: "4px 8px",
            textAlign: "center",
            backgroundColor: "rgba(0,0,0,0.2)",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: "bold",
              color: "text.secondary",
              textTransform: "uppercase",
            }}
          >
            {title}
          </Typography>
        </Box>
      )}

      {title && <Divider />}

      <TeamLine
        team={team1}
        aggregateScore={aggregates?.[0]}
        idaScore={scores?.ida?.[0]}
        voltaScore={scores?.volta?.[0]}
        isWinner={winnerTeam?.id === team1?.id}
      />
      <Divider />
      <TeamLine
        team={team2}
        aggregateScore={aggregates?.[1]}
        idaScore={scores?.ida?.[1]}
        voltaScore={scores?.volta?.[1]}
        isWinner={winnerTeam?.id === team2?.id}
      />
    </Paper>
  );
};

export default BracketMatch;
