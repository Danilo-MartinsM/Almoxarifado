// =====================
// Funções globais
// =====================

function showToast(mensagem, tipo = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.innerText = mensagem;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 300); }, 3000);
}

async function carregarCategoriasSelect(selectElement, textoTodas = "Todas as Categorias", valorSelecionado = null) {
  try {
    const response = await fetch("http://localhost:8001/categorias");
    const categorias = await response.json();
    selectElement.innerHTML = "";
    if (textoTodas) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = textoTodas;
      selectElement.appendChild(opt);
    }
    categorias.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.nome;
      if (valorSelecionado && valorSelecionado == cat.id) opt.selected = true;
      selectElement.appendChild(opt);
    });
    if (!$(selectElement).data("select2")) {
      $(selectElement).select2({ width: "resolve", placeholder: textoTodas, allowClear: true });
    } else {
      $(selectElement).trigger("change.select2");
    }
  } catch (err) {
    console.error("Erro ao carregar categorias:", err);
    showToast("Erro ao carregar categorias", "error");
  }
}

async function carregarProdutosSelect(selectElement, textoTodos = "Selecione um produto") {
  try {
    const response = await fetch("http://localhost:8001/produtos");
    const produtos = await response.json();
    selectElement.innerHTML = "";
    if (textoTodos) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = textoTodos;
      selectElement.appendChild(opt);
    }
    produtos.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.nome} (${p.categoria})`;
      selectElement.appendChild(opt);
    });
    if (!$(selectElement).data("select2")) {
      $(selectElement).select2({ width: "resolve", placeholder: textoTodos, allowClear: true });
    } else {
      $(selectElement).trigger("change.select2");
    }
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
    showToast("Erro ao carregar produtos", "error");
  }
}

// ==========================
// Login
// ==========================
if (document.getElementById("form-login")) {
  document.getElementById("form-login").addEventListener("submit", async e => {
    e.preventDefault();
    const username = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("senha", senha);

    try {
      const response = await fetch("http://localhost:8001/login", { method: "POST", body: formData });
      if (response.ok) {
        showToast("Login realizado com sucesso", "success");
        setTimeout(() => window.location.href = "dashboard.html", 1000);
      } else {
        showToast("Email ou senha incorretos", "error");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      showToast("Erro no servidor", "error");
    }
  });
}

// ==========================
// Cadastro de produto
// ==========================
if (document.getElementById("form-cadastro")) {
  const selectCategoria = document.getElementById("categoria");
  carregarCategoriasSelect(selectCategoria, "Selecione uma categoria");

  document.getElementById("form-cadastro").addEventListener("submit", async e => {
    e.preventDefault();
    const nome = document.getElementById("nome").value;
    const categoria = document.getElementById("categoria").value;
    const quantidade_inicial = document.getElementById("quantidade").value;

    const formData = new URLSearchParams();
    formData.append("nome", nome);
    formData.append("id_categoria", categoria);
    formData.append("quantidade_inicial", quantidade_inicial);

    try {
      const response = await fetch("http://localhost:8001/produtos", { method: "POST", body: formData });
      if (response.ok) {
        showToast("Produto cadastrado com sucesso!", "success");
        document.getElementById("form-cadastro").reset();
        $(selectCategoria).val("").trigger("change");
      } else showToast("Erro ao cadastrar produto", "error");
    } catch (err) { console.error(err); showToast("Erro no servidor", "error"); }
  });
}

// ==========================
// Entradas
// ==========================
if (document.getElementById("form-entrada")) {
  const selectProduto = document.getElementById("produtoEntrada");
  carregarProdutosSelect(selectProduto);

  document.getElementById("form-entrada").addEventListener("submit", async e => {
    e.preventDefault();
    const produto_id = selectProduto.value;
    const quantidade = document.getElementById("quantidadeEntrada").value;

    const formData = new URLSearchParams();
    formData.append("id_produto", produto_id);
    formData.append("quantidade", quantidade);
    formData.append("data_alteracao", new Date().toISOString());

    try {
      const response = await fetch("http://localhost:8001/entradas", { method: "POST", body: formData });
      if (response.ok) {
        showToast("Entrada registrada com sucesso!", "success");
        document.getElementById("form-entrada").reset();
        $(selectProduto).val("").trigger("change");
      } else showToast("Erro ao registrar entrada", "error");
    } catch (err) { console.error(err); showToast("Erro no servidor", "error"); }
  });
}

// ==========================
// Saídas
// ==========================
if (document.getElementById("form-saida")) {
  const selectProduto = document.getElementById("produtoSaida");
  carregarProdutosSelect(selectProduto);

  document.getElementById("form-saida").addEventListener("submit", async e => {
    e.preventDefault();
    const produto_id = selectProduto.value;
    const quantidade = document.getElementById("quantidadeSaida").value;

    const formData = new URLSearchParams();
    formData.append("id_produto", produto_id);
    formData.append("quantidade", quantidade);
    formData.append("data_alteracao", new Date().toISOString());

    try {
      const response = await fetch("http://localhost:8001/saidas", { method: "POST", body: formData });
      if (response.ok) {
        showToast("Saída registrada com sucesso!", "success");
        document.getElementById("form-saida").reset();
        $(selectProduto).val("").trigger("change");
      } else showToast("Erro ao registrar saída", "error");
    } catch (err) { console.error(err); showToast("Erro no servidor", "error"); }
  });
}

// ==========================
// Relatórios
// ==========================
if (document.getElementById("form-novo-relatorio")) {
  document.getElementById("btn-novo-relatorio").addEventListener("click", () => {
    document.getElementById("modal-novo-relatorio").style.display = "block";
  });

  document.getElementById("form-novo-relatorio").addEventListener("submit", async e => {
    e.preventDefault();
    const titulo = document.getElementById("relatorio-titulo").value;
    const descricao = document.getElementById("relatorio-descricao").value;
    const lembrete = document.getElementById("relatorio-data").value;

    const formData = new URLSearchParams();
    formData.append("titulo", titulo);
    formData.append("descricao", descricao);
    formData.append("lembrete", lembrete);

    try {
      const response = await fetch("http://localhost:8001/relatorios", { method: "POST", body: formData });
      if (response.ok) {
        showToast("Relatório criado com sucesso!", "success");
        document.getElementById("form-novo-relatorio").reset();
        document.getElementById("modal-novo-relatorio").style.display = "none";
      } else showToast("Erro ao criar relatório", "error");
    } catch (err) { console.error(err); showToast("Erro no servidor", "error"); }
  });
}

// ==========================
// Inicialização global
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('select[id^="filtroCategoria"]').forEach(select => carregarCategoriasSelect(select, "Todas as Categorias"));
});
