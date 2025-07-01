// frontend/src/utils/download.js
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { saveAs } from "file-saver";

// Função para converter Blob para Base64, necessária para a API do Filesystem
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      // O resultado do reader inclui o prefixo "data:...", que precisamos remover
      const dataUrl = reader.result;
      const base64 = dataUrl.split(",", 2)[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};

export const savePdf = async (blob, fileName, showFeedback) => {
  // Verifica se está rodando em uma plataforma nativa (Android/iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      if (showFeedback)
        showFeedback("info", "Salvando arquivo no dispositivo...");

      const base64Data = await blobToBase64(blob);

      // Salva o arquivo na pasta de Downloads do dispositivo
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Downloads, // Diretório padrão de Downloads
        recursive: true,
      });

      if (showFeedback)
        showFeedback("success", `Relatório salvo em: ${result.uri}`);

      return result;
    } catch (e) {
      console.error("Erro ao salvar arquivo no dispositivo nativo", e);
      if (showFeedback)
        showFeedback(
          "error",
          "Não foi possível salvar o arquivo. Verifique as permissões."
        );
      throw e;
    }
  } else {
    // Se estiver na web, usa o método tradicional com file-saver
    try {
      if (showFeedback)
        showFeedback("info", "Iniciando download do relatório...");
      saveAs(blob, fileName);
    } catch (e) {
      console.error("Erro ao salvar com file-saver:", e);
      if (showFeedback)
        showFeedback("error", "Ocorreu um erro ao iniciar o download.");
      throw e;
    }
  }
};
