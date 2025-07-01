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

// --- ESTILOS (REFEITOS PARA MÁXIMA ROBUSTEZ) ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Exo 2",
    backgroundColor: "#1A1A2E",
    color: "#EAEAEA",
    padding: 30, // Padding generoso
  },
  header: {
    textAlign: "center",
    marginBottom: 25,
    borderBottomWidth: 1.5,
    borderBottomColor: "#00E5FF",
    paddingBottom: 15,
  },
  headerText: { color: "#00E5FF", fontSize: 24, fontWeight: "bold" },
  // Usar a prop 'break' garante que um grupo não será cortado entre páginas
  groupContainer: {
    backgroundColor: "#2C2C44",
    borderRadius: 5,
    padding: 15,
    marginBottom: 20, // Espaço entre os grupos
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.5)",
    break: "avoid", // Impede que o grupo seja dividido entre páginas
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "gray",
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10, // Aumenta o espaço entre os times
    padding: 5,
  },
  escudo: {
    width: 30,
    height: 30,
    marginRight: 12,
  },
  teamInfo: {
    flexDirection: "column",
  },
  teamName: {
    fontSize: 12, // Aumenta a fonte para melhor legibilidade
  },
  cartolaName: {
    fontSize: 9,
    color: "#B0B0C0",
    marginTop: 2,
  },
});

// --- COMPONENTE DO DOCUMENTO ---
const RelatorioSorteioDocument = ({ groups, apiUrl }) => (
  <Document title="Resultado do Sorteio dos Grupos">
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Resultado do Sorteio</Text>
      </View>

      {/* Renderiza um grupo por vez, em uma única coluna */}
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