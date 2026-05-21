// Application State
const state = {
    pdfFile: null,
    pdfFileName: '',
    pngFile: null,
    pngFileName: '',
    pngBase64: null,
    alignment: 'left',
    scale: 50,
    topMargin: 20,
    skipFirst: false,
    skipLast: false,
    shrinkContent: true
};

// DOM Elements
const pdfInput = document.getElementById('pdf-input');
const pdfDropZone = document.getElementById('pdf-drop-zone');
const pdfNameDisplay = document.getElementById('pdf-name');

const pngInput = document.getElementById('png-input');
const pngDropZone = document.getElementById('png-drop-zone');
const pngNameDisplay = document.getElementById('png-name');

const scaleSlider = document.getElementById('header-scale');
const scaleVal = document.getElementById('scale-val');

const marginSlider = document.getElementById('header-margin');
const marginVal = document.getElementById('margin-val');

const shrinkContentCheckbox = document.getElementById('shrink-content');
const skipFirstCheckbox = document.getElementById('skip-first');
const skipLastCheckbox = document.getElementById('skip-last');

const alignButtons = document.querySelectorAll('.align-btn');
const processBtn = document.getElementById('process-btn');
const statusMessage = document.getElementById('status-message');

const a4Sheet = document.getElementById('a4-sheet');
const previewHeader = document.getElementById('preview-header');
const previewHeaderImg = document.getElementById('preview-header-img');
const previewHeaderText = document.getElementById('preview-header-text');

const loadingOverlay = document.getElementById('loading-overlay');
const loaderTitle = document.getElementById('loader-title');
const loaderSubtitle = document.getElementById('loader-subtitle');
const progressBar = document.getElementById('progress-bar');

const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');


// Initialize Lucide Icons
lucide.createIcons();

// --- Toast Notification Handler ---
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;
    
    // Change icon based on type
    if (type === 'success') {
        toastIcon.setAttribute('data-lucide', 'check-circle');
    } else if (type === 'error') {
        toastIcon.setAttribute('data-lucide', 'alert-triangle');
    } else {
        toastIcon.setAttribute('data-lucide', 'info');
    }
    lucide.createIcons();

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// --- Drag and Drop Setup ---
function setupDragAndDrop(zone, input, fileType, callback) {
    // Click on zone triggers input click, but ignore bubbled click from the input itself
    zone.addEventListener('click', (e) => {
        if (e.target !== input) {
            input.click();
        }
    });

    // Drag-drop visual effects
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const isCorrectType = fileType === 'pdf' ? file.name.endsWith('.pdf') : file.name.endsWith('.png');
            
            if (isCorrectType) {
                input.files = e.dataTransfer.files;
                callback(file);
            } else {
                showToast(`Vui lòng chọn đúng định dạng file .${fileType}`, 'error');
            }
        }
    });

    input.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            callback(e.target.files[0]);
        }
    });
}

// PDF File Selected Callback
function handlePdfSelected(file) {
    state.pdfFile = file;
    state.pdfFileName = file.name;
    pdfNameDisplay.textContent = file.name;
    pdfDropZone.classList.add('has-file');
    showToast('Đã nhận file PDF thành công!', 'success');
    checkReadyState();
}

// PNG File Selected Callback
function handlePngSelected(file) {
    state.pngFile = file;
    state.pngFileName = file.name;
    pngNameDisplay.textContent = file.name;
    pngDropZone.classList.add('has-file');

    // Read to Base64 for Preview
    const reader = new FileReader();
    reader.onload = function(e) {
        state.pngBase64 = e.target.result;
        previewHeaderImg.src = state.pngBase64;
        previewHeaderImg.style.display = 'block';
        previewHeaderText.style.display = 'none';
        
        // Load image to calculate aspect ratio
        previewHeaderImg.onload = function() {
            state.aspectRatio = previewHeaderImg.naturalHeight / previewHeaderImg.naturalWidth;
            showToast('Đã nhận file ảnh Header PNG thành công!', 'success');
            updatePreview();
            checkReadyState();
        };
    };
    reader.readAsDataURL(file);
}

setupDragAndDrop(pdfDropZone, pdfInput, 'pdf', handlePdfSelected);
setupDragAndDrop(pngDropZone, pngInput, 'png', handlePngSelected);

// --- State and Preview Updates ---

// Update Alignment
alignButtons.forEach(button => {
    button.addEventListener('click', () => {
        alignButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        state.alignment = button.getAttribute('data-align');
        updatePreview();
    });
});

// Update Scale Slider
scaleSlider.addEventListener('input', (e) => {
    state.scale = parseInt(e.target.value);
    scaleVal.textContent = `${state.scale}%`;
    updatePreview();
});

// Update Margin Slider
marginSlider.addEventListener('input', (e) => {
    state.topMargin = parseInt(e.target.value);
    marginVal.textContent = `${state.topMargin}px`;
    updatePreview();
});

// Update Toggles
shrinkContentCheckbox.addEventListener('change', (e) => {
    state.shrinkContent = e.target.checked;
    updatePreview();
});

skipFirstCheckbox.addEventListener('change', (e) => {
    state.skipFirst = e.target.checked;
});

skipLastCheckbox.addEventListener('change', (e) => {
    state.skipLast = e.target.checked;
});

// Update Live Preview Mockup Styles
function updatePreview() {
    // Alignment mapping to flex layout
    let flexAlign = 'flex-start';
    if (state.alignment === 'center') flexAlign = 'center';
    if (state.alignment === 'right') flexAlign = 'flex-end';
    
    // Scale Margin for preview A4 sheet
    // PDF A4 height = 842 points. Preview A4 height = 353px. (ratio ~0.42)
    // Scale top margin to look visually equivalent
    const previewMargin = Math.max(0, state.topMargin * 0.42);
    
    a4Sheet.style.setProperty('--preview-align', flexAlign);
    a4Sheet.style.setProperty('--preview-scale', `${state.scale}%`);
    a4Sheet.style.setProperty('--preview-margin', `${previewMargin}px`);
    
    // Dynamic height based on image aspect ratio
    let previewHeight = 24;
    if (state.aspectRatio) {
        // A4 sheet width in CSS is 250px
        const previewWidth = 250 * (state.scale / 100);
        previewHeight = previewWidth * state.aspectRatio;
        a4Sheet.style.setProperty('--preview-height', `${previewHeight}px`);
    } else {
        a4Sheet.style.setProperty('--preview-height', '24px');
    }

    // Shrink content mockup preview
    if (state.shrinkContent) {
        a4Sheet.classList.add('shrink-active');
        // Total height taken by header in preview
        const totalHeaderHeight = previewMargin + previewHeight + 10;
        const contentHeight = 300; // estimated mock content container height
        const scaleFactor = Math.max(0.65, Math.min(1.0, (contentHeight - totalHeaderHeight) / contentHeight));
        a4Sheet.style.setProperty('--preview-shrink-scale', scaleFactor);
    } else {
        a4Sheet.classList.remove('shrink-active');
        a4Sheet.style.setProperty('--preview-shrink-scale', '1.0');
    }
}

// Enable/Disable Action Button
function checkReadyState() {
    if (state.pdfFile && state.pngFile) {
        processBtn.removeAttribute('disabled');
        statusMessage.textContent = 'Sẵn sàng xử lý. Nhấp nút phía trên để bắt đầu.';
        statusMessage.style.color = 'var(--success-color)';
    } else {
        processBtn.setAttribute('disabled', 'true');
        statusMessage.textContent = 'Vui lòng tải lên đầy đủ file PDF và ảnh PNG để bắt đầu.';
        statusMessage.style.color = 'var(--text-secondary)';
    }
}

// Initialize Preview
updatePreview();

// --- PDF Processing and Generation ---

processBtn.addEventListener('click', async () => {
    if (!state.pdfFile || !state.pngFile) return;

    try {
        // Show overlay loader
        loadingOverlay.classList.add('active');
        updateProgress(10, 'Đang đọc dữ liệu file...');

        // Read files as ArrayBuffer
        const pdfBytes = await readFileAsArrayBuffer(state.pdfFile);
        updateProgress(30, 'Đang giải mã PDF...');

        const pngBytes = await readFileAsArrayBuffer(state.pngFile);
        updateProgress(40, 'Đang nạp thư viện PDF-lib...');

        // Load PDF Document
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes);
        updateProgress(55, 'Đang nhúng hình ảnh PNG...');

        const pages = pdfDoc.getPages();
        const totalPages = pages.length;

        let destPdfDoc;
        let pngImage;
        let embeddedPages = [];

        if (state.shrinkContent) {
            destPdfDoc = await PDFDocument.create();
            try {
                pngImage = await destPdfDoc.embedPng(pngBytes);
            } catch (embedError) {
                throw new Error('Ảnh PNG không hợp lệ hoặc bị hỏng. Hãy chọn file ảnh PNG chuẩn.');
            }
            updateProgress(60, 'Đang chuẩn bị nhúng các trang tài liệu gốc...');
            const pageIndices = Array.from({ length: totalPages }, (_, idx) => idx);
            embeddedPages = await destPdfDoc.embedPdf(pdfDoc, pageIndices);
        } else {
            destPdfDoc = pdfDoc;
            try {
                pngImage = await destPdfDoc.embedPng(pngBytes);
            } catch (embedError) {
                throw new Error('Ảnh PNG không hợp lệ hoặc bị hỏng. Hãy chọn file ảnh PNG chuẩn.');
            }
        }

        const { width: imgOriginalWidth, height: imgOriginalHeight } = pngImage.scale(1.0);
        updateProgress(65, 'Đang chèn Header vào các trang...');

        // Process each page
        for (let i = 0; i < totalPages; i++) {
            const originalPage = pages[i];
            const cropBox = originalPage.getCropBox();
            const cropX = cropBox.x;
            const cropY = cropBox.y;
            const cropWidth = cropBox.width;
            const cropHeight = cropBox.height;

            const isSkipped = (state.skipFirst && i === 0) || (state.skipLast && i === totalPages - 1);

            if (state.shrinkContent) {
                // Add a blank page to destination matching original dimensions
                const newPage = destPdfDoc.addPage([originalPage.getWidth(), originalPage.getHeight()]);
                newPage.setCropBox(cropX, cropY, cropWidth, cropHeight);

                if (isSkipped) {
                    // Draw original page at full size
                    newPage.drawPage(embeddedPages[i], {
                        x: 0,
                        y: 0,
                        width: originalPage.getWidth(),
                        height: originalPage.getHeight()
                    });
                } else {
                    // Calculate dimensions for header
                    const targetWidth = cropWidth * (state.scale / 100);
                    const targetHeight = (imgOriginalHeight / imgOriginalWidth) * targetWidth;

                    // Space reserved for header: topMargin + headerHeight + 15pt spacing
                    const headerHeightTotal = state.topMargin + targetHeight + 15;

                    // Calculate scale factor for main content
                    const scaleFactor = Math.max(0.1, (cropHeight - headerHeightTotal) / cropHeight);

                    // Compute scaled page dimensions
                    const drawWidth = originalPage.getWidth() * scaleFactor;
                    const drawHeight = originalPage.getHeight() * scaleFactor;

                    // Center horizontal offset in CropBox
                    const newCropBoxX = cropX + (cropWidth - cropWidth * scaleFactor) / 2;
                    const newCropBoxY = cropY;

                    // MediaBox offsets mapping
                    const drawX = newCropBoxX - (cropX * scaleFactor);
                    const drawY = newCropBoxY - (cropY * scaleFactor);

                    // Draw scaled down page content
                    newPage.drawPage(embeddedPages[i], {
                        x: drawX,
                        y: drawY,
                        width: drawWidth,
                        height: drawHeight
                    });

                    // Draw the PNG header on top
                    let headerX = cropX;
                    if (state.alignment === 'center') {
                        headerX = cropX + (cropWidth - targetWidth) / 2;
                    } else if (state.alignment === 'right') {
                        headerX = cropX + cropWidth - targetWidth;
                    }

                    const headerY = cropY + cropHeight - state.topMargin - targetHeight;

                    newPage.drawImage(pngImage, {
                        x: headerX,
                        y: headerY,
                        width: targetWidth,
                        height: targetHeight
                    });
                }
            } else {
                if (isSkipped) continue;

                const targetWidth = cropWidth * (state.scale / 100);
                const targetHeight = (imgOriginalHeight / imgOriginalWidth) * targetWidth;

                let x = cropX;
                if (state.alignment === 'center') {
                    x = cropX + (cropWidth - targetWidth) / 2;
                } else if (state.alignment === 'right') {
                    x = cropX + cropWidth - targetWidth;
                }

                const y = cropY + cropHeight - state.topMargin - targetHeight;

                originalPage.drawImage(pngImage, {
                    x: x,
                    y: y,
                    width: targetWidth,
                    height: targetHeight
                });
            }

            // Update progressive processing progress
            const pageProgress = 65 + Math.floor((i + 1) / totalPages * 25);
            updateProgress(pageProgress, `Đang xử lý trang ${i + 1}/${totalPages}...`);
        }

        updateProgress(90, 'Đang chuẩn bị file tải xuống...');

        // Save modified PDF
        const pdfBytesModified = await destPdfDoc.save();
        updateProgress(98, 'Đang tải xuống...');


        // Create Blob and trigger download
        const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        // Generate new file name
        const cleanName = state.pdfFileName.replace(/\.pdf$/i, '');
        link.download = `${cleanName}_co_header.pdf`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
            loadingOverlay.classList.remove('active');
            showToast('Chèn Header và tải PDF thành công!', 'success');
        }, 800);

    } catch (error) {
        console.error(error);
        loadingOverlay.classList.remove('active');
        showToast(error.message || 'Đã xảy ra lỗi khi xử lý PDF!', 'error');
    }
});

// Helper: Read file as ArrayBuffer
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error(`Không thể đọc file: ${file.name}`));
        reader.readAsArrayBuffer(file);
    });
}

// Helper: Update Progress Overlay
function updateProgress(percent, subtitle) {
    progressBar.style.width = `${percent}%`;
    if (subtitle) {
        loaderSubtitle.textContent = subtitle;
    }
}
