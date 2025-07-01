// src/components/pdf/RelatorioTimesAdminDocument.js
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
  table: {
    width: "100%",
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "gray",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "gray",
    alignItems: "stretch", // Alterado para 'stretch' para garantir alinhamento vertical
  },
  tableHeader: {
    backgroundColor: "#2C2C44",
    alignItems: "center", // Garante que o header também se alinhe
  },
  tableCell: {
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderColor: "gray",
    padding: 6,
    justifyContent: "center",
  },
  // --- LARGURAS DAS COLUNAS AJUSTADAS PARA MELHOR ENCAIXE ---
  colPos: { width: "8%" },
  colTime: { width: "40%" },
  colCartola: { width: "37%" },
  colGrupo: { width: "15%" },

  headerTextCell: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    color: "#B0B0C0",
  },
  // --- CÉLULA DO TIME COM COMPORTAMENTO FLEXÍVEL ---
  teamCell: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap", // Permite que o conteúdo quebre a linha se necessário
  },
  teamInfo: {
    flexShrink: 1, // Permite que este container encolha para caber
    flexDirection: "column",
  },
  escudo: {
    width: 20,
    height: 20,
    marginRight: 8,
    flexShrink: 0, // Impede que o escudo encolha
  },
  cellText: {
    fontSize: 10,
    // A propriedade a seguir é importante para textos longos
    hyphenationCallback: (word) => [word],
  },
  cellTextCenter: { fontSize: 10, textAlign: "center" },
});

const RelatorioTimesAdminDocument = ({ teams, apiUrl }) => (
  <Document title="Lista de times - Libertadores do Cartola">
    <Page style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Libertadores do Cartola</Text>
        <Text style={{ ...styles.headerText, fontSize: 18, marginTop: 4 }}>
          Lista de Times da Competição
        </Text>
      </View>
      <View style={styles.table} wrap={false}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.tableCell, styles.colPos]}>
            <Text style={styles.headerTextCell}>#</Text>
          </View>
          <View style={[styles.tableCell, styles.colTime]}>
            <Text style={styles.headerTextCell}>Time</Text>
          </View>
          <View style={[styles.tableCell, styles.colCartola]}>
            <Text style={styles.headerTextCell}>Cartoleiro</Text>
          </View>
          <View style={[styles.tableCell, styles.colGrupo]}>
            <Text style={styles.headerTextCell}>Grupo</Text>
          </View>
        </View>
        {teams.map((team, index) => (
          <View key={team.id} style={styles.tableRow}>
            <View style={[styles.tableCell, styles.colPos]}>
              <Text style={styles.cellTextCenter}>{index + 1}</Text>
            </View>
            {/* --- ESTRUTURA DA CÉLULA DO TIME AJUSTADA --- */}
            <View style={[styles.tableCell, styles.colTime]}>
              <View style={styles.teamCell}>
                <Image
                  style={styles.escudo}
                  src={`${apiUrl}/api/image-proxy?url=${encodeURIComponent(
                    team.url_escudo
                  )}`}
                />
                <View style={styles.teamInfo}>
                  <Text style={styles.cellText}>{team.nome}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.tableCell, styles.colCartola]}>
              <Text style={styles.cellText}>{team.nome_cartola || "N/A"}</Text>
            </View>
            <View style={[styles.tableCell, styles.colGrupo]}>
              <Text style={styles.cellTextCenter}>{team.group || "-"}</Text>
            </View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default RelatorioTimesAdminDocument;
