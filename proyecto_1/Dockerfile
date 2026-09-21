# ---- Etapa 1: compilar el binario de proyecto_1 (C++) ----
FROM debian:bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY lib ./lib
COPY include ./include
COPY src ./src

RUN cd src && make clean && make

# ---- Etapa 2: runtime (binario + API que lo expone por HTTP) ----
FROM node:20-bookworm-slim

# graphviz: lo necesita "rep" (report.cpp) para generar los reportes (dot -Tjpg ...)
RUN apt-get update && apt-get install -y --no-install-recommends \
    graphviz \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /build/src/run ./bin/run
COPY api/package.json api/package-lock.json* ./api/
RUN cd api && npm install --omit=dev --no-audit --no-fund
COPY api/server.js ./api/server.js

ENV BINARY_PATH=/app/bin/run \
    DATA_DIR=/data \
    PORT=8000 \
    ALLOWED_ORIGIN=*

RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 8000

CMD ["node", "api/server.js"]
