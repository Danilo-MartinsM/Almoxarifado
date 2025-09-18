from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel, validator
from typing import Literal, Optional
from database import get_connection
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1",
    "http://127.0.0.1:5500",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# MODELOS
# ============================
class Produto(BaseModel):
    nome: str
    categoria: Literal['Insumos', 'Vasos', 'Caixas', 'Porta Vaso', 'Fita Cetim', 'Liga Elástica', 'Etiquetas']
    quantidade: int = 0
    

class Movimentacao(BaseModel):
    id_produto: int
    tipo: Literal['Entrada', 'Saída']
    quantidade: int
    data_alteracao: Optional[datetime] = None
    
    @validator("data_alteracao", pre=True)
    def parse_datetime_local(cls, v):
        if isinstance(v, str):
            try:
                return datetime.strptime(v, "%Y-%m-%dT%H:%M")
            except ValueError:
                return v
        return v

# Função auxiliar para hora de Brasília
def hora_brasilia():
    return datetime.utcnow() - timedelta(hours=3)

# ============================
# FUNÇÃO AUXILIAR: criar movimentação
# ============================
def criar_movimentacao(mov: Movimentacao, conn=None):
    close_conn = False
    if conn is None:
        conn = get_connection()
        close_conn = True
    cursor = conn.cursor()
    try:
        # verifica se produto existe
        cursor.execute("SELECT quantidade FROM produtos WHERE id=%s", (mov.id_produto,))
        produto = cursor.fetchone()
        if not produto:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        # calcula nova quantidade
        quantidade_atual = produto[0]
        if mov.tipo == "Entrada":
            nova_quantidade = quantidade_atual + mov.quantidade
        else:
            nova_quantidade = quantidade_atual - mov.quantidade
            if nova_quantidade < 0:
                raise HTTPException(status_code=400, detail="Quantidade insuficiente em estoque")

        # atualiza quantidade no produto
        cursor.execute(
            "UPDATE produtos SET quantidade=%s WHERE id=%s",
            (nova_quantidade, mov.id_produto)
        )

        # insere movimentação com data/hora do frontend ou datetime.now()
        data = mov.data_alteracao or datetime.now()
        cursor.execute(
            "INSERT INTO movimentacoes (id_produto, tipo, quantidade, data_alteracao) VALUES (%s, %s, %s, %s)",
            (mov.id_produto, mov.tipo, mov.quantidade, data)
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
        if close_conn:
            conn.close()

# ============================
# ENDPOINT: Criar produto
# ============================
@app.post("/produtos")
def criar_produto(produto: Produto):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # insere produto
        cursor.execute(
            "INSERT INTO produtos (nome, categoria, quantidade) VALUES (UPPER(%s), %s, %s)",
            (produto.nome, produto.categoria, produto.quantidade)
        )
        conn.commit()
        id_produto = cursor.lastrowid

        # registra movimentação de entrada
        mov = Movimentacao(
            id_produto=id_produto,
            tipo="Entrada",
            quantidade=produto.quantidade,
            data_alteracao=produto.dataAlteracao  # se None, será datetime.now() na função
        )
        criar_movimentacao(mov, conn)

        return {"mensagem": "Produto criado e movimentação registrada com sucesso!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ============================
# ENDPOINT: Atualizar produto
# ============================
@app.put("/produtos/{produto_id}")
def atualizar_produto(produto_id: int, produto: Produto):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Verifica se o produto existe
        cursor.execute("SELECT id FROM produtos WHERE id=%s", (produto_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        # Atualiza o produto
        cursor.execute(
            "UPDATE produtos SET nome=UPPER(%s), categoria=%s WHERE id=%s",
            (produto.nome, produto.categoria, produto_id)
        )
        conn.commit()
        return {"mensagem": "Produto atualizado com sucesso!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ============================
# ENDPOINT: Deletar produto (com cascata em movimentações)
# ============================
@app.delete("/produtos/{produto_id}")
def deletar_produto(produto_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Verifica se o produto existe
        cursor.execute("SELECT id FROM produtos WHERE id=%s", (produto_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        # Deleta movimentações relacionadas
        cursor.execute("DELETE FROM movimentacoes WHERE id_produto=%s", (produto_id,))

        # Deleta o produto
        cursor.execute("DELETE FROM produtos WHERE id=%s", (produto_id,))

        conn.commit()
        return {"mensagem": "Produto e movimentações deletadas com sucesso!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()



# ============================
# ENDPOINTS DE LISTAGEM
# ============================
@app.get("/produtos")
def listar_produtos():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT p.id, p.nome, p.categoria, p.quantidade,
                   MAX(m.data_alteracao) AS ultima_alteracao
            FROM produtos p
            LEFT JOIN movimentacoes m ON m.id_produto = p.id
            GROUP BY p.id, p.nome, p.categoria, p.quantidade
        """)
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
        cursor.execute("SELECT id, nome FROM categorias ORDER BY nome")
        categorias = cursor.fetchall()
        return {"categorias": categorias}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ============================
# ENDPOINT: Movimentações
# ============================
@app.post("/movimentacoes")
def criar_movimentacao_endpoint(mov: Movimentacao):
    return criar_movimentacao(mov)

@app.get("/movimentacoes")
def listar_movimentacoes():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT 
                m.id, 
                p.nome AS produto, 
                p.categoria AS categoria,
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

# ============================
# ENDPOINT: Registrar Entrada
# ============================

@app.post("/entradas")
def registrar_entrada(mov: Movimentacao = Body(...)):
    # força o tipo como Entrada, caso queira ignorar o que vier do frontend
    mov.tipo = "Entrada"
    return criar_movimentacao(mov)

# ============================
# ENDPOINT: Registrar Sáida
# ============================
@app.post("/saidas")
def registrar_saida(mov: Movimentacao = Body(...)):
    mov.tipo = "Saída"
    return criar_movimentacao(mov)
