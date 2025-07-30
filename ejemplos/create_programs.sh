import re

def split_programs(input_file='programas.md'):
    # Leer el contenido del archivo Markdown
    with open(input_file, 'r', encoding='utf-8') as file:
        content = file.read()

    # Dividir por separadores de programas (--- seguido de número)
    programs = re.split(r'\-\-\-', content)
    
    # El primer elemento es basura (texto antes del primer programa)
    programs = programs[1:]
    programs_struct = []

    regex = r"###\s\*\*(\d+)\.\s*(.*?)\*\*(.*)"
    for i in range(0,len(programs)):
        programs[i] = (programs[i]).strip()
        match = re.search(regex, programs[i], re.DOTALL)
        if match:
            programs_struct.append({
                "num": int(match.group(1)),
                "title": match.group(2),
                "text": match.group(3).strip(),
            })

    for program in programs_struct:
        filename = f'programa{program["num"]}.txt'
        with open(filename, 'w', encoding='utf-8') as out_file:
            out_file.write(program["title"] + "\n\n")
            out_file.write(program["text"])
        print(f'Archivo creado: {filename}')

if __name__ == '__main__':
    split_programs()
