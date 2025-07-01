// src/components/TabelaGrupo.js
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Tooltip,
  Avatar,
  useTheme,
  useMediaQuery,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const TimeCardMobile = ({ time, index, rounds }) => {
  const isQualified = index < 2 && time.group;
  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 1.5,
        overflow: "hidden",
        borderColor: isQualified ? "success.main" : "divider",
        borderWidth: isQualified ? "1.5px" : "1px",
      }}
    >
      <Box
        sx={{
          p: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          backgroundColor: isQualified ? "success.light" : "transparent",
        }}
      >
        <Box sx={{ width: "24px", textAlign: "center", flexShrink: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              color: isQualified ? "success.main" : "text.primary",
            }}
          >
            {index + 1}
          </Typography>
        </Box>
        <Avatar
          src={time.url_escudo}
          sx={{
            width: 40,
            height: 40,
            backgroundColor: "rgba(255,255,255,0.1)",
            p: 0.5,
            flexShrink: 0,
          }}
          variant="rounded"
        />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Tooltip
            title={`${time.nome} • ${time.nome_cartola || ""}`}
            placement="top-start"
          >
            <Typography noWrap sx={{ fontWeight: 600 }}>
              {time.nome}
            </Typography>
          </Tooltip>
          <Typography noWrap variant="caption" color="text.secondary">
            {time.nome_cartola || "N/A"}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
          <Typography variant="caption" color="text.secondary">
            Total
          </Typography>
          <Typography
            sx={{
              fontWeight: "bold",
              color: "primary.main",
              fontSize: "1.2rem",
              lineHeight: 1.1,
              fontFamily: "monospace",
            }}
          >
            {(time.total || 0).toFixed(2)}
          </Typography>
        </Box>
      </Box>
      <Accordion
        disableGutters
        elevation={0}
        sx={{
          backgroundImage: "none",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel-${time.id}-content`}
          id={`panel-${time.id}-header`}
          sx={{
            minHeight: "36px",
            backgroundColor: "rgba(0,0,0,0.1)",
            "& .MuiAccordionSummary-content": { my: 0 },
            "&.Mui-expanded": { minHeight: "36px" },
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Ver pontuações
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ backgroundColor: "rgba(0,0,0,0.2)", p: 2 }}>
          <Grid container spacing={1} justifyContent="center">
            {/* CORREÇÃO AQUI: Usa o índice para exibir R1, R2, etc. */}
            {rounds.map((r, roundIndex) => (
              <Grid item xs={4} sm={2} key={r} sx={{ textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  Rod. {roundIndex + 1}
                </Typography>
                <Typography sx={{ fontFamily: "monospace", fontWeight: 500 }}>
                  {(time.pontuacoes?.[`rodada_${r}`] || 0).toFixed(2)}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

const TimeRowDesktop = ({ time, index, rounds }) => (
  <TableRow
    sx={{
      backgroundColor: index < 2 && time.group ? "success.light" : "inherit",
      "& > *": {
        borderColor: index < 2 && time.group ? "success.main" : "divider",
      },
    }}
  >
    <TableCell component="th" scope="row" align="center">
      <Typography
        variant="body2"
        sx={{
          fontWeight: "bold",
          color: index < 2 && time.group ? "success.main" : "text.primary",
        }}
      >
        {index + 1}
      </Typography>
    </TableCell>
    <TableCell>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar
          src={time.url_escudo}
          sx={{
            width: 28,
            height: 28,
            backgroundColor: "rgba(255,255,255,0.1)",
            p: 0.5,
          }}
          variant="rounded"
        />
        <Box sx={{ minWidth: 0 }}>
          <Tooltip
            title={`${time.nome} • ${time.nome_cartola || ""}`}
            placement="top-start"
          >
            <Box>
              <Typography noWrap variant="body2" sx={{ fontWeight: 500 }}>
                {time.nome}
              </Typography>
              <Typography noWrap variant="caption" color="text.secondary">
                {time.nome_cartola || "N/A"}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </Box>
    </TableCell>
    {rounds.map((r) => (
      <TableCell
        key={`${time.id}-${r}`}
        align="center"
        sx={{ fontFamily: "monospace", fontSize: "0.9rem", fontWeight: "bold" }}
      >
        {(time.pontuacoes?.[`rodada_${r}`] || 0).toFixed(2)}
      </TableCell>
    ))}
    <TableCell
      align="right"
      sx={{
        fontWeight: "bold",
        fontFamily: "monospace",
        color: "primary.main",
        fontSize: "1rem",
      }}
    >
      {(time.total || 0).toFixed(2)}
    </TableCell>
  </TableRow>
);

function TabelaGrupo({ nomeGrupo, times, rounds }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const timesOrdenados = [...times].sort(
    (a, b) => (b.total || 0) - (a.total || 0)
  );

  const hasGroup = nomeGrupo !== "Sem Grupo";

  return (
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          p: 2,
          borderBottom: "2px solid",
          borderColor: "primary.main",
          textTransform: "uppercase",
        }}
      >
        {hasGroup ? `Grupo ${nomeGrupo}` : "Times Sem Grupo"}
      </Typography>

      {isMobile ? (
        <Box sx={{ p: { xs: 1, sm: 2 }, overflowY: "auto", flexGrow: 1 }}>
          {timesOrdenados.map((time, index) => (
            <TimeCardMobile
              key={time.id}
              time={time}
              index={index}
              rounds={rounds}
            />
          ))}
        </Box>
      ) : (
        <TableContainer sx={{ flexGrow: 1 }}>
          <Table
            stickyHeader
            size="small"
            aria-label={`Tabela do grupo ${nomeGrupo}`}
          >
            <TableHead>
              <TableRow sx={{ "& th": { border: 0 } }}>
                <TableCell sx={{ width: "5%", fontWeight: "bold" }}>
                  #
                </TableCell>
                <TableCell sx={{ width: "40%", fontWeight: "bold" }}>
                  Time / Cartoleiro
                </TableCell>
                {/* CORREÇÃO AQUI: Usa o índice para exibir R1, R2, etc. */}
                {rounds.map((r, index) => (
                  <TableCell key={r} align="center" sx={{ fontWeight: "bold" }}>
                    R{index + 1}
                  </TableCell>
                ))}
                <TableCell
                  align="right"
                  sx={{ minWidth: "80px", fontWeight: "bold" }}
                >
                  Total
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {timesOrdenados.map((time, index) => (
                <TimeRowDesktop
                  key={time.id}
                  time={time}
                  index={index}
                  rounds={rounds}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

export default TabelaGrupo;
