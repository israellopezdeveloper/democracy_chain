/// <reference lib="webworker" />

// src/workers/embedding-worker.ts
import {
  pipeline,
  type FeatureExtractionPipeline,
  // Omitimos ProgressCallback porque no está exportado en v2.17
  // type PipelineType,  // opcional, podemos tipar con literal
} from "@xenova/transformers";

// Tipo de progreso compatible con lo que emite @xenova/transformers
type Progress = (data: {
  status?: string;
  progress?: number; // 0..1
  loaded?: number;
  total?: number;
  name?: string;
  file?: string;
}) => void;

class EmbeddingPipeline {
  // Si no importas PipelineType, usa el literal:
  static task /*: PipelineType*/ = "feature-extraction" as const;
  static model = "Xenova/all-MiniLM-L12-v2";
  static instance: FeatureExtractionPipeline | null = null;

  static async getInstance(
    p_cb?: Progress,
  ): Promise<FeatureExtractionPipeline> {
    if (!this.instance) {
      const opts: Record<string, unknown> = {};
      if (p_cb) opts["progress_callback"] = p_cb; // solo se añade si existe

      this.instance = (await pipeline(
        this.task,
        this.model,
        opts,
      )) as unknown as FeatureExtractionPipeline;
    }
    return this.instance;
  }
}

self.addEventListener("message", async (event: MessageEvent) => {
  try {
    const { text } = event.data ?? {};
    if (typeof text !== "string" || text.trim() === "") {
      self.postMessage({
        status: "error",
        error: "Texto inválido para generar embedding.",
      });
      return;
    }

    const embedder = await EmbeddingPipeline.getInstance((progress) => {
      self.postMessage({ status: "loading", progress });
    });

    const output = await embedder(text, { pooling: "mean", normalize: true });

    self.postMessage({
      status: "complete",
      embedding: Array.from(output.data as Float32Array | number[]),
    });
  } catch (error: unknown) {
    let message = "Error desconocido en el worker.";
    if (error instanceof Error) {
      message = error.message;
    }
    self.postMessage({
      status: "error",
      error: message,
    });
  }
});
