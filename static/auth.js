// ============================
// auth.js - Autenticação JWT com depuração
// ============================

// Recupera o token do localStorage
function getToken() {
    const token = localStorage.getItem("token");
    console.log("[DEBUG] Token do localStorage:", token);
    return token;
}

// Verifica se o usuário está logado
function verificarLogin() {
    const token = getToken();
    if (!token) {
        console.warn("[DEBUG] Token ausente. Redirecionando para login...");
        // logout(); // opcional: redirecionar apenas se necessário
        return false;
    }

    try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && now > payload.exp) {
            console.warn("[DEBUG] Token expirado");
            // logout();
            return false;
        }

        console.log("[DEBUG] Token válido. Payload:", payload);
        return true;
    } catch (err) {
        console.error("[DEBUG] Token inválido:", err);
        // logout();
        return false;
    }
}

// Retorna o nome do usuário logado
function getNomeUsuario() {
    const token = getToken();
    if (!token) return null;

    try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);
        console.log("[DEBUG] Nome do usuário extraído:", payload.sub);
        return payload.sub || null;
    } catch (err) {
        console.error("[DEBUG] Falha ao decodificar token:", err);
        return null;
    }
}

// Logout
function logout() {
    console.log("[DEBUG] Logout executado");
    localStorage.removeItem("token");
    window.location.href = "/login.html";
}

// Atualiza o nome do usuário em páginas protegidas
function atualizarNomeUsuario() {
    const spanUsuario = document.querySelector(".user-info span");
    if (!spanUsuario) {
        console.warn("[DEBUG] Elemento '.user-info span' não encontrado");
        return;
    }

    if (verificarLogin()) {
        const nome = getNomeUsuario();
        if (nome) {
            spanUsuario.textContent = `Usuário: ${nome}`;
            console.log("[DEBUG] Nome atualizado no DOM:", nome);
        } else {
            console.warn("[DEBUG] Nome do usuário não encontrado no token");
        }
    } else {
        console.warn("[DEBUG] Usuário não logado. Nome não será exibido");
    }
}

// ============================
// Código executado ao carregar a página
// ============================
document.addEventListener("DOMContentLoaded", () => {
    console.log("[DEBUG] DOM carregado");

    // Atualiza o nome do usuário
    atualizarNomeUsuario();

    // Verificação automática do token a cada 5 segundos
    setInterval(() => {
        verificarLogin();
    }, 5000);

    // ============================
    // Se for a página de login
    // ============================
    const form = document.getElementById("login-form");
    const mensagem = document.getElementById("mensagem");
    if (!form) {
        console.log("[DEBUG] Formulário de login não encontrado. Ignorando login...");
        return;
    }

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
            console.log("[DEBUG] Login bem-sucedido. Token recebido:", data.access_token);
            localStorage.setItem("token", data.access_token);

            // Atualiza o nome do usuário após login
            atualizarNomeUsuario();

            // Redireciona para a dashboard
            window.location.href = "/1_dashboard.html";

        } catch (err) {
            console.error("[DEBUG] Erro de conexão com o servidor:", err);
            mensagem.textContent = "Erro de conexão com o servidor.";
        }
    });
});
