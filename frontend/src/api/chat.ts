export interface ChatResponse {
  reply: string;
  matched_wallets: string[];
}

export async function queryChat(embedding: number[]): Promise<ChatResponse> {
  const str = JSON.stringify({
    message: "Hola",
    embedding: embedding,
  });
  const res = await fetch(`${import.meta.env["VITE_BACKEND_URL"]}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: str,
  });
  return res.json();
}

type WorkerInitiate = { status: "initiate" };
type WorkerLoading = { status: "loading"; progress: unknown };
type WorkerComplete = { status: "complete"; embedding: number[] };
export type WorkerMessage = WorkerInitiate | WorkerLoading | WorkerComplete;
