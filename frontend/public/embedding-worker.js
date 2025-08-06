import { pipeline } from "@huggingface/transformers";

/**
 * Singleton para cargar el modelo una sola vez
 */
class EmbeddingPipeline {
  static task = "feature-extraction";
  static model = "Xenova/all-MiniLM-L12-v2";
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (!this.instance) {
      this.instance = await pipeline(this.task, this.model, {
        progress_callback,
      });
      console.log("Modelo cargado.");
    }
    return this.instance;
  }
}

// Escuchar mensajes del hilo principal
self.addEventListener("message", async (event) => {
  try {
    const { text } = event.data;

    if (typeof text !== "string" || text.trim() === "") {
      self.postMessage({
        status: "error",
        error: "Texto inválido para generar embedding.",
      });
      return;
    }

    // Cargar modelo si es necesario
    const embedder = await EmbeddingPipeline.getInstance((progress) => {
      self.postMessage({
        status: "loading",
        progress,
      });
    });

    // Obtener embedding
    const output = await embedder(text, {
      pooling: "mean",
      normalize: true,
    });

    // Enviar resultado al hilo principal
    self.postMessage({
      status: "complete",
      embedding: output.data, // Asegurado como Array
    });
  } catch (error) {
    console.error("Error en el worker:", error);
    self.postMessage({
      status: "error",
      error: error.message || "Error desconocido en el worker.",
    });
  }
});
