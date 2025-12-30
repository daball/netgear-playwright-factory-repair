FROM node:trixie

RUN apt update && apt upgrade -y && apt install -y chromium-headless-shell \
    libgstreamer1.0-0 libgtk-4-1 libgraphene-1.0-0 libwoff1 libvpx9 \
    libgstreamer-gl1.0-0 libgstreamer-plugins-base1.0-0 libflite1 \
    libjxl0.11 libavif16 libenchant-2-2 libhyphen0 libmanette-0.2-0 libx264-164 \
    libgstreamer-plugins-bad1.0-0

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