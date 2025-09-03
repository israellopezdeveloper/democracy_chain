from __future__ import annotations

import os
import re
import subprocess
from typing import List, TypedDict


class Program(TypedDict):
    num: int
    title: str
    text: str


def split_programs(input_file: str = "programas.md", output_dir: str = "programs") -> None:
    os.makedirs(output_dir, exist_ok=True)

    with open(input_file, encoding="utf-8") as file:
        content = file.read()

    programs = re.split(r"---", content)  # no hace falta escapar '-'
    programs = programs[1:]

    programs_struct: List[Program] = []

    regex = re.compile(r"###\s\*\*(\d+)\.\s*(.*?)\*\*(.*)", re.DOTALL)
    for i in range(len(programs)):
        programs[i] = programs[i].strip()
        match = regex.search(programs[i])
        if match:
            programs_struct.append(
                Program(
                    num=int(match.group(1)),
                    title=match.group(2),
                    text=match.group(3).strip(),
                )
            )

    for program in programs_struct:
        print("╭──────────────────────────────────────────────────────────────────────────────╮")
        filename_base = f"programa{program['num']}"
        filename_md = f"{filename_base}.md"
        filename_html = os.path.join(output_dir, f"{filename_base}.html")

        # Escribir archivo .md temporal
        with open(filename_md, "w", encoding="utf-8") as out_file:
            out_file.write(program["text"])  # <- ahora mypy sabe que es str

        # Convertir a HTML standalone con pandoc
        try:
            subprocess.run(
                [
                    "pandoc",
                    filename_md,
                    "-s",
                    "--metadata",
                    f'title="{program["title"]}"',
                    "-o",
                    filename_html,
                ],
                check=True,
            )
            print(f"✅ HTML generado: {filename_html}")
        except subprocess.CalledProcessError as e:
            print(f"❌ Error al convertir {filename_md}: {e}")
            continue

        # Eliminar el archivo .md temporal
        try:
            os.remove(filename_md)
            print(f"🗑️ Eliminado archivo temporal: {filename_md}")
        except OSError as e:
            print(f"⚠️ No se pudo eliminar {filename_md}: {e}")
        print("╰──────────────────────────────────────────────────────────────────────────────╯")


if __name__ == "__main__":
    split_programs()
