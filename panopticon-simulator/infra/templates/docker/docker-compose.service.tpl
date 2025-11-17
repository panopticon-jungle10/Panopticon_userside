services:
  ${SERVICE_NAME}:
    build:
      context: ../backend
    container_name: ${SERVICE_NAME}
    env_file:
      - .env.${SERVICE_NAME}
    depends_on:
      - postgres
      - panopticon-agent
    ports:
      - "3000:3000"

  postgres:
    image: postgres:16
    container_name: ecommerce-postgres
    environment:
      - POSTGRES_USER=appuser
      - POSTGRES_PASSWORD=apppassword
      - POSTGRES_DB=ecommerce
    volumes:
      - demo-db-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  panopticon-agent:
    image: panopticon/agent:latest
    container_name: panopticon-agent
    environment:
      - PANOPTICON_API_KEY=${PANOPTICON_API_KEY}
      - PANOPTICON_TENANT_ID=${PANOPTICON_TENANT_ID}
      - PANOPTICON_INGEST_ENDPOINT=${PANOPTICON_INGEST_ENDPOINT}

volumes:
  demo-db-data:
