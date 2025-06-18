import React from "react";
import { Typography, Box, Paper, Avatar } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

const ChampionColumn = ({ campeao }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
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
        Campeão
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
            background: `linear-gradient(145deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: "white",
            border: `2px solid ${theme.palette.primary.main}`,
            boxShadow: `0 0 25px ${theme.palette.primary.main}`,
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
