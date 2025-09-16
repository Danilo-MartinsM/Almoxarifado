// ============================
// script.js - Página Inicial
// ============================

// 🔹 Executa quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", () => {
    // Carrega os filtros e movimentações
    carregarFiltros();
    carregarMovimentacoes();
    inicializarCalendar();

    // Adiciona listeners aos selects para filtrar movimentações
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

        movimentacoes.forEach(mov => {
            const divMov = document.createElement("div");
            divMov.classList.add("movimentacao-item");
            divMov.innerHTML = `
                <strong>Produto:</strong> ${mov.produto} <br/>
                <strong>Categoria:</strong> ${mov.categoria || "-"} <br/>
                <strong>Tipo:</strong> ${mov.tipo} <br/>
                <strong>Quantidade:</strong> ${mov.quantidade} <br/>
                <strong>Data:</strong> ${new Date(mov.data_alteracao).toLocaleString()}
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
// FUNÇÃO: Popular filtros de Produto e Categoria
// ============================
async function carregarFiltros() {
    try {
        // Produtos
        const resProdutos = await fetch("http://localhost:8001/produtos");
        const dataProdutos = await resProdutos.json();
        const selectProduto = document.getElementById("filtroProduto");
        selectProduto.innerHTML = `<option value="">Todos</option>`;
        dataProdutos.produtos.forEach(p => {
            selectProduto.innerHTML += `<option value="${p.nome}">${p.nome}</option>`;
        });
        // Inicializa Select2
        $("#filtroProduto").select2({ width: 'resolve' });

        // Categorias
        const categorias = [...new Set(dataProdutos.produtos.map(p => p.categoria))];
        const selectCategoria = document.getElementById("filtroCategoria");
        selectCategoria.innerHTML = `<option value="">Todas</option>`;
        categorias.forEach(c => {
            selectCategoria.innerHTML += `<option value="${c}">${c}</option>`;
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
        weekNumbers: true,           // MOSTRA O NÚMERO DA SEMANA
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

    setTimeout(() => {
        toast.remove();
    }, 3000);
}
