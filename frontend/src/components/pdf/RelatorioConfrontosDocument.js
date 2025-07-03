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
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: "#00E5FF",
    paddingBottom: 15,
  },
  headerText: {
    color: "#00E5FF",
    fontSize: 24,
    fontWeight: "bold",
  },
  roundTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    marginTop: 20,
  },
  table: {
    width: "100%",
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "gray",
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
    borderColor: "gray",
    padding: 6,
    justifyContent: "center",
  },
  colGroup: { width: 50 },
  colMandante: { width: 190 },
  colPlacar: { width: 105 },
  colVisitante: { width: 190 },
  headerTextCell: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    color: "#B0B0C0",
  },
  teamCell: {
    flexDirection: "row",
    alignItems: "center",
  },
  escudo: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  teamInfo: {
    flexDirection: "column",
  },
  teamName: {
    fontSize: 10,
  },
  cartolaName: {
    fontSize: 8,
    color: "#B0B0C0",
    marginTop: 2,
  },
  scoreCell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontFamily: "Courier",
    fontWeight: "bold",
    fontSize: 12,
    color: "#00E5FF",
  },
  vsText: {
    fontSize: 9,
    fontFamily: "Exo 2",
    color: "gray",
    marginHorizontal: 5,
  },
  groupText: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
});

const truncateText = (text, maxLength) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

const RelatorioConfrontosDocument = ({ matchesByRound, apiUrl }) => (
  <Document title="Relatório de Confrontos">
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Libertadores do Cartola</Text>
      </View>

      {Object.keys(matchesByRound)
        .sort()
        .map((roundName) => (
          <View key={roundName} wrap={false}>
            <Text style={styles.roundTitle}>{roundName}</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.tableCell, styles.colGroup]}>
                  <Text style={styles.headerTextCell}>Grupo</Text>
                </View>
                <View style={[styles.tableCell, styles.colMandante]}>
                  <Text style={styles.headerTextCell}>Mandante</Text>
                </View>
                <View style={[styles.tableCell, styles.colPlacar]}>
                  <Text style={styles.headerTextCell}>Placar</Text>
                </View>
                <View style={[styles.tableCell, styles.colVisitante]}>
                  <Text style={styles.headerTextCell}>Visitante</Text>
                </View>
              </View>

              {matchesByRound[roundName]
                .sort((a, b) => a.group.localeCompare(b.group))
                .map((match) => {
                  const homeScore = match.home_team.score;
                  const awayScore = match.away_team.score;
                  return (
                    <View key={match.id} style={styles.tableRow}>
                      <View style={[styles.tableCell, styles.colGroup]}>
                        <Text style={styles.groupText}>{match.group}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.colMandante]}>
                        <View style={styles.teamCell}>
                          <Image
                            style={styles.escudo}
                            src={`${apiUrl}/api/image-proxy?url=${encodeURIComponent(
                              match.home_team.url_escudo
                            )}`}
                          />
                          <View style={styles.teamInfo}>
                            <Text style={styles.teamName}>
                              {truncateText(match.home_team.nome, 20)}
                            </Text>
                            <Text style={styles.cartolaName}>
                              {truncateText(match.home_team.nome_cartola, 22)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={[styles.tableCell, styles.colPlacar]}>
                        <View style={styles.scoreCell}>
                          <Text style={styles.scoreText}>
                            {typeof homeScore === "number"
                              ? homeScore.toFixed(2)
                              : "-"}
                          </Text>
                          <Text style={styles.vsText}>vs</Text>
                          <Text style={styles.scoreText}>
                            {typeof awayScore === "number"
                              ? awayScore.toFixed(2)
                              : "-"}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.tableCell, styles.colVisitante]}>
                        <View style={styles.teamCell}>
                          <Image
                            style={styles.escudo}
                            src={`${apiUrl}/api/image-proxy?url=${encodeURIComponent(
                              match.away_team.url_escudo
                            )}`}
                          />
                          <View style={styles.teamInfo}>
                            <Text style={styles.teamName}>
                              {truncateText(match.away_team.nome, 20)}
                            </Text>
                            <Text style={styles.cartolaName}>
                              {truncateText(match.away_team.nome_cartola, 22)}
                            </Text>
                          </View>
                        </View>
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

export default RelatorioConfrontosDocument;
