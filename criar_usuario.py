import bcrypt
from database import get_connection

# Solicita informações do novo usuário
nome = input("Digite o nome do usuário: ")
senha = input("Digite a senha do usuário: ")

# Criptografa a senha
senha_bytes = senha.encode('utf-8')
hash_senha = bcrypt.hashpw(senha_bytes, bcrypt.gensalt())

# Conecta ao banco e insere usuário
conn = get_connection()
cursor = conn.cursor()

try:
    cursor.execute(
        "INSERT INTO usuarios (nome, senha) VALUES (%s, %s)",
        (nome, hash_senha)
    )
    conn.commit()
    print("Usuário criado com sucesso!")
except Exception as e:
    conn.rollback()
    print("Erro ao criar usuário:", e)
finally:
    cursor.close()
    conn.close()
