import React from "react";
import {
  Typography,
  Box,
  Paper,
  Avatar,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery,
  Chip,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

// Sub-componente TeamScoreColumn
const TeamScoreColumn = ({ team, aggregateScore, roundScores, isWinner }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: 1.5,
      p: 2,
      height: "100%",
      backgroundColor: isWinner ? "success.light" : "transparent",
      borderRadius: 2,
    }}
  >
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Avatar
        src={team.url_escudo}
        variant="rounded"
        sx={{
          width: { xs: 56, sm: 64 },
          height: { xs: 56, sm: 64 },
          backgroundColor: "rgba(255,255,255,0.1)",
          p: 0.5,
        }}
      />
      <Tooltip
        title={`${team.nome} • ${team.nome_cartola || "N/A"}`}
        placement="top"
      >
        <Typography
          noWrap
          sx={{ fontWeight: 600, fontSize: "1rem", width: "100%" }}
        >
          {team.nome}
        </Typography>
      </Tooltip>
      <Typography noWrap variant="caption" color="text.secondary">
        {team.nome_cartola || "N/A"}
      </Typography>
    </Box>

    <Typography
      variant="h4"
      component="div"
      sx={{
        fontFamily: "monospace",
        fontWeight: "bold",
        color: isWinner ? "success.main" : "primary.main",
      }}
    >
      {typeof aggregateScore === "number" ? aggregateScore.toFixed(2) : "-"}
    </Typography>

    {roundScores && (
      <Box sx={{ opacity: 0.7 }}>
        <Typography variant="caption" color="text.secondary">
          Ida:{" "}
          <Typography
            component="span"
            variant="caption"
            sx={{ fontFamily: "monospace", color: "text.primary" }}
          >
            {typeof roundScores.ida === "number"
              ? roundScores.ida.toFixed(2)
              : "-"}
          </Typography>
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          Volta:{" "}
          <Typography
            component="span"
            variant="caption"
            sx={{ fontFamily: "monospace", color: "text.primary" }}
          >
            {typeof roundScores.volta === "number"
              ? roundScores.volta.toFixed(2)
              : "-"}
          </Typography>
        </Typography>
      </Box>
    )}
  </Box>
);

function KnockoutMatchCard({ match, title }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { team1, team2, aggregates, scores, winnerTeam } = match;

  const scoresTeam1 = scores
    ? { ida: scores.ida?.[0], volta: scores.volta?.[0] }
    : undefined;
  const scoresTeam2 = scores
    ? { ida: scores.ida?.[1], volta: scores.volta?.[1] }
    : undefined;

  const isWinnerTeam1 = winnerTeam?.id === team1?.id;
  const isWinnerTeam2 = winnerTeam?.id === team2?.id;

  return (
    <Paper
      elevation={3}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Container principal que inclui o novo título */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {/* TÍTULO DO CONFRONTO */}
        <Box
          sx={{
            p: 1,
            textAlign: "center",
            backgroundColor: "rgba(0,0,0,0.2)",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: "bold", color: "text.secondary" }}
          >
            {title}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            p: { xs: 1, sm: 2 },
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? 1 : 2,
            flexGrow: 1,
          }}
        >
          <Box sx={{ width: "100%", flex: 1 }}>
            <TeamScoreColumn
              team={team1}
              aggregateScore={aggregates?.[0]}
              roundScores={scoresTeam1}
              isWinner={isWinnerTeam1}
            />
          </Box>
          <Divider
            orientation={isMobile ? "horizontal" : "vertical"}
            flexItem
            sx={{ my: isMobile ? 2 : 0 }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: "bold",
                color: "text.secondary",
                px: isMobile ? 0 : 1,
              }}
            >
              VS
            </Typography>
          </Divider>
          <Box sx={{ width: "100%", flex: 1 }}>
            <TeamScoreColumn
              team={team2}
              aggregateScore={aggregates?.[1]}
              roundScores={scoresTeam2}
              isWinner={isWinnerTeam2}
            />
          </Box>
        </Box>
      </Box>

      {winnerTeam && (
        <Box sx={{ p: 1.5, pt: 0 }}>
          <Divider sx={{ mb: 1.5 }} />
          <Chip
            icon={<EmojiEventsIcon />}
            label={`Vencedor: ${winnerTeam.nome}`}
            sx={{
              width: "100%",
              backgroundColor: "success.main",
              color: "background.paper",
              fontWeight: "bold",
              fontSize: "0.8rem",
            }}
          />
        </Box>
      )}
    </Paper>
  );
}

export default KnockoutMatchCard;
