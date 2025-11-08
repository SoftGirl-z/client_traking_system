let clients = [];
let sessions = [];
let currentClientId = null;
let currentUser = null;

// Sayfa yüklendiğinde
window.onload = function() {
    checkLoginStatus();
    loadData();
    document.getElementById('sessionDate').valueAsDate = new Date();
};

// Login kontrolü
async function checkLoginStatus() {
    try {
        const userData = await window.storage.get('current-user');
        if (userData) {
            currentUser = JSON.parse(userData.value);
            document.getElementById('userDisplay').style.display = 'flex';
            document.getElementById('guestDisplay').style.display = 'none';
            document.getElementById('currentUserName').textContent = currentUser.name;
        } else {
            document.getElementById('userDisplay').style.display = 'none';
            document.getElementById('guestDisplay').style.display = 'flex';
        }
    } catch (error) {
        document.getElementById('userDisplay').style.display = 'none';
        document.getElementById('guestDisplay').style.display = 'flex';
    }
}

// Çıkış yap
async function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        try {
            await window.storage.delete('current-user');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Çıkış hatası:', error);
        }
    }
}

// Veri yükleme
async function loadData() {
    const userPrefix = currentUser ? ('user-' + currentUser.email) : 'guest';
    
    try {
        const clientsData = await window.storage.get(userPrefix + '-clients');
        const sessionsData = await window.storage.get(userPrefix + '-sessions');
        
        if (clientsData) clients = JSON.parse(clientsData.value);
        if (sessionsData) sessions = JSON.parse(sessionsData.value);
        
        renderClients();
        updateStats();
    } catch (error) {
        console.log('İlk kullanım - veri yüklenmedi');
        renderClients();
        updateStats();
    }
}

// Veri kaydetme
async function saveData() {
    const userPrefix = currentUser ? ('user-' + currentUser.email) : 'guest';
    
    try {
        await window.storage.set(userPrefix + '-clients', JSON.stringify(clients));
        await window.storage.set(userPrefix + '-sessions', JSON.stringify(sessions));
    } catch (error) {
        console.error('Kayıt hatası:', error);
        alert('Veri kaydedilirken hata oluştu!');
    }
}

// Danışan ekleme modalı
function openAddClientModal() {
    document.getElementById('addClientModal').classList.add('active');
}

function closeAddClientModal() {
    document.getElementById('addClientModal').classList.remove('active');
    clearClientForm();
}

function clearClientForm() {
    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('clientComplaints').value = '';
    document.getElementById('clientNotes').value = '';
}

// Danışan kaydetme
function saveClient() {
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();

    if (!name || !phone) {
        alert('Ad Soyad ve Telefon zorunludur!');
        return;
    }

    const newClient = {
        id: Date.now().toString(),
        name: name,
        phone: phone,
        email: document.getElementById('clientEmail').value.trim(),
        complaints: document.getElementById('clientComplaints').value.trim(),
        notes: document.getElementById('clientNotes').value.trim(),
        createdAt: new Date().toISOString()
    };

    clients.push(newClient);
    saveData();
    renderClients();
    updateStats();
    closeAddClientModal();
    alert('Danışan başarıyla eklendi!');
}

// Seans ekleme modalı
function openAddSessionModal(clientId) {
    currentClientId = clientId;
    document.getElementById('addSessionModal').classList.add('active');
    document.getElementById('sessionDate').valueAsDate = new Date();
}

function closeAddSessionModal() {
    document.getElementById('addSessionModal').classList.remove('active');
    clearSessionForm();
    currentClientId = null;
}

function clearSessionForm() {
    document.getElementById('sessionDate').valueAsDate = new Date();
    document.getElementById('sessionTime').value = '09:00';
    document.getElementById('sessionType').value = 'Fizyoterapi';
    document.getElementById('sessionNotes').value = '';
}

// Seans kaydetme
function saveSession() {
    if (!currentClientId) {
        alert('Danışan seçilmedi!');
        return;
    }

    const date = document.getElementById('sessionDate').value;
    const time = document.getElementById('sessionTime').value;

    if (!date || !time) {
        alert('Tarih ve saat zorunludur!');
        return;
    }

    const newSession = {
        id: Date.now().toString(),
        clientId: currentClientId,
        date: date,
        time: time,
        type: document.getElementById('sessionType').value,
        notes: document.getElementById('sessionNotes').value.trim(),
        createdAt: new Date().toISOString()
    };

    sessions.push(newSession);
    saveData();
    renderClients();
    updateStats();
    closeAddSessionModal();
    alert('Seans başarıyla eklendi!');
}

// Danışan silme
function deleteClient(clientId) {
    if (!confirm('Bu danışanı silmek istediğinizden emin misiniz? Tüm seansları da silinecektir.')) {
        return;
    }

    clients = clients.filter(c => c.id !== clientId);
    sessions = sessions.filter(s => s.clientId !== clientId);
    saveData();
    renderClients();
    updateStats();
}

// Seans silme
function deleteSession(sessionId) {
    if (!confirm('Bu seansı silmek istediğinizden emin misiniz?')) {
        return;
    }

    sessions = sessions.filter(s => s.id !== sessionId);
    saveData();
    renderClients();
    updateStats();
}

// Danışanları render etme
function renderClients() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm) ||
        client.phone.includes(searchTerm)
    );

    const container = document.getElementById('clientsList');
    document.getElementById('clientCount').textContent = filteredClients.length;

    if (filteredClients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👤</div>
                <p>Henüz danışan eklenmemiş</p>
                ${clients.length > 0 ? '<p style="font-size: 14px; margin-top: 10px;">Arama kriterine uygun sonuç bulunamadı</p>' : ''}
            </div>
        `;
        return;
    }

    container.innerHTML = filteredClients.map(client => {
        const clientSessions = sessions
            .filter(s => s.clientId === client.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        return `
            <div class="client-card">
                <div class="client-header">
                    <div class="client-info">
                        <h3>
                            ${client.name}
                            <span class="badge">${clientSessions.length} seans</span>
                        </h3>
                        <div class="client-details">
                            <div>📱 ${client.phone}</div>
                            ${client.email ? `<div>📧 ${client.email}</div>` : ''}
                            ${client.complaints ? `<div style="color: #ef4444;">⚠️ ${client.complaints}</div>` : ''}
                        </div>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-success btn-small" onclick="openAddSessionModal('${client.id}')">
                            ➕ Seans
                        </button>
                        <button class="btn btn-danger btn-small" onclick="deleteClient('${client.id}')">
                            🗑️
                        </button>
                    </div>
                </div>
                
                ${clientSessions.length > 0 ? `
                    <div class="sessions-list">
                        <strong style="color: #333; display: block; margin-bottom: 10px;">
                            Seanslar (${clientSessions.length}):
                        </strong>
                        ${clientSessions.map(session => `
                            <div class="session-card">
                                <div class="session-info">
                                    <span class="session-type">${session.type}</span>
                                    <span style="margin-left: 10px; color: #666;">
                                        ${new Date(session.date).toLocaleDateString('tr-TR')} 
                                        ${session.time ? '• ' + session.time : ''}
                                    </span>
                                    ${session.notes ? `
                                        <div style="color: #666; margin-top: 5px; font-size: 13px;">
                                            💬 ${session.notes}
                                        </div>
                                    ` : ''}
                                </div>
                                <button 
                                    class="btn btn-danger btn-small" 
                                    onclick="deleteSession('${session.id}')"
                                    style="padding: 6px 12px; font-size: 12px;">
                                    🗑️
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${client.notes ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                        <strong style="color: #666; font-size: 14px;">📝 Notlar:</strong>
                        <p style="color: #666; font-size: 14px; margin-top: 5px;">${client.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// İstatistikleri güncelleme
function updateStats() {
    document.getElementById('totalClients').textContent = clients.length;
    document.getElementById('totalSessions').textContent = sessions.length;
    
    const now = new Date();
    const thisMonth = sessions.filter(s => {
        const sessionDate = new Date(s.date);
        return sessionDate.getMonth() === now.getMonth() && 
               sessionDate.getFullYear() === now.getFullYear();
    }).length;
    
    document.getElementById('thisMonthSessions').textContent = thisMonth;
}

// Modal dışına tıklandığında kapatma
window.onclick = function(event) {
    const clientModal = document.getElementById('addClientModal');
    const sessionModal = document.getElementById('addSessionModal');
    
    if (event.target === clientModal) {
        closeAddClientModal();
    }
    if (event.target === sessionModal) {
        closeAddSessionModal();
    }
}
