import { useEffect, useRef, useState, useCallback } from 'react';
import '../assets/chatbox.css';
import { Candidate, useDemocracyContract } from '../hooks/useDemocracyContract';

export interface ChatResponse {
  reply: string;
  matched_wallets: string[];
}

export async function queryChat(embedding: number[]): Promise<ChatResponse> {
  const str = JSON.stringify({
    message: "Coso",
    embedding: Object.values(embedding),
  });
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: str,
  });
  return res.json();
}

interface ChatBoxProps {
  onMatchedWallets?: (wallets: string[]) => void;
}

export default function ChatBox({ onMatchedWallets }: ChatBoxProps) {
  const contract = useDemocracyContract();
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const worker = useRef<Worker | null>(null);

  useEffect(() => {
    if (response && Array.isArray(response.matched_wallets)) {
      onMatchedWallets?.(response.matched_wallets);
    }
  }, [response, onMatchedWallets]);

  useEffect(() => {
    if (!worker.current) {
      console.log("Cargando worker")
      worker.current = new Worker(new URL('/embedding-worker.js', import.meta.url), {
        type: 'module',
      });
    }

    const onMessageReceived = async (e: MessageEvent<any>) => {
      switch (e.data.status) {
        case 'initiate':
          setLoading(true);
          break;
        case 'loading':
          // Opcional: setear una barra de progreso con e.data.loaded / e.data.total
          break;
        case 'complete':
          try {
            const embedding = e.data.embedding;
            const res = await queryChat(embedding);
            const botReply = `🤖 ${res.reply}`;
            setMessages((prev) => [...prev, botReply]);
            // setResponse(res);
            if (res && Array.isArray(res.matched_wallets)) {
              // let list = [];
              // for (let i = 0; i < res.matched_wallets.length; i++) {
              //   const wallet = res.matched_wallets[i];
              //   console.log("PASA 2", wallet);
              //   // @ts-expect-error "Dynamic ABI import"
              //   const candidate: Candidate = new Candidate(await contract.read.candidates([wallet]));
              //   console.log("PASA 3", candidate);
              //   list.push({
              //     dni: candidate.citizen.person.dni,
              //     name: candidate.citizen.person.name,
              //     wallet: candidate.citizen.person.wallet,
              //     votes: candidate.voteCount,
              //   })
              // }
              // console.log(list);
              // onMatchedWallets?.(list);
              onMatchedWallets?.(res.matched_wallets);
            }
          } catch (err) {
            console.error(err);
            setMessages((prev) => [...prev, '❌ Error al procesar la consulta.']);
            setResponse(null);
          } finally {
            setLoading(false);
          }
          break;
      }
    };

    worker.current.addEventListener('message', onMessageReceived);

    return () => {
      worker.current?.removeEventListener('message', onMessageReceived);
    };
  }, [contract]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !worker.current) return;
    const newMessages = [...messages, `🧑‍💬 ${input}`];
    setMessages(newMessages);
    setInput('');
    worker.current.postMessage({ text: input });
  }, [input, messages]);

  return (
    <div className="chat-box">
      <div className="chat-header">🗣️ Chat de búsqueda</div>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className="chat-message">{m}</div>
        ))}

        {response && Array.isArray(response.matched_wallets) &&
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
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={loading}
        />
        <button onClick={sendMessage} className="styled" disabled={loading}>
          {loading ? '⏳' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}

