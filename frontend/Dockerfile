FROM node:22-slim

RUN apt-get update && apt-get install -y tini && apt-get clean

# Crear un directorio para el código y usar el usuario no-root 'node'
WORKDIR /app

# Copiar solo los archivos necesarios primero para aprovechar la caché
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install && npm prune --production

# Copiar el resto del código fuente
COPY . .

# Exponer el puerto por defecto de Vite
EXPOSE 5173

RUN usermod -l clistenes node && groupmod -n clistenes node
RUN chown -R clistenes:clistenes /app
USER clistenes

# Usar tini como sistema init para evitar problemas con señales y zombies
ENTRYPOINT ["/usr/bin/tini", "--"]

# Ejecutar Vite en modo desarrollo como único proceso
CMD ["npm", "run", "dev", "--", "--host"]

