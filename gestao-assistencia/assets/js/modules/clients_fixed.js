// --- Extracted from original ---
function saveClientFromOrder(order) {
    const existingClient = db.clients.find(c =>
        c.name.toLowerCase() === order.client.toLowerCase() ||
        (c.phone && c.phone === order.phone)
    );

    if (!existingClient && order.client) {
        db.clients.push({
            id: getClientID(),
            name: order.client,
            phone: order.phone,
            email: '',
            address: '',
            notes: '',
            orders: 1,
            lastOrder: order.date,
            totalSpent: order.total,
            createdAt: new Date().toISOString()
        });
    } else if (existingClient) {
        existingClient.orders += 1;
        existingClient.lastOrder = order.date;
        existingClient.totalSpent = (existingClient.totalSpent || 0) + order.total;
    }
}

// --- Extracted from original ---
function openClientModal(client) {
    document.getElementById('client-id').value = client?.id || '';
    document.getElementById('client-name').value = client?.name || '';
    document.getElementById('client-phone').value = client?.phone || '';
    document.getElementById('client-email').value = client?.email || '';
    document.getElementById('client-address').value = client?.address || '';
    document.getElementById('client-notes').value = client?.notes || '';
    document.querySelector('#clientModal h3').textContent = client ? 'Editar Cliente' : 'Novo Cliente';
    document.getElementById('clientModal').classList.remove('hidden');
    lucide.createIcons();
}

// --- Extracted from original ---
function renderClients() {
    const term = (document.getElementById('search-client')?.value || '').toLowerCase();
    const tbody = document.getElementById('clients-table-body');
    const emptyMsg = document.getElementById('empty-clients-msg');

    let filtered = db.clients.filter(c =>
        c.name.toLowerCase().includes(term) ||
        (c.phone || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyMsg?.classList.remove('hidden');
        lucide.createIcons();
        return;
    }
    emptyMsg?.classList.add('hidden');

    tbody.innerHTML = filtered.map(client => {
        const clientOrders = db.orders.filter(o => o.clientId === client.id || o.client === client.name);
        const lastOrder = clientOrders.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        return `
            <tr class="hover:bg-gray-50 group border-b border-gray-100">
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-800">${client.name}</div>
                    ${client.address ? `<div class="text-xs text-gray-400">${client.address}</div>` : ''}
                </td>
                <td class="px-6 py-4">
                    ${client.phone ? `<div class="text-sm text-gray-700">${client.phone}</div>` : ''}
                    ${client.email ? `<div class="text-xs text-gray-400">${client.email}</div>` : ''}
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">${clientOrders.length}</span>
                </td>
                <td class="px-6 py-4 text-gray-500 text-sm">${lastOrder ? fmtDate(lastOrder.date) : '-'}</td>
                <td class="px-6 py-4 text-center">
                    <div class="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="openClientModal(${JSON.stringify(client).replace(/"/g, '&quot;')})"
                                class="text-gray-400 hover:text-blue-500 transition-colors" title="Editar">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteClient('${client.id}')"
                                class="text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    lucide.createIcons();
}

// --- Extracted from original ---
function deleteClient(id) {
    if (confirm('Excluir este cliente? Esta ação não pode ser desfeita.')) {
        db.clients = db.clients.filter(c => c.id !== id);
        save();
        renderClients();
        showNotification('Cliente excluído.', 'success');
    }
}
