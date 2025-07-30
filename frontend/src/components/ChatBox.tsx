import { useState } from 'react';
import '../assets/chatbox.css';

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
  matched_wallets: string[];
}

export async function queryChat(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('Error al consultar el modelo');
  return res.json();
}

export default function ChatBox() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, `🧑‍💬 ${input}`];
    setMessages(newMessages);
    setLoading(true);
    setInput('');

    try {
      const res = await queryChat({ message: input });
      const botReply = `🤖 ${res.reply}`;
      setMessages([...newMessages, botReply]);
      setResponse(res);
    } catch (e) {
      setMessages([...newMessages, '❌ Error al procesar la consulta.']);
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

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
          type="text"
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

