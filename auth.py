from datetime import datetime, timedelta
import jwt
import bcrypt
from fastapi import HTTPException, Header, Depends
from typing import Optional
from dotenv import load_dotenv
import os

load_dotenv()

# ==========================
# Configurações JWT
# ==========================
SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24 * 30  # 30 dias

# ==========================
# Funções auxiliares
# ==========================
def criar_token(usuario: str) -> str:
    """Cria um token JWT para o usuário"""
    payload = {
        "sub": usuario,
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verificar_token(token: str) -> Optional[dict]:
    """Verifica e decodifica o token JWT"""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def validar_usuario(senha_digitada: str, hash_banco: str) -> bool:
    """Valida a senha usando bcrypt"""
    return bcrypt.checkpw(senha_digitada.encode("utf-8"), hash_banco.encode("utf-8"))

# ==========================
# Dependência FastAPI
# ==========================
def get_current_user(authorization: str = Header(...)) -> str:
    """
    Dependência para proteger rotas.
    Retorna o nome do usuário logado.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido")
    token = authorization.split(" ")[1]
    payload = verificar_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    return payload["sub"]
