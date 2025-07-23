import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { ResizableImage } from '../components/ResizableImage'
import '../assets/TiptapEditor.css'
import { useAccount } from 'wagmi'
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


export default function TiptapEditor() {
  const { address } = useAccount();

  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizableImage,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: '',
  })

  if (!editor) return null

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

      alert('Contenido guardado correctamente');
    } catch (err) {
      console.error(err);
      alert('Fallo al guardar');
    }
  };


  return (
    <div className="tiptap-container">
      <div className="tiptap-toolbar">
        <button onClick={handleSave}>
          <FaSave />
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
            } catch (err) {
              console.error('Error al subir archivo:', err);
              alert('Error al subir el archivo');
            }

            e.target.value = '';
          }}
        />
        <span className="separator" />
      </div>

      <div className="tiptap-editor">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

