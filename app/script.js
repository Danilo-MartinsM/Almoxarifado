// ============================
// script.js - Página Inicial (com toggle do marcador e eventos sempre visíveis)
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

        // 🔹 Clique em um dia (toggle marcador azul)
        dateClick: function(info) {
            if (dataSelecionada === info.dateStr) {
                // clicou no mesmo dia → remove marcador
                calendar.getEvents().forEach(ev => {
                    if (ev.title === "Selecionado") ev.remove();
                });
                dataSelecionada = "";
            } else {
                // remove marcador antigo
                calendar.getEvents().forEach(ev => {
                    if (ev.title === "Selecionado") ev.remove();
                });
                dataSelecionada = info.dateStr;
                calendar.addEvent({
                    title: 'Selecionado',
                    start: dataSelecionada,
                    allDay: true,
                    color: 'rgba(0, 123, 255, 0.2)' // azul suave
                });
            }

            // atualiza lista de movimentações
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
    toast.className = `toast ${tipo}`;
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
