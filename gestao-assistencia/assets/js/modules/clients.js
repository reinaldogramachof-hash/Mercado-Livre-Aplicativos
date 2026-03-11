// ==========================================
// MÓDULO CLIENTES - GESTÃO ASSISTÊNCIA
// ==========================================

function openClientModal(client = null) {
    document.getElementById('client-id').value = client?.id || '';
    document.getElementById('client-name').value = client?.name || '';
    document.getElementById('client-phone').value = client?.phone || '';
    document.getElementById('client-email').value = client?.email || '';
    document.getElementById('client-address').value = client?.address || '';
    const notesEl = document.getElementById('client-notes');
    if (notesEl) notesEl.value = client?.notes || '';
    
    const titleEl = document.querySelector('#clientModal h3');
    if (titleEl) titleEl.textContent = client ? 'Editar Cliente' : 'Novo Cliente';
    
    const modal = document.getElementById('clientModal');
    if (modal) modal.classList.remove('hidden');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function submitClient(event) {
    if (event) event.preventDefault();
    const id = document.getElementById('client-id').value;
    const client = {
        id: id || getClientID(),
        name: document.getElementById('client-name').value.trim(),
        phone: document.getElementById('client-phone').value.trim(),
        email: document.getElementById('client-email').value.trim(),
        address: document.getElementById('client-address').value.trim(),
        notes: document.getElementById('client-notes')?.value.trim() || '',
        createdAt: id ? (db.clients.find(c => c.id === id)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };
    
    if (!client.name) {
        showNotification('O nome do cliente é obrigatório!', 'error');
        return;
    }

    if (id) {
        const idx = db.clients.findIndex(c => c.id === id);
        if (idx !== -1) db.clients[idx] = client;
    } else {
        db.clients.unshift(client);
    }
    
    save();
    closeModal('clientModal');
    renderClients();
    showNotification(id ? 'Cliente atualizado!' : 'Cliente cadastrado!', 'success');
}

function renderClients() {
    const term = (document.getElementById('search-client')?.value || '').toLowerCase();
    const tbody = document.getElementById('clients-table-body');
    const emptyMsg = document.getElementById('empty-clients-msg');

    if (!tbody) return;

    let filtered = db.clients.filter(c =>
        c.name.toLowerCase().includes(term) ||
        (c.phone || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }
    
    if (emptyMsg) emptyMsg.classList.add('hidden');

    tbody.innerHTML = filtered.map(client => {
        const clientOrders = db.orders.filter(o => o.clientId === client.id || o.client === client.name);
        const lastOrder = clientOrders.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        // Escape quotes in client JSON for HTML attribute
        const clientData = JSON.stringify(client).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        
        return `
            <tr class="hover:bg-gray-50 group border-b border-gray-100">
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-800">${sanitizeHTML(client.name)}</div>
                    ${client.address ? `<div class="text-xs text-gray-400">${sanitizeHTML(client.address)}</div>` : ''}
                </td>
                <td class="px-6 py-4">
                    ${client.phone ? `<div class="text-sm text-gray-700">${sanitizeHTML(client.phone)}</div>` : ''}
                    ${client.email ? `<div class="text-xs text-gray-400">${sanitizeHTML(client.email)}</div>` : ''}
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">${clientOrders.length}</span>
                </td>
                <td class="px-6 py-4 text-gray-500 text-sm">${lastOrder ? fmtDate(lastOrder.date) : '-'}</td>
                <td class="px-6 py-4 text-center">
                    <div class="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="openClientModal(${clientData})"
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
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function deleteClient(id) {
    if (confirm('Excluir este cliente? Esta ação não pode ser desfeita.')) {
        db.clients = db.clients.filter(c => c.id !== id);
        save();
        renderClients();
        showNotification('Cliente excluído.', 'success');
    }
}

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
        save();
    } else if (existingClient) {
        existingClient.orders = (existingClient.orders || 0) + 1;
        existingClient.lastOrder = order.date;
        existingClient.totalSpent = (existingClient.totalSpent || 0) + order.total;
        save();
    }
}
