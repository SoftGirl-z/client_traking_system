// firebase-config.js
// Firebase JS SDK v10.7.1 kullanarak entegre edildi

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    doc,
    orderBy,
    limit
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAsT6vzHfChTyAXht7X2Bcl9qSi2j3KlmA",
  authDomain: "danisantakip-1150f.firebaseapp.com",
  projectId: "danisantakip-1150f",
  storageBucket: "danisantakip-1150f.firebasestorage.app",
  messagingSenderId: "1018903532193",
  appId: "1:1018903532193:web:69ec20c64286f0eefe56e0",
  measurementId: "G-PFRMNSTMV5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ============================================
// KULLANICİ İŞLEMLERİ (Authentication)
// ============================================

/**
 * Yeni kullanıcı kaydı
 * @param {string} email - Kullanıcı e-postası
 * @param {string} password - Şifre
 * @param {string} name - Kullanıcı adı (işletme adı)
 */
export async function registerUser(email, password, name) {
    try {
        // Firebase Authentication'da kayıt yap
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Firestore'da kullanıcı bilgisini kaydet
        await addDoc(collection(db, 'users'), {
            uid: user.uid,
            email: email,
            name: name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        console.log('✓ Kullanıcı kaydedildi:', user.uid);
        return user;
    } catch (error) {
        console.error('❌ Kayıt hatası:', error.message);
        throw error;
    }
}

/**
 * Kullanıcı girişi
 * @param {string} email - E-posta
 * @param {string} password - Şifre
 */
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✓ Giriş başarılı:', userCredential.user.email);
        return userCredential.user;
    } catch (error) {
        console.error('❌ Giriş hatası:', error.message);
        throw error;
    }
}

/**
 * Kullanıcı çıkışı
 */
export async function logoutUser() {
    try {
        await signOut(auth);
        console.log('✓ Çıkış yapıldı');
    } catch (error) {
        console.error('❌ Çıkış hatası:', error.message);
        throw error;
    }
}

/**
 * Giriş durumunu dinle
 * @param {function} callback - Duruma göre çalışacak fonksiyon
 */
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('👤 Kullanıcı giriş yaptı:', user.email);
            callback(user);
        } else {
            console.log('🚪 Kullanıcı çıkış yaptı');
            callback(null);
        }
    });
}

// ============================================
// DANIŞAN İŞLEMLERİ (Clients Collection)
// ============================================

/**
 * Danışan ekle
 * @param {object} clientData - Danışan bilgileri
 */
export async function addClient(clientData) {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        const docRef = await addDoc(collection(db, 'clients'), {
            ...clientData,
            userId: auth.currentUser.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        console.log('✓ Danışan eklendi:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Danışan ekleme hatası:', error.message);
        throw error;
    }
}

/**
 * Danışanları getir
 */
export async function getClients() {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        const q = query(
            collection(db, 'clients'),
            where('userId', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const clientsList = [];
        
        querySnapshot.forEach((doc) => {
            clientsList.push({
                docId: doc.id,  // Firebase'in verdiği ID
                ...doc.data()
            });
        });
        
        console.log(`✓ ${clientsList.length} danışan yüklendi`);
        return clientsList;
    } catch (error) {
        console.error('❌ Danışan getirme hatası:', error.message);
        throw error;
    }
}

/**
 * Danışan güncelle
 * @param {string} clientId - Danışan Firebase ID'si
 * @param {object} clientData - Güncellenmiş bilgiler
 */
export async function updateClient(clientId, clientData) {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        const clientRef = doc(db, 'clients', clientId);
        await updateDoc(clientRef, {
            ...clientData,
            updatedAt: new Date().toISOString()
        });
        
        console.log('✓ Danışan güncellendi:', clientId);
    } catch (error) {
        console.error('❌ Danışan güncelleme hatası:', error.message);
        throw error;
    }
}

/**
 * Danışan sil
 * @param {string} clientId - Danışan Firebase ID'si
 */
export async function deleteClient(clientId) {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        await deleteDoc(doc(db, 'clients', clientId));
        console.log('✓ Danışan silindi:', clientId);
    } catch (error) {
        console.error('❌ Danışan silme hatası:', error.message);
        throw error;
    }
}

// ============================================
// SEANS İŞLEMLERİ (Sessions Collection)
// ============================================

/**
 * Seans ekle
 * @param {object} sessionData - Seans bilgileri
 */
export async function addSession(sessionData) {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        const docRef = await addDoc(collection(db, 'sessions'), {
            ...sessionData,
            userId: auth.currentUser.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        console.log('✓ Seans eklendi:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Seans ekleme hatası:', error.message);
        throw error;
    }
}

/**
 * Seansları getir
 * @param {string} clientId - İsteğe bağlı: belirli danışanın seansları
 */
export async function getSessions(clientId = null) {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        let q;
        if (clientId) {
            q = query(
                collection(db, 'sessions'),
                where('userId', '==', auth.currentUser.uid),
                where('clientId', '==', clientId),
                orderBy('date', 'desc')
            );
        } else {
            q = query(
                collection(db, 'sessions'),
                where('userId', '==', auth.currentUser.uid),
                orderBy('date', 'desc')
            );
        }
        
        const querySnapshot = await getDocs(q);
        const sessionsList = [];
        
        querySnapshot.forEach((doc) => {
            sessionsList.push({
                docId: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✓ ${sessionsList.length} seans yüklendi`);
        return sessionsList;
    } catch (error) {
        console.error('❌ Seans getirme hatası:', error.message);
        throw error;
    }
}

/**
 * Seans güncelle
 * @param {string} sessionId - Seans Firebase ID'si
 * @param {object} sessionData - Güncellenmiş bilgiler
 */
export async function updateSession(sessionId, sessionData) {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            ...sessionData,
            updatedAt: new Date().toISOString()
        });
        
        console.log('✓ Seans güncellendi:', sessionId);
    } catch (error) {
        console.error('❌ Seans güncelleme hatası:', error.message);
        throw error;
    }
}

/**
 * Seans sil
 * @param {string} sessionId - Seans Firebase ID'si
 */
export async function deleteSession(sessionId) {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        await deleteDoc(doc(db, 'sessions', sessionId));
        console.log('✓ Seans silindi:', sessionId);
    } catch (error) {
        console.error('❌ Seans silme hatası:', error.message);
        throw error;
    }
}

// ============================================
// PAKET İŞLEMLERİ (Packages Collection)
// ============================================

/**
 * Paket ekle
 * @param {object} packageData - Paket bilgileri
 */
export async function addPackage(packageData) {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        const docRef = await addDoc(collection(db, 'packages'), {
            ...packageData,
            userId: auth.currentUser.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        console.log('✓ Paket eklendi:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Paket ekleme hatası:', error.message);
        throw error;
    }
}

/**
 * Paketleri getir
 */
export async function getPackages() {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        const q = query(
            collection(db, 'packages'),
            where('userId', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const packagesList = [];
        
        querySnapshot.forEach((doc) => {
            packagesList.push({
                docId: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✓ ${packagesList.length} paket yüklendi`);
        return packagesList;
    } catch (error) {
        console.error('❌ Paket getirme hatası:', error.message);
        throw error;
    }
}

/**
 * Paket güncelle
 * @param {string} packageId - Paket Firebase ID'si
 * @param {object} packageData - Güncellenmiş bilgiler
 */
export async function updatePackage(packageId, packageData) {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        const packageRef = doc(db, 'packages', packageId);
        await updateDoc(packageRef, {
            ...packageData,
            updatedAt: new Date().toISOString()
        });
        
        console.log('✓ Paket güncellendi:', packageId);
    } catch (error) {
        console.error('❌ Paket güncelleme hatası:', error.message);
        throw error;
    }
}

/**
 * Paket sil
 * @param {string} packageId - Paket Firebase ID'si
 */
export async function deletePackage(packageId) {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        await deleteDoc(doc(db, 'packages', packageId));
        console.log('✓ Paket silindi:', packageId);
    } catch (error) {
        console.error('❌ Paket silme hatası:', error.message);
        throw error;
    }
}

// ============================================
// ÖDEME İŞLEMLERİ (Payments Collection)
// ============================================

/**
 * Ödeme ekle
 * @param {object} paymentData - Ödeme bilgileri
 */
export async function addPayment(paymentData) {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        const docRef = await addDoc(collection(db, 'payments'), {
            ...paymentData,
            userId: auth.currentUser.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        console.log('✓ Ödeme kaydedildi:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Ödeme ekleme hatası:', error.message);
        throw error;
    }
}

/**
 * Ödemeleri getir
 */
export async function getPayments() {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        const q = query(
            collection(db, 'payments'),
            where('userId', '==', auth.currentUser.uid),
            orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const paymentsList = [];
        
        querySnapshot.forEach((doc) => {
            paymentsList.push({
                docId: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✓ ${paymentsList.length} ödeme yüklendi`);
        return paymentsList;
    } catch (error) {
        console.error('❌ Ödeme getirme hatası:', error.message);
        throw error;
    }
}

/**
 * Ödeme güncelle
 * @param {string} paymentId - Ödeme Firebase ID'si
 * @param {object} paymentData - Güncellenmiş bilgiler
 */
export async function updatePayment(paymentId, paymentData) {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        const paymentRef = doc(db, 'payments', paymentId);
        await updateDoc(paymentRef, {
            ...paymentData,
            updatedAt: new Date().toISOString()
        });
        
        console.log('✓ Ödeme güncellendi:', paymentId);
    } catch (error) {
        console.error('❌ Ödeme güncelleme hatası:', error.message);
        throw error;
    }
}

/**
 * Ödeme sil
 * @param {string} paymentId - Ödeme Firebase ID'si
 */
export async function deletePayment(paymentId) {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        await deleteDoc(doc(db, 'payments', paymentId));
        console.log('✓ Ödeme silindi:', paymentId);
    } catch (error) {
        console.error('❌ Ödeme silme hatası:', error.message);
        throw error;
    }
}

// ============================================
// VERİ YEDEKLEME VE SENKRONIZASYON
// ============================================

/**
 * Tüm verileri indir (Backup)
 */
export async function exportAllData() {
    try {
        if (!auth.currentUser) throw new Error('Kullanıcı giriş yapmamış');
        
        const clients = await getClients();
        const sessions = await getSessions();
        const packages = await getPackages();
        const payments = await getPayments();
        
        const backupData = {
            exportDate: new Date().toISOString(),
            user: auth.currentUser.email,
            data: {
                clients,
                sessions,
                packages,
                payments
            }
        };
        
        // JSON dosyası indir
        const blob = new Blob([JSON.stringify(backupData, null, 2)], 
            { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `physio-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('✓ Yedekleme indirildi');
        return backupData;
    } catch (error) {
        console.error('❌ Yedekleme hatası:', error.message);
        throw error;
    }
}

// Export Firebase instances for use in app
export { auth, db };
