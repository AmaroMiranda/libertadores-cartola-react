// src/components/pdf/RelatorioGruposDocument.js
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

// --- FONTES ---
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

// --- ESTILOS COM A CORREÇÃO DE ALINHAMENTO ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Exo 2",
    backgroundColor: "#1A1A2E",
    color: "#EAEAEA",
    padding: 30,
    flexDirection: "column",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: "#00E5FF",
    paddingBottom: 15,
  },
  headerText: { color: "#00E5FF", fontSize: 24, fontWeight: "bold" },
  groupTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  table: {
    width: "100%",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "gray",
    alignItems: "stretch",
  },
  tableHeader: {
    backgroundColor: "#2C2C44",
    borderBottomWidth: 1.5,
    borderBottomColor: "#00E5FF",
  },
  // Estilo base da célula
  tableCell: {
    paddingVertical: 8,
    paddingHorizontal: 4, // Padding horizontal reduzido para dar mais espaço
    justifyContent: "center",
  },
  // Larguras das colunas
  colPos: { width: "6%" },
  colTime: { width: "37%" },
  colRodada: { width: "8%" },
  colTotal: { width: "11%" },

  // Célula do header (texto)
  headerTextCell: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    color: "#B0B0C0",
  },
  teamCellContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  escudo: {
    width: 20,
    height: 20,
    marginRight: 8,
    flexShrink: 0,
  },
  teamInfo: {
    flexDirection: "column",
    flex: 1,
  },
  teamName: { fontSize: 10 },
  cartolaName: { fontSize: 8, color: "#B0B0C0", marginTop: 2 },

  // *** AQUI ESTÁ A CORREÇÃO PRINCIPAL ***
  // Célula que força a centralização do seu conteúdo
  centerAlignedCell: {
    alignItems: "center", // Centraliza horizontalmente
    justifyContent: "center", // Centraliza verticalmente
  },
  scoreText: {
    fontFamily: "Courier",
    fontSize: 10,
  },
  placeholderText: {
    fontFamily: "Courier",
    fontSize: 10,
    color: "#888",
  },
  posText: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  totalScoreText: {
    fontFamily: "Courier",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
    color: "#00E5FF",
  },
});

const RelatorioGruposDocument = ({ grupos, rounds, apiUrl }) => {
  const displayRounds = Array.from({ length: 6 }, (_, i) => i + 1);

  const PAGE_PADDING = 60;
  const HEADER_HEIGHT = 85;
  const GROUP_TITLE_HEIGHT = 40;
  const TABLE_HEADER_HEIGHT = 35;
  const ROW_HEIGHT = 45;

  const calculatePageHeight = (teamCount) => {
    return (
      PAGE_PADDING +
      HEADER_HEIGHT +
      GROUP_TITLE_HEIGHT +
      TABLE_HEADER_HEIGHT +
      teamCount * ROW_HEIGHT
    );
  };

  return (
    <Document title="Classificação da Fase de Grupos">
      {Object.keys(grupos)
        .sort()
        .map((nomeGrupo) => {
          const teamsInGroup = grupos[nomeGrupo];
          const pageHeight = calculatePageHeight(teamsInGroup.length);

          return (
            <Page
              key={nomeGrupo}
              style={styles.page}
              size={{ width: 595, height: pageHeight }}
            >
              <View style={styles.header}>
                <Text style={styles.headerText}>Libertadores do Cartola</Text>
              </View>
              <Text style={styles.groupTitle}>
                {nomeGrupo !== "Sem Grupo"
                  ? `Grupo ${nomeGrupo}`
                  : "Times Sem Grupo"}
              </Text>
              <View style={styles.table} wrap={false}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <View style={[styles.tableCell, styles.colPos, styles.centerAlignedCell]}>
                    <Text style={styles.headerTextCell}>#</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colTime]}>
                    <Text style={styles.headerTextCell}>Time / Cartoleiro</Text>
                  </View>
                  {displayRounds.map((roundNumber) => (
                    <View
                      key={`header-r${roundNumber}`}
                      style={[styles.tableCell, styles.colRodada, styles.centerAlignedCell]}
                    >
                      <Text style={styles.headerTextCell}>R{roundNumber}</Text>
                    </View>
                  ))}
                  <View style={[styles.tableCell, styles.colTotal]}>
                    <Text style={styles.headerTextCell}>Total</Text>
                  </View>
                </View>

                {teamsInGroup
                  .sort((a, b) => (b.total || 0) - (a.total || 0))
                  .map((time, index) => (
                    <View key={time.id} style={styles.tableRow}>
                      <View style={[styles.tableCell, styles.colPos, styles.centerAlignedCell]}>
                        <Text style={styles.posText}>{index + 1}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.colTime]}>
                        <View style={styles.teamCellContainer}>
                          <Image
                            style={styles.escudo}
                            src={`${apiUrl}/api/image-proxy?url=${encodeURIComponent(
                              time.url_escudo
                            )}`}
                          />
                          <View style={styles.teamInfo}>
                            <Text style={styles.teamName}>{time.nome}</Text>
                            <Text style={styles.cartolaName}>
                              {time.nome_cartola}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {displayRounds.map((roundIndex) => {
                        const cartolaRoundNumber = rounds[roundIndex - 1];
                        const score = cartolaRoundNumber
                          ? time.pontuacoes?.[`rodada_${cartolaRoundNumber}`]
                          : null;
                        return (
                          <View
                            key={`score-${time.id}-r${roundIndex}`}
                            style={[styles.tableCell, styles.colRodada, styles.centerAlignedCell]}
                          >
                            {typeof score === "number" ? (
                              <Text style={styles.scoreText}>
                                {score.toFixed(2)}
                              </Text>
                            ) : (
                              <Text style={styles.placeholderText}>-</Text>
                            )}
                          </View>
                        );
                      })}
                      <View style={[styles.tableCell, styles.colTotal]}>
                        <Text style={styles.totalScoreText}>
                          {(time.total || 0).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            </Page>
          );
        })}
    </Document>
  );
};

export default RelatorioGruposDocument;