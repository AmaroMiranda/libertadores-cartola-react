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

const styles = StyleSheet.create({
  page: {
    fontFamily: "Exo 2",
    backgroundColor: "#1A1A2E",
    color: "#EAEAEA",
    padding: 30,
  },
  header: {
    textAlign: "center",
    marginBottom: 30, // Aumentando a margem inferior do cabeçalho
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
    marginBottom: 20, // Aumentando o espaçamento abaixo do título da rodada
    marginTop: 30, // Aumentando o espaçamento acima do título da rodada
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "gray",
  },
  matchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2C2C44",
    borderRadius: 5,
    padding: 15, // Aumentando o padding interno do container da partida
    marginBottom: 12, // Aumentando a margem inferior entre as partidas
    borderLeftWidth: 4,
    borderLeftColor: "#00E5FF",
    position: "relative", // Adicionado para posicionar o chip do grupo
  },
  teamCell: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    padding: "5px 0", // Adicionando um pequeno padding vertical para os times
  },
  escudo: {
    width: 36, // Aumentando um pouco o tamanho do escudo
    height: 36, // Aumentando um pouco o tamanho do escudo
    marginRight: 12,
  },
  teamInfo: {
    flexDirection: "column",
  },
  teamName: {
    fontSize: 13,
    fontWeight: "bold",
  },
  cartolaName: {
    fontSize: 10,
    color: "#B0B0C0",
    marginTop: 3,
  },
  vsText: {
    fontSize: 16,
    fontFamily: "Exo 2",
    color: "#00E5FF",
    marginHorizontal: 18,
    fontWeight: "bold",
  },
  groupChip: {
    position: "absolute",
    top: -10, // Ajustando a posição vertical do chip
    left: 10,
    backgroundColor: "#1A1A2E",
    color: "#B0B0C0",
    padding: "3px 7px",
    borderRadius: 5,
    fontSize: 10,
    fontWeight: "bold",
  },
});

const truncateText = (text, maxLength) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

const RelatorioConfrontosSimplesDocument = ({ matchesByRound, apiUrl }) => (
  <Document title="Relatório de Confrontos Simplificado">
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Libertadores do Cartola</Text>
        <Text style={{ ...styles.headerText, fontSize: 18, marginTop: 6 }}>
          Confrontos da Fase de Grupos
        </Text>
      </View>

      {Object.keys(matchesByRound)
        .sort()
        .map((roundName) => (
          <View key={roundName} wrap={false}>
            <Text style={styles.roundTitle}>{roundName}</Text>
            {matchesByRound?.[roundName]
              ?.sort((a, b) => a.group.localeCompare(b.group))
              ?.map((match) => (
                <View key={match.id} style={styles.matchContainer}>
                  <Text style={styles.groupChip}>Grupo {match.group}</Text>
                  <View
                    style={[styles.teamCell, { justifyContent: "flex-start" }]}
                  >
                    <Image
                      style={styles.escudo}
                      src={`${apiUrl}/api/image-proxy?url=${encodeURIComponent(
                        match.home_team.url_escudo
                      )}`}
                    />
                    <View style={styles.teamInfo}>
                      <Text style={styles.teamName}>
                        {truncateText(match.home_team.nome, 25)}
                      </Text>
                      <Text style={styles.cartolaName}>
                        {truncateText(match.home_team.nome_cartola, 28)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.vsText}>VS</Text>

                  <View
                    style={[
                      styles.teamCell,
                      { justifyContent: "flex-end", textAlign: "right" },
                    ]}
                  >
                    <View style={[styles.teamInfo, { alignItems: "flex-end" }]}>
                      <Text style={styles.teamName}>
                        {truncateText(match.away_team.nome, 25)}
                      </Text>
                      <Text style={styles.cartolaName}>
                        {truncateText(match.away_team.nome_cartola, 28)}
                      </Text>
                    </View>
                    <Image
                      style={[
                        styles.escudo,
                        { marginRight: 0, marginLeft: 12 },
                      ]}
                      src={`${apiUrl}/api/image-proxy?url=${encodeURIComponent(
                        match.away_team.url_escudo
                      )}`}
                    />
                  </View>
                </View>
              ))}
          </View>
        ))}
    </Page>
  </Document>
);

export default RelatorioConfrontosSimplesDocument;
