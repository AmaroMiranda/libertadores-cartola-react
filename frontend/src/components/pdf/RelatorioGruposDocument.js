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

// FUNÇÃO PARA TRUNCAR TEXTO LONGO
const truncateText = (text, maxLength) => {
  if (!text) return "";
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength).trim() + "...";
};

// ESTILO FINAL E REFINADO
const styles = StyleSheet.create({
  page: {
    fontFamily: "Exo 2",
    backgroundColor: "#1A1A2E",
    color: "#EAEAEA",
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottomWidth: 1.5,
    // COR ALTERADA para coincidir com o total
    borderBottomColor: "#00E5FF",
    paddingBottom: 15,
  },
  headerText: {
    // COR ALTERADA para coincidir com o total
    color: "#00E5FF",
    fontSize: 24,
    fontWeight: "bold",
  },
  groupTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#EAEAEA",
    marginBottom: 20,
  },
  table: {
    width: "100%",
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "gray",
  },
  tableRow: {
    flexDirection: "row",
  },
  qualifiedRow: {
    backgroundColor: "rgba(0, 229, 255, 0.1)",
  },
  tableCell: {
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderColor: "gray",
    padding: 8,
  },
  // LARGURAS FIXAS E ESTÁVEIS
  colPos: { width: 35 },
  colTime: { width: 135 },
  colRodada: { width: 50 },
  colTotal: { width: 65 },
  headerTextCell: {
    fontFamily: "Exo 2",
    fontWeight: "bold",
    fontSize: 10,
    textAlign: "center",
  },
  teamCellContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  teamInfo: {
    flexDirection: "column",
    paddingLeft: 8,
  },
  teamName: {
    fontSize: 10,
  },
  cartolaName: {
    fontSize: 8,
    color: "#B0B0C0",
    marginTop: 2,
  },
  escudo: {
    width: 24,
    height: 24,
    flexShrink: 0,
  },
  scoreText: {
    fontFamily: "Courier",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "right",
    color: "#EAEAEA",
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

const RelatorioGruposDocument = ({ grupos, rounds, apiUrl }) => (
  <Document title="Classificação da Fase de Grupos">
    {Object.keys(grupos)
      .sort()
      .map((nomeGrupo) => (
        <Page
          key={nomeGrupo}
          size={{ width: 595, height: 380 }}
          style={styles.page}
        >
          <View style={styles.header}>
            <Text style={styles.headerText}>Libertadores do Cartola</Text>
          </View>
          <Text style={styles.groupTitle}>
            {nomeGrupo !== "Sem Grupo"
              ? `Grupo ${nomeGrupo}`
              : "Times Sem Grupo"}
          </Text>
          <View style={styles.table}>
            {/* Cabeçalho */}
            <View style={styles.tableRow}>
              <View
                style={[
                  styles.tableCell,
                  styles.colPos,
                  { justifyContent: "center" },
                ]}
              >
                <Text style={styles.headerTextCell}>#</Text>
              </View>
              <View
                style={[
                  styles.tableCell,
                  styles.colTime,
                  { justifyContent: "center" },
                ]}
              >
                <Text style={[styles.headerTextCell, { textAlign: "left" }]}>
                  Time / Cartoleiro
                </Text>
              </View>
              {rounds.map((r) => (
                <View
                  key={r}
                  style={[
                    styles.tableCell,
                    styles.colRodada,
                    { justifyContent: "center" },
                  ]}
                >
                  <Text style={styles.headerTextCell}>R{r}</Text>
                </View>
              ))}
              <View
                style={[
                  styles.tableCell,
                  styles.colTotal,
                  { justifyContent: "center" },
                ]}
              >
                <Text style={[styles.headerTextCell, { textAlign: "right" }]}>
                  Total
                </Text>
              </View>
            </View>
            {/* Corpo da Tabela */}
            {grupos[nomeGrupo]
              .sort((a, b) => (b.total || 0) - (a.total || 0))
              .map((time, index) => {
                const isQualified = index < 2;
                const rowStyles = [styles.tableRow];
                if (isQualified) {
                  rowStyles.push(styles.qualifiedRow);
                }

                return (
                  <View key={time.id} style={rowStyles}>
                    <View
                      style={[
                        styles.tableCell,
                        styles.colPos,
                        { justifyContent: "center" },
                      ]}
                    >
                      <Text style={styles.posText}>{index + 1}</Text>
                    </View>
                    <View style={[styles.tableCell, styles.colTime]}>
                      <View style={styles.teamCellContainer}>
                        <Image
                          style={styles.escudo}
                          src={`${apiUrl}/api/image-proxy?url=${encodeURIComponent(
                            time.url_escudo
                          )}`}
                          cache={false}
                        />
                        <View style={styles.teamInfo}>
                          <Text style={styles.teamName}>
                            {truncateText(time.nome, 16)}
                          </Text>
                          <Text style={styles.cartolaName}>
                            {truncateText(time.nome_cartola, 18)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {rounds.map((r) => (
                      <View
                        key={r}
                        style={[
                          styles.tableCell,
                          styles.colRodada,
                          { justifyContent: "center" },
                        ]}
                      >
                        <Text style={styles.scoreText}>
                          {(time.pontuacoes?.[`rodada_${r}`] || 0).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                    <View
                      style={[
                        styles.tableCell,
                        styles.colTotal,
                        { justifyContent: "center" },
                      ]}
                    >
                      <Text style={styles.totalScoreText}>
                        {(time.total || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>
        </Page>
      ))}
  </Document>
);

export default RelatorioGruposDocument;
