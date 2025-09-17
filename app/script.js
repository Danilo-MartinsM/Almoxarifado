// ============================
// script.js - Página Inicial
// ============================

// 🔹 Executa quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", () => {
    // Inicializa filtros, movimentações e calendar
    carregarFiltros();
    carregarMovimentacoes();
    inicializarCalendar();

    // Atualizar movimentações quando mudar filtros
    document.getElementById("filtroProduto").addEventListener("change", carregarMovimentacoes);
    document.getElementById("filtroCategoria").addEventListener("change", carregarMovimentacoes);
});

// ============================
// FUNÇÃO: Buscar e exibir movimentações
// ============================
async function carregarMovimentacoes() {
    try {
        const produtoFiltro = document.getElementById("filtroProduto").value;
        const categoriaFiltro = document.getElementById("filtroCategoria").value;

        // Requisição GET para API de movimentações
        const response = await fetch("http://localhost:8001/movimentacoes");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        const container = document.querySelector(".movimentacao-list");
        container.innerHTML = "";

        // Filtra movimentações pelo produto e categoria selecionados
        let movimentacoes = data.movimentacoes;
        if (produtoFiltro) {
            movimentacoes = movimentacoes.filter(m => m.produto === produtoFiltro);
        }
        if (categoriaFiltro) {
            movimentacoes = movimentacoes.filter(m => m.categoria === categoriaFiltro);
        }

        // Exibe movimentações no estilo .product-item
        movimentacoes.forEach(mov => {
            const divMov = document.createElement("div");
            divMov.classList.add("product-item");

            // Escolhe ícone baseado no tipo de movimentação
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

        if (movimentacoes.length === 0) {
            container.innerHTML = "<p>Nenhuma movimentação encontrada.</p>";
        }

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
        const categorias = [...new Set(data.produtos.map(p => p.categoria))];
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
        mostrarToast("Erro ao carregar filtros!", "erro");
    }
}

// ============================
// FUNÇÃO: Inicializar FullCalendar
// ============================
function inicializarCalendar() {
    const calendarEl = document.getElementById('calendar');

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        weekNumbers: true, // MOSTRA O NÚMERO DA SEMANA
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        dayMaxEvents: true
    });

    calendar.render();
}

// ============================
// FUNÇÃO: Toast notifications
// ============================
function mostrarToast(mensagem, tipo) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${tipo}`;
    toast.innerText = mensagem;

    container.appendChild(toast);

    // Animação de entrada
    requestAnimationFrame(() => {
        toast.style.animation = 'slideIn 0.3s forwards';
    });

    // Remove o toast com fadeOut após 3s
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}
