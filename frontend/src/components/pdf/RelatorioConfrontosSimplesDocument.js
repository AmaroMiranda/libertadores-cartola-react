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

// --- ESTILOS FINAIS ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Exo 2",
    backgroundColor: "#1A1A2E",
    color: "#EAEAEA",
    padding: 30,
  },
  // 1. CORREÇÃO NO HEADER PARA EVITAR SOBREPOSIÇÃO
  header: {
    alignItems: "center", // Centraliza o conteúdo do header
    marginBottom: 25,
    borderBottomWidth: 1.5,
    borderBottomColor: "#00E5FF",
    paddingBottom: 15,
  },
  headerText: {
    color: "#00E5FF",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center", // Garante centralização
  },
  subHeaderText: {
    fontSize: 14,
    color: "#B0B0C0",
    marginTop: 6, // Adiciona margem para empurrar para baixo
    textAlign: "center",
  },
  roundTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
    textTransform: "uppercase",
  },
  matchesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  matchCard: {
    width: "48%",
    backgroundColor: "#2C2C44",
    borderRadius: 8,
    // 3. COR DA BORDA ATUALIZADA
    borderWidth: 1.5,
    borderColor: "#00E5FF", // Cor de destaque, conforme solicitado
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
    alignSelf: "center",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
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
    textAlign: "center",
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

// --- COMPONENTES AUXILIARES ---

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

const PageHeader = () => (
  <View style={styles.header}>
    <Text style={styles.headerText}>Libertadores do Cartola</Text>
    <Text style={styles.subHeaderText}>Confrontos da Fase de Grupos</Text>
  </View>
);

// --- COMPONENTE PRINCIPAL DO DOCUMENTO (COM LÓGICA DE PAGINAÇÃO) ---
const RelatorioConfrontosSimplesDocument = ({ matchesByRound, apiUrl }) => {
  const sortedRounds = Object.keys(matchesByRound).sort(
    (a, b) =>
      parseInt(a.replace(/\D/g, ""), 10) - parseInt(b.replace(/\D/g, ""), 10)
  );

  return (
    <Document title="Relatório de Confrontos Simplificado">
      {sortedRounds.map((roundName) => {
        const matchesInRound = matchesByRound[roundName];
        const groupsByName = matchesInRound.reduce((acc, match) => {
          (acc[match.group] = acc[match.group] || []).push(match);
          return acc;
        }, {});
        const sortedGroupNames = Object.keys(groupsByName).sort();

        // 2. LÓGICA DE PAGINAÇÃO: Divide os grupos em "pedaços" de 4
        const groupsPerPage = 4;
        const groupChunks = [];
        for (let i = 0; i < sortedGroupNames.length; i += groupsPerPage) {
          groupChunks.push(sortedGroupNames.slice(i, i + groupsPerPage));
        }

        // Gera uma <Page> para cada "pedaço" de grupos
        return groupChunks.map((pageGroupNames, pageIndex) => (
          <Page
            key={`${roundName}-page-${pageIndex}`}
            size="A4"
            style={styles.page}
          >
            <PageHeader />
            <Text style={styles.roundTitle}>{roundName}</Text>
            <View style={styles.matchesGrid}>
              {pageGroupNames
                .flatMap((groupName) => groupsByName[groupName])
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
          </Page>
        ));
      })}
    </Document>
  );
};

export default RelatorioConfrontosSimplesDocument;
