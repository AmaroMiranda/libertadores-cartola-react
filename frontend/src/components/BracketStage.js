// src/components/BracketStage.js
import React from "react";
import { Typography, Box } from "@mui/material";
import BracketMatch from "./BracketMatch";

const BracketStage = ({ title, matches, gap }) => {
  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: "bold",
          color: "text.secondary",
          textAlign: "center",
          mb: 3,
        }}
      >
        {title}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: `${gap}px` }}>
        {matches.map((match, index) => (
          <BracketMatch key={match.id || index} match={match} />
        ))}
      </Box>
    </Box>
  );
};

export default BracketStage;
