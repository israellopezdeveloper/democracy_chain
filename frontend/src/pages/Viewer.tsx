import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Modal } from "../components/Modal";

export default function ViewerPage() {
  const [searchParams] = useSearchParams();
  const wallet = searchParams.get('wallet');
  const name = searchParams.get('name');

  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet) return;

    const fetchProgram = async () => {
      try {
        const res = await fetch(`http://localhost:8000/${wallet}/program`);
        if (!res.ok) throw new Error("Programa no encontrado");
        const text = await res.text();

        setContent(text);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchProgram();
  }, [wallet]);

  if (!wallet || error || !content) {
    return (
      <Modal
        title="📃 Error"
        message="No existe el programa"
        onClose={() => { }}
        autoCloseDelay={4000}
        redirectTo='/candidates'
      />
    )
  }


  return (<main>
    <div>
      <img
        src="/freedom.svg"
        alt="Freedom"
      />
      <div>
        <h1>
          Democracy Chain
        </h1>

        <h2>
          📘 Programa Electoral de {name}
        </h2>

        <div
          className={'viewer'}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  </main>)
}

