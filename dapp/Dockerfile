FROM node:22-slim

RUN apt-get update && apt-get install -y tini fzf && apt-get clean

WORKDIR /app

COPY package*.json ./
RUN npm install && npm prune --production

COPY . .

RUN chmod +x ./scripts/deploy_n_run.sh

EXPOSE 3000

RUN usermod -l clistenes node && groupmod -n clistenes node
RUN chown -R clistenes:clistenes /app
USER clistenes

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "./scripts/deploy_n_run.sh --network=localhost --contract=DemocracyChain; node ./scripts/server.mjs & ./scripts/deploy_n_run.sh"]
