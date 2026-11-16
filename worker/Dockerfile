# Beevo Dedicated Railway FFmpeg Render & Background Pipeline Worker
FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    NODE_ENV=production \
    PORT=8080

# Install FFmpeg (includes ffprobe + libass) and comprehensive Noto Unicode fonts (Latin + Devanagari + Arabic + CJK)
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg \
      fontconfig \
      fonts-noto-core \
      fonts-noto-extra \
      fonts-noto-ui-core \
      ca-certificates \
    && fc-cache -fv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm install tsx

COPY tsconfig.json ./
COPY src ./src
COPY worker ./worker

RUN mkdir -p /tmp/beevo-renders && chown -R node:node /app /tmp/beevo-renders
USER node

EXPOSE 8080

CMD ["npm", "run", "worker:start"]
