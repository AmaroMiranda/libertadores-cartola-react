import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// --- Fontes Seguras ---
Font.register({
  family: "Exo 2",
  fonts: [
    { src: "/fonts/Exo2-Regular.ttf" },
    { src: "/fonts/Exo2-Bold.ttf", fontWeight: "bold" },
  ],
});

// --- Estilos para o Chaveamento ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Exo 2",
    backgroundColor: "#1A1A2E",
    color: "#EAEAEA",
    padding: 20,
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  headerText: {
    color: "#00E5FF",
    fontSize: 24,
    fontWeight: "bold",
  },
  bracketContainer: {
    flexDirection: "row",
    flexGrow: 1,
  },
  stageColumn: {
    flex: 3,
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  connectorColumn: {
    flex: 1,
    justifyContent: "space-around",
  },
  match: {
    backgroundColor: "#2C2C44",
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 3,
    padding: 5,
    minHeight: 50,
    justifyContent: "center",
  },
  team: {
    fontSize: 9,
  },
  winner: {
    fontWeight: "bold",
    color: "#00E5FF",
  },
  vs: {
    textAlign: "center",
    fontSize: 8,
    color: "gray",
    marginVertical: 2,
  },
  connector: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
  },
  connectorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "gray",
  },
  connectorTurn: {
    width: "50%",
    height: "100%",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "gray",
  },
  stageTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    color: "#B0B0C0",
    marginBottom: 10,
  },
  championColumn: {
    flex: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  championCard: {
    backgroundColor: "#2C2C44",
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#00E5FF",
    borderRadius: 5,
    alignItems: "center",
  },
  championTitle: {
    fontSize: 14,
    color: "#B0B0C0",
    marginBottom: 10,
  },
  championName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00E5FF",
  },
});

// --- Sub-componentes para o Chaveamento ---

const BracketMatch = ({ match }) => {
  const team1 = match?.team1;
  const team2 = match?.team2;
  const winnerId = match?.winnerTeam?.id;

  return (
    <View style={styles.match}>
      <Text
        style={[styles.team, team1 && team1.id === winnerId && styles.winner]}
      >
        {team1 ? team1.nome : "A definir"}
      </Text>
      <Text style={styles.vs}>vs</Text>
      <Text
        style={[styles.team, team2 && team2.id === winnerId && styles.winner]}
      >
        {team2 ? team2.nome : "A definir"}
      </Text>
    </View>
  );
};

const Connector = () => (
  <View style={styles.connector}>
    <View style={styles.connectorLine} />
    <View style={styles.connectorTurn} />
  </View>
);

const Stage = ({ title, matches }) => (
  <View style={styles.stageColumn}>
    <Text style={styles.stageTitle}>{title}</Text>
    {matches.map((match, index) => (
      <BracketMatch key={match.id || index} match={match} />
    ))}
  </View>
);

const Champion = ({ team }) => (
  <View style={styles.championColumn}>
    <Text style={styles.stageTitle}>Campeão</Text>
    <View style={styles.championCard}>
      <Text style={styles.championTitle}>🏆 CAMPEÃO 🏆</Text>
      <Text style={styles.championName}>{team ? team.nome : "A definir"}</Text>
    </View>
  </View>
);

// --- Documento Principal ---

const ChaveamentoDocument = ({ stages, campeao }) => (
  <Document title="Chaveamento da Fase Final">
    <Page size="A3" orientation="landscape" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Chaveamento - Fase Final</Text>
      </View>
      <View style={styles.bracketContainer}>
        {stages.map((stage, index) => (
          <React.Fragment key={stage.key}>
            <Stage title={stage.title} matches={stage.matches} />
            {index < stages.length - 1 && (
              <View style={styles.connectorColumn}>
                {Array.from({ length: stage.matches.length / 2 }).map(
                  (_, i) => (
                    <Connector key={i} />
                  )
                )}
              </View>
            )}
          </React.Fragment>
        ))}
        <Champion team={campeao} />
      </View>
    </Page>
  </Document>
);

export default ChaveamentoDocument;
