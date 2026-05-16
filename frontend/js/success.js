const whatsappLink = document.getElementById('success-whatsapp-link');
const savedWhatsAppUrl = localStorage.getItem('parapharmacie_last_whatsapp_url');

if (whatsappLink && savedWhatsAppUrl) {
    whatsappLink.href = savedWhatsAppUrl;
}
