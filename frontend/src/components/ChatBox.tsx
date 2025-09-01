import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type JSX,
} from "react";
import "../assets/chatbox.css";
import { useDemocracyContract } from "../hooks/useDemocracyContract";
import {
  queryChat,
  type ChatResponse,
  type WorkerMessage,
} from "../api/chat";

interface ChatBoxProps {
  onMatchedWallets?: (wallets: string[]) => void;
}

export default function ChatBox({
  onMatchedWallets,
}: ChatBoxProps): JSX.Element {
  const contract = useDemocracyContract();

  // ✅ Hidrata desde localStorage en la inicialización (evita pisar datos)
  const [messages, setMessages] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("chatMessages");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState<string>(() => {
    try {
      return localStorage.getItem("chatInput") ?? "";
    } catch {
      return "";
    }
  });

  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const worker = useRef<Worker | null>(null);

  // ✅ Persistencia: solo este effect (ya no hay “carga” tardía)
  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("chatInput", input);
  }, [input]);

  // Propaga wallets destacados hacia arriba
  useEffect(() => {
    if (response && Array.isArray(response.matched_wallets)) {
      onMatchedWallets?.(response.matched_wallets);
    }
  }, [response, onMatchedWallets]);

  // ✅ Worker: crear/limpiar + handler estable
  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(
        new URL("../workers/embedding-worker.ts", import.meta.url),
        { type: "module" },
      );
    }

    const onMessageReceived = async (
      e: MessageEvent<WorkerMessage>,
    ) => {
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
            const botReply = `🤖 ${res.reply}`;

            // ✅ Actualización funcional (evita closures obsoletos)
            setMessages((prev) => [...prev, botReply]);
            setResponse(res);
            if (Array.isArray(res.matched_wallets)) {
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
      worker.current?.removeEventListener(
        "message",
        onMessageReceived,
      );
      // opcional: terminar el worker para liberar memoria al cambiar de página
      worker.current?.terminate();
      worker.current = null;
    };
  }, [contract, onMatchedWallets]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || !worker.current) return;

    // ✅ Actualización funcional
    setMessages((prev) => [...prev, `🧑‍💬 ${text}`]);
    setInput("");
    worker.current.postMessage({ text });
  }, [input]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setResponse(null);
    localStorage.removeItem("chatMessages");
    localStorage.removeItem("chatInput");
  }, []);

  return (
    <div className="chat-box">
      <div className="chat-header">🗣️ Chat de búsqueda</div>

      <div className="chat-messages">
        {messages.map((m, i) => {
          const isBot = m.startsWith("🤖") || m.startsWith("❌");
          return (
            <div
              key={i}
              className={`chat-message ${isBot ? "bot" : "user"}`}
            >
              {m}
            </div>
          );
        })}

        {response?.matched_wallets?.length ? (
          <div className="chat-message highlight">
            <strong>🎯 Programas destacados:</strong>
            <ul>
              {response.matched_wallets.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="chat-input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault(); // evita salto de línea accidental
              sendMessage();
            }
          }}
          disabled={loading}
        />
        <div className="chat-buttons">
          <button
            onClick={sendMessage}
            className="styled"
            disabled={loading}
          >
            {loading ? "⏳" : "Enviar"}
          </button>
          <button onClick={clearChat} className="styled clear-btn">
            🧹
          </button>
        </div>
      </div>
    </div>
  );
}
