let clients = [];
let sessions = [];
let packages = [];
let payments = [];
let currentClientId = null;
let currentPackageId = null;
let currentUser = null;
let currentCalendarDate = new Date();

// Sayfa yüklendiğinde
window.onload = function() {
    checkLoginStatus();
    loadData();
    document.getElementById('sessionDate').valueAsDate = new Date();
    document.getElementById('packageStartDate').valueAsDate = new Date();
    document.getElementById('paymentDate').valueAsDate = new Date();
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

// Tab değiştirme
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    event.target.classList.add('active');
    
    if (tab === 'clients') {
        document.getElementById('clientsPage').classList.add('active');
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

// Veri yükleme
async function loadData() {
    const userPrefix = currentUser ? ('user-' + currentUser.email) : 'guest';
    
    try {
        const clientsData = await window.storage.get(userPrefix + '-clients');
        const sessionsData = await window.storage.get(userPrefix + '-sessions');
        const packagesData = await window.storage.get(userPrefix + '-packages');
        const paymentsData = await window.storage.get(userPrefix + '-payments');
        
        if (clientsData) clients = JSON.parse(clientsData.value);
        if (sessionsData) sessions = JSON.parse(sessionsData.value);
        if (packagesData) packages = JSON.parse(packagesData.value);
        if (paymentsData) payments = JSON.parse(paymentsData.value);
        
        renderClients();
        updateStats();
    } catch (error) {
        console.log('İlk kullanım');
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
        await window.storage.set(userPrefix + '-packages', JSON.stringify(packages));
        await window.storage.set(userPrefix + '-payments', JSON.stringify(payments));
    } catch (error) {
        console.error('Kayıt hatası:', error);
    }
}
// app.js'e ekle

// Grafik ekleme (Chart.js kullanarak)
function renderDashboardCharts() {
    // Aylık gelir grafiği
    const incomeChart = document.getElementById('incomeChart');
    if (incomeChart) {
        new Chart(incomeChart, {
            type: 'line',
            data: {
                labels: getLast6Months(),
                datasets: [{
                    label: 'Gelir',
                    data: getMonthlyIncomeData(),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

// Bildirim sistemi
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✓' : '⚠'}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Arama önerileri (autocomplete)
function initializeAutocomplete() {
    const searchInput = document.getElementById('searchInput');
    const suggestions = document.createElement('div');
    suggestions.className = 'autocomplete-suggestions';
    searchInput.parentNode.appendChild(suggestions);
    
    searchInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        if (value.length < 2) {
            suggestions.innerHTML = '';
            return;
        }
        
        const matches = clients.filter(client => 
            client.name.toLowerCase().includes(value) ||
            client.phone.includes(value)
        );
        
        suggestions.innerHTML = matches.slice(0, 5).map(client => `
            <div class="suggestion-item" onclick="selectClient('${client.id}')">
                <strong>${client.name}</strong>
                <span>${client.phone}</span>
            </div>
        `).join('');
    });
}

// === DANIŞAN FONKSİYONLARI ===

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

function deleteClient(clientId) {
    if (!confirm('Bu danışanı silmek istediğinizden emin misiniz?')) return;
    
    clients = clients.filter(c => c.id !== clientId);
    sessions = sessions.filter(s => s.clientId !== clientId);
    packages = packages.filter(p => p.clientId !== clientId);
    
    saveData();
    renderClients();
    updateStats();
}

function clearFilters() {
    document.getElementById('filterStatus').value = 'all';
    document.getElementById('filterSessionType').value = 'all';
    document.getElementById('filterPayment').value = 'all';
    document.getElementById('searchInput').value = '';
    renderClients();
}

// === SEANS FONKSİYONLARI ===

function openAddSessionModal(clientId = null) {
    currentClientId = clientId;
    const modal = document.getElementById('addSessionModal');
    modal.classList.add('active');
    
    const select = document.getElementById('sessionClient');
    select.innerHTML = '<option value="">Seçiniz...</option>';
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        if (clientId && client.id === clientId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
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

function saveSession() {
    const clientId = document.getElementById('sessionClient').value || currentClientId;
    
    if (!clientId) {
        alert('Lütfen bir danışan seçin!');
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
        clientId: clientId,
        date: date,
        time: time,
        type: document.getElementById('sessionType').value,
        notes: document.getElementById('sessionNotes').value.trim(),
        createdAt: new Date().toISOString()
    };

    sessions.push(newSession);
    
    // Paketten seans düş
    const activePackage = packages.find(p => p.clientId === clientId && p.status === 'active');
    if (activePackage && activePackage.remainingSessions > 0) {
        activePackage.remainingSessions--;
        if (activePackage.remainingSessions === 0) {
            activePackage.status = 'completed';
        }
    }
    
    saveData();
    renderClients();
    updateStats();
    closeAddSessionModal();
    alert('Seans başarıyla eklendi!');
}

function deleteSession(sessionId) {
    if (!confirm('Bu seansı silmek istediğinizden emin misiniz?')) return;
    
    sessions = sessions.filter(s => s.id !== sessionId);
    saveData();
    renderClients();
    updateStats();
}

// === PAKET FONKSİYONLARI ===

function openAddPackageModal(clientId = null) {
    const modal = document.getElementById('addPackageModal');
    modal.classList.add('active');
    
    const select = document.getElementById('packageClient');
    select.innerHTML = '<option value="">Seçiniz...</option>';
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        if (clientId && client.id === clientId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    document.getElementById('packageStartDate').valueAsDate = new Date();
}

function closeAddPackageModal() {
    document.getElementById('addPackageModal').classList.remove('active');
    document.getElementById('packageName').value = '';
    document.getElementById('packageSessions').value = '10';
    document.getElementById('packagePrice').value = '';
    document.getElementById('packagePaid').value = '0';
}

function savePackage() {
    const clientId = document.getElementById('packageClient').value;
    const name = document.getElementById('packageName').value.trim();
    const totalSessions = parseInt(document.getElementById('packageSessions').value);
    const price = parseFloat(document.getElementById('packagePrice').value);
    const paidAmount = parseFloat(document.getElementById('packagePaid').value) || 0;

    if (!clientId || !name || !totalSessions || !price) {
        alert('Lütfen zorunlu alanları doldurun!');
        return;
    }

    const newPackage = {
        id: Date.now().toString(),
        clientId: clientId,
        name: name,
        totalSessions: totalSessions,
        remainingSessions: totalSessions,
        price: price,
        paidAmount: paidAmount,
        startDate: document.getElementById('packageStartDate').value,
        status: 'active',
        createdAt: new Date().toISOString()
    };

    packages.push(newPackage);

    if (paidAmount > 0) {
        const payment = {
            id: Date.now().toString(),
            packageId: newPackage.id,
            clientId: clientId,
            amount: paidAmount,
            date: newPackage.startDate,
            method: 'Nakit',
            note: 'İlk ödeme',
            createdAt: new Date().toISOString()
        };
        payments.push(payment);
    }

    saveData();
    closeAddPackageModal();
    renderClients();
    renderPackages();
    updateStats();
    alert('Paket başarıyla eklendi!');
}

function deletePackage(packageId) {
    if (!confirm('Bu paketi silmek istediğinizden emin misiniz?')) return;
    
    packages = packages.filter(p => p.id !== packageId);
    payments = payments.filter(p => p.packageId !== packageId);
    saveData();
    renderPackages();
    updateStats();
}

// === ÖDEME FONKSİYONLARI ===

function openPaymentModal(packageId) {
    currentPackageId = packageId;
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;

    const client = clients.find(c => c.id === pkg.clientId);
    const remaining = pkg.price - pkg.paidAmount;

    document.getElementById('paymentPackageInfo').innerHTML = `
        <strong>Danışan:</strong> ${client.name}<br>
        <strong>Paket:</strong> ${pkg.name}<br>
        <strong>Toplam:</strong> ${pkg.price.toFixed(2)} ₺<br>
        <strong>Ödenen:</strong> ${pkg.paidAmount.toFixed(2)} ₺<br>
        <strong>Kalan:</strong> <span style="color: #ef4444; font-weight: bold;">${remaining.toFixed(2)} ₺</span>
    `;

    document.getElementById('paymentAmount').value = remaining.toFixed(2);
    document.getElementById('paymentDate').valueAsDate = new Date();
    document.getElementById('paymentModal').classList.add('active');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    currentPackageId = null;
}

function savePayment() {
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    
    if (!amount || amount <= 0) {
        alert('Geçerli bir tutar girin!');
        return;
    }

    const pkg = packages.find(p => p.id === currentPackageId);
    if (!pkg) return;

    const payment = {
        id: Date.now().toString(),
        packageId: currentPackageId,
        clientId: pkg.clientId,
        amount: amount,
        date: document.getElementById('paymentDate').value,
        method: document.getElementById('paymentMethod').value,
        createdAt: new Date().toISOString()
    };

    payments.push(payment);
    pkg.paidAmount += amount;

    saveData();
    closePaymentModal();
    renderFinance();
    renderPackages();
    alert('Ödeme kaydedildi!');
}

// === RENDER FONKSİYONLARI ===

function renderClients() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const typeFilter = document.getElementById('filterSessionType').value;
    const paymentFilter = document.getElementById('filterPayment').value;

    let filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchTerm) ||
                            client.phone.includes(searchTerm);
        if (!matchesSearch) return false;

        if (statusFilter !== 'all') {
            const hasActivePackage = packages.some(p => p.clientId === client.id && p.status === 'active');
            if (statusFilter === 'active' && !hasActivePackage) return false;
            if (statusFilter === 'inactive' && hasActivePackage) return false;
        }

        if (typeFilter !== 'all') {
            const hasSessionType = sessions.some(s => s.clientId === client.id && s.type === typeFilter);
            if (!hasSessionType) return false;
        }

        if (paymentFilter !== 'all') {
            const clientPackages = packages.filter(p => p.clientId === client.id);
            const totalDebt = clientPackages.reduce((sum, p) => sum + (p.price - p.paidAmount), 0);
            if (paymentFilter === 'paid' && totalDebt > 0) return false;
            if (paymentFilter === 'debt' && totalDebt <= 0) return false;
        }

        return true;
    });

    const container = document.getElementById('clientsList');
    document.getElementById('clientCount').textContent = filteredClients.length;

    if (filteredClients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👤</div>
                <p>Henüz danışan eklenmemiş</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredClients.map(client => {
        const clientSessions = sessions
            .filter(s => s.clientId === client.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const clientPackages = packages.filter(p => p.clientId === client.id);
        const activePackage = clientPackages.find(p => p.status === 'active');
        const totalDebt = clientPackages.reduce((sum, p) => sum + (p.price - p.paidAmount), 0);

        return `
            <div class="client-card">
                <div class="client-header">
                    <div class="client-info">
                        <h3>
                            ${client.name}
                            <span class="badge">${clientSessions.length} seans</span>
                            ${activePackage ? `
                                <span class="package-badge package-active">
                                    ${activePackage.remainingSessions}/${activePackage.totalSessions} kaldı
                                </span>
                            ` : ''}
                            ${totalDebt > 0 ? `
                                <span class="payment-status payment-debt">
                                    💳 ${totalDebt.toFixed(2)} ₺ borç
                                </span>
                            ` : clientPackages.length > 0 ? `
                                <span class="payment-status payment-paid">
                                    ✓ Ödemesi tamam
                                </span>
                            ` : ''}
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
                        <button class="btn btn-primary btn-small" onclick="openAddPackageModal('${client.id}')">
                            📦 Paket
                        </button>
                        <button class="btn btn-danger btn-small" onclick="deleteClient('${client.id}')">
                            🗑️
                        </button>
                    </div>
                </div>
                
                ${clientSessions.length > 0 ? `
                    <div class="sessions-list">
                        <strong style="color: #333; display: block; margin-bottom: 10px;">
                            Son Seanslar:
                        </strong>
                        ${clientSessions.slice(0, 5).map(session => `
                            <div class="session-card">
                                <div class="session-info">
                                    <span class="session-type">${session.type}</span>
                                    <span style="margin-left: 10px; color: #666;">
                                        ${new Date(session.date).toLocaleDateString('tr-TR')} • ${session.time}
                                    </span>
                                    ${session.notes ? `
                                        <div style="color: #666; margin-top: 5px; font-size: 13px;">
                                            💬 ${session.notes}
                                        </div>
                                    ` : ''}
                                </div>
                                <button class="btn btn-danger btn-small" onclick="deleteSession('${session.id}')">
                                    🗑️
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
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

        const dateStr = currentDate.toISOString().split('T')[0];
        const daySessions = sessions.filter(s => s.date === dateStr);

        daySessions.forEach(session => {
            const client = clients.find(c => c.id === session.clientId);
            if (client) {
                const eventDiv = document.createElement('div');
                eventDiv.className = 'calendar-event';
                
                if (session.type.includes('Fizyoterapi')) {
                    eventDiv.classList.add('physio');
                } else if (session.type.includes('Pilates')) {
                    eventDiv.classList.add('pilates');
                } else if (session.type.includes('Yoga')) {
                    eventDiv.classList.add('yoga');
                }
                
                eventDiv.textContent = `${session.time} ${client.name.split(' ')[0]}`;
                eventDiv.title = `${client.name} - ${session.type}`;
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
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><p>Henüz paket yok</p></div>';
        return;
    }

    container.innerHTML = clients.map(client => {
        const clientPackages = packages.filter(p => p.clientId === client.id);
        
        if (clientPackages.length === 0) return '';
        
        return `
            <div class="client-card">
                <h3 style="margin-bottom: 15px;">${client.name}</h3>
                ${clientPackages.map(pkg => {
                    const used = pkg.totalSessions - pkg.remainingSessions;
                    const progress = (used / pkg.totalSessions) * 100;
                    const remaining = pkg.price - pkg.paidAmount;
                    
                    return `
                        <div class="package-card">
                            <div class="package-header">
                                <div>
                                    <strong>${pkg.name}</strong>
                                    <span class="badge">${pkg.status === 'active' ? 'Aktif' : 'Tamamlandı'}</span>
                                </div>
                                ${remaining > 0 ? `
                                    <button class="btn btn-success btn-small" onclick="openPaymentModal('${pkg.id}')">
                                        💰 Ödeme Al
                                    </button>
                                ` : ''}
                            </div>
                            <div style="font-size: 14px; color: #666; margin: 10px 0;">
                                📊 Kullanılan: ${used}/${pkg.totalSessions} seans
                            </div>
                            <div class="package-progress">
                                <div class="package-progress-bar ${progress > 80 ? 'danger' : progress > 50 ? 'warning' : ''}" 
                                     style="width: ${progress}%"></div>
                            </div>
                            <div style="font-size: 14px; color: #666; margin-top: 10px;">
                                💳 Ödenen: ${pkg.paidAmount.toFixed(2)} / ${pkg.price.toFixed(2)} ₺
                                ${remaining > 0 ? 
                                    `<span style="color: #ef4444; font-weight: 600;"> (Kalan: ${remaining.toFixed(2)} ₺)</span>` : 
                                    `<span style="color: #10b981; font-weight: 600;"> ✓ Tamamlandı</span>`
                                }
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }).filter(html => html).join('');
}

function renderFinance() {
    const now = new Date();
    const thisMonthPayments = payments.filter(p => {
        const paymentDate = new Date(p.date);
        return paymentDate.getMonth() === now.getMonth() && 
               paymentDate.getFullYear() === now.getFullYear();
    });

    const monthlyIncome = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDebt = packages.reduce((sum, p) => sum + (p.price - p.paidAmount), 0);

    document.getElementById('monthlyIncome').textContent = monthlyIncome.toFixed(2) + ' ₺';
    document.getElementById('totalIncome').textContent = totalIncome.toFixed(2) + ' ₺';
    document.getElementById('totalDebt').textContent = totalDebt.toFixed(2) + ' ₺';

    const container = document.getElementById('paymentHistory');
    const recentPayments = payments.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

    if (recentPayments.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Henüz ödeme yok</p></div>';
        return;
    }

    container.innerHTML = recentPayments.map(payment => {
        const client = clients.find(c => c.id === payment.clientId);
        const pkg = packages.find(p => p.id === payment.packageId);
        
        return `
            <div style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${client ? client.name : 'Bilinmeyen'}</strong>
                    <div style="font-size: 12px; color: #666;">
                        ${new Date(payment.date).toLocaleDateString('tr-TR')} • ${payment.method}
                    </div>
                    ${pkg ? `<div style="font-size: 12px; color: #666;">${pkg.name}</div>` : ''}
                </div>
                <div style="text-align: right;">
                    <strong style="color: #10b981; font-size: 18px;">+${payment.amount.toFixed(2)} ₺</strong>
                </div>
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
        return sessionDate.getMonth() === now.getMonth() && 
               sessionDate.getFullYear() === now.getFullYear();
    }).length;
    
    document.getElementById('thisMonthSessions').textContent = thisMonth;
}

// Modal dışına tıklandığında kapatma
window.onclick = function(event) {
    const modals = ['addClientModal', 'addSessionModal', 'addPackageModal', 'paymentModal']; 
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
}
