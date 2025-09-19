// ============================
// auth.js - Autenticação JWT corrigida
// ============================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const mensagem = document.getElementById("mensagem");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensagem.textContent = "";

    const nome = form.nome.value.trim();
    const senha = form.senha.value;

    if (!nome || !senha) {
      mensagem.textContent = "Preencha todos os campos!";
      return;
    }

    try {
      // Caminho relativo para backend
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, senha })
      });

      // Lê o corpo JSON apenas uma vez
      const data = await response.json();

      if (!response.ok) {
        mensagem.textContent = data.detail || "Erro ao fazer login";
        return;
      }

      // Armazena token no localStorage
      localStorage.setItem("token", data.access_token);

      // Redireciona para a dashboard
      window.location.href = "/1_dashboard.html";

    } catch (err) {
      console.error("Erro de conexão com o servidor:", err);
      mensagem.textContent = "Erro de conexão com o servidor.";
    }
  });
});

// ============================
// Função para extrair nome do usuário do token
// ============================
function getNomeUsuario() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);
    return payload.sub || null;
  } catch (err) {
    console.error("Token inválido:", err);
    return null;
  }
}

// ============================
// Função para logout (opcional)
// ============================
function logout() {
  localStorage.removeItem("token");
  window.location.href = "/index.html";
}
