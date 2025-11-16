🥼 Danışan Takip Sistemi

Fizyoterapi • Reformer Pilates • Yoga • Klinikler için Akıllı Yönetim Sistemi

Modern klinikler, fizyoterapi merkezleri ve pilates/yoga stüdyoları için tasarlanmış, web tabanlı bir Danışan Takip & Randevu Yönetim Sistemi.

Bu uygulama ile:
✔ Danışan kaydı tutabilir
✔ Seans planlayabilir
✔ Paket oluşturabilir
✔ Ödeme takibi yapabilir
✔ Firebase ile bulutta güvenli şekilde veri saklayabilir
✔ Mobil cihazlarda uygulama gibi kullanabilirsiniz (PWA)

🚀 Özellikler
👥 Danışan Yönetimi

Yeni danışan ekleme

Telefon, e-posta, notlar, detaylı profil

Danışan geçmişi görüntüleme

Arama & filtreleme

📅 Seans Yönetimi

Tarih + saat seçerek hızlı seans ekleme

Takvim görünümü (aylık)

Seans türleri: Fizyoterapi, Pilates, Yoga, Mat Pilates

Otomatik renk kodlaması

📦 Paket Yönetimi

Kişiye özel paket oluşturma

Toplam seans / kalan seans

Paket ilerleme barı (%)

Ödeme durumu (tamamlandı / borç var)

💰 Finansal Takip

Aylık gelir

Toplam gelir

Bekleyen ödemeler

Son ödemeler listesi

🔐 Güvenli Kullanıcı Sistemi (Firebase Auth)

Email/Password ile giriş

Her kullanıcının verileri tamamen ayrı (userId izolasyonu)

Firestore Security Rules ile güvenli yapı

☁️ Bulut Tabanlı Veri Saklama (Firestore)

Danışanlar

Seanslar

Paketler

Ödemeler

Hepsi Firebase’de güvenle saklanır.

📱 PWA Desteği

Ana ekrana ekleyerek uygulama gibi kullanabilme

Offline destek (IndexedDB + Cache)

🛠 Teknolojiler
Teknoloji	Kullanım
HTML / CSS / JS	Arayüz ve uygulama mantığı
Firebase Authentication	Kullanıcı girişi / kayıt
Firestore Database	Danışan, seans, paket, ödeme verileri
IndexedDB	Offline kullanım / Cache
PWA	Uygulama olarak kullanılabilir offline yapı
Chart.js (opsiyonel)	Grafiksel analizler
Service Worker	Cache yönetimi
📂 Proje Yapısı
├── index.html
├── login.html
├── style.css
├── app.js
├── firebase-config.js
├── storage-manager.js
├── notifications.js
├── export.js
├── service-worker.js
└── manifest.json

⚙️ Kurulum
1️⃣ Projeyi klonla:
git clone https://github.com/USERNAME/DanisanTakipSistemi.git

2️⃣ Firebase ayarlarını yap

firebase-config.js içindeki yapılandırmayı kendi Firebase projenle değiştir:

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};

3️⃣ Authentication → Email/Password Enable

Firebase Console → Build → Authentication → Sign-in Method

4️⃣ Firestore → kuralları uygula

Rules sekmesine:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{docId} {
      allow read, write: if
        request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }
  }
}

5️⃣ Uygulamayı başlat

VSCode → Live Server

veya

npx serve

📦 Geliştirilmesi Planlanan Özellikler

Online randevu ekranı (müşterilerin kendilerinin randevu seçmesi)

Çoklu çalışan ekleme (birden fazla fizyoterapist)

Stripe / İyzico ile üyelik sistemi (Basic – Pro – Elite)

WhatsApp API ile otomatik seans hatırlatma

PDF danışan raporu

Mobil uygulama (Capacitor ile)

📸 Ekran Görüntüleri

<img width="1121" height="690" alt="image" src="https://github.com/user-attachments/assets/68a97219-f4c7-4ad9-9339-16744820d9be" />

<img width="525" height="781" alt="image" src="https://github.com/user-attachments/assets/ca517391-5c85-4842-8ace-94a73ea76d3c" />


❤️ Katkı

Pull request’e açıktır. Sorular için issue açabilirsiniz.

📄 Lisans

MIT Lisansı.
