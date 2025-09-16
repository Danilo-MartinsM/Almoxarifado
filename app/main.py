from fastapi import FastAPI
from dotenv import load_dotenv
import os
import mysql.connector

load_dotenv()

app = FastAPI()

@app.get("/")
def home():
    return {"mensagem": "API de Estoque funcionando 🚀"}

# Rota opcional para testar conexão com o banco (deixe só se já tiver o banco criado)
@app.get("/teste-banco")
def teste_banco():
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )
    cur = conn.cursor()
    cur.execute("SELECT DATABASE();")
    banco = cur.fetchone()
    cur.close()
    conn.close()
    return {"conectado_ao_banco": banco[0]}
