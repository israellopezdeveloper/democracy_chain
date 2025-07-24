import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { ResizableImage } from '../components/ResizableImage'
import '../assets/TiptapEditor.css'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import {
  FaListUl,
  FaListOl,
  FaBold,
  FaItalic,
  FaUnderline,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaUndo,
  FaRedo,
  FaImage,
  FaDatabase,
  FaLink,
  FaSave,
} from 'react-icons/fa'

type FileJSONInput =
  | { filename: string; wallet_address: string; created_at: string, mime_type: string; }
  | [string, string, string, string]
  | null;
// Mapeo de extensiones a emojis
const extensionIcons: Record<string, string> = {
  pdf: '📄',
  doc: '📝',
  docx: '📝',
  xls: '📊',
  xlsx: '📊',
  csv: '📑',
  zip: '🗜️',
  rar: '🗜️',
  ppt: '📽️',
  pptx: '📽️',
  txt: '📄',
  md: '📘',
  json: '🧾',
  js: '📟',
  ts: '📟',
  java: '☕',
  cpp: '🧠',
  py: '🐍',
  mp4: '🎬',
  mp3: '🎵',
  jpg: '🖼️',
  jpeg: '🖼️',
  png: '🖼️',
  gif: '🖼️',
};


class FileJSON {
  filename: string;
  wallet_address: string;
  created_at: string;
  mime_type: string;

  constructor(data: FileJSONInput) {
    if (Array.isArray(data)) {
      const [filename, wallet_address, created_at, mime_type] = data;
      this.filename = filename;
      this.wallet_address = wallet_address;
      this.created_at = created_at;
      this.mime_type = mime_type;
    } else if (
      data &&
      typeof data === "object" &&
      "filename" in data &&
      "wallet_address" in data &&
      "created_at" in data &&
      "mime_type" in data
    ) {
      this.filename = data.filename;
      this.wallet_address = data.wallet_address;
      this.created_at = data.created_at;
      this.mime_type = data.mime_type;
    } else {
      this.filename = "";
      this.wallet_address = "0x0000000000000000000000000000000000000000";
      this.created_at = "";
      this.mime_type = "";
    }
  }
}

export default function TiptapEditor() {
  const { address } = useAccount();

  const [initialContent, setInitialContent] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [files, setFiles] = useState<FileJSON[]>([])

  const loadFileList = async () => {
    try {
      const res = await fetch(`http://localhost:8000/${address}/file`);
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      console.error('Error al cargar archivos:', err);
    }
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(`http://localhost:8000/${address}/program`)
        if (!res.ok) throw new Error('No program found')
        const text = await res.text()
        setInitialContent(text)
      } catch (err) {
        console.warn('No saved content or error loading:', err)
        setInitialContent('<p></p>')
      }
    }

    if (address) {
      fetchContent();
      loadFileList();
    }
  }, [address])

  const toggleSidebar = async () => {
    if (!showSidebar) {
      try {
        const res = await fetch(`http://localhost:8000/${address}/file`)
        const fileList = await res.json()
        setFiles(fileList)
      } catch (err) {
        console.error('Error fetching files:', err)
        alert('No se pudieron cargar los archivos')
      }
    }
    setShowSidebar(!showSidebar)
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizableImage,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent,
  }, [initialContent])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.userAgent.toUpperCase().includes('MAC');
      const isSaveCombo = (isMac && event.metaKey && event.key === 's') || (!isMac && event.ctrlKey && event.key === 's');

      if (isSaveCombo) {
        event.preventDefault();
        handleSave(); // ya definida en tu componente
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor]);

  if (!editor || !initialContent) return null

  const handleSave = async () => {
    if (!editor) return;

    const content = editor.getHTML(); // o .getJSON() si lo prefieres

    const file = new File([content], 'main.html', { type: 'text/html' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('overwrite', 'true'); // o false según tu lógica

    try {
      const res = await fetch(`http://localhost:8000/${address}/program`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error al guardar el contenido: ${errorText}`);
      }

    } catch (err) {
      console.error(err);
      alert('Fallo al guardar');
    }
  };

  const handleDelete = async (fileid: string) => {
    try {
      await fetch(`http://localhost:8000/${address}/file/${fileid}`, {
        method: 'DELETE',
      });

      // Eliminar nodos del editor relacionados con el fileid
      editor?.commands.command(({ tr, state }) => {
        const { doc } = state;
        const positionsToDelete: number[] = [];

        doc.descendants((node, pos) => {
          const attrs = node.attrs;

          // Si es una imagen con ese fileid
          if (node.type.name === 'resizableImageWrapper' && attrs['data-fileid'] === fileid) {
            positionsToDelete.push(pos);
          }

          // Si es un link que contiene el fileid
          if (node.type.name === 'text' && attrs?.link?.href?.includes(`/file/${fileid}/download`)) {
            positionsToDelete.push(pos);
          }

          return true;
        });

        positionsToDelete.reverse().forEach(pos => {
          tr.delete(pos, pos + 1);
        });

        editor.view.dispatch(tr);
        return true;
      });

    } catch (err) {
    }
    loadFileList(); // refrescar lista
  };



  return (
    <div className="tiptap-container">
      <div className="tiptap-toolbar">
        <button onClick={handleSave}>
          <FaSave />
        </button>
        <button
          className="mt-4 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2 rounded"
          onClick={async () => {
            if (!confirm('¿Seguro que quieres borrar el programa?')) return;

            try {
              const res = await fetch(`http://localhost:8000/${address}/program`, {
                method: 'DELETE',
              });

              if (!res.ok) throw new Error(await res.text());
              setInitialContent("<p></p>")
            } catch (err) {
              console.error('Error al eliminar el programa:', err);
              alert('Error al eliminar el programa');
            }
          }}
        >
          🗑️
        </button>
        <span className="separator" />
        <button onClick={toggleSidebar}>
          <FaDatabase />
        </button>
        <span className="separator" />
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'active' : ''}>
          <FaBold />
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'active' : ''}>
          <FaItalic />
        </button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'active' : ''}>
          <FaUnderline />
        </button>
        <span className="separator" />
        <button onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <FaListUl />
        </button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <FaListOl />
        </button>
        <span className="separator" />
        <select
          onChange={(e) => {
            const level = parseInt(e.target.value);
            if (level === 0) {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
            }
          }}
          value={
            editor.isActive('heading', { level: 1 }) ? '1' :
              editor.isActive('heading', { level: 2 }) ? '2' :
                editor.isActive('heading', { level: 3 }) ? '3' :
                  editor.isActive('heading', { level: 4 }) ? '4' :
                    editor.isActive('heading', { level: 5 }) ? '5' :
                      editor.isActive('heading', { level: 6 }) ? '6' : '0'
          }
          style={{ padding: '4px', borderRadius: '4px' }}
        >
          <option value="0">Normal</option>
          <option value="1">H1</option>
          <option value="2">H2</option>
          <option value="3">H3</option>
          <option value="4">H4</option>
          <option value="5">H5</option>
          <option value="6">H6</option>
        </select>
        <span className="separator" />
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <FaAlignLeft />
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <FaAlignCenter />
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <FaAlignRight />
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
          <FaAlignJustify />
        </button>
        <span className="separator" />
        <button onClick={() => editor.chain().focus().undo().run()}>
          <FaUndo />
        </button>
        <button onClick={() => editor.chain().focus().redo().run()}>
          <FaRedo />
        </button>
        <span className="separator" />
        <button onClick={() => document.getElementById('uploadImageInput')?.click()}>
          <FaImage />
        </button>
        <input
          id="uploadImageInput"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
              let res = await fetch(`http://localhost:8000/${address}/file`, {
                method: 'POST',
                body: formData,
              });

              if (res.status != 201) throw new Error('Fallo al subir imagen');

              const fileid = await res.text();

              res = await fetch(`http://localhost:8000/${address}/file/${fileid}/base64`, {
                method: 'GET',
              });

              const src = await res.text();

              editor.chain().focus().setImage({
                src,
                'data-fileid': fileid,
              }).run();
              loadFileList()
            } catch (err) {
              console.error('Error al subir imagen:', err);
              alert('Error al subir la imagen');
            }

            e.target.value = ''; // reset para permitir misma imagen otra vez
          }}
        />
        <button onClick={() => document.getElementById('uploadFileInput')?.click()}>
          <FaLink />
        </button>
        <input
          id="uploadFileInput"
          type="file"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
              const res = await fetch(`http://localhost:8000/${address}/file`, {
                method: 'POST',
                body: formData,
              });

              if (res.status !== 201) throw new Error('Fallo al subir archivo');

              const fileid = await res.text();
              const downloadUrl = `http://localhost:8000/${address}/file/${fileid}/download`;

              const ext = file.name.split('.').pop()?.toLowerCase() || '';
              const icon = extensionIcons[ext] || '📎';

              const linkHtml = `<a href="${downloadUrl}" download target="_blank" rel="noopener noreferrer">${icon} ${file.name}</a>`;

              editor.chain().focus().insertContent(linkHtml).run();
              loadFileList()
            } catch (err) {
              console.error('Error al subir archivo:', err);
              alert('Error al subir el archivo');
            }

            e.target.value = '';
          }}
        />
      </div>

      <div className="editor-wrapper">
        {showSidebar && (
          <div className="sidebar-overlay">
            <div className="sidebar">
              {files.map((file) => {
                const isImage = file.mime_type.startsWith("image/");
                const downloadUrl = `http://localhost:8000/${address}/file/${file.filename}/download`;

                const handleInsert = async () => {
                  if (!editor) return;
                  if (isImage) {
                    const res = await fetch(`http://localhost:8000/${address}/file/${file.filename}/base64`, {
                      method: 'GET',
                    });

                    const src = await res.text();

                    editor.chain().focus().setImage({
                      src,
                      'data-fileid': file.filename,
                    }).run();
                  } else {
                    const ext = file.filename.split('.').pop()?.toLowerCase() || '';
                    const icon = extensionIcons[ext] || '📎';

                    const linkHtml = `<a href="${downloadUrl}" download target="_blank" rel="noopener noreferrer">${icon} ${file.filename.substring(file.filename.indexOf("_") + 1)}</a>`;

                    editor.chain().focus().insertContent(linkHtml).run();
                  }
                };

                return (
                  <div
                    key={file.filename}
                    className="file-item"
                    onClick={handleInsert}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="file-preview">
                      {isImage ? (
                        <img src={downloadUrl} alt={file.filename} />
                      ) : (
                        <img src="/file-icon.png" alt="Archivo" />
                      )}
                    </div>
                    <div className="file-name">
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Descargar archivo"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {file.filename.substring(file.filename.indexOf("_") + 1)}
                      </a>
                    </div>
                    <button
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file.filename);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="tiptap-editor">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}

