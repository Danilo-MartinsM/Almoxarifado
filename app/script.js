// ============================
// script.js - Global
// ============================

// 🔹 Variáveis globais
let calendar;
let dataSelecionada = "";

// ============================
// FUNÇÃO: Toast notifications
// ============================
function mostrarToast(mensagem, tipo) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    const classe = tipo === "sucesso" ? "success" : "error";
    toast.className = `toast ${classe}`;
    toast.innerText = mensagem;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.animation = 'slideIn 0.3s forwards';
    });

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// ============================
// DOMContentLoaded
// ============================
document.addEventListener("DOMContentLoaded", () => {
    // ===== PÁGINA DE MOVIMENTAÇÕES =====
    if (document.querySelector(".movimentacao-list") || document.getElementById("calendar")) {
        inicializarCalendar();
        carregarFiltrosMovimentacoes().then(() => {
            $("#filtroProduto").on("change", carregarMovimentacoes);
            $("#filtroCategoria").on("change", carregarMovimentacoes);
            carregarMovimentacoes();
        }).catch(err => {
            console.error(err);
            mostrarToast("Erro ao carregar filtros!", "erro");
        });
    }

    // ===== PÁGINA DE PRODUTOS / ESTOQUE =====
    if (document.querySelector("#form-cadastro") || document.querySelector("#tabela-produtos")) {
        inicializarCadastroProdutos();
        inicializarTabelaProdutos();
    }
});


// ============================
// FUNÇÕES: Movimentações
// ============================
async function carregarFiltrosMovimentacoes() {
    const response = await fetch("http://localhost:8001/produtos");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    // Filtro Produto
    const selectProduto = document.getElementById("filtroProduto");
    if (selectProduto) {
        selectProduto.innerHTML = '<option value="">Todos</option>';
        data.produtos.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.nome;
            opt.textContent = p.nome;
            selectProduto.appendChild(opt);
        });
        $("#filtroProduto").select2({ width: 'resolve' });
    }

    // Filtro Categoria
    const selectCategoria = document.getElementById("filtroCategoria");
    if (selectCategoria) {
        const categorias = [...new Set(data.produtos.map(p => p.categoria).filter(c => c))];
        selectCategoria.innerHTML = '<option value="">Todas</option>';
        categorias.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = c;
            selectCategoria.appendChild(opt);
        });
        $("#filtroCategoria").select2({ width: 'resolve' });
    }
}

async function carregarMovimentacoes() {
    const container = document.querySelector(".movimentacao-list");
    if (!container) return;

    try {
        const produtoFiltro = (document.getElementById("filtroProduto")?.value || "").trim().toLowerCase();
        const categoriaFiltro = (document.getElementById("filtroCategoria")?.value || "").trim().toLowerCase();

        const response = await fetch("http://localhost:8001/movimentacoes");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const movimentacoes = (await response.json()).movimentacoes || [];

        // ========================
        // Função de filtro reutilizável
        // ========================
        const filtrar = m => {
            if (produtoFiltro && (m.produto || "").trim().toLowerCase() !== produtoFiltro) return false;
            if (categoriaFiltro && (m.categoria || "").trim().toLowerCase() !== categoriaFiltro) return false;
            if (dataSelecionada && (m.data_alteracao || "").substring(0, 10) !== dataSelecionada) return false;
            return true;
        };

        const movimentacoesFiltradas = movimentacoes.filter(filtrar);

        // ========================
        // Atualiza a lista textual
        // ========================
        container.innerHTML = "";
        if (movimentacoesFiltradas.length === 0) {
            container.innerHTML = "<p>Nenhuma movimentação encontrada.</p>";
        } else {
            movimentacoesFiltradas.forEach(mov => {
                const divMov = document.createElement("div");
                divMov.classList.add("product-item");
                divMov.innerHTML = `
                    <div class="product-icon">${mov.tipo === "Entrada" ? "📥" : "📦"}</div>
                    <div>
                        <strong>${mov.produto}</strong><br/>
                        <small>Tipo: ${mov.tipo}</small><br/>
                        <small>Quantidade: ${mov.quantidade}</small><br/>
                        <small>Data: ${new Date(mov.data_alteracao).toLocaleString()}</small>
                    </div>
                `;
                container.appendChild(divMov);
            });
        }

        // ========================
        // Atualiza o calendário com todas as movimentações (sem filtro de data)
        // ========================
        atualizarCalendar(movimentacoes);

    } catch (err) {
        console.error(err);
        mostrarToast("Erro ao carregar movimentações!", "erro");
    }
}


function inicializarCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        weekNumbers: true,
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
        dayMaxEvents: true,
        dateClick: function(info) {
            if (dataSelecionada) {
                const oldCell = calendarEl.querySelector(`[data-date="${dataSelecionada}"]`);
                if (oldCell) oldCell.classList.remove('dia-selecionado');
            }

            dataSelecionada = (dataSelecionada === info.dateStr) ? "" : info.dateStr;
            info.dayEl.classList.toggle('dia-selecionado', dataSelecionada === info.dateStr);

            carregarMovimentacoes();
        }
    });
    calendar.render();
}

function atualizarCalendar(movimentacoes) {
    if (!calendar) return;

    calendar.getEvents().forEach(ev => { if (ev.title !== "Selecionado") ev.remove(); });

    movimentacoes.forEach(mov => {
        calendar.addEvent({
            title: `${mov.produto} (${mov.tipo}: ${mov.quantidade})`,
            start: mov.data_alteracao,
            color: mov.tipo === "Entrada" ? "green" : "red"
        });
    });
}


// ============================
// FUNÇÕES: Cadastro e tabela de produtos
// ============================
function inicializarCadastroProdutos() {
    const form = document.getElementById("form-cadastro");
    if (!form) return;

    // Preenche data/hora atual
    function preencherDataHoraAtual() {
        const inputData = document.getElementById("dataAlteracao");
        if (!inputData) return;
        const agora = new Date();
        inputData.value = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,"0")}-${String(agora.getDate()).padStart(2,"0")}T${String(agora.getHours()).padStart(2,"0")}:${String(agora.getMinutes()).padStart(2,"0")}`;
    }
    preencherDataHoraAtual();

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const nome = document.getElementById("nomeProduto").value.trim();
        const categoria = document.getElementById("categoriaProduto").value;
        const quantidade = parseInt(document.getElementById("quantidadeInicial").value);
        const dataAlteracao = document.getElementById("dataAlteracao").value;

        if (!nome || !categoria || isNaN(quantidade)) {
            mostrarToast("Preencha todos os campos corretamente!", "erro");
            return;
        }

        const body = { nome, categoria, quantidade, dataAlteracao: dataAlteracao ? dataAlteracao.replace("T", " ") : undefined };

        try {
            const resp = await fetch("http://localhost:8001/produtos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.detail || "Erro ao cadastrar produto");
            }
            mostrarToast("Produto cadastrado com sucesso!", "sucesso");
            form.reset();
            $("#categoriaProduto").val("").trigger('change');
            preencherDataHoraAtual();
        } catch (err) {
            console.error(err);
            mostrarToast(err.message, "erro");
        }
    });

    // Preenche select categoria fixa
    const categoriasFixas = ['Insumos', 'Vasos', 'Caixas', 'Porta Vaso', 'Fita Cetim', 'Liga Elástica', 'Etiquetas'];
    const selectCategoria = document.getElementById("categoriaProduto");
    if (selectCategoria) {
        selectCategoria.innerHTML = '<option value="">Selecione</option>';
        categoriasFixas.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = c;
            selectCategoria.appendChild(opt);
        });
        $("#categoriaProduto").select2({ width: 'resolve' });
    }
}

function inicializarTabelaProdutos() {
    if (!document.querySelector("#tabela-produtos")) return;

    // Eventos de filtros
    document.getElementById("busca")?.addEventListener("input", carregarProdutos);
    document.getElementById("filtro-data")?.addEventListener("change", carregarProdutos);
    carregarCategoriasFiltroProdutos().then(() => {
        $("#filtroCategoria").on("change", carregarProdutos);
        carregarProdutos();
    });
}

async function carregarCategoriasFiltroProdutos() {
    const selectCategoria = document.getElementById("filtroCategoria");
    if (!selectCategoria) return;

    try {
        const resp = await fetch("http://localhost:8001/produtos");
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const categorias = [...new Set(data.produtos.map(p => p.categoria).filter(c => c))];
        selectCategoria.innerHTML = '<option value="">Todas</option>';
        categorias.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = c;
            selectCategoria.appendChild(opt);
        });
        $("#filtroCategoria").select2({ width: 'resolve' });
    } catch (err) {
        console.error(err);
    }
}

async function carregarProdutos() {
    const tabela = document.querySelector("#tabela-produtos tbody");
    if (!tabela) return;

    try {
        const busca = document.getElementById("busca")?.value.trim().toLowerCase() || "";
        const categoria = $("#filtroCategoria").val() || "";
        const dataFiltro = document.getElementById("filtro-data")?.value || "";

        const resp = await fetch("http://localhost:8001/produtos");
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        let produtos = (await resp.json()).produtos || [];

        if (busca) produtos = produtos.filter(p => p.nome.toLowerCase().includes(busca));
        if (categoria) produtos = produtos.filter(p => p.categoria === categoria);
        if (dataFiltro) produtos = produtos.filter(p => (p.ultima_alteracao || '').substring(0,10) === dataFiltro);

        tabela.innerHTML = "";
        if (produtos.length === 0) {
            tabela.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum produto encontrado.</td></tr>`;
            return;
        }

        produtos.forEach(prod => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${prod.id}</td>
                <td>${prod.nome}</td>
                <td>${prod.categoria || "Sem categoria"}</td>
                <td>${prod.quantidade}</td>
                <td>${prod.ultima_alteracao ? new Date(prod.ultima_alteracao).toLocaleString("pt-BR") : '—'}</td>
                <td>
                    <button class="btn-editar" data-id="${prod.id}">Editar</button>
                    <button class="btn-excluir" data-id="${prod.id}">Excluir</button>
                </td>
            `;
            tabela.appendChild(tr);
        });

        document.querySelectorAll(".btn-editar").forEach(btn => btn.addEventListener("click", () => abrirModalEditar(btn.dataset.id)));
        document.querySelectorAll(".btn-excluir").forEach(btn => btn.addEventListener("click", () => abrirModalExcluir(btn.dataset.id)));

    } catch (err) {
        console.error(err);
        mostrarToast("Erro ao carregar produtos!", "erro");
    }
}

