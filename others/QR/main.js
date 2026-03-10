document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // --- QR Generator Logic ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const inputGroups = document.querySelectorAll('.input-group');
    const qrCanvas = document.getElementById('qrCanvas');
    const qrPlaceholder = document.getElementById('qrPlaceholder');
    const downloadBtn = document.getElementById('downloadBtn');
    const fgColorInput = document.getElementById('fgColor');
    const bgColorInput = document.getElementById('bgColor');
    const sizeInput = document.getElementById('qrSize');
    const sizeVal = document.getElementById('sizeVal');

    const textContent = document.getElementById('textContent');
    const urlContent = document.getElementById('urlContent');
    const wifiSsid = document.getElementById('wifiSsid');
    const wifiPass = document.getElementById('wifiPass');
    const wifiEnc = document.getElementById('wifiEnc');
    const emailAddr = document.getElementById('emailAddr');
    const emailSub = document.getElementById('emailSub');
    const emailBody = document.getElementById('emailBody');
    const phoneNumber = document.getElementById('phoneNumber');
    const smsNumber = document.getElementById('smsNumber');
    const smsMessage = document.getElementById('smsMessage');
    const waNumber = document.getElementById('waNumber');
    const waMessage = document.getElementById('waMessage');
    const vName = document.getElementById('vName');
    const vPhone = document.getElementById('vPhone');
    const vEmail = document.getElementById('vEmail');
    const vOrg = document.getElementById('vOrg');

    let qr = null;
    let currentType = 'url';

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            inputGroups.forEach(g => g.classList.remove('active'));
            btn.classList.add('active');
            currentType = btn.dataset.type;
            const targetGroup = document.querySelector(`.input-group[data-content="${currentType}"]`);
            if (targetGroup) targetGroup.classList.add('active');
            generateQR();
        });
    });

    [fgColorInput, bgColorInput, sizeInput].forEach(el => {
        el.addEventListener('input', () => {
            if (el === sizeInput) sizeVal.textContent = sizeInput.value;
            generateQR();
        });
    });

    const allInputs = document.querySelectorAll('#qr-gen input, #qr-gen textarea, #qr-gen select');
    allInputs.forEach(input => {
        input.addEventListener('input', generateQR);
    });

    function getFormattedContent() {
        switch (currentType) {
            case 'url':
                let url = urlContent.value;
                if (url && !url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
                return url;
            case 'text': return textContent.value;
            case 'wifi': return `WIFI:S:${wifiSsid.value};T:${wifiEnc.value};P:${wifiPass.value};;`;
            case 'email': return `mailto:${emailAddr.value}?subject=${encodeURIComponent(emailSub.value)}&body=${encodeURIComponent(emailBody.value)}`;
            case 'phone': return phoneNumber.value ? `tel:${phoneNumber.value}` : '';
            case 'sms': return smsNumber.value ? `SMSTO:${smsNumber.value}:${smsMessage.value}` : '';
            case 'whatsapp':
                const num = waNumber.value.replace(/\D/g, '');
                return num ? `https://wa.me/${num}?text=${encodeURIComponent(waMessage.value)}` : '';
            case 'contact':
                if (!vName.value) return '';
                return `BEGIN:VCARD\nVERSION:3.0\nFN:${vName.value}\nTEL:${vPhone.value}\nEMAIL:${vEmail.value}\nORG:${vOrg.value}\nEND:VCARD`;
            default: return '';
        }
    }

    function generateQR() {
        const content = getFormattedContent();
        if (!content || content.trim() === "") {
            qrCanvas.style.display = 'none';
            qrPlaceholder.style.display = 'flex';
            return;
        }
        qrCanvas.style.display = 'block';
        qrPlaceholder.style.display = 'none';
        if (!qr) {
            qr = new QRious({
                element: qrCanvas,
                size: parseInt(sizeInput.value),
                value: content,
                foreground: fgColorInput.value,
                background: bgColorInput.value,
                level: 'H'
            });
        } else {
            qr.set({
                size: parseInt(sizeInput.value),
                value: content,
                foreground: fgColorInput.value,
                background: bgColorInput.value
            });
        }
    }

    downloadBtn.addEventListener('click', () => {
        const content = getFormattedContent();
        if (!content) return;

        // Create a hidden canvas for high-res generation
        const highResCanvas = document.createElement('canvas');
        const highResSize = 7680; // 8K Resolution

        try {
            showStatusMessage('Generating 8K QR Code...', 'info');

            new QRious({
                element: highResCanvas,
                size: highResSize,
                value: content,
                foreground: fgColorInput.value,
                background: bgColorInput.value,
                level: 'H'
            });

            const link = document.createElement('a');
            link.download = `qrcraft-8k-${currentType}-${Date.now()}.png`;
            link.href = highResCanvas.toDataURL('image/png');
            link.click();

            showStatusMessage('8K Download Started!', 'success');
            setTimeout(() => hideStatusMessage(), 3000);
        } catch (err) {
            console.error('8K Generation Error:', err);
            alert('8K generation failed. Your browser might have memory limits for very large images. Try a smaller size.');
        }
    });

    // Helper functions for status (since YouTube logic was removed)
    function showStatusMessage(msg, type) {
        // We can use a simple alert or toast if we want, 
        // but I'll add a small status element to the UI if not present.
        console.log(`${type.toUpperCase()}: ${msg}`);
    }

    function hideStatusMessage() {
        // ...
    }

    const shareBtn = document.getElementById('shareBtn');
    shareBtn.addEventListener('click', () => {
        if (navigator.share) {
            qrCanvas.toBlob(blob => {
                const file = new File([blob], "qr-code.png", { type: "image/png" });
                navigator.share({ title: 'QR Code', text: 'Generated with QR Craft', files: [file] })
                    .catch(err => console.error('Share Error:', err));
            });
        } else {
            alert('Sharing not supported on this browser.');
        }
    });

    generateQR();
});
