import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type JSX,
} from "react";
import "../assets/chatbox.css";
import {
  useDemocracyContract,
  Citizen,
} from "../hooks/useDemocracyContract";
import {
  queryChat,
  type ChatResponse,
  type WorkerMessage,
} from "../api/chat";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { usePublicClient } from "wagmi";
import type { Abi, Address } from "viem";

interface ChatBoxProps {
  onMatchedWallets?: (wallets: string[]) => void;
}

// Config opcional de marked (una vez)
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Emojis/prefijos usados para marcar el rol
const KNOWN_PREFIXES = new Set(["🤖", "❌", "🧑‍💬"]);

/** Separa prefijo emoji (si existe) del cuerpo, manejando Unicode correctamente */
function splitPrefixUnicodeSafe(s: string): {
  prefix: string | null;
  body: string;
} {
  const cp = Array.from(s);
  if (cp.length === 0) return { prefix: null, body: s };

  if (KNOWN_PREFIXES.has(cp[0] || "")) {
    if (cp[1] === " ")
      return { prefix: cp[0] || "", body: cp.slice(2).join("") };
    return { prefix: cp[0] || "", body: cp.slice(1).join("") };
  }
  return { prefix: null, body: s };
}

export default function ChatBox({
  onMatchedWallets,
}: ChatBoxProps): JSX.Element {
  const contract = useDemocracyContract();
  const publicClient = usePublicClient();
  const citizenCache = useRef<Map<string, string>>(new Map());

  /** Reemplaza direcciones 0x... por <b>Nombre</b> usando el contrato */
  const replaceWallets = useCallback(
    async (html: string): Promise<string> => {
      const ETH_ADDR_RE = /0x[a-fA-F0-9]{40}/g;
      if (!html) return html;
      if (!contract || !publicClient) return html;

      const matches = html.match(ETH_ADDR_RE);
      if (!matches) return html;

      const uniqueAddresses = Array.from(new Set(matches));
      const replacements: Record<string, string> = {};

      for (const wallet of uniqueAddresses) {
        // cache para no golpear el contrato repetidamente
        const cached = citizenCache.current.get(wallet);
        if (cached) {
          replacements[wallet] =
            `<b>${DOMPurify.sanitize(cached)}</b>`;
          continue;
        }

        try {
          const citizenUnknown = await publicClient.readContract({
            address: contract.address as Address,
            abi: contract.abi as Abi,
            functionName: "citizens",
            args: [wallet],
          });
          // @ts-expect-error dynamic
          const citizen: Citizen = new Citizen(citizenUnknown);
          const name = citizen?.person?.name ?? wallet;
          citizenCache.current.set(wallet, String(name));
          replacements[wallet] =
            `<b>${DOMPurify.sanitize(String(name))}</b>`;
        } catch (err) {
          console.warn(
            `No se pudo resolver citizen para ${wallet}`,
            err,
          );
          replacements[wallet] = wallet; // fallback
        }
      }

      let updatedHtml = html;
      for (const [addr, label] of Object.entries(replacements)) {
        updatedHtml = updatedHtml.replace(
          new RegExp(addr, "g"),
          label,
        );
      }
      return updatedHtml;
    },
    [contract, publicClient],
  );

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

  // HTML final por mensaje (mismo índice que messages)
  const [renderedHtml, setRenderedHtml] = useState<string[]>([]);
  const processedCountRef = useRef(0); // cuántos mensajes ya están procesados

  // ✅ Persistencia
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
    setRenderedHtml([]);
    processedCountRef.current = 0;
    localStorage.removeItem("chatMessages");
    localStorage.removeItem("chatInput");
  }, []);

  // ===========================
  // Procesamiento incremental a HTML final seguro
  // ===========================
  useEffect(() => {
    let cancelled = false;

    const processNewMessages = async () => {
      const start = processedCountRef.current;
      if (start >= messages.length) return;

      const nextRendered = renderedHtml.slice();

      for (let i = start; i < messages.length; i++) {
        const m = messages[i] || "";

        const { prefix, body } = splitPrefixUnicodeSafe(m);
        const isBot = prefix === "🤖" || prefix === "❌";

        // 1) Markdown -> HTML y sanitizar
        const unsafe: string = marked.parse(body) as string;
        const safe = DOMPurify.sanitize(unsafe);

        // 2) Si es del bot, resolver wallets -> <b>Nombre</b>
        const finalHtml = isBot
          ? prefix + (await replaceWallets(safe))
          : safe;

        if (cancelled) return;
        nextRendered[i] = finalHtml;
      }

      if (!cancelled) {
        setRenderedHtml(nextRendered);
        processedCountRef.current = messages.length;
      }
    };

    void processNewMessages();
    return () => {
      cancelled = true;
    };
  }, [
    messages,
    contract,
    publicClient,
    renderedHtml,
    replaceWallets,
  ]);

  return (
    <div className="chat-box">
      <div className="chat-header">🗣️ Chat de búsqueda</div>

      <div className="chat-messages">
        {messages.map((m, i) => {
          const { prefix } = splitPrefixUnicodeSafe(m);
          const isBot = prefix === "🤖" || prefix === "❌";
          const html = renderedHtml[i];

          return (
            <div
              key={i}
              className={`chat-message ${isBot ? "bot" : "user"}`}
            >
              {/* mientras procesa mostramos el texto plano original */}
              {html ? (
                <div dangerouslySetInnerHTML={{ __html: html }} />
              ) : (
                <span>{m}</span>
              )}
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
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
