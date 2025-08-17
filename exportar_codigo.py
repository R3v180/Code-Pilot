# list_files_for_codepilot.py
import os

# --- CONFIGURACIÓN ---
# Ruta base de tu proyecto Code-Pilot
# El script asumirá que se ejecuta desde la raíz del proyecto, así que '.' es suficiente.
base_dir = r"." 
# Archivo de salida, se creará en el mismo directorio
output_file = os.path.join(base_dir, "code-pilot-context.txt")
# Extensiones de archivo a incluir relevantes para nuestro proyecto TypeScript/Node.js
valid_extensions = (".ts", ".tsx", ".js", ".json", ".md", ".env.example", ".gitignore")
# Carpetas a ignorar (añadimos carpetas comunes de compilación y caché)
ignored_dirs = {'node_modules', '.git', '.vscode', 'dist', '__pycache__', 'coverage'}
# Archivos específicos a ignorar
ignored_files = {'pnpm-lock.yaml'}
# --- FIN CONFIGURACIÓN ---

def main():
    # Obtener la ruta absoluta para mensajes más claros
    abs_base_dir = os.path.abspath(base_dir)
    print(f"Iniciando escaneo de archivos en: {abs_base_dir}")
    all_files = []
    
    for root, dirs, files in os.walk(base_dir, topdown=True):
        # Modificar 'dirs' in-place para que os.walk no entre en las carpetas ignoradas
        dirs[:] = [d for d in dirs if d not in ignored_dirs]
        
        for file in files:
            if file.endswith(valid_extensions) and file not in ignored_files:
                full_path = os.path.join(root, file)
                # Crear ruta relativa desde la base del proyecto
                rel_path = os.path.relpath(full_path, base_dir)
                # Normalizar separadores para consistencia
                all_files.append((full_path, rel_path.replace(os.path.sep, '/')))

    # Ordenar alfabéticamente por la ruta relativa para un índice predecible
    all_files.sort(key=lambda x: x[1])

    print(f"Se encontraron {len(all_files)} archivos válidos. Escribiendo en {output_file}...")
    
    try:
        with open(output_file, "w", encoding="utf-8") as outfile:
            # --- Escribir el Índice ---
            outfile.write("# CONTEXTO DEL PROYECTO CODE-PILOT\n\n")
            outfile.write("## ÍNDICE DE ARCHIVOS\n\n")
            for _, rel_path in all_files:
                outfile.write(f"- `{rel_path}`\n")
            outfile.write("\n\n---\n\n")
            
            # --- Escribir el Contenido ---
            outfile.write("## CONTENIDO DE LOS ARCHIVOS\n\n")
            for full_path, rel_path in all_files:
                try:
                    with open(full_path, "r", encoding="utf-8", errors='ignore') as infile:
                        content = infile.read()
                    outfile.write(f"### `{rel_path}`\n")
                    # Usamos un bloque de código Markdown para una mejor presentación
                    outfile.write("```\n")
                    outfile.write(content)
                    outfile.write("\n```\n\n")
                except Exception as e:
                    print(f"  ADVERTENCIA al leer el archivo {full_path}: {e}")
                    outfile.write(f"### `{rel_path}` (ERROR DE LECTURA)\n")
                    outfile.write(f"// No se pudo leer el archivo. Error: {e}\n\n")
                    
        print(f"¡Éxito! El contexto del proyecto ha sido guardado en '{output_file}'")
    except Exception as e:
        print(f"ERROR FATAL al escribir el archivo de salida: {e}")

if __name__ == "__main__":
    main()