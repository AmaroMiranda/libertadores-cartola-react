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

// --- ESTILOS (REFEITOS COM FOCO EM ROBUSTEZ MÁXIMA) ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Exo 2",
    backgroundColor: "#1A1A2E",
    color: "#EAEAEA",
    padding: 25,
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
  subHeaderText: {
    fontSize: 14,
    color: "#B0B0C0",
    marginTop: 4,
  },
  // Container para uma rodada inteira
  roundSection: {
    marginBottom: 20,
  },
  roundTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  // A grande mudança: Um container para cada grupo de confrontos
  groupSection: {
    backgroundColor: "#2C2C44",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.2)",
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#00E5FF",
    paddingBottom: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    textTransform: "uppercase",
  },
  // Linha de cada confronto
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8, // Espaço vertical entre as partidas
  },
  // Colunas com LARGURA FIXA para garantir o layout
  teamColumn: {
    width: "45%", // Fixo
    flexDirection: "row",
    alignItems: "center",
  },
  vsColumn: {
    width: "10%", // Fixo
    textAlign: "center",
  },
  vsText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "gray",
  },
  escudo: {
    width: 28,
    height: 28,
    borderRadius: 4,
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
});

// --- COMPONENTE TEAMDISPLAY (SIMPLIFICADO) ---
const TeamDisplay = ({ team, direction = "left", apiUrl }) => {
  // Garantir que a URL da imagem existe antes de tentar usá-la
  const imageSrc = team?.url_escudo
    ? `${apiUrl}/api/image-proxy?url=${encodeURIComponent(team.url_escudo)}`
    : null;

  const isLeft = direction === "left";
  // Estilos condicionais para alinhamento
  const columnStyle = isLeft
    ? { justifyContent: "flex-start" }
    : { justifyContent: "flex-end", flexDirection: "row-reverse" };
  const marginStyle = isLeft ? { marginRight: 10 } : { marginLeft: 10 };
  const textStyle = isLeft ? { textAlign: "left" } : { textAlign: "right" };

  return (
    <View style={[styles.teamColumn, columnStyle]}>
      {imageSrc && (
        <Image style={[styles.escudo, marginStyle]} src={imageSrc} />
      )}
      <View style={styles.teamInfo}>
        <Text style={[styles.teamName, textStyle]}>
          {truncateText(team?.nome, 20)}
        </Text>
        <Text style={[styles.cartolaName, textStyle]}>
          {truncateText(team?.nome_cartola, 22)}
        </Text>
      </View>
    </View>
  );
};

// --- COMPONENTE PRINCIPAL DO DOCUMENTO (REESTRUTURADO) ---
const RelatorioConfrontosSimplesDocument = ({ matchesByRound, apiUrl }) => {
  // Ordena as chaves das rodadas numericamente (ex: "Rodada 1", "Rodada 2", ...)
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

        {/* Itera sobre cada rodada */}
        {sortedRounds.map((roundName) => {
          // Agrupa os confrontos da rodada atual pelo nome do grupo
          const matchesByGroup = matchesByRound[roundName].reduce(
            (acc, match) => {
              (acc[match.group] = acc[match.group] || []).push(match);
              return acc;
            },
            {}
          );

          // Ordena os nomes dos grupos (A, B, C, ...)
          const sortedGroups = Object.keys(matchesByGroup).sort();

          return (
            <View key={roundName} style={styles.roundSection} wrap={false}>
              <Text style={styles.roundTitle}>{roundName}</Text>

              {/* Itera sobre cada grupo (A, B, C...) dentro da rodada */}
              {sortedGroups.map((groupName) => (
                <View key={groupName} style={styles.groupSection}>
                  <Text style={styles.groupTitle}>Grupo {groupName}</Text>

                  {/* Itera sobre cada confronto dentro do grupo */}
                  {matchesByGroup[groupName].map((match) => (
                    <View key={match.id} style={styles.matchRow}>
                      <TeamDisplay
                        team={match.home_team}
                        direction="left"
                        apiUrl={apiUrl}
                      />
                      <View style={styles.vsColumn}>
                        <Text style={styles.vsText}>VS</Text>
                      </View>
                      <TeamDisplay
                        team={match.away_team}
                        direction="right"
                        apiUrl={apiUrl}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        })}
      </Page>
    </Document>
  );
};

export default RelatorioConfrontosSimplesDocument;
