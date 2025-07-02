import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// --- FONTES ---
Font.register({
  family: "Exo 2",
  fonts: [
    { src: "/fonts/Exo2-Regular.ttf" },
    { src: "/fonts/Exo2-Bold.ttf", fontWeight: "bold" },
  ],
});

// --- ESTILOS (REFEITOS PARA MÁXIMA ROBUSTEZ) ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Exo 2",
    backgroundColor: "#1A1A2E",
    color: "#EAEAEA",
    padding: 25,
  },
  header: {
    textAlign: "center",
    marginBottom: 25,
    borderBottomWidth: 1.5,
    borderBottomColor: "#00E5FF",
    paddingBottom: 15,
  },
  headerText: {
    color: "#00E5FF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5, // Espaço entre o título principal e o subtítulo
  },
  subHeaderText: {
    color: "#EAEAEA",
    fontSize: 16,
  },
  roundTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
    marginTop: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  // Container de cada partida com layout de colunas fixas
  matchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C44",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.15)",
  },
  teamColumn: {
    flexDirection: "row",
    alignItems: "center",
    width: "45%", // Coluna com largura fixa
  },
  vsColumn: {
    width: "10%", // Coluna central com largura fixa
    textAlign: "center",
  },
  vsText: {
    fontSize: 14,
    color: "#00E5FF",
    fontWeight: "bold",
  },
  escudo: {
    width: 32,
    height: 32,
  },
  teamInfo: {
    flexDirection: "column",
  },
  teamName: {
    fontSize: 11,
    fontWeight: "bold",
  },
  cartolaName: {
    fontSize: 9,
    color: "#B0B0C0",
    marginTop: 2,
  },
  groupChip: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    color: "#00E5FF",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 9,
    fontWeight: "bold",
  },
});

// Componente para exibir um time, controlando a direção (esquerda ou direita)
const TeamDisplay = ({ team, direction = "left" }) => {
  const isLeft = direction === "left";
  return (
    <View
      style={[
        styles.teamColumn,
        { justifyContent: isLeft ? "flex-start" : "flex-end" },
      ]}
    >
      {isLeft && (
        <Image
          style={[styles.escudo, { marginRight: 10 }]}
          src={`${
            process.env.REACT_APP_API_URL
          }/api/image-proxy?url=${encodeURIComponent(team.url_escudo)}`}
        />
      )}
      <View
        style={[
          styles.teamInfo,
          { alignItems: isLeft ? "flex-start" : "flex-end" },
        ]}
      >
        <Text style={styles.teamName}>{team.nome}</Text>
        <Text style={styles.cartolaName}>{team.nome_cartola}</Text>
      </View>
      {!isLeft && (
        <Image
          style={[styles.escudo, { marginLeft: 10 }]}
          src={`${
            process.env.REACT_APP_API_URL
          }/api/image-proxy?url=${encodeURIComponent(team.url_escudo)}`}
        />
      )}
    </View>
  );
};

// --- COMPONENTE PRINCIPAL DO DOCUMENTO ---
const RelatorioConfrontosSimplesDocument = ({ matchesByRound, apiUrl }) => (
  <Document title="Relatório de Confrontos Simplificado">
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Libertadores do Cartola</Text>
        <Text style={styles.subHeaderText}>Confrontos da Fase de Grupos</Text>
      </View>

      {Object.keys(matchesByRound)
        .sort()
        .map((roundName) => (
          <View key={roundName} wrap={false}>
            <Text style={styles.roundTitle}>{roundName}</Text>
            {matchesByRound[roundName]
              .sort((a, b) => a.group.localeCompare(b.group))
              .map((match) => (
                <View key={match.id} style={styles.matchContainer}>
                  <Text style={styles.groupChip}>GRUPO {match.group}</Text>
                  <TeamDisplay team={match.home_team} direction="left" />
                  <View style={styles.vsColumn}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>
                  <TeamDisplay team={match.away_team} direction="right" />
                </View>
              ))}
          </View>
        ))}
    </Page>
  </Document>
);

export default RelatorioConfrontosSimplesDocument;
