/**
 * Gelişmiş Veri Yönetim Sistemi
 * IndexedDB + LocalStorage kombinasyonu
 */

class StorageManager {
    constructor() {
        this.dbName = 'PhysioTrackerDB';
        this.dbVersion = 2;
        this.db = null;
        this.syncQueue = [];
    }

    // IndexedDB'yi başlat
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('IndexedDB açılamadı:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✓ IndexedDB başarıyla başlatıldı');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Clients store
                if (!db.objectStoreNames.contains('clients')) {
                    const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
                    clientStore.createIndex('name', 'name', { unique: false });
                    clientStore.createIndex('phone', 'phone', { unique: false });
                    clientStore.createIndex('userId', 'userId', { unique: false });
                    clientStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                
                // Sessions store
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
                    sessionStore.createIndex('clientId', 'clientId', { unique: false });
                    sessionStore.createIndex('date', 'date', { unique: false });
                    sessionStore.createIndex('userId', 'userId', { unique: false });
                    sessionStore.createIndex('type', 'type', { unique: false });
                }
                
                // Packages store
                if (!db.objectStoreNames.contains('packages')) {
                    const packageStore = db.createObjectStore('packages', { keyPath: 'id' });
                    packageStore.createIndex('clientId', 'clientId', { unique: false });
                    packageStore.createIndex('userId', 'userId', { unique: false });
                    packageStore.createIndex('status', 'status', { unique: false });
                }
                
                // Payments store
                if (!db.objectStoreNames.contains('payments')) {
                    const paymentStore = db.createObjectStore('payments', { keyPath: 'id' });
                    paymentStore.createIndex('packageId', 'packageId', { unique: false });
                    paymentStore.createIndex('clientId', 'clientId', { unique: false });
                    paymentStore.createIndex('userId', 'userId', { unique: false });
                    paymentStore.createIndex('date', 'date', { unique: false });
                }

                // Users store
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id' });
                    userStore.createIndex('email', 'email', { unique: true });
                }

                console.log('✓ Veritabanı şeması oluşturuldu');
            };
        });
    }

    // Kullanıcı ID'sini al
    getUserId() {
        return currentUser ? currentUser.id : 'guest';
    }

    // Veri ekleme
    async add(storeName, data) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            try {
                const tx = this.db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                
                // Kullanıcı ID'sini ve timestamp ekle
                data.userId = this.getUserId();
                data.updatedAt = new Date().toISOString();
                
                const request = store.add(data);
                
                request.onsuccess = () => {
                    console.log(`✓ ${storeName} eklendi:`, data.id);
                    resolve(data);
                };
                
                request.onerror = () => {
                    console.error(`✗ ${storeName} eklenemedi:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    // Veri güncelleme
    async update(storeName, data) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            try {
                const tx = this.db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                
                data.updatedAt = new Date().toISOString();
                
                const request = store.put(data);
                
                request.onsuccess = () => {
                    console.log(`✓ ${storeName} güncellendi:`, data.id);
                    resolve(data);
                };
                
                request.onerror = () => {
                    console.error(`✗ ${storeName} güncellenemedi:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    // Tek veri getirme
    async get(storeName, id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            try {
                const tx = this.db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const request = store.get(id);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Tüm verileri getirme
    async getAll(storeName) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            try {
                const tx = this.db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const index = store.index('userId');
                const userId = this.getUserId();
                
                const request = index.getAll(userId);
                
                request.onsuccess = () => {
                    console.log(`✓ ${storeName} verileri alındı:`, request.result.length);
                    resolve(request.result);
                };
                
                request.onerror = () => {
                    console.error(`✗ ${storeName} verileri alınamadı:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    // Veri silme
    async delete(storeName, id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            try {
                const tx = this.db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const request = store.delete(id);
                
                request.onsuccess = () => {
                    console.log(`✓ ${storeName} silindi:`, id);
                    resolve(true);
                };
                
                request.onerror = () => {
                    console.error(`✗ ${storeName} silinemedi:`, request.error);
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    // Gelişmiş arama
    async search(storeName, searchParams) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            try {
                const tx = this.db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const index = store.index('userId');
                const userId = this.getUserId();
                
                const request = index.openCursor(userId);
                const results = [];
                
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        const item = cursor.value;
                        let matches = true;
                        
                        // Tüm arama parametrelerini kontrol et
                        for (const [key, value] of Object.entries(searchParams)) {
                            if (item[key] && typeof item[key] === 'string') {
                                if (!item[key].toLowerCase().includes(value.toLowerCase())) {
                                    matches = false;
                                    break;
                                }
                            } else if (item[key] !== value) {
                                matches = false;
                                break;
                            }
                        }
                        
                        if (matches) results.push(item);
                        cursor.continue();
                    } else {
                        resolve(results);
                    }
                };
                
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Yedekleme (Export)
    async exportData() {
        try {
            const data = {
                version: this.dbVersion,
                exportDate: new Date().toISOString(),
                userId: this.getUserId(),
                clients: await this.getAll('clients'),
                sessions: await this.getAll('sessions'),
                packages: await this.getAll('packages'),
                payments: await this.getAll('payments')
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], 
                { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `physio-backup-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('Veriler başarıyla dışa aktarıldı!', 'success');
            return true;
        } catch (error) {
            console.error('Dışa aktarma hatası:', error);
            showNotification('Dışa aktarma sırasında hata oluştu!', 'error');
            return false;
        }
    }

    // İçe aktarma (Import)
    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Veri doğrulama
                    if (!data.version || !data.clients) {
                        throw new Error('Geçersiz yedekleme dosyası');
                    }
                    
                    // Mevcut verileri temizle (opsiyonel)
                    const clearFirst = confirm('Mevcut verileri silmek ister misiniz? (Hayır seçerseniz veriler birleştirilir)');
                    
                    if (clearFirst) {
                        await this.clearAllData();
                    }
                    
                    // Verileri içe aktar
                    let imported = 0;
                    
                    for (const client of data.clients || []) {
                        try {
                            await this.add('clients', client);
                            imported++;
                        } catch (e) {
                            console.warn('Müşteri atlandı:', client.id);
                        }
                    }
                    
                    for (const session of data.sessions || []) {
                        try {
                            await this.add('sessions', session);
                            imported++;
                        } catch (e) {
                            console.warn('Seans atlandı:', session.id);
                        }
                    }
                    
                    for (const pkg of data.packages || []) {
                        try {
                            await this.add('packages', pkg);
                            imported++;
                        } catch (e) {
                            console.warn('Paket atlandı:', pkg.id);
                        }
                    }
                    
                    for (const payment of data.payments || []) {
                        try {
                            await this.add('payments', payment);
                            imported++;
                        } catch (e) {
                            console.warn('Ödeme atlandı:', payment.id);
                        }
                    }
                    
                    showNotification(`${imported} kayıt başarıyla içe aktarıldı!`, 'success');
                    resolve(imported);
                } catch (error) {
                    console.error('İçe aktarma hatası:', error);
                    showNotification('İçe aktarma sırasında hata oluştu!', 'error');
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    // Tüm verileri temizle
    async clearAllData() {
        const stores = ['clients', 'sessions', 'packages', 'payments'];
        
        for (const storeName of stores) {
            const items = await this.getAll(storeName);
            for (const item of items) {
                await this.delete(storeName, item.id);
            }
        }
        
        console.log('✓ Tüm veriler temizlendi');
    }

    // Veritabanı istatistikleri
    async getStats() {
        const stats = {
            clients: (await this.getAll('clients')).length,
            sessions: (await this.getAll('sessions')).length,
            packages: (await this.getAll('packages')).length,
            payments: (await this.getAll('payments')).length,
            totalSize: await this.estimateSize()
        };
        
        return stats;
    }

    // Tahmini boyut
    async estimateSize() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: (estimate.usage / 1024 / 1024).toFixed(2) + ' MB',
                quota: (estimate.quota / 1024 / 1024).toFixed(2) + ' MB',
                percent: ((estimate.usage / estimate.quota) * 100).toFixed(1) + '%'
            };
        }
        return null;
    }
}

// Global instance
const storageManager = new StorageManager();