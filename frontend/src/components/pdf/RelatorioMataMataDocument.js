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

const styles = StyleSheet.create({
  page: {
    fontFamily: "Exo 2",
    backgroundColor: "#1A1A2E",
    color: "#EAEAEA",
    padding: 30,
  },
  mainHeader: {
    textAlign: "center",
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: "#00E5FF",
    paddingBottom: 15,
  },
  mainHeaderText: {
    color: "#00E5FF",
    fontSize: 24,
    fontWeight: "bold",
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    marginTop: 20,
    textTransform: "uppercase",
  },
  table: {
    width: "100%",
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderRightColor: "gray",
    borderBottomColor: "#00E5FF",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  tableHeader: {
    backgroundColor: "#2C2C44",
  },
  tableCell: {
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderTopColor: "#00E5FF",
    borderLeftColor: "gray",
    padding: 8,
    justifyContent: "center",
  },
  colConfronto: { width: "15%" },
  colTime1: { width: "37.5%" },
  colVs: { width: "10%" },
  colTime2: { width: "37.5%" },
  headerText: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    color: "#B0B0C0",
  },
  teamCell: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  escudo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  teamInfo: {
    flexDirection: "column",
  },
  teamName: {
    fontSize: 11,
    fontWeight: "bold",
  },
  cartolaName: {
    fontSize: 8,
    color: "#B0B0C0",
  },
  scoreInfo: {
    marginTop: 6,
    alignItems: "center",
  },
  aggregateScore: {
    fontFamily: "Courier",
    fontWeight: "bold",
    fontSize: 16,
    color: "#00E5FF",
  },
  subScoreText: {
    fontSize: 9,
    fontFamily: "Courier",
    color: "#EAEAEA",
    textAlign: "center",
    marginTop: 3,
  },
  vsText: {
    fontSize: 14,
    color: "gray",
    textAlign: "center",
    fontWeight: "bold",
  },
  winnerCell: {
    backgroundColor: "rgba(0, 229, 255, 0.1)",
  },
  confrontoText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

const truncateText = (text, maxLength) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

const TeamDisplay = ({ team, aggregateScore, roundScores, apiUrl }) => {
  if (!team) {
    return (
      <Text style={{ fontSize: 10, color: "gray", textAlign: "center" }}>
        A definir
      </Text>
    );
  }
  return (
    <View style={styles.teamCell}>
      <View style={styles.teamHeader}>
        <Image
          style={styles.escudo}
          src={`${apiUrl}/api/image-proxy?url=${encodeURIComponent(
            team.url_escudo
          )}`}
        />
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{truncateText(team.nome, 18)}</Text>
          <Text style={styles.cartolaName}>
            {truncateText(team.nome_cartola, 20)}
          </Text>
        </View>
      </View>
      <View style={styles.scoreInfo}>
        <Text style={styles.aggregateScore}>
          {typeof aggregateScore === "number" ? aggregateScore.toFixed(2) : "-"}
        </Text>
        <Text style={styles.subScoreText}>
          Ida:{" "}
          {typeof roundScores.ida === "number"
            ? roundScores.ida.toFixed(2)
            : "-"}{" "}
          | Volta:{" "}
          {typeof roundScores.volta === "number"
            ? roundScores.volta.toFixed(2)
            : "-"}
        </Text>
      </View>
    </View>
  );
};

const RelatorioMataMataDocument = ({ matchesByStage, stageOrder, apiUrl }) => (
  <Document title="Relatório de Confrontos do Mata-Mata">
    <Page size="A4" style={styles.page}>
      <View style={styles.mainHeader}>
        <Text style={styles.mainHeaderText}>Libertadores do Cartola</Text>
      </View>

      {stageOrder
        .filter((stageName) => matchesByStage[stageName])
        .map((stageName) => (
          <View key={stageName} wrap={false}>
            <Text style={styles.stageTitle}>{stageName}</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.tableCell, styles.colConfronto]}>
                  <Text style={styles.headerText}>#</Text>
                </View>
                <View style={[styles.tableCell, styles.colTime1]}>
                  <Text style={styles.headerText}>Time 1</Text>
                </View>
                <View style={[styles.tableCell, styles.colVs]}>
                  <Text style={styles.headerText}>vs</Text>
                </View>
                <View style={[styles.tableCell, styles.colTime2]}>
                  <Text style={styles.headerText}>Time 2</Text>
                </View>
              </View>

              {matchesByStage[stageName].map((match, index) => {
                const isTeam1Winner = match.winnerTeam?.id === match.team1?.id;
                const isTeam2Winner = match.winnerTeam?.id === match.team2?.id;

                return (
                  <View key={match.id || index} style={styles.tableRow}>
                    <View style={[styles.tableCell, styles.colConfronto]}>
                      <Text style={styles.confrontoText}>
                        {stageName === "Final" ? "Final" : index + 1}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.tableCell,
                        styles.colTime1,
                        isTeam1Winner && styles.winnerCell,
                      ]}
                    >
                      <TeamDisplay
                        team={match.team1}
                        aggregateScore={match.aggregates?.[0]}
                        roundScores={{
                          ida: match.scores?.ida?.[0],
                          volta: match.scores?.volta?.[0],
                        }}
                        apiUrl={apiUrl}
                      />
                    </View>
                    <View style={[styles.tableCell, styles.colVs]}>
                      <Text style={styles.vsText}>vs</Text>
                    </View>
                    <View
                      style={[
                        styles.tableCell,
                        styles.colTime2,
                        isTeam2Winner && styles.winnerCell,
                      ]}
                    >
                      <TeamDisplay
                        team={match.team2}
                        aggregateScore={match.aggregates?.[1]}
                        roundScores={{
                          ida: match.scores?.ida?.[1],
                          volta: match.scores?.volta?.[1],
                        }}
                        apiUrl={apiUrl}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
    </Page>
  </Document>
);

export default RelatorioMataMataDocument;
