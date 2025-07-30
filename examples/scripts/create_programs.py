import os
import re
import subprocess


def split_programs(input_file="programas.md", output_dir="programs"):
    # Crear el directorio de salida si no existe
    os.makedirs(output_dir, exist_ok=True)

    # Leer el contenido del archivo Markdown
    with open(input_file, encoding="utf-8") as file:
        content = file.read()

    # Dividir por separadores de programas (---)
    programs = re.split(r"\-\-\-", content)

    # Ignorar la parte antes del primer programa
    programs = programs[1:]
    programs_struct = []

    regex = r"###\s\*\*(\d+)\.\s*(.*?)\*\*(.*)"
    for i in range(len(programs)):
        programs[i] = programs[i].strip()
        match = re.search(regex, programs[i], re.DOTALL)
        if match:
            programs_struct.append(
                {
                    "num": int(match.group(1)),
                    "title": match.group(2),
                    "text": match.group(3).strip(),
                }
            )

    for program in programs_struct:
        filename_base = f"programa{program['num']}"
        filename_md = f"{filename_base}.md"
        filename_html = os.path.join(output_dir, f"{filename_base}.html")

        # Escribir archivo .txt temporal
        with open(filename_md, "w", encoding="utf-8") as out_file:
            out_file.write("# " + program["title"] + "\n\n")
            out_file.write(program["text"])

        # Convertir a HTML standalone con pandoc
        try:
            subprocess.run(
                ["pandoc", filename_md, "-s", "-o", filename_html], check=True
            )
            print(f"✅ HTML generado: {filename_html}")
        except subprocess.CalledProcessError as e:
            print(f"❌ Error al convertir {filename_md}: {e}")
            continue

        # Eliminar el archivo .txt temporal
        try:
            os.remove(filename_md)
            print(f"🗑️ Eliminado archivo temporal: {filename_md}")
        except OSError as e:
            print(f"⚠️ No se pudo eliminar {filename_md}: {e}")


if __name__ == "__main__":
    split_programs()
