import { useState } from 'react';
import '../assets/chatbox.css';

export default function ChatBox() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, input]);
    setInput('');
  };

  return (
    <div className="chat-box">
      <div className="chat-header">🗣️ Chat de búsqueda</div>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className="chat-message">{m}</div>
        ))}
      </div>
      <div className="chat-input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className={'styled'}>Enviar</button>
      </div>
    </div>
  );
}

