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

// --- Fontes ---
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

// --- Estilos ---
const styles = StyleSheet.create({
  page: {
    fontFamily: "Exo 2",
    backgroundColor: "#1A1A2E",
    color: "#EAEAEA",
    padding: 20,
  },
  headerText: {
    color: "#00E5FF",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  stageTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#B0B0C0",
    position: "absolute",
  },
  matchContainer: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "gray",
    backgroundColor: "#2C2C44",
    borderRadius: 3,
    padding: 6,
  },
  team: {
    flexDirection: "row",
    alignItems: "center",
  },
  escudo: {
    width: 16,
    height: 16,
    marginRight: 5,
  },
  teamName: {
    fontSize: 8,
  },
  winner: {
    fontWeight: "bold",
  },
  score: {
    fontSize: 8,
    fontFamily: "Courier",
    fontWeight: "bold",
    marginLeft: 4,
    color: "#00E5FF",
  },
  connector: {
    position: "absolute",
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: "gray",
  },
  championContainer: {
    position: "absolute",
    alignItems: "center",
  },
  championCard: {
    backgroundColor: "#2C2C44",
    padding: 15,
    borderWidth: 1.5,
    borderColor: "#00E5FF",
    borderRadius: 5,
    alignItems: "center",
  },
  championText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00E5FF",
  },
});

// --- Componentes do PDF ---

const BracketMatch = ({ element, apiUrl }) => {
  const { matchData } = element;
  const winnerId = matchData.winnerTeam?.id;
  return (
    <View
      style={{
        ...styles.matchContainer,
        top: element.top,
        left: element.left,
        width: element.width,
        height: element.height,
      }}
    >
      <View style={styles.team}>
        <Image
          style={styles.escudo}
          src={`${apiUrl}/api/image-proxy?url=${encodeURIComponent(
            matchData.team1?.url_escudo || ""
          )}`}
        />
        <Text
          style={[
            styles.teamName,
            matchData.team1?.id === winnerId && styles.winner,
          ]}
        >
          {matchData.team1
            ? truncateText(matchData.team1.nome, 18)
            : "A definir"}
        </Text>
        <Text
          style={[
            styles.score,
            matchData.team1?.id === winnerId && styles.winner,
          ]}
        >
          {typeof matchData.aggregates?.[0] === "number"
            ? matchData.aggregates[0].toFixed(2)
            : ""}
        </Text>
      </View>
      <View style={{ height: 1, backgroundColor: "gray", marginVertical: 4 }} />
      <View style={styles.team}>
        <Image
          style={styles.escudo}
          src={`${apiUrl}/api/image-proxy?url=${encodeURIComponent(
            matchData.team2?.url_escudo || ""
          )}`}
        />
        <Text
          style={[
            styles.teamName,
            matchData.team2?.id === winnerId && styles.winner,
          ]}
        >
          {matchData.team2
            ? truncateText(matchData.team2.nome, 18)
            : "A definir"}
        </Text>
        <Text
          style={[
            styles.score,
            matchData.team2?.id === winnerId && styles.winner,
          ]}
        >
          {typeof matchData.aggregates?.[1] === "number"
            ? matchData.aggregates[1].toFixed(2)
            : ""}
        </Text>
      </View>
    </View>
  );
};

const Connector = ({ element }) => (
  <View
    style={{
      ...styles.connector,
      top: element.top,
      left: element.left,
      width: element.width,
      height: element.height,
    }}
  />
);

const Champion = ({ element, campeao }) => (
  <View
    style={{
      ...styles.championContainer,
      top: element.top,
      left: element.left,
    }}
  >
    <Text style={styles.stageTitle}>CAMPEÃO</Text>
    <View style={styles.championCard}>
      <Image
        style={{ width: 60, height: 60, marginBottom: 8 }}
        src={`${
          process.env.REACT_APP_API_URL
        }/api/image-proxy?url=${encodeURIComponent(campeao?.url_escudo || "")}`}
      />
      <Text style={styles.championName}>
        {campeao ? campeao.nome : "A definir"}
      </Text>
    </View>
  </View>
);

const truncateText = (text, maxLength) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

// --- Documento Principal ---
const ChaveamentoVisualDocument = ({ elements, apiUrl }) => (
  <Document title="Chaveamento da Fase Final">
    <Page size="A3" orientation="landscape" style={styles.page}>
      <Text style={styles.headerText}>Chaveamento da Fase Final</Text>
      {elements.map((element, index) => {
        if (element.type === "title") {
          return (
            <Text
              key={index}
              style={{
                ...styles.stageTitle,
                top: element.top,
                left: element.left,
              }}
            >
              {element.text}
            </Text>
          );
        }
        if (element.type === "match") {
          return <BracketMatch key={index} element={element} apiUrl={apiUrl} />;
        }
        if (element.type === "connector") {
          return <Connector key={index} element={element} />;
        }
        if (element.type === "champion") {
          return (
            <Champion key={index} element={element} campeao={element.campeao} />
          );
        }
        return null;
      })}
    </Page>
  </Document>
);

export default ChaveamentoVisualDocument;
