from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Literal
import bcrypt
from database import get_connection
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1",
    "http://127.0.0.1:5500",  # se usar Live Server do VSCode
    "*",  # opcional para liberar todos
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Produto(BaseModel):
    nome: str
    categoria: Literal['Insumos', 'Vasos', 'Caixas', 'Porta Vaso', 'Fita Cetim', 'Liga Elástica', 'Etiquetas']
    quantidade: int = 0

class Movimentacao(BaseModel):
    id_produto: int
    tipo: Literal['Entrada', 'Saída']
    quantidade: int

@app.post("/produtos")
def criar_produto(produto: Produto):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO produtos (nome, categoria, quantidade) VALUES (Upper(%s), %s, %s)",
            (produto.nome, produto.categoria, produto.quantidade)
        )
        conn.commit()
        return {"mensagem": "Produto criado com sucesso!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/produtos")
def listar_produtos():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM produtos")
        produtos = cursor.fetchall()
        return {"produtos": produtos}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/categorias")
def listar_categorias():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT DISTINCT categoria FROM produtos")
        categorias = cursor.fetchall()
        # Ajusta formato para o frontend
        categorias = [{"nome": c["categoria"]} for c in categorias]
        return {"categorias": categorias}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()



@app.post("/movimentacoes")
def criar_movimentacao(mov: Movimentacao):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Verifica se o produto existe
        cursor.execute("SELECT quantidade FROM produtos WHERE id=%s", (mov.id_produto,))
        produto = cursor.fetchone()
        if not produto:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        # Calcula nova quantidade
        quantidade_atual = produto[0]
        if mov.tipo == 'Entrada':
            nova_quantidade = quantidade_atual + mov.quantidade
        else:  # Saída
            nova_quantidade = quantidade_atual - mov.quantidade
            if nova_quantidade < 0:
                raise HTTPException(status_code=400, detail="Quantidade insuficiente em estoque")

        # Atualiza quantidade no produto
        cursor.execute(
            "UPDATE produtos SET quantidade=%s WHERE id=%s",
            (nova_quantidade, mov.id_produto)
        )

        # Insere a movimentação
        cursor.execute(
            "INSERT INTO movimentacoes (id_produto, tipo, quantidade) VALUES (%s, %s, %s)",
            (mov.id_produto, mov.tipo, mov.quantidade)
        )

        conn.commit()
        return {"mensagem": "Movimentação registrada com sucesso!"}

    except HTTPException as e:
        raise e
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/movimentacoes")
def listar_movimentacoes():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                m.id, 
                p.nome AS produto, 
                p.categoria AS categoria,  -- pega direto da tabela produtos
                m.tipo, 
                m.quantidade, 
                m.data_alteracao
            FROM movimentacoes m
            JOIN produtos p ON m.id_produto = p.id
            ORDER BY m.data_alteracao DESC
        """)
        movimentacoes = cursor.fetchall()
        return {"movimentacoes": movimentacoes}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


