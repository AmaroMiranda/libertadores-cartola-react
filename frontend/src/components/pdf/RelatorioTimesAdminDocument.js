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

// Registre as fontes que você já usa no projeto
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
  },
  tableHeader: { backgroundColor: "#2C2C44" },
  tableCell: {
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderColor: "gray",
    padding: 6,
    justifyContent: "center",
  },
  colPos: { width: "8%" },
  colTime: { width: "42%" },
  colCartola: { width: "35%" },
  colGrupo: { width: "15%" },
  headerTextCell: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    color: "#B0B0C0",
  },
  teamCell: { flexDirection: "row", alignItems: "center" },
  escudo: { width: 20, height: 20, marginRight: 8 },
  cellText: { fontSize: 10 },
  cellTextCenter: { fontSize: 10, textAlign: "center" },
});

const RelatorioTimesAdminDocument = ({ teams, apiUrl }) => (
  <Document title="Relatório de Times - Admin">
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Lista de Times da Competição</Text>
      </View>
      <View style={styles.table}>
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
            <View style={[styles.tableCell, styles.colTime]}>
              <View style={styles.teamCell}>
                <Image
                  style={styles.escudo}
                  src={`${apiUrl}/api/image-proxy?url=${encodeURIComponent(
                    team.url_escudo
                  )}`}
                />
                <Text style={styles.cellText}>{team.nome}</Text>
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
