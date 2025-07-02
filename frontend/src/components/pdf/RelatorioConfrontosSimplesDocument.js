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
// Manter o registro da fonte é uma boa prática.
Font.register({
  family: "Exo 2",
  fonts: [
    { src: "/fonts/Exo2-Regular.ttf" },
    { src: "/fonts/Exo2-Bold.ttf", fontWeight: "bold" },
  ],
});

// --- FUNÇÃO UTILITÁRIA ---
// Adicionada para truncar textos longos, evitando quebra de layout.
const truncateText = (text, maxLength) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

// --- ESTILOS (REFEITOS PARA MÁXIMA ROBUSTEZ E ELEGÂNCIA) ---
const styles = StyleSheet.create({
  // PAGE: A base do nosso documento.
  page: {
    fontFamily: "Exo 2",
    backgroundColor: "#1A1A2E", // Fundo escuro e imersivo
    color: "#EAEAEA",
    padding: 30, // Espaçamento generoso para "respiro"
  },
  // HEADER: Cabeçalho principal do relatório.
  header: {
    textAlign: "center",
    marginBottom: 30, // Mais espaço antes do conteúdo
    borderBottomWidth: 1.5,
    borderBottomColor: "#00E5FF", // Cor de destaque
    paddingBottom: 15,
  },
  headerText: {
    color: "#00E5FF",
    fontSize: 26, // Ligeiramente maior para mais impacto
    fontWeight: "bold",
    textTransform: "uppercase", // Estilo mais formal
    letterSpacing: 1,
  },
  subHeaderText: {
    fontSize: 14,
    color: "#B0B0C0", // Cor mais suave para o subtítulo
    marginTop: 4,
  },
  // ROUND TITLE: Título de cada rodada (ex: "Rodada 1").
  roundTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
    marginBottom: 20, // Mais espaço para separar as seções
    marginTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  // MATCH CONTAINER: O "card" de cada confronto.
  matchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Distribui o espaço entre os times
    backgroundColor: "#2C2C44",
    borderRadius: 8, // Bordas mais arredondadas
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.2)",
    position: "relative", // Necessário para o posicionamento do "groupChip"
  },
  // TEAM COLUMN: A coluna de cada time. Agora é flexível!
  teamColumn: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Ponto chave: permite que a coluna cresça e ocupe o espaço
    minWidth: 0, // Evita que a coluna empurre outros elementos
  },
  // VS COLUMN: A coluna central "VS".
  vsColumn: {
    paddingHorizontal: 15, // Espaçamento para não ficar colado nos times
  },
  vsText: {
    fontSize: 14,
    color: "#00E5FF",
    fontWeight: "bold",
  },
  // ESCUDO: Imagem do time.
  escudo: {
    width: 36,
    height: 36,
    borderRadius: 4, // Levemente arredondado
  },
  // TEAM INFO: Container para o nome do time e do cartoleiro.
  teamInfo: {
    flexDirection: "column",
    flex: 1, // Permite que o texto use o espaço disponível
    minWidth: 0, // Garante o comportamento de flex correto
  },
  teamName: {
    fontSize: 12, // Tamanho legível
    fontWeight: "bold",
  },
  cartolaName: {
    fontSize: 9,
    color: "#B0B0C0",
    marginTop: 2,
  },
  // GROUP CHIP: A etiqueta do grupo.
  groupChip: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    color: "#00E5FF",
    padding: "3px 6px",
    borderRadius: 4,
    fontSize: 8,
    fontWeight: "bold",
  },
});

// --- COMPONENTE TEAMDISPLAY (REFINADO) ---
// Responsável por exibir um time, controlando o alinhamento (esquerda ou direita)
const TeamDisplay = ({ team, direction = "left", apiUrl }) => {
  const isLeft = direction === "left";

  const imageSrc =
    team.url_escudo &&
    `${apiUrl}/api/image-proxy?url=${encodeURIComponent(team.url_escudo)}`;

  // Define o alinhamento dos elementos com base na direção
  const containerStyle = {
    justifyContent: isLeft ? "flex-start" : "flex-end",
  };
  const textAlignment = {
    alignItems: isLeft ? "flex-start" : "flex-end",
  };
  const escudoMargin = isLeft ? { marginRight: 12 } : { marginLeft: 12 };

  return (
    <View style={[styles.teamColumn, containerStyle]}>
      {isLeft && imageSrc && (
        <Image style={[styles.escudo, escudoMargin]} src={imageSrc} />
      )}
      <View style={[styles.teamInfo, textAlignment]}>
        {/* Usando a função truncateText para evitar quebras de layout */}
        <Text style={styles.teamName}>{truncateText(team.nome, 20)}</Text>
        <Text style={styles.cartolaName}>
          {truncateText(team.nome_cartola, 25)}
        </Text>
      </View>
      {!isLeft && imageSrc && (
        <Image style={[styles.escudo, escudoMargin]} src={imageSrc} />
      )}
    </View>
  );
};

// --- COMPONENTE PRINCIPAL DO DOCUMENTO (ATUALIZADO) ---
const RelatorioConfrontosSimplesDocument = ({ matchesByRound, apiUrl }) => (
  <Document title="Relatório de Confrontos Simplificado">
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Libertadores do Cartola</Text>
        <Text style={styles.subHeaderText}>Confrontos da Fase de Grupos</Text>
      </View>

      {Object.keys(matchesByRound)
        .sort(
          (a, b) =>
            parseInt(a.replace(/\D/g, ""), 10) -
            parseInt(b.replace(/\D/g, ""), 10)
        ) // Ordena as rodadas numericamente
        .map((roundName) => (
          <View key={roundName} wrap={false}>
            <Text style={styles.roundTitle}>{roundName}</Text>
            {matchesByRound[roundName]
              .sort((a, b) => a.group.localeCompare(b.group)) // Ordena os confrontos por grupo
              .map((match) => (
                <View key={match.id} style={styles.matchContainer}>
                  <Text style={styles.groupChip}>GRUPO {match.group}</Text>

                  {/* Componente do Time 1 (Home) */}
                  <TeamDisplay
                    team={match.home_team}
                    direction="left"
                    apiUrl={apiUrl}
                  />

                  {/* Coluna Central "VS" */}
                  <View style={styles.vsColumn}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>

                  {/* Componente do Time 2 (Away) */}
                  <TeamDisplay
                    team={match.away_team}
                    direction="right"
                    apiUrl={apiUrl}
                  />
                </View>
              ))}
          </View>
        ))}
    </Page>
  </Document>
);

export default RelatorioConfrontosSimplesDocument;
