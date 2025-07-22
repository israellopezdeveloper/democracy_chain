FROM node:22-slim

RUN apt-get update && apt-get install -y tini && apt-get clean

WORKDIR /app

# Copiamos el proyecto real desde ../dapp (requiere build context correcto)
COPY ../dapp/package*.json ./dapp/
WORKDIR /app/dapp
RUN npm install && npm prune --production

COPY ../dapp .

RUN usermod -l clistenes node && groupmod -n clistenes node
RUN chown -R clistenes:clistenes /app
USER clistenes

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
