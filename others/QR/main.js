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
    const logoInput = document.getElementById('logoInput');
    const logoPreview = document.getElementById('logoPreview');
    const removeLogoBtn = document.getElementById('removeLogoBtn');
    const logoDropzone = document.getElementById('logoDropzone');
    const logoDropzonePrompt = document.getElementById('logoDropzonePrompt');
    const logoDropzoneLoaded = document.getElementById('logoDropzoneLoaded');
    const bgImageInput = document.getElementById('bgImageInput');
    const bgImagePreview = document.getElementById('bgImagePreview');
    const removeBgImageBtn = document.getElementById('removeBgImageBtn');
    const bgImageDropzone = document.getElementById('bgImageDropzone');
    const bgImageDropzonePrompt = document.getElementById('bgImageDropzonePrompt');
    const bgImageDropzoneLoaded = document.getElementById('bgImageDropzoneLoaded');
    const bgOpacityInput = document.getElementById('bgOpacity');
    const bgOpacityVal = document.getElementById('bgOpacityVal');
    const bgOpacityOption = document.getElementById('bgOpacityOption');

    const textContent = document.getElementById('textContent');
    const urlContent = document.getElementById('urlContent');

    let currentType = 'url';
    let centerLogo = null;
    let qrBackgroundImage = null;

    function drawFitImage(ctx, img, size) {
        const scale = Math.min(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (size - w) / 2;
        const y = (size - h) / 2;
        ctx.drawImage(img, x, y, w, h);
    }

    function drawCenterLogo(canvas, logo) {
        if (!logo || !canvas) return;
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const logoSize = Math.round(size * 0.22);
        const padding = Math.round(logoSize * 0.08);
        const plateSize = logoSize + padding * 2;
        const x = (size - plateSize) / 2;
        const y = (size - plateSize) / 2;
        const radius = Math.round(plateSize * 0.12);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(x, y, plateSize, plateSize, radius);
        ctx.fill();

        ctx.drawImage(
            logo,
            x + padding,
            y + padding,
            logoSize,
            logoSize
        );
    }

    function getBgImageOpacity() {
        return parseInt(bgOpacityInput.value, 10) / 100;
    }

    function updateLogoUi() {
        const hasLogo = Boolean(centerLogo);
        logoDropzonePrompt.hidden = hasLogo;
        logoDropzoneLoaded.hidden = !hasLogo;
        logoDropzone.classList.toggle('has-image', hasLogo);
        if (hasLogo) {
            logoPreview.src = centerLogo.src;
        } else {
            logoPreview.removeAttribute('src');
        }
    }

    function updateBgImageUi() {
        const hasBg = Boolean(qrBackgroundImage);
        bgImageDropzonePrompt.hidden = hasBg;
        bgImageDropzoneLoaded.hidden = !hasBg;
        bgImageDropzone.classList.toggle('has-image', hasBg);
        bgOpacityOption.classList.toggle('is-active', hasBg);
        if (hasBg) {
            bgImagePreview.src = qrBackgroundImage.src;
        } else {
            bgImagePreview.removeAttribute('src');
        }
    }

    function loadImageFromFile(file, onSuccess, invalidMessage) {
        if (!file || !file.type.startsWith('image/')) {
            alert(invalidMessage);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => onSuccess(img);
            img.onerror = () => {
                alert('Could not load that image. Try a PNG or JPG.');
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    }

    function loadLogoFromFile(file) {
        loadImageFromFile(file, (img) => {
            centerLogo = img;
            updateLogoUi();
            generateQR();
        }, 'Please drop an image file (PNG, JPG, etc.).');
    }

    function loadBgImageFromFile(file) {
        loadImageFromFile(file, (img) => {
            qrBackgroundImage = img;
            updateBgImageUi();
            generateQR();
        }, 'Please drop an image file for the background (PNG, JPG, etc.).');
    }

    function clearCenterLogo() {
        centerLogo = null;
        logoInput.value = '';
        updateLogoUi();
        generateQR();
    }

    function clearBgImage() {
        qrBackgroundImage = null;
        bgImageInput.value = '';
        updateBgImageUi();
        generateQR();
    }

    function setupImageDropzone({ dropzone, input, removeBtn, onFile, hasImage }) {
        input.addEventListener('change', () => {
            const file = input.files?.[0];
            if (file) onFile(file);
        });

        dropzone.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            if (!hasImage()) input.click();
        });

        ['dragenter', 'dragover'].forEach((eventName) => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('is-dragover');
            });
        });

        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!dropzone.contains(e.relatedTarget)) {
                dropzone.classList.remove('is-dragover');
            }
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('is-dragover');
            const file = e.dataTransfer?.files?.[0];
            if (file) onFile(file);
        });

        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropzone === logoDropzone) clearCenterLogo();
            else clearBgImage();
        });
    }

    setupImageDropzone({
        dropzone: logoDropzone,
        input: logoInput,
        removeBtn: removeLogoBtn,
        onFile: loadLogoFromFile,
        hasImage: () => centerLogo
    });

    setupImageDropzone({
        dropzone: bgImageDropzone,
        input: bgImageInput,
        removeBtn: removeBgImageBtn,
        onFile: loadBgImageFromFile,
        hasImage: () => qrBackgroundImage
    });

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

    [fgColorInput, bgColorInput, sizeInput, bgOpacityInput].forEach(el => {
        el.addEventListener('input', () => {
            if (el === sizeInput) sizeVal.textContent = sizeInput.value;
            if (el === bgOpacityInput) bgOpacityVal.textContent = bgOpacityInput.value;
            generateQR();
        });
    });

    const allInputs = document.querySelectorAll('#qr-gen input:not([type="file"]):not([type="range"]), #qr-gen textarea');
    allInputs.forEach(input => {
        input.addEventListener('input', generateQR);
    });

    function getFormattedContent() {
        switch (currentType) {
            case 'url': {
                let url = urlContent.value;
                if (url && !url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
                return url;
            }
            case 'text':
                return textContent.value;
            default:
                return '';
        }
    }

    function renderQrToCanvas(canvas, content, size) {
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = bgColorInput.value;
        ctx.fillRect(0, 0, size, size);

        if (qrBackgroundImage) {
            ctx.save();
            ctx.globalAlpha = getBgImageOpacity();
            drawFitImage(ctx, qrBackgroundImage, size);
            ctx.restore();
        }

        const qrLayer = document.createElement('canvas');
        qrLayer.width = size;
        qrLayer.height = size;

        new QRious({
            element: qrLayer,
            size,
            value: content,
            foreground: fgColorInput.value,
            background: qrBackgroundImage ? 'rgba(255,255,255,0)' : bgColorInput.value,
            level: 'H'
        });

        ctx.drawImage(qrLayer, 0, 0);

        if (centerLogo) {
            drawCenterLogo(canvas, centerLogo);
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
        const size = parseInt(sizeInput.value, 10);
        renderQrToCanvas(qrCanvas, content, size);
    }

    downloadBtn.addEventListener('click', () => {
        const content = getFormattedContent();
        if (!content) return;

        const highResCanvas = document.createElement('canvas');
        const highResSize = 7680;

        try {
            showStatusMessage('Generating 8K QR Code...', 'info');

            renderQrToCanvas(highResCanvas, content, highResSize);

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

    function showStatusMessage(msg, type) {
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

    updateLogoUi();
    updateBgImageUi();
    generateQR();
});
