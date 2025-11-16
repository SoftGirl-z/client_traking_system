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
    
    // window.storage hazır mı kontrol et
    if (!window.storage) {
        console.error('❌ HATA: window.storage tanımlanmamış! storage-manager.js yüklenmiş mi?');
        alert('⚠️ Hata: Storage sistemi hazırlanmıyor. Sayfayı yenile.');
        return;
    }
    
    console.log('✅ window.storage hazır');
    
    // Başlat
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
            console.log('✅ Kullanıcı giriş yaptı:', currentUser.name);
        } else {
            document.getElementById('userDisplay').style.display = 'none';
            document.getElementById('guestDisplay').style.display = 'flex';
        }
    } catch (error) {
        console.error('Login kontrol hatası:', error);
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
        
        console.log(`✅ Veri yüklendi: ${clients.length} danışan, ${sessions.length} seans`);
    } catch (error) {
        console.log('💡 İlk kullanım - veri yok:', error.message);
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
        console.log('✅ Veri kaydedildi');
    } catch (error) {
        console.error('❌ Kayıt hatası:', error);
        alert('Veri kaydedilirken hata: ' + error.message);
    }
}

// ========================================
// FORM INITIALIZATION
// ========================================

function initializeForm() {
    // Select'leri doldur
    updateClientSelects();
    
    // Tarih alanlarını bugüne ayarla
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sessionDate').value = today;
    document.getElementById('packageStartDate').value = today;
    document.getElementById('paymentDate').value = today;
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
    // Tab'ları pasif yap
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Tıklanan tab'ı aktif yap
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
        name: name,
        phone: phone,
        email: email,
        complaints: complaints,
        notes: notes,
        createdAt: new Date().toISOString()
    };

    clients.push(client);
    await saveData();
    renderClients();
    updateStats();
    updateClientSelects();
    closeAddClientModal();
    showNotification('Danışan eklendi', 'success');
}

function deleteClient(clientId) {
    if (!confirm('Bu danışanı silmek istediğinizden emin misiniz?')) return;
    
    clients = clients.filter(c => c.id !== clientId);
    sessions = sessions.filter(s => s.clientId !== clientId);
    packages = packages.filter(p => p.clientId !== clientId);
    
    saveData();
    renderClients();
    updateStats();
    showNotification('Danışan silindi', 'success');
}

// ========================================
// SESSION MANAGEMENT
// ========================================

function openAddSessionModal() {
    document.getElementById('addSessionModal').classList.add('active');
    clearSessionForm();
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sessionDate').value = today;
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
        clientId: clientId,
        date: date,
        time: time,
        type: type,
        duration: duration,
        notes: notes,
        createdAt: new Date().toISOString()
    };

    sessions.push(session);
    
    // Paket seans sayısını azalt
    const pkg = packages.find(p => p.clientId === clientId && p.status === 'active');
    if (pkg && pkg.remainingSessions > 0) {
        pkg.remainingSessions -= 1;
        if (pkg.remainingSessions === 0) {
            pkg.status = 'completed';
        }
    }

    await saveData();
    renderClients();
    renderCalendar();
    updateStats();
    closeAddSessionModal();
    showNotification('Seans eklendi', 'success');
}

function deleteSession(sessionId) {
    if (!confirm('Seanı silmek istediğinizden emin misiniz?')) return;
    
    sessions = sessions.filter(s => s.id !== sessionId);
    saveData();
    renderClients();
    renderCalendar();
    updateStats();
    showNotification('Seans silindi', 'success');
}

// ========================================
// PACKAGE MANAGEMENT
// ========================================

function openAddPackageModal(clientId = null) {
    document.getElementById('addPackageModal').classList.add('active');
    clearPackageForm();
    
    if (clientId) {
        document.getElementById('packageClient').value = clientId;
    }
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('packageStartDate').value = today;
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

    if (paid > price) {
        alert('❌ Ödenen tutar toplam fiyatı geçemez!');
        return;
    }

    const pkg = {
        id: 'package-' + Date.now(),
        clientId: clientId,
        name: name,
        totalSessions: totalSessions,
        remainingSessions: totalSessions,
        price: price,
        paidAmount: paid,
        startDate: startDate,
        status: 'active',
        createdAt: new Date().toISOString()
    };

    packages.push(pkg);
    await saveData();
    renderPackages();
    renderClients();
    updateStats();
    closeAddPackageModal();
    showNotification('Paket eklendi', 'success');
}

function deletePackage(packageId) {
    if (!confirm('Paketi silmek istediğinizden emin misiniz?')) return;
    
    packages = packages.filter(p => p.id !== packageId);
    saveData();
    renderPackages();
    updateStats();
    showNotification('Paket silindi', 'success');
}

// ========================================
// PAYMENT MANAGEMENT
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

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('paymentDate').value = today;

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

    if (amount <= 0) {
        alert('❌ Tutar 0\'dan büyük olmalıdır!');
        return;
    }

    const pkg = packages.find(p => p.id === packageId);
    
    const payment = {
        id: 'payment-' + Date.now(),
        packageId: packageId,
        clientId: pkg.clientId,
        amount: amount,
        date: date,
        method: method,
        createdAt: new Date().toISOString()
    };

    payments.push(payment);
    pkg.paidAmount += amount;

    await saveData();
    renderPackages();
    renderFinance();
    renderClients();
    closePaymentModal();
    showNotification('Ödeme kaydedildi', 'success');
}

// ========================================
// RENDERING FUNCTIONS
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
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">Danışan bulunamadı</div>';
        return;
    }

    container.innerHTML = filtered.map(client => {
        const clientSessions = sessions.filter(s => s.clientId === client.id);
        const clientPackages = packages.filter(p => p.clientId === client.id);
        const totalSpent = clientPackages.reduce((sum, p) => sum + p.price, 0);

        return `
            <div class="client-card">
                <div class="client-header">
                    <div>
                        <h3>${client.name}</h3>
                        <p>📱 ${client.phone}</p>
                        ${client.email ? `<p>📧 ${client.email}</p>` : ''}
                    </div>
                    <div style="text-align: right; font-size: 12px; color: #666;">
                        📊 ${clientSessions.length} seans | 📦 ${clientPackages.length} paket | 💳 ${totalSpent.toFixed(2)} ₺
                    </div>
                </div>
                ${client.complaints ? `<p style="color: #666; font-size: 13px;"><strong>Şikayetler:</strong> ${client.complaints}</p>` : ''}
                ${client.notes ? `<p style="color: #666; font-size: 13px;"><strong>Notlar:</strong> ${client.notes}</p>` : ''}
                <div style="display: flex; gap: 8px; margin-top: 15px; flex-wrap: wrap;">
                    <button class="btn btn-success btn-small" onclick="openAddPackageModal('${client.id}')">📦 Paket Ekle</button>
                    <button class="btn btn-danger btn-small" onclick="deleteClient('${client.id}')">🗑️ Sil</button>
                </div>
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
