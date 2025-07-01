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

// --- ESTILOS ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Exo 2",
    backgroundColor: "#1A1A2E",
    color: "#EAEAEA",
    padding: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around", // Distribui o espaço
    alignContent: "flex-start",
  },
  header: {
    width: "100%",
    textAlign: "center",
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: "#00E5FF",
    paddingBottom: 15,
  },
  headerText: { color: "#00E5FF", fontSize: 24, fontWeight: "bold" },
  groupContainer: {
    width: "48%", // Em paisagem, 48% funciona bem para 2 colunas
    backgroundColor: "#2C2C44",
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.5)",
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "gray",
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
    fontSize: 10,
  },
  cartolaName: {
    fontSize: 8,
    color: "#B0B0C0",
  },
});

// --- COMPONENTE DO DOCUMENTO ---
const RelatorioSorteioDocument = ({ groups, apiUrl }) => (
  <Document title="Resultado do Sorteio dos Grupos">
    {/* AQUI ESTÁ A MUDANÇA: orientation="landscape" */}
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Resultado do Sorteio</Text>
      </View>

      {Object.keys(groups)
        .sort()
        .map((groupName) => (
          <View key={groupName} style={styles.groupContainer}>
            <Text style={styles.groupTitle}>Grupo {groupName}</Text>
            {groups[groupName].map((team) => (
              <View key={team.id} style={styles.teamRow}>
                <Image
                  style={styles.escudo}
                  src={`${apiUrl}/api/image-proxy?url=${encodeURIComponent(
                    team.url_escudo
                  )}`}
                />
                <View style={styles.teamInfo}>
                  <Text style={styles.teamName}>{team.nome}</Text>
                  <Text style={styles.cartolaName}>{team.nome_cartola}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
    </Page>
  </Document>
);

export default RelatorioSorteioDocument;