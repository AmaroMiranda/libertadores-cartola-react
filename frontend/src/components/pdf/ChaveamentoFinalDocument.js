import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

// --- Fontes ---
Font.register({
  family: "Exo 2",
  fonts: [
    { src: "/fonts/Exo2-Regular.ttf" },
    { src: "/fonts/Exo2-Bold.ttf", fontWeight: "bold" },
  ],
});
Font.register({
  family: "Courier",
  fonts: [{ src: "/fonts/Courier-Prime-Bold.ttf", fontWeight: "bold" }],
});

// --- Estilos ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Exo 2",
    backgroundColor: "#1A1A2E",
    color: "#EAEAEA",
    padding: 20,
  },
  headerText: {
    color: "#00E5FF",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  bracketContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  matchupColumn: {
    flexDirection: "column",
    justifyContent: "space-around",
    flexGrow: 1,
    height: "100%",
  },
  connectorColumn: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: 30,
  },
  connector: {
    width: "50%",
    height: "100%",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "gray",
  },
  matchBox: {
    backgroundColor: "#2C2C44",
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 3,
    padding: 8,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamInfo: { flexDirection: "row", alignItems: "center" },
  escudo: { width: 18, height: 18, marginRight: 5 },
  teamName: { fontSize: 9 },
  winner: { fontWeight: "bold", color: "#00E5FF" },
  score: { fontSize: 10, fontFamily: "Courier", fontWeight: "bold" },
  vsText: {
    textAlign: "center",
    fontSize: 8,
    color: "gray",
    marginVertical: 4,
  },
  championBox: { alignItems: "center" },
  championName: { fontSize: 16, fontWeight: "bold", color: "#00E5FF" },
});

const truncateText = (text, maxLength) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

const TeamDisplay = ({ team, score, isWinner, apiUrl }) => {
  if (!team)
    return (
      <View style={styles.teamRow}>
        <Text style={styles.teamName}>A definir</Text>
      </View>
    );
  return (
    <View style={styles.teamRow}>
      <View style={styles.teamInfo}>
        <Image
          style={styles.escudo}
          src={`${apiUrl}/api/image-proxy?url=${encodeURIComponent(
            team.url_escudo
          )}`}
        />
        <Text style={[styles.teamName, isWinner && styles.winner]}>
          {truncateText(team.nome, 18)}
        </Text>
      </View>
      <Text style={[styles.score, isWinner && styles.winner]}>
        {(score || 0).toFixed(2)}
      </Text>
    </View>
  );
};

const Matchup = ({ match, apiUrl }) => {
  if (!match) return <View />;

  const isFinal = !match.child1;

  if (isFinal) {
    return (
      <View style={styles.matchBox}>
        <TeamDisplay
          team={match.team1}
          score={match.aggregates?.[0]}
          isWinner={match.winnerTeam?.id === match.team1?.id}
          apiUrl={apiUrl}
        />
        <Text style={styles.vsText}>vs</Text>
        <TeamDisplay
          team={match.team2}
          score={match.aggregates?.[1]}
          isWinner={match.winnerTeam?.id === match.team2?.id}
          apiUrl={apiUrl}
        />
      </View>
    );
  }

  // É um confronto que tem "filhos" (confrontos anteriores)
  return (
    <View style={{ flexDirection: "row", alignItems: "center", flexGrow: 1 }}>
      <View style={styles.matchupColumn}>
        <Matchup match={match.child1} apiUrl={apiUrl} />
        <Matchup match={match.child2} apiUrl={apiUrl} />
      </View>
      <View style={styles.connectorColumn}>
        <View style={styles.connector} />
      </View>
      <View style={{ flex: 1 }}>
        <Matchup
          match={{ ...match, child1: null, child2: null }}
          apiUrl={apiUrl}
        />
      </View>
    </View>
  );
};

const ChaveamentoFinalDocument = ({ bracketTree, apiUrl }) => (
  <Document title="Chaveamento da Fase Final">
    <Page size="A3" orientation="landscape" style={styles.page}>
      <Text style={styles.headerText}>Chaveamento da Fase Final</Text>
      <View style={styles.bracketContainer}>
        <Matchup match={bracketTree} apiUrl={apiUrl} />
      </View>
    </Page>
  </Document>
);

export default ChaveamentoFinalDocument;
