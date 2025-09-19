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
      const response = await fetch("http://localhost:8001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, senha })
      });

      if (!response.ok) {
        const data = await response.json();
        mensagem.textContent = data.detail || "Erro ao fazer login";
        return;
      }

      const data = await response.json();
      // Armazena token no localStorage
      localStorage.setItem("token", data.access_token);

      // Redireciona para a dashboard
      window.location.href = "/1_dashboard.html";

    } catch (err) {
      console.error(err);
      mensagem.textContent = "Erro de conexão com o servidor.";
    }
  });
});


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

