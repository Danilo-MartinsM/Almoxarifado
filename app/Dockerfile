# Imagem base
FROM python:3.11-slim

# Cria diretório de trabalho
WORKDIR /app

# Copia dependências
COPY requirements.txt .

# Instala dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copia código
COPY . .

# Expõe porta padrão interna
EXPOSE 8000

# Comando para rodar o FastAPI

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]