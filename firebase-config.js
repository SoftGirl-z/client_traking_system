// firebase-config.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Danışan ekleme
async function addClientToFirebase(clientData) {
    try {
        const docRef = await addDoc(collection(db, 'clients'), {
            ...clientData,
            userId: auth.currentUser.uid,
            createdAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        console.error('Hata:', error);
    }
}

// Danışanları getirme
async function getClientsFromFirebase() {
    const q = query(
        collection(db, 'clients'),
        where('userId', '==', auth.currentUser.uid)
    );
    
    const querySnapshot = await getDocs(q);
    const clients = [];
    querySnapshot.forEach((doc) => {
        clients.push({ id: doc.id, ...doc.data() });
    });
    return clients;
}

// Otomatik senkronizasyon
function enableAutoSync() {
    // Her 5 dakikada bir sync
    setInterval(async () => {
        if (navigator.onLine) {
            await syncData();
        }
    }, 300000);
}

async function syncData() {
    // Local değişiklikleri cloud'a gönder
    const localChanges = await getLocalChanges();
    for (const change of localChanges) {
        await pushToCloud(change);
    }
    
    // Cloud'dan güncellemeleri al
    const cloudUpdates = await pullFromCloud();
    await applyUpdates(cloudUpdates);
}