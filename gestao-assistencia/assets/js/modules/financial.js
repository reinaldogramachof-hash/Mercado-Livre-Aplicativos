// ==========================================
// MÓDULO FINANCEIRO E TRANSAÇÕES - GESTÃO ASSISTÊNCIA
// ==========================================

function openTransactionModal(type = 'income', trans = null) {
    const modal = document.getElementById('transactionModal');
    if (!modal) return;

    // Resetar formulário
    document.getElementById('trans-id').value = trans?.id || '';
    document.getElementById('trans-amount').value = trans ? trans.amount.toFixed(2).replace('.', ',') : '';
    document.getElementById('trans-desc').value = trans?.desc || '';
    document.getElementById('trans-category').value = trans?.category || (type === 'income' ? 'service' : 'supplies');
    document.getElementById('trans-date').value = trans ? trans.date : new Date().toISOString().split('T')[0];

    // Ajustar tipo (Radio)
    const targetType = trans ? trans.type : type;
    const radio = document.querySelector(`input[name="trans-type"][value="${targetType}"]`);
    if (radio) radio.checked = true;

    // Título dinâmico
    const modalTitleEl = document.getElementById('transactionModal').querySelector('h3');
    if (modalTitleEl) {
        modalTitleEl.textContent = trans ? 'Editar Lançamento' : (type === 'income' ? 'Nova Receita' : 'Nova Despesa');
    }

    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function submitTransaction(event) {
    if (event) event.preventDefault();

    const id = document.getElementById('trans-id').value;
    const typeValue = document.querySelector('input[name="trans-type"]:checked').value;
    const amountStr = document.getElementById('trans-amount').value.replace(',', '.');
    const amount = parseFloat(amountStr) || 0;
    const desc = document.getElementById('trans-desc').value.trim();
    const category = document.getElementById('trans-category').value;
    const date = document.getElementById('trans-date').value;

    if (!desc || amount <= 0 || !date) {
        showNotification('Preencha os campos obrigatórios corretamente!', 'error');
        return;
    }

    const transaction = {
        id: id || 'TR' + Date.now().toString(36).toUpperCase().substr(-6),
        type: typeValue,
        amount,
        desc,
        category,
        date,
        createdAt: new Date().toISOString()
    };

    if (id) {
        const idx = db.transactions.findIndex(t => t.id === id);
        if (idx !== -1) {
            db.transactions[idx] = transaction;
        }
    } else {
        db.transactions.unshift(transaction);
    }

    save();
    closeModal('transactionModal');
    renderTransactions();
    renderDashboard();
    showNotification(id ? 'Lançamento atualizado!' : 'Lançamento registrado!', 'success');
}

function deleteTransaction(id) {
    if (confirm('Tem certeza que deseja excluir este lançamento?\n\nEsta ação não poderá ser desfeita.')) {
        db.transactions = db.transactions.filter(t => t.id !== id);
        save();
        renderTransactions();
        renderDashboard();
        showNotification('Lançamento excluído!', 'success');
    }
}

function renderTransactions() {
    const start = document.getElementById('cash-start')?.value || '';
    const end = document.getElementById('cash-end')?.value || '';
    const type = document.getElementById('cash-type')?.value || 'all';
    const tbody = document.getElementById('trans-table-body');

    if (!tbody) return;

    let filtered = db.transactions.filter(t => {
        // Filtro de Data
        if (start && t.date < start) return false;
        if (end && t.date > end) return false;
        
        // Filtro de Tipo
        if (type !== 'all' && t.type !== type) return false;
        
        return true;
    });

    // Ordenar por data decrescente
    filtered.sort((a, b) => new Date(b.date + 'T12:00:00') - new Date(a.date + 'T12:00:00'));

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-12 text-center text-gray-400">Nenhum lançamento encontrado.</td></tr>';
        updateFinancialStats(filtered);
        return;
    }

    tbody.innerHTML = filtered.map(t => {
        const transData = JSON.stringify(t).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const catMap = {
            'service': 'Serviço',
            'parts': 'Peças',
            'supplies': 'Materiais',
            'rent': 'Aluguel',
            'utilities': 'Contas',
            'other': 'Outros',
            'sale': 'Venda PDV'
        };

        return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 group transition-colors">
                <td class="px-6 py-4 text-xs font-mono text-gray-400">${fmtDate(t.date)}</td>
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-800">${sanitizeHTML(t.desc)}</div>
                </td>
                <td class="px-6 py-4">
                    <span class="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-medium">
                        ${catMap[t.category] || t.category}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <span class="font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}">
                        ${t.type === 'income' ? '+' : '-'} ${fmtMoney(t.amount)}
                    </span>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick='openTransactionModal("", ${transData})'
                                class="text-gray-400 hover:text-blue-500 transition-colors" title="Editar">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteTransaction('${t.id}')"
                                class="text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
    updateFinancialStats(filtered);
}

function updateFinancialStats(transactions) {
    const incomeEl = document.getElementById('cash-income');
    const expenseEl = document.getElementById('cash-expense');
    const balanceEl = document.getElementById('cash-balance');

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;

    if (incomeEl) incomeEl.textContent = fmtMoney(totalIncome);
    if (expenseEl) expenseEl.textContent = '- ' + fmtMoney(totalExpense);
    if (balanceEl) {
        balanceEl.textContent = fmtMoney(balance);
        balanceEl.className = `text-3xl font-bold ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`;
    }
}
