// ============================
// script.js - Página Inicial
// ============================

// 🔹 Variáveis globais
let calendar;               // instância do FullCalendar
let dataSelecionada = "";   // guarda a data clicada para filtro

// ============================
// DOMContentLoaded
// ============================
document.addEventListener("DOMContentLoaded", () => {
    inicializarCalendar();

    carregarFiltros()
        .then(() => {
            // Registra handlers dos filtros usando jQuery + Select2
            $("#filtroProduto").on("change", carregarMovimentacoes);
            $("#filtroCategoria").on("change", carregarMovimentacoes);

            // Primeira carga de movimentações
            carregarMovimentacoes();
        })
        .catch(err => {
            console.error("Erro ao inicializar filtros:", err);
            mostrarToast("Erro ao carregar filtros!", "erro");
        });
});

// ============================
// FUNÇÃO: Cadastro de Produto
// ============================
document.addEventListener("DOMContentLoaded", () => {
    const formCadastro = document.getElementById("form-cadastro");
    if (formCadastro) {  // só executa se a página tiver esse formulário

        // 🔹 Função que preenche input de data/hora atual
        function preencherDataHoraAtual() {
            const inputData = document.getElementById("dataAlteracao");
            if (inputData) {
                const agora = new Date();
                const ano = agora.getFullYear();
                const mes = String(agora.getMonth() + 1).padStart(2, "0");
                const dia = String(agora.getDate()).padStart(2, "0");
                const horas = String(agora.getHours()).padStart(2, "0");
                const minutos = String(agora.getMinutes()).padStart(2, "0");

                inputData.value = `${ano}-${mes}-${dia}T${horas}:${minutos}`;
            }
        }

        // 🔹 Preenche na inicialização da página
        preencherDataHoraAtual();

        formCadastro.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nome = document.getElementById("nomeProduto").value.trim();
            const categoria = document.getElementById("categoriaProduto").value;
            const quantidade = parseInt(document.getElementById("quantidadeInicial").value);
            const dataAlteracao = document.getElementById("dataAlteracao").value;

            if (!nome || !categoria || isNaN(quantidade)) {
                mostrarToast("Preencha todos os campos corretamente!", "erro");
                return;
            }

            const body = {
                nome: nome,
                categoria: categoria,
                quantidade: quantidade,
                dataAlteracao: dataAlteracao ? dataAlteracao.replace("T", " ") : undefined
            };

            try {
                const response = await fetch("http://localhost:8001/produtos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.detail || "Erro ao cadastrar produto");
                }

                mostrarToast("Produto cadastrado com sucesso!", "sucesso");

                // Limpa o formulário
                formCadastro.reset();
                $("#categoriaProduto").val("").trigger('change');

                // 🔹 Reaplica a data/hora atual após o submit
                preencherDataHoraAtual();

            } catch (error) {
                console.error(error);
                mostrarToast(error.message, "erro");
            }
        });

        // Carrega categorias fixas no select
        const categoriasFixas = ['Insumos', 'Vasos', 'Caixas', 'Porta Vaso', 'Fita Cetim', 'Liga Elástica', 'Etiquetas'];
        const selectCategoria = document.getElementById("categoriaProduto");
        selectCategoria.innerHTML = '<option value="">Selecione</option>';
        categoriasFixas.forEach(c => {
            const option = document.createElement("option");
            option.value = c;
            option.textContent = c;
            selectCategoria.appendChild(option);
        });

        // Inicializa Select2 **após adicionar as opções**
        $("#categoriaProduto").select2({ width: 'resolve' });


    }
});



// ============================
// FUNÇÃO: Buscar e exibir movimentações
// ============================
async function carregarMovimentacoes() {
    try {
        // Normaliza filtros
        const produtoFiltroRaw = document.getElementById("filtroProduto").value || "";
        const categoriaFiltroRaw = document.getElementById("filtroCategoria").value || "";
        const produtoFiltro = produtoFiltroRaw.trim().toLowerCase();
        const categoriaFiltro = categoriaFiltroRaw.trim().toLowerCase();

        const response = await fetch("http://localhost:8001/movimentacoes");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        const container = document.querySelector(".movimentacao-list");
        container.innerHTML = "";

        let movimentacoes = data.movimentacoes || [];

        // Filtra por produto e categoria
        if (produtoFiltro) {
            movimentacoes = movimentacoes.filter(m => (m.produto || "").trim().toLowerCase() === produtoFiltro);
        }
        if (categoriaFiltro) {
            movimentacoes = movimentacoes.filter(m => (m.categoria || "").trim().toLowerCase() === categoriaFiltro);
        }

        // Filtra por data selecionada apenas para exibição na lista
        let movimentacoesParaLista = movimentacoes;
        if (dataSelecionada) {
            movimentacoesParaLista = movimentacoes.filter(m => (m.data_alteracao || "").substring(0, 10) === dataSelecionada);
        }

        // Exibe movimentações na lista
        movimentacoesParaLista.forEach(mov => {
            const divMov = document.createElement("div");
            divMov.classList.add("product-item");

            const icon = mov.tipo === "Entrada" ? "📥" : "📦";
            divMov.innerHTML = `
                <div class="product-icon">${icon}</div>
                <div>
                    <strong>${mov.produto}</strong><br/>
                    <small>Tipo: ${mov.tipo}</small><br/>
                    <small>Quantidade: ${mov.quantidade}</small><br/>
                    <small>Data: ${new Date(mov.data_alteracao).toLocaleString()}</small>
                </div>
            `;
            container.appendChild(divMov);
        });

        if (movimentacoesParaLista.length === 0) {
            container.innerHTML = "<p>Nenhuma movimentação encontrada.</p>";
        }

        // Atualiza calendário com todos os eventos
        atualizarCalendar(movimentacoes);

    } catch (error) {
        console.error("Erro ao carregar movimentações:", error);
        mostrarToast("Erro ao carregar movimentações!", "erro");
    }
}

// ============================
// FUNÇÃO: Carregar filtros de produto e categoria
// ============================
async function carregarFiltros() {
    try {
        const response = await fetch("http://localhost:8001/produtos");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        // ===== Filtro de Produto =====
        const selectProduto = document.getElementById("filtroProduto");
        selectProduto.innerHTML = '<option value="">Todos</option>';
        data.produtos.forEach(p => {
            const option = document.createElement("option");
            option.value = p.nome;
            option.textContent = p.nome;
            selectProduto.appendChild(option);
        });
        $("#filtroProduto").select2({ width: 'resolve' });

        // ===== Filtro de Categoria =====
        const categorias = [...new Set(data.produtos.map(p => p.categoria).filter(c => c))];
        const selectCategoria = document.getElementById("filtroCategoria");
        selectCategoria.innerHTML = '<option value="">Todas</option>';
        categorias.forEach(c => {
            const option = document.createElement("option");
            option.value = c;
            option.textContent = c;
            selectCategoria.appendChild(option);
        });
        $("#filtroCategoria").select2({ width: 'resolve' });

    } catch (error) {
        console.error("Erro ao carregar filtros:", error);
        throw error;
    }
}

// ============================
// FUNÇÃO: Inicializar FullCalendar
// ============================
function inicializarCalendar() {
    const calendarEl = document.getElementById('calendar');

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        weekNumbers: true,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        dayMaxEvents: true,

        // 🔹 Clique em um dia (toggle fundo do dia)
        dateClick: function(info) {
            // Remove fundo antigo, se houver
            if (dataSelecionada) {
                const oldCell = calendarEl.querySelector(`[data-date="${dataSelecionada}"]`);
                if (oldCell) oldCell.classList.remove('dia-selecionado');
            }

            // Toggle da data selecionada
            if (dataSelecionada === info.dateStr) {
                dataSelecionada = ""; // desmarca se clicou no mesmo dia
            } else {
                dataSelecionada = info.dateStr;
                info.dayEl.classList.add('dia-selecionado'); // adiciona fundo suave
            }

            // Atualiza lista de movimentações
            carregarMovimentacoes();
        }
    });

    calendar.render();
}


// ============================
// FUNÇÃO: Atualizar eventos no calendário
// ============================
function atualizarCalendar(movimentacoes) {
    if (!calendar) return;

    // remove apenas eventos de movimentações (mantendo marcador azul)
    calendar.getEvents().forEach(ev => {
        if (ev.title !== "Selecionado") ev.remove();
    });

    movimentacoes.forEach(mov => {
        const titulo = `${mov.produto} (${mov.tipo}: ${mov.quantidade})`;

        calendar.addEvent({
            title: titulo,
            start: mov.data_alteracao,
            color: mov.tipo === "Entrada" ? "green" : "red"
        });
    });
}

// ============================
// FUNÇÃO: Toast notifications
// ============================
function mostrarToast(mensagem, tipo) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");

    // 🔹 Só aceita "sucesso" ou "erro"
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
// FUNÇÃO: Carregar produtos na tabela
// ============================
async function carregarProdutos() {
    try {
        const response = await fetch("http://localhost:8001/produtos");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        const produtos = data.produtos || [];
        const tbody = document.querySelector("#tabela-produtos tbody");
        tbody.innerHTML = "";

        if (produtos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum produto encontrado.</td></tr>`;
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
            tbody.appendChild(tr);
        });

        // Registrar eventos dos botões
        document.querySelectorAll(".btn-editar").forEach(btn => {
            btn.addEventListener("click", () => abrirModalEditar(btn.dataset.id));
        });
        document.querySelectorAll(".btn-excluir").forEach(btn => {
            btn.addEventListener("click", () => abrirModalExcluir(btn.dataset.id));
        });

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        mostrarToast("Erro ao carregar produtos!", "erro");
    }
}

// ============================
// Executa ao carregar a página
// ============================
document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("#tabela-produtos")) {
        carregarProdutos();
    }
});
