# Ejemplo_presentacion_AWS

### Docker Compose (plugin)
```bash

DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins

curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o $DOCKER_CONFIG/cli-plugins/docker-compose

chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

docker compose version
```

## Docker Buildx (plugin)
```bash

DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins

curl -SL https://github.com/docker/buildx/releases/latest/download/buildx-$(curl -s https://api.github.com/repos/docker/buildx/releases/latest | grep tag_name | cut -d '"' -f4).linux-amd64 \
  -o $DOCKER_CONFIG/cli-plugins/docker-buildx

chmod +x $DOCKER_CONFIG/cli-plugins/docker-buildx

docker buildx version

    Nota: si tu instancia es ARM (Graviton, tipo t4g), cambia linux-amd64 por linux-arm64 en ambos comandos.
```
### Después de instalar buildx, corre:
```bash

docker compose up -d --build
```


