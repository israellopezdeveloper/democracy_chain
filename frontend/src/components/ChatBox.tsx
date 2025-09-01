import { useEffect, useRef, useState, useCallback, type JSX } from "react";
import "../assets/chatbox.css";
import { useDemocracyContract } from "../hooks/useDemocracyContract";
import { queryChat, type ChatResponse, type WorkerMessage } from "../api/chat";

interface ChatBoxProps {
  onMatchedWallets?: (wallets: string[]) => void;
}

export default function ChatBox({
  onMatchedWallets,
}: ChatBoxProps): JSX.Element {
  const contract = useDemocracyContract();
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const worker = useRef<Worker | null>(null);

  // Cargar historial desde localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch {
        // ignorar
      }
    }
    const savedInput = localStorage.getItem("chatInput");
    if (savedInput) {
      setInput(savedInput);
    }
  }, []);

  // Guardar historial en localStorage
  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  // Guardar input no enviado
  useEffect(() => {
    localStorage.setItem("chatInput", input);
  }, [input]);

  useEffect(() => {
    if (response && Array.isArray(response.matched_wallets)) {
      onMatchedWallets?.(response.matched_wallets);
    }
  }, [response, onMatchedWallets]);

  useEffect(() => {
    if (!worker.current) {
      console.log("Cargando worker");
      worker.current = new Worker(
        new URL("../workers/embedding-worker.ts", import.meta.url),
        {
          type: "module",
        },
      );
    }

    const onMessageReceived = async (e: MessageEvent<WorkerMessage>) => {
      switch (e.data.status) {
        case "initiate":
          setLoading(true);
          break;
        case "loading":
          break;
        case "complete":
          try {
            const embedding = e.data.embedding;
            const res: ChatResponse = await queryChat(embedding);
            const botReply: string = `🤖 ${res.reply}`;
            setMessages((prev) => [...prev, botReply]);
            if (res && Array.isArray(res.matched_wallets)) {
              onMatchedWallets?.(res.matched_wallets);
            }
          } catch (err) {
            console.error(err);
            setMessages((prev) => [
              ...prev,
              "❌ Error al procesar la consulta.",
            ]);
            setResponse(null);
          } finally {
            setLoading(false);
          }
          break;
      }
    };

    worker.current.addEventListener("message", onMessageReceived);

    return () => {
      worker.current?.removeEventListener("message", onMessageReceived);
    };
  }, [contract, onMatchedWallets]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !worker.current) return;
    const newMessages = [...messages, `🧑‍💬 ${input}`];
    setMessages(newMessages);
    setInput("");
    worker.current.postMessage({ text: input });
  }, [input, messages]);

  return (
    <div className="chat-box">
      <div className="chat-header">🗣️ Chat de búsqueda</div>

      <div className="chat-messages">
        {messages.map((m, i) => {
          const isBot = m.startsWith("🤖") || m.startsWith("❌");
          return (
            <div key={i} className={`chat-message ${isBot ? "bot" : "user"}`}>
              {m}
            </div>
          );
        })}

        {response &&
          Array.isArray(response.matched_wallets) &&
          response.matched_wallets.length > 0 && (
            <div className="chat-message highlight">
              <strong>🎯 Programas destacados:</strong>
              <ul>
                {response?.matched_wallets.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
      </div>

      <div className="chat-input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={loading}
        />
        <button onClick={sendMessage} className="styled" disabled={loading}>
          {loading ? "⏳" : "Enviar"}
        </button>
      </div>
    </div>
  );
}
