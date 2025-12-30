FROM node:trixie

RUN apt update && apt upgrade -y && apt install -y chromium-headless-shell

VOLUME /app
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
WORKDIR /app

RUN npm install -g npm@11.7.0
RUN npm install
RUN npx playwright install
RUN npx playwright install install-deps

COPY . /app
RUN npx tsc
CMD ["node", "dist/src/index.js"]