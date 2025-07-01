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

// --- ESTILOS FINAIS E OTIMIZADOS ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Exo 2",
    backgroundColor: "#1A1A2E",
    color: "#EAEAEA",
    padding: 30,
    flexDirection: 'column',
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
  tableCell: {
    padding: 6,
    justifyContent: "center",
  },
  // --- LARGURAS OTIMIZADAS PARA MELHOR DISTRIBUIÇÃO ---
  colPos: { width: "6%" },
  colTime: { width: "37%" },
  colRodada: { width: "8%" },
  colTotal: { width: "11%" },

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
    flexShrink: 1, 
  },
  teamName: { fontSize: 10 },
  cartolaName: { fontSize: 8, color: "#B0B0C0", marginTop: 2 },
  scoreText: {
    fontFamily: "Courier",
    fontSize: 10,
    textAlign: "right",
  },
  placeholderText: {
    fontFamily: "Courier",
    fontSize: 10,
    textAlign: "right",
    color: "#888888",
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
  // Garante que sempre teremos 6 rodadas no cabeçalho
  const displayRounds = Array.from({ length: 6 }, (_, i) => i + 1);

  return (
    <Document title="Classificação da Fase de Grupos">
      {Object.keys(grupos).sort().map((nomeGrupo) => (
        <Page key={nomeGrupo} style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Libertadores do Cartola</Text>
          </View>
          <Text style={styles.groupTitle}>
            {nomeGrupo !== "Sem Grupo" ? `Grupo ${nomeGrupo}` : "Times Sem Grupo"}
          </Text>
          <View style={styles.table} wrap={false}>
            {/* Cabeçalho Fixo com 6 Rodadas */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={[styles.tableCell, styles.colPos]}><Text style={styles.headerTextCell}>#</Text></View>
              <View style={[styles.tableCell, styles.colTime]}><Text style={styles.headerTextCell}>Time / Cartoleiro</Text></View>
              {displayRounds.map((roundNumber) => (
                <View key={`header-r${roundNumber}`} style={[styles.tableCell, styles.colRodada]}>
                  <Text style={styles.headerTextCell}>R{roundNumber}</Text>
                </View>
              ))}
              <View style={[styles.tableCell, styles.colTotal]}><Text style={styles.headerTextCell}>Total</Text></View>
            </View>
            
            {/* Corpo da Tabela */}
            {grupos[nomeGrupo]
              .sort((a, b) => (b.total || 0) - (a.total || 0))
              .map((time, index) => (
                <View key={time.id} style={styles.tableRow}>
                  <View style={[styles.tableCell, styles.colPos]}>
                    <Text style={styles.posText}>{index + 1}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colTime]}>
                    <View style={styles.teamCellContainer}>
                      <Image
                        style={styles.escudo}
                        src={`${apiUrl}/api/image-proxy?url=${encodeURIComponent(time.url_escudo)}`}
                      />
                      <View style={styles.teamInfo}>
                        <Text style={styles.teamName}>{time.nome}</Text>
                        <Text style={styles.cartolaName}>{time.nome_cartola}</Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* Lógica de Pontuação com Placeholder */}
                  {displayRounds.map((roundIndex) => {
                    const cartolaRoundNumber = rounds[roundIndex - 1];
                    const score = cartolaRoundNumber ? time.pontuacoes?.[`rodada_${cartolaRoundNumber}`] : null;
                    
                    return (
                      <View key={`score-${time.id}-r${roundIndex}`} style={[styles.tableCell, styles.colRodada]}>
                        {typeof score === 'number' ? (
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
      ))}
    </Document>
  );
};

export default RelatorioGruposDocument;