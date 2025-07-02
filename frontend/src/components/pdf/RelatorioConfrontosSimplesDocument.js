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

// --- FUNÇÃO UTILITÁRIA ---
const truncateText = (text, maxLength) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

// --- ESTILOS (REFEITOS PARA ESPELHAR O TEMA DO SITE) ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Exo 2",
    backgroundColor: "#1A1A2E",
    color: "#EAEAEA",
    padding: 30,
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
  },
  subHeaderText: {
    fontSize: 14,
    color: "#B0B0C0",
    marginTop: 4,
  },
  roundTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
    marginTop: 10,
    textTransform: "uppercase",
  },
  // Estrutura principal: Grid de 2 colunas para os confrontos
  matchesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  // CARD DE CONFRONTO: Agora espelha o MatchCard.js
  matchCard: {
    width: "48%", // Ocupa quase metade da página, permitindo 2 por linha
    backgroundColor: "#2C2C44",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.2)",
    marginBottom: 15,
    padding: 12,
  },
  groupChip: {
    textAlign: "center",
    marginBottom: 10,
    color: "#00E5FF",
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    fontSize: 9,
    fontWeight: "bold",
    alignSelf: "center", // Centraliza o chip
  },
  // CONTEÚDO DO CARD: Onde os dois times são exibidos
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  // COLUNA VERTICAL PARA CADA TIME (Avatar, Nome, Cartoleiro)
  teamDisplayColumn: {
    width: "45%",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  escudo: {
    width: 48,
    height: 48,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 2,
    borderRadius: 5,
  },
  teamName: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center", // Garante centralização
  },
  cartolaName: {
    fontSize: 8,
    color: "#B0B0C0",
    marginTop: 2,
    textAlign: "center",
  },
  vsText: {
    fontSize: 10,
    color: "gray",
    fontWeight: "bold",
  },
});

// --- NOVO COMPONENTE DE EXIBIÇÃO DE TIME (VERTICAL) ---
const TeamDisplayVertical = ({ team, apiUrl }) => {
  const imageSrc = team?.url_escudo
    ? `${apiUrl}/api/image-proxy?url=${encodeURIComponent(team.url_escudo)}`
    : null;

  return (
    <View style={styles.teamDisplayColumn}>
      {imageSrc && <Image style={styles.escudo} src={imageSrc} />}
      <Text style={styles.teamName}>{truncateText(team?.nome, 20)}</Text>
      <Text style={styles.cartolaName}>
        {truncateText(team?.nome_cartola, 22)}
      </Text>
    </View>
  );
};

// --- COMPONENTE PRINCIPAL DO DOCUMENTO (VERSÃO FINAL) ---
const RelatorioConfrontosSimplesDocument = ({ matchesByRound, apiUrl }) => {
  const sortedRounds = Object.keys(matchesByRound).sort(
    (a, b) =>
      parseInt(a.replace(/\D/g, ""), 10) - parseInt(b.replace(/\D/g, ""), 10)
  );

  return (
    <Document title="Relatório de Confrontos Simplificado">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Libertadores do Cartola</Text>
          <Text style={styles.subHeaderText}>Confrontos da Fase de Grupos</Text>
        </View>

        {sortedRounds.map((roundName) => (
          <View key={roundName} wrap={false}>
            <Text style={styles.roundTitle}>{roundName}</Text>
            <View style={styles.matchesGrid}>
              {matchesByRound[roundName]
                .sort((a, b) => a.group.localeCompare(b.group))
                .map((match) => (
                  <View key={match.id} style={styles.matchCard}>
                    <Text style={styles.groupChip}>GRUPO {match.group}</Text>
                    <View style={styles.cardContent}>
                      <TeamDisplayVertical
                        team={match.home_team}
                        apiUrl={apiUrl}
                      />
                      <Text style={styles.vsText}>VS</Text>
                      <TeamDisplayVertical
                        team={match.away_team}
                        apiUrl={apiUrl}
                      />
                    </View>
                  </View>
                ))}
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
};

export default RelatorioConfrontosSimplesDocument;
