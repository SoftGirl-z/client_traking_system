// notifications.js

function sendWhatsAppReminder(client, session) {
    const message = encodeURIComponent(
        `Merhaba ${client.name},\n\n` +
        `${new Date(session.date).toLocaleDateString('tr-TR')} tarihinde ` +
        `saat ${session.time}'da ${session.type} seansınız bulunmaktadır.\n\n` +
        `İyi günler dileriz.`
    );
    
    window.open(`https://wa.me/${client.phone}?text=${message}`, '_blank');
}

function sendSMSReminder(client, session) {
    const message = `Sayın ${client.name}, ${new Date(session.date).toLocaleDateString('tr-TR')} saat ${session.time} seansınızı hatırlatırız.`;
    
    // SMS API entegrasyonu (Twilio, MessageBird vb.)
    fetch('https://api.example.com/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            to: client.phone,
            message: message
        })
    });
}