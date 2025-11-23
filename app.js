// ========================================
// GLOBAL VARIABLES
// ========================================

let clients = [];
let sessions = [];
let packages = [];
let payments = [];
let currentUser = null;
let currentCalendarDate = new Date();

// ========================================
// INITIALIZE APP
// ========================================

window.addEventListener('load', async function() {
    console.log('✅ Uygulama başlatılıyor...');
    
    if (!window.storage) {
        console.error('❌ HATA: window.storage tanımlanmamış!');
        alert('⚠️ Hata: Storage sistemi yüklenemedi.');
        return;
    }
    
    console.log('✅ window.storage hazır');
    
    try {
        await checkLoginStatus();
        await loadData();
        initializeForm();
        renderClients();
        updateStats();
        console.log('✅ Uygulama tamamen başlatıldı');
    } catch (error) {
        console.error('❌ Başlatma hatası:', error);
        alert('⚠️ Uygulama başlatılırken hata: ' + error.message);
    }
});

// ========================================
// LOGIN & AUTH
// ========================================

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

async function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        try {
            await window.storage.delete('current-user');
            window.location.href = 'login.html';
        } catch (error) {
            alert('Çıkış hatası: ' + error.message);
        }
    }
}

// ========================================
// DATA MANAGEMENT
// ========================================

async function loadData() {
    const userPrefix = currentUser ? ('user-' + currentUser.email) : 'guest';
    
    try {
        const clientsData = await window.storage.get(userPrefix + '-clients');
        const sessionsData = await window.storage.get(userPrefix + '-sessions');
        const packagesData = await window.storage.get(userPrefix + '-packages');
        const paymentsData = await window.storage.get(userPrefix + '-payments');
        
        clients = clientsData ? JSON.parse(clientsData.value) : [];
        sessions = sessionsData ? JSON.parse(sessionsData.value) : [];
        packages = packagesData ? JSON.parse(packagesData.value) : [];
        payments = paymentsData ? JSON.parse(paymentsData.value) : [];
        
        console.log(`✅ Veri yüklendi`);
    } catch (error) {
        clients = [];
        sessions = [];
        packages = [];
        payments = [];
    }
}

async function saveData() {
    const userPrefix = currentUser ? ('user-' + currentUser.email) : 'guest';
    
    try {
        await window.storage.set(userPrefix + '-clients', JSON.stringify(clients));
        await window.storage.set(userPrefix + '-sessions', JSON.stringify(sessions));
        await window.storage.set(userPrefix + '-packages', JSON.stringify(packages));
        await window.storage.set(userPrefix + '-payments', JSON.stringify(payments));
    } catch (error) {
        alert('Veri kaydedilirken hata: ' + error.message);
    }
}

// ========================================
// FORM INITIALIZATION
// ========================================

function initializeForm() {
    updateClientSelects();

    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const localDate = today.toISOString().split('T')[0];

    document.getElementById('sessionDate').value = localDate;
    document.getElementById('packageStartDate').value = localDate;
    document.getElementById('paymentDate').value = localDate;
}

function updateClientSelects() {
    const selects = ['sessionClient', 'packageClient', 'paymentClient'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">-- Danışan Seç --</option>';
        
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = `${client.name} (${client.phone})`;
            select.appendChild(option);
        });
        
        if (currentValue) select.value = currentValue;
    });
}

// ========================================
// NOTIFICATION SYSTEM
// ========================================

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${type === 'success' ? '✅' : '⚠️'} ${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// TAB SWITCHING
// ========================================

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    event.target.classList.add('active');
    
    if (tab === 'clients') {
        document.getElementById('clientsPage').classList.add('active');
        renderClients();
    } else if (tab === 'calendar') {
        document.getElementById('calendarPage').classList.add('active');
        renderCalendar();
    } else if (tab === 'packages') {
        document.getElementById('packagesPage').classList.add('active');
        renderPackages();
    } else if (tab === 'finance') {
        document.getElementById('financePage').classList.add('active');
        renderFinance();
    }
}

// ========================================
// CLIENT MANAGEMENT
// ========================================

function openAddClientModal() {
    document.getElementById('addClientModal').classList.add('active');
    clearClientForm();
}

function closeAddClientModal() {
    document.getElementById('addClientModal').classList.remove('active');
}

function clearClientForm() {
    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('clientComplaints').value = '';
    document.getElementById('clientNotes').value = '';
}

async function saveClient() {
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const email = document.getElementById('clientEmail').value.trim();
    const complaints = document.getElementById('clientComplaints').value.trim();
    const notes = document.getElementById('clientNotes').value.trim();

    if (!name || !phone) {
        alert('❌ Ad ve telefon zorunlu!');
        return;
    }

    const client = {
    id: 'client-' + Date.now(),
    name,
    phone,
    email,
    complaints,
    notes,
    createdAt: new Date().toISOString(),
    status: 'active',        // aktif / dondurulmuş
    messages: [],            // danışan notları / mesajları
    totalSessions: 0         // toplam seans sayısı
};


    clients.push(client);
    await saveData();
    renderClients();
    updateStats();
    updateClientSelects();
    closeAddClientModal();
    showNotification('Danışan eklendi', 'success');
}
function addClientMessage(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const text = prompt("Danışan için not ekleyin:");
    if (!text || !text.trim()) return;

    const message = {
        id: "msg-" + Date.now(),
        text: text.trim(),
        date: new Date().toLocaleString("tr-TR")
    };

    if (!client.messages) client.messages = [];
    client.messages.push(message);

    saveData();
    renderClients();
    showNotification("Not eklendi", "success");
}
function toggleClientStatus(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    client.status = client.status === "frozen" ? "active" : "frozen";

    saveData();
    renderClients();
    showNotification("Danışan durumu güncellendi", "success");
}
function deleteClient(clientId) {
    if (!confirm("Bu danışanı silmek istediğinizden emin misiniz?")) return;

    clients = clients.filter(c => c.id !== clientId);
    sessions = sessions.filter(s => s.clientId !== clientId);
    packages = packages.filter(p => p.clientId !== clientId);
    payments = payments.filter(pay => pay.clientId !== clientId);

    saveData();
    renderClients();
    renderCalendar();
    updateStats();
    showNotification("Danışan silindi", "success");
}


// ========================================
// SESSION MANAGEMENT
// ========================================

function openAddSessionModal() {
    document.getElementById('addSessionModal').classList.add('active');
    clearSessionForm();
    
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    document.getElementById('sessionDate').value = d.toISOString().split('T')[0];

    document.getElementById('sessionTime').value = '09:00';
}

function closeAddSessionModal() {
    document.getElementById('addSessionModal').classList.remove('active');
}

function clearSessionForm() {
    document.getElementById('sessionClient').value = '';
    document.getElementById('sessionDate').value = '';
    document.getElementById('sessionTime').value = '09:00';
    document.getElementById('sessionType').value = 'Fizyoterapi';
    document.getElementById('sessionDuration').value = '60';
    document.getElementById('sessionNotes').value = '';
}

async function saveSession() {
    const clientId = document.getElementById('sessionClient').value;
    const date = document.getElementById('sessionDate').value;
    const time = document.getElementById('sessionTime').value;
    const type = document.getElementById('sessionType').value;
    const duration = parseInt(document.getElementById('sessionDuration').value) || 60;
    const notes = document.getElementById('sessionNotes').value.trim();

    if (!clientId || !date || !time || !type) {
        alert('❌ Zorunlu alanları doldurun!');
        return;
    }

    const session = {
        id: 'session-' + Date.now(),
        clientId,
        date,
        time,
        type,
        duration,
        notes,
        createdAt: Date.now()
    };

    sessions.push(session);

    // Paket seans azaltma
    const pkg = packages.find(p => p.clientId === clientId && p.status === 'active');
    if (pkg && pkg.remainingSessions > 0) {
        pkg.remainingSessions--;
        if (pkg.remainingSessions === 0) pkg.status = 'completed';
    }

    await saveData();
    renderClients();
    renderCalendar();
    updateStats();
    closeAddSessionModal();
    showNotification('Seans eklendi', 'success');
}

// ========================================
// PACKAGE MANAGEMENT (TARİH KAYMA DÜZELTİLDİ)
// ========================================

function openAddPackageModal(clientId = null) {
    document.getElementById('addPackageModal').classList.add('active');
    clearPackageForm();
    
    if (clientId) {
        document.getElementById('packageClient').value = clientId;
    }
    
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    document.getElementById('packageStartDate').value = d.toISOString().split('T')[0];
}

function closeAddPackageModal() {
    document.getElementById('addPackageModal').classList.remove('active');
}

function clearPackageForm() {
    document.getElementById('packageClient').value = '';
    document.getElementById('packageName').value = '';
    document.getElementById('packageSessions').value = '10';
    document.getElementById('packagePrice').value = '';
    document.getElementById('packagePaid').value = '0';
    document.getElementById('packageStartDate').value = '';
}

async function savePackage() {
    const clientId = document.getElementById('packageClient').value;
    const name = document.getElementById('packageName').value.trim();
    const totalSessions = parseInt(document.getElementById('packageSessions').value);
    const price = parseFloat(document.getElementById('packagePrice').value);
    const paid = parseFloat(document.getElementById('packagePaid').value) || 0;
    const startDate = document.getElementById('packageStartDate').value;

    if (!clientId || !name || !totalSessions || !price) {
        alert('❌ Zorunlu alanları doldurun!');
        return;
    }

    const pkg = {
        id: 'package-' + Date.now(),
        clientId,
        name,
        totalSessions,
        remainingSessions: totalSessions,
        price,
        paidAmount: paid,
        startDate,
        status: 'active',
        createdAt: Date.now()
    };

    packages.push(pkg);
    await saveData();
    renderPackages();
    renderClients();
    updateStats();
    closeAddPackageModal();
    showNotification('Paket eklendi', 'success');
}

// ========================================
// PAYMENT MANAGEMENT (TARİH KAYMA DÜZELTİLDİ)
// ========================================

function openPaymentModal(packageId) {
    const pkg = packages.find(p => p.id === packageId);
    const client = clients.find(c => c.id === pkg.clientId);

    if (!pkg || !client) return;

    const remaining = pkg.price - pkg.paidAmount;
    
    document.getElementById('paymentPackageInfo').innerHTML = `
        <strong>${client.name}</strong><br>
        <strong>${pkg.name}</strong><br>
        <strong>Kalan Tutar:</strong> ${remaining.toFixed(2)} ₺
    `;

    document.getElementById('paymentAmount').value = remaining;
    document.getElementById('paymentPackage').value = packageId;
    document.getElementById('paymentClient').value = pkg.clientId;

    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    document.getElementById('paymentDate').value = d.toISOString().split('T')[0];

    document.getElementById('paymentModal').classList.add('active');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

async function savePayment() {
    const packageId = document.getElementById('paymentPackage').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const date = document.getElementById('paymentDate').value;
    const method = document.getElementById('paymentMethod').value;

    if (!packageId || !amount || !date) {
        alert('❌ Zorunlu alanları doldurun!');
        return;
    }

    const pkg = packages.find(p => p.id === packageId);

    const payment = {
        id: 'payment-' + Date.now(),
        packageId,
        clientId: pkg.clientId,
        amount,
        date,
        method,
        createdAt: Date.now()
    };

    payments.push(payment);
    pkg.paidAmount += amount;

     const client = clients.find(c => c.id === pkg.clientId);
    if (client) {
        const currentPaid = client.totalPaid || 0;
        client.totalPaid = currentPaid + amount;
    }

    await saveData();
    renderPackages();
    renderFinance();
    renderClients();
    closePaymentModal();
    showNotification('Ödeme kaydedildi', 'success');
}

// ========================================
// RENDERING (Aynı)
// ========================================

function renderClients() {
    const container = document.getElementById('clientsList');
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();

    let filtered = clients;
    if (search) {
        filtered = filtered.filter(c =>
            c.name.toLowerCase().includes(search) || c.phone.includes(search)
        );
    }

    document.getElementById('clientCount').textContent = filtered.length;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 60px; margin-bottom: 20px;">👤</div>
                <p>Henüz danışan eklenmemiş</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(client => {
        // Eski kayıtlarda eksikse default ver
        const status = client.status || 'active';
        const messages = client.messages || [];

        const clientSessions = sessions
            .filter(s => s.clientId === client.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        const clientPackages = packages.filter(p => p.clientId === client.id);
        const activePackage = clientPackages.find(p => p.status === 'active');
        const clientPayments = payments.filter(p => p.clientId === client.id);

        const totalPackageValue = clientPackages.reduce((sum, p) => sum + p.price, 0);
        const totalPaid = (client.totalPaid != null
            ? client.totalPaid
            : clientPayments.reduce((sum, p) => sum + p.amount, 0)
        );
        const totalDebt = totalPackageValue - totalPaid;

        const createdAtStr = client.createdAt
            ? new Date(client.createdAt).toLocaleDateString('tr-TR')
            : '-';

        const lastSessionDate = clientSessions.length
            ? new Date(clientSessions[0].date).toLocaleDateString('tr-TR')
            : '-';

        const lastMessage = messages.length ? messages[messages.length - 1] : null;

        const statusLabel = status === 'frozen' ? 'Donduruldu' : 'Aktif';
        const statusClass = status === 'frozen' ? 'badge badge-frozen' : 'badge badge-active';

        return `
            <div class="client-card">
                <div class="client-header">
                    <div class="client-info">
                        <h3 onclick="openClientDetail('${client.id}')" style="cursor:pointer;">
    ${client.name}
    <span class="${statusClass}">${statusLabel}</span>
</h3>

                        <div class="client-details">
                            <div>📱 ${client.phone}</div>
                            ${client.email ? `<div>📧 ${client.email}</div>` : ''}
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 12px; color: #666;">
                        <div>📅 Kayıt: ${createdAtStr}</div>
                        <div>🧭 Son seans: ${lastSessionDate}</div>
                        <div>📊 Toplam seans: ${clientSessions.length}</div>
                    </div>
                </div>

                <div class="client-summary-grid">
                    <div>
                        <div class="client-summary-label">Toplam Paket Tutarı</div>
                        <div class="client-summary-value">${totalPackageValue.toFixed(2)} ₺</div>
                    </div>
                    <div>
                        <div class="client-summary-label">Toplam Ödenen</div>
                        <div class="client-summary-value">${totalPaid.toFixed(2)} ₺</div>
                    </div>
                    <div>
                        <div class="client-summary-label">Kalan Borç</div>
                        <div class="client-summary-value ${totalDebt > 0 ? 'debt' : ''}">
                            ${totalDebt.toFixed(2)} ₺
                        </div>
                    </div>
                    <div>
                        <div class="client-summary-label">Aktif Paket</div>
                        <div class="client-summary-value">
                            ${clientPackages.some(p => p.status === 'active') ? 'Var' : 'Yok'}
                        </div>
                    </div>
                    <div>
                    <div class="client-summary-label">Kullandığı Paket</div>
                        <div class="client-summary-value">
                           ${activePackage ? activePackage.name + " (" + activePackage.remainingSessions + " seans kaldı)" : "Yok"}
                        </div>
                    </div>
                </div>

                ${client.complaints
                    ? `<p style="color: #666; font-size: 13px;"><strong>Şikayetler:</strong> ${client.complaints}</p>`
                    : ''}
                ${client.notes
                    ? `<p style="color: #666; font-size: 13px;"><strong>Notlar:</strong> ${client.notes}</p>`
                    : ''}
                ${lastMessage
                    ? `<p class="client-last-message"><strong>Son Not:</strong> ${lastMessage.text}</p>`
                    : ''}

                <div class="btn-group" style="margin-top: 15px;">
                    <button class="btn btn-success btn-small" onclick="openAddSessionModal('${client.id}')">
                        ➕ Seans
                    </button>
                    <button class="btn btn-small" onclick="openAddPackageModal('${client.id}')">
                        📦 Paket
                    </button>
                    <button class="btn btn-small" onclick="addClientMessage('${client.id}')">
                        💬 Not Ekle
                    </button>
                    <button class="btn btn-small" onclick="toggleClientStatus('${client.id}')">
                        ${status === 'frozen' ? 'Aktifleştir' : 'Dondur'}
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deleteClient('${client.id}')">
                        🗑️ Sil
                    </button>
                </div>
            </div>
        `;
    }).join('');
   

function closeClientDetailModal() {
    const modal = document.getElementById("clientDetailModal");
    if (modal) modal.classList.remove("active");
}

}
function openClientDetail(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const clientSessions = sessions
        .filter(s => s.clientId === clientId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const clientPackages = packages.filter(p => p.clientId === clientId);
    const clientPayments = payments.filter(p => p.clientId === clientId);

    let html = `
        <p><strong>Telefon:</strong> ${client.phone}</p>
        ${client.email ? `<p><strong>E-posta:</strong> ${client.email}</p>` : ''}
        <p><strong>Kayıt Tarihi:</strong> ${
            client.createdAt ? new Date(client.createdAt).toLocaleDateString('tr-TR') : '-'
        }</p>

        <h3>📦 Paketler</h3>
        ${
            clientPackages.length
                ? `<ul>` + clientPackages.map(p => `
                    <li>${p.name} - ${p.remainingSessions} / ${p.totalSessions} seans - ${p.price} ₺</li>
                  `).join('') + `</ul>`
                : `<p>Bu danışana kayıtlı paket yok.</p>`
        }

        <h3>📅 Seanslar</h3>
        ${
            clientSessions.length
                ? `<ul>` + clientSessions.map(s => `
                    <li>${s.date} ${s.time} - ${s.type} (${s.duration} dk)</li>
                  `).join('') + `</ul>`
                : `<p>Bu danışanın seansı yok.</p>`
        }

        <h3>💰 Ödemeler</h3>
        ${
            clientPayments.length
                ? `<ul>` + clientPayments.map(pay => `
                    <li>${pay.date} - ${pay.amount} ₺ (${pay.method || 'Belirtilmemiş'})</li>
                  `).join('') + `</ul>`
                : `<p>Bu danışana ait ödeme kaydı yok.</p>`
        }
    `;

    const titleEl = document.getElementById("clientDetailTitle");
    const bodyEl = document.getElementById("clientDetailBody");
    const modal = document.getElementById("clientDetailModal");

    if (!modal || !titleEl || !bodyEl) return;

    titleEl.innerHTML = client.name;
    bodyEl.innerHTML = html;
    modal.classList.add("active");
}

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                       'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    document.getElementById('calendarMonth').textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - (firstDay.getDay() || 7) + 1);

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const dayHeaders = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });

    const currentDate = new Date(startDate);
    for (let i = 0; i < 42; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        
        if (currentDate.getMonth() !== month) {
            dayDiv.classList.add('other-month');
        }
        
        const today = new Date();
        if (currentDate.toDateString() === today.toDateString()) {
            dayDiv.classList.add('today');
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = currentDate.getDate();
        dayDiv.appendChild(dayNumber);

        const dateStr =
    currentDate.getFullYear() + '-' +
    String(currentDate.getMonth() + 1).padStart(2, '0') + '-' +
    String(currentDate.getDate()).padStart(2, '0');

        const daySessions = sessions.filter(s => s.date === dateStr);

        daySessions.forEach(session => {
            const client = clients.find(c => c.id === session.clientId);
            if (client) {
                const eventDiv = document.createElement('div');
                eventDiv.className = 'calendar-event';
                eventDiv.textContent = `${session.time} ${client.name.split(' ')[0]}`;
                eventDiv.title = `${client.name} - ${session.type} (${session.duration} dk)`;
                dayDiv.appendChild(eventDiv);
            }
        });

        grid.appendChild(dayDiv);
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
}

function goToToday() {
    currentCalendarDate = new Date();
    renderCalendar();
}

function renderPackages() {
    const container = document.getElementById('packagesList');
    
    if (clients.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">Paket yok</div>';
        return;
    }

    container.innerHTML = clients.map(client => {
        const clientPackages = packages.filter(p => p.clientId === client.id);
        if (clientPackages.length === 0) return '';
        
        return `
            <div class="client-card">
                <h3>${client.name}</h3>
                ${clientPackages.map(pkg => {
                    const used = pkg.totalSessions - pkg.remainingSessions;
                    const progress = (used / pkg.totalSessions) * 100;
                    const remaining = pkg.price - pkg.paidAmount;
                    
                    return `
                        <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                            <strong>${pkg.name}</strong> <span style="color: #10b981;">${pkg.status === 'active' ? '✓ Aktif' : 'Tamamlandı'}</span><br>
                            📊 Kullanılan: ${used}/${pkg.totalSessions} seans<br>
                            💳 Ödenen: ${pkg.paidAmount.toFixed(2)} / ${pkg.price.toFixed(2)} ₺
                            ${remaining > 0 ? `<span style="color: #ef4444;"> (Kalan: ${remaining.toFixed(2)} ₺)</span>` : ''}
                            <br>
                            ${remaining > 0 ? `<button class="btn btn-success btn-small" onclick="openPaymentModal('${pkg.id}')">💰 Ödeme Al</button>` : ''}
                            <button class="btn btn-danger btn-small" onclick="deletePackage('${pkg.id}')">🗑️ Sil</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }).filter(html => html).join('');
}
function calculateMonthlyIncome() {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const monthlyPayments = payments.filter(pay => {
        const d = new Date(pay.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    const total = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    return { total, list: monthlyPayments };
}
function openFinanceModal(title, content) {
    const modal = document.getElementById("financeModal");
    const titleEl = document.getElementById("financeModalTitle");
    const bodyEl = document.getElementById("financeModalBody");

    if (!modal || !titleEl || !bodyEl) return;

    titleEl.innerHTML = title;
    bodyEl.innerHTML = content;
    modal.classList.add("active");
}

function closeFinanceModal() {
    const modal = document.getElementById("financeModal");
    if (modal) modal.classList.remove("active");
}
function openMonthlyIncome() {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const monthlyPayments = payments.filter(pay => {
        const d = new Date(pay.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    const total = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    let html = `
        <p><strong>Bu Ay Toplam:</strong> ${total.toFixed(2)} ₺</p>
        <table class="finance-table">
            <thead>
                <tr>
                    <th>Tarih</th>
                    <th>Danışan</th>
                    <th>Tutar</th>
                </tr>
            </thead>
            <tbody>
    `;

    monthlyPayments.forEach(p => {
        const client = clients.find(c => c.id === p.clientId);
        html += `
            <tr>
                <td>${p.date}</td>
                <td>${client ? client.name : '-'}</td>
                <td>${p.amount.toFixed(2)} ₺</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    openFinanceModal("📅 Bu Ayın Geliri", html);
}
function openTotalIncome() {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);

    let html = `
        <p><strong>Toplam Gelir:</strong> ${total.toFixed(2)} ₺</p>
        <table class="finance-table">
            <thead>
                <tr>
                    <th>Tarih</th>
                    <th>Danışan</th>
                    <th>Tutar</th>
                </tr>
            </thead>
            <tbody>
    `;

    payments.forEach(p => {
        const client = clients.find(c => c.id === p.clientId);
        html += `
            <tr>
                <td>${p.date}</td>
                <td>${client ? client.name : '-'}</td>
                <td>${p.amount.toFixed(2)} ₺</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    openFinanceModal("💰 Tüm Gelirler", html);
}
function openPendingPayments() {
    const pending = packages
        .map(p => ({
            name: clients.find(c => c.id === p.clientId)?.name || '-',
            pkg: p.name,
            debt: (p.price || 0) - (p.paidAmount || 0)
        }))
        .filter(x => x.debt > 0);

    if (pending.length === 0) {
        openFinanceModal("⚠️ Bekleyen Ödemeler", "<p>Bekleyen ödeme yok.</p>");
        return;
    }

    let html = `
        <table class="finance-table">
            <thead>
                <tr>
                    <th>Danışan</th>
                    <th>Paket</th>
                    <th>Kalan Borç</th>
                </tr>
            </thead>
            <tbody>
    `;

    pending.forEach(p => {
        html += `
            <tr>
                <td>${p.name}</td>
                <td>${p.pkg}</td>
                <td>${p.debt.toFixed(2)} ₺</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    openFinanceModal("⚠️ Bekleyen Ödemeler", html);
}

function renderFinance() {
    const now = new Date();
    const thisMonth = payments.filter(p => {
        const paymentDate = new Date(p.date);
        return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
    });

    const monthlyIncome = thisMonth.reduce((sum, p) => sum + p.amount, 0);
    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDebt = packages.reduce((sum, p) => sum + (p.price - p.paidAmount), 0);

    document.getElementById('monthlyIncome').textContent = monthlyIncome.toFixed(2) + ' ₺';
    document.getElementById('totalIncome').textContent = totalIncome.toFixed(2) + ' ₺';
    document.getElementById('totalDebt').textContent = totalDebt.toFixed(2) + ' ₺';

    const container = document.getElementById('paymentHistory');
    const recent = payments.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

    if (recent.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">Ödeme yok</div>';
        return;
    }

    container.innerHTML = recent.map(payment => {
        const client = clients.find(c => c.id === payment.clientId);
        const pkg = packages.find(p => p.id === payment.packageId);
        
        return `
            <div style="padding: 15px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between;">
                <div>
                    <strong>${client ? client.name : 'Bilinmeyen'}</strong><br>
                    ${new Date(payment.date).toLocaleDateString('tr-TR')} • ${payment.method}<br>
                    ${pkg ? `<small>${pkg.name}</small>` : ''}
                </div>
                <strong style="color: #10b981;">+${payment.amount.toFixed(2)} ₺</strong>
            </div>
        `;
        
    }).join('');
}

function updateStats() {
    document.getElementById('totalClients').textContent = clients.length;
    document.getElementById('totalSessions').textContent = sessions.length;
    document.getElementById('activePackages').textContent = packages.filter(p => p.status === 'active').length;
    
    const now = new Date();
    const thisMonth = sessions.filter(s => {
        const sessionDate = new Date(s.date);
        return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
    }).length;
    
    document.getElementById('thisMonthSessions').textContent = thisMonth;
}

// ========================================
// UTILITIES
// ========================================

function clearFilters() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    renderClients();
}

// Modal dışına tıklandığında kapat
window.onclick = function(event) {
    const modals = ['addClientModal', 'addSessionModal', 'addPackageModal', 'paymentModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
}

console.log('✅ app.js yüklendi ve hazır');
// ================================
// GLOBAL'E AÇILAN FONKSİYONLAR
// ================================
window.logoutUser = function () {
    if (confirm("Çıkış yapmak istiyor musunuz?")) {
        localStorage.removeItem('current-user');
        window.location.href = "login.html";
    }
}

window.switchTab = switchTab;

window.openAddClientModal = openAddClientModal;
window.closeAddClientModal = closeAddClientModal;

window.openAddSessionModal = openAddSessionModal;
window.closeAddSessionModal = closeAddSessionModal;

window.openAddPackageModal = openAddPackageModal;
window.closeAddPackageModal = closeAddPackageModal;

window.openPaymentModal = openPaymentModal;
window.closePaymentModal = closePaymentModal;

window.saveClient = saveClient;
window.saveSession = saveSession;
window.savePackage = savePackage;
window.savePayment = savePayment;

window.deleteClient = deleteClient;
window.deleteSession = deleteSession;
window.deletePackage = deletePackage;

window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.goToToday = goToToday;

window.clearFilters = clearFilters;
window.logout = logout;

window.addClientMessage = addClientMessage;
window.toggleClientStatus = toggleClientStatus;

window.openMonthlyIncome = openMonthlyIncome;
window.openTotalIncome = openTotalIncome;
window.openPendingPayments = openPendingPayments;
window.openFinanceModal = openFinanceModal;
window.closeFinanceModal = closeFinanceModal;

window.openClientDetail = openClientDetail;
window.closeClientDetailModal = closeClientDetailModal;

