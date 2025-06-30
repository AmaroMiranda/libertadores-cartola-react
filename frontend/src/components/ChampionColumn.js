import React from "react";
import { Typography, Box, Paper, Avatar } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

const ChampionColumn = ({ campeao, title = "Campeão" }) => {
  const isChampion = title === "Campeão";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minWidth: 250,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: "bold",
          color: "text.secondary",
          mb: 2,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Typography>
      {campeao ? (
        <Paper
          elevation={4}
          sx={(theme) => ({
            p: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            width: "250px",
            background: isChampion
              ? `linear-gradient(145deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              : `linear-gradient(145deg, #6d4c41, #a1887f)`, // Tons de bronze para 3º lugar
            color: "white",
            border: `2px solid ${
              isChampion ? theme.palette.primary.main : "#8d6e63"
            }`,
            boxShadow: `0 0 25px ${
              isChampion ? theme.palette.primary.main : "#a1887f"
            }`,
            borderRadius: "12px",
          })}
        >
          <EmojiEventsIcon sx={{ fontSize: 50, color: "white" }} />
          <Avatar
            src={campeao.url_escudo}
            sx={{
              width: 60,
              height: 60,
              border: "3px solid white",
              backgroundColor: "rgba(255,255,255,0.2)",
              p: 0.5,
            }}
            variant="rounded"
          />
          <Typography variant="h6" align="center" sx={{ fontWeight: "bold" }}>
            {campeao.nome}
          </Typography>
          <Typography variant="body2" align="center">
            {campeao.nome_cartola}
          </Typography>
        </Paper>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            width: "250px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            borderStyle: "dashed",
            borderColor: "divider",
            backgroundColor: "transparent",
            minHeight: 240,
          }}
        >
          <EmojiEventsIcon sx={{ fontSize: 50, color: "text.disabled" }} />
          <Typography variant="h6" color="text.secondary">
            A Definir
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ChampionColumn;
