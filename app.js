// =====================================================
// SHARED STATE
// =====================================================
const state = {
    pdfFile: null, pdfFileName: '',
    pngFile: null, pngFileName: '', pngBase64: null,
    alignment: 'left', scale: 50, topMargin: 20,
    skipFirst: false, skipLast: false, shrinkContent: true, aspectRatio: null
};

const cvState = {
    pngFile: null, pngFileName: '',
    files: [], // Array of objects: { id, file, name, status, form: { name, position, summary, skills, english, notice } }
    activeFileId: null
};

// =====================================================
// DOM ELEMENTS – SHARED
// =====================================================
const loadingOverlay = document.getElementById('loading-overlay');
const loaderTitle    = document.getElementById('loader-title');
const loaderSubtitle = document.getElementById('loader-subtitle');
const progressBar    = document.getElementById('progress-bar');
const toast          = document.getElementById('toast');
const toastIcon      = document.getElementById('toast-icon');
const toastMessage   = document.getElementById('toast-message');

// DOM – Tab 1
const pdfInput             = document.getElementById('pdf-input');
const pdfDropZone          = document.getElementById('pdf-drop-zone');
const pdfNameDisplay       = document.getElementById('pdf-name');
const pngInput             = document.getElementById('png-input');
const pngDropZone          = document.getElementById('png-drop-zone');
const pngNameDisplay       = document.getElementById('png-name');
const scaleSlider          = document.getElementById('header-scale');
const scaleVal             = document.getElementById('scale-val');
const marginSlider         = document.getElementById('header-margin');
const marginVal            = document.getElementById('margin-val');
const shrinkContentCheckbox= document.getElementById('shrink-content');
const skipFirstCheckbox    = document.getElementById('skip-first');
const skipLastCheckbox     = document.getElementById('skip-last');
const alignButtons         = document.querySelectorAll('.align-btn');
const processBtn           = document.getElementById('process-btn');
const statusMessage        = document.getElementById('status-message');
const a4Sheet              = document.getElementById('a4-sheet');
const previewHeaderImg     = document.getElementById('preview-header-img');
const previewHeaderText    = document.getElementById('preview-header-text');

// DOM – Tab 2
const cvPdfInput          = document.getElementById('cv-pdf-input');
const cvPdfDropZone       = document.getElementById('cv-pdf-drop-zone');
const cvPdfNameDisplay    = document.getElementById('cv-pdf-name');
const cvPngInput          = document.getElementById('cv-png-input');
const cvPngDropZone       = document.getElementById('cv-png-drop-zone');
const cvPngNameDisplay    = document.getElementById('cv-png-name');
const cvGenerateBtn       = document.getElementById('cv-generate-btn');
const cvExportAllBtn      = document.getElementById('cv-export-all-btn');
const cvStatusMessage     = document.getElementById('cv-status-message');

// Initialize icons
lucide.createIcons();

// =====================================================
// SHARED UTILITIES
// =====================================================
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;
    toastIcon.setAttribute('data-lucide',
        type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info');
    lucide.createIcons();
    setTimeout(() => toast.classList.remove('show'), 4000);
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = () => reject(new Error(`Cannot read: ${file.name}`));
        reader.readAsArrayBuffer(file);
    });
}

function updateProgress(pct, subtitle) {
    progressBar.style.width = `${pct}%`;
    if (subtitle) loaderSubtitle.textContent = subtitle;
}

function setupDragAndDrop(zone, input, fileType, callback) {
    zone.addEventListener('click', (e) => { if (e.target !== input) input.click(); });
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const ok = fileType === 'pdf' ? file.name.toLowerCase().endsWith('.pdf') : file.name.toLowerCase().endsWith('.png');
            if (ok) { input.files = e.dataTransfer.files; callback(file); }
            else showToast(`Please select a .${fileType} file`, 'error');
        }
    });
    input.addEventListener('change', (e) => { if (e.target.files && e.target.files.length > 0) callback(e.target.files[0]); });
}

// =====================================================
// TAB NAVIGATION
// =====================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
});

// =====================================================
// TAB 1 – HEADER ADDER
// =====================================================
function handlePdfSelected(file) {
    state.pdfFile = file; state.pdfFileName = file.name;
    pdfNameDisplay.textContent = file.name;
    pdfDropZone.classList.add('has-file');
    showToast('PDF loaded!', 'success');
    checkReadyState();
}

function handlePngSelected(file) {
    state.pngFile = file; state.pngFileName = file.name;
    pngNameDisplay.textContent = file.name;
    pngDropZone.classList.add('has-file');
    const reader = new FileReader();
    reader.onload = (e) => {
        state.pngBase64 = e.target.result;
        previewHeaderImg.src = state.pngBase64;
        previewHeaderImg.style.display = 'block';
        previewHeaderText.style.display = 'none';
        previewHeaderImg.onload = () => {
            state.aspectRatio = previewHeaderImg.naturalHeight / previewHeaderImg.naturalWidth;
            showToast('Header PNG loaded!', 'success');
            updatePreview(); checkReadyState();
        };
    };
    reader.readAsDataURL(file);
}

setupDragAndDrop(pdfDropZone, pdfInput, 'pdf', handlePdfSelected);
setupDragAndDrop(pngDropZone, pngInput, 'png', handlePngSelected);

alignButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        alignButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.alignment = btn.getAttribute('data-align');
        updatePreview();
    });
});

scaleSlider.addEventListener('input', (e) => {
    state.scale = parseInt(e.target.value);
    scaleVal.textContent = `${state.scale}%`;
    updatePreview();
});

marginSlider.addEventListener('input', (e) => {
    state.topMargin = parseInt(e.target.value);
    marginVal.textContent = `${state.topMargin}px`;
    updatePreview();
});

shrinkContentCheckbox.addEventListener('change', (e) => { state.shrinkContent = e.target.checked; updatePreview(); });
skipFirstCheckbox.addEventListener('change', (e) => { state.skipFirst = e.target.checked; });
skipLastCheckbox.addEventListener('change', (e) => { state.skipLast = e.target.checked; });

function updatePreview() {
    let flexAlign = 'flex-start';
    if (state.alignment === 'center') flexAlign = 'center';
    if (state.alignment === 'right')  flexAlign = 'flex-end';
    const previewMargin = Math.max(0, state.topMargin * 0.42);
    a4Sheet.style.setProperty('--preview-align',  flexAlign);
    a4Sheet.style.setProperty('--preview-scale',  `${state.scale}%`);
    a4Sheet.style.setProperty('--preview-margin', `${previewMargin}px`);
    let previewHeight = 24;
    if (state.aspectRatio) {
        previewHeight = 250 * (state.scale / 100) * state.aspectRatio;
        a4Sheet.style.setProperty('--preview-height', `${previewHeight}px`);
    } else {
        a4Sheet.style.setProperty('--preview-height', '24px');
    }
    if (state.shrinkContent) {
        a4Sheet.classList.add('shrink-active');
        const sf = Math.max(0.65, Math.min(1.0, (300 - previewMargin - previewHeight - 10) / 300));
        a4Sheet.style.setProperty('--preview-shrink-scale', sf);
    } else {
        a4Sheet.classList.remove('shrink-active');
        a4Sheet.style.setProperty('--preview-shrink-scale', '1.0');
    }
}

function checkReadyState() {
    if (state.pdfFile && state.pngFile) {
        processBtn.removeAttribute('disabled');
        statusMessage.textContent = 'Ready. Click the button to start.';
        statusMessage.style.color = 'var(--success-color)';
    } else {
        processBtn.setAttribute('disabled', 'true');
        statusMessage.textContent = 'Vui lòng tải lên đầy đủ file PDF và ảnh PNG.';
        statusMessage.style.color = 'var(--text-secondary)';
    }
}

updatePreview();

processBtn.addEventListener('click', async () => {
    if (!state.pdfFile || !state.pngFile) return;
    try {
        loadingOverlay.classList.add('active');
        loaderTitle.textContent = 'Đang chèn Header...';
        updateProgress(10, 'Reading files...');
        const pdfBytes = await readFileAsArrayBuffer(state.pdfFile);
        updateProgress(30, 'Parsing PDF...');
        const pngBytes = await readFileAsArrayBuffer(state.pngFile);
        updateProgress(45, 'Loading pdf-lib...');
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const totalPages = pages.length;
        let destDoc, pngImage, embeddedPages = [];

        if (state.shrinkContent) {
            destDoc = await PDFDocument.create();
            try { pngImage = await destDoc.embedPng(pngBytes); } catch { throw new Error('Invalid PNG.'); }
            updateProgress(60, 'Embedding pages...');
            embeddedPages = await destDoc.embedPdf(pdfDoc, Array.from({ length: totalPages }, (_, i) => i));
        } else {
            destDoc = pdfDoc;
            try { pngImage = await destDoc.embedPng(pngBytes); } catch { throw new Error('Invalid PNG.'); }
        }

        const { width: imgW, height: imgH } = pngImage.scale(1.0);
        updateProgress(65, 'Inserting headers...');

        for (let i = 0; i < totalPages; i++) {
            const origPage = pages[i];
            const cb = origPage.getCropBox();
            const [cropX, cropY, cropW, cropH] = [cb.x, cb.y, cb.width, cb.height];
            const skipped = (state.skipFirst && i === 0) || (state.skipLast && i === totalPages - 1);

            if (state.shrinkContent) {
                const newPage = destDoc.addPage([origPage.getWidth(), origPage.getHeight()]);
                newPage.setCropBox(cropX, cropY, cropW, cropH);
                if (skipped) {
                    newPage.drawPage(embeddedPages[i], { x: 0, y: 0, width: origPage.getWidth(), height: origPage.getHeight() });
                } else {
                    const tw = cropW * (state.scale / 100);
                    const th = (imgH / imgW) * tw;
                    const sf = Math.max(0.1, (cropH - state.topMargin - th - 15) / cropH);
                    const dW = origPage.getWidth() * sf, dH = origPage.getHeight() * sf;
                    const dX = cropX + (cropW - cropW * sf) / 2 - cropX * sf;
                    const dY = cropY - cropY * sf;
                    newPage.drawPage(embeddedPages[i], { x: dX, y: dY, width: dW, height: dH });
                    let hx = cropX;
                    if (state.alignment === 'center') hx = cropX + (cropW - tw) / 2;
                    else if (state.alignment === 'right') hx = cropX + cropW - tw;
                    newPage.drawImage(pngImage, { x: hx, y: cropY + cropH - state.topMargin - th, width: tw, height: th });
                }
            } else {
                if (skipped) continue;
                const tw = cropW * (state.scale / 100), th = (imgH / imgW) * tw;
                let x = cropX;
                if (state.alignment === 'center') x = cropX + (cropW - tw) / 2;
                else if (state.alignment === 'right') x = cropX + cropW - tw;
                origPage.drawImage(pngImage, { x, y: cropY + cropH - state.topMargin - th, width: tw, height: th });
            }
            updateProgress(65 + Math.floor((i + 1) / totalPages * 25), `Page ${i + 1}/${totalPages}...`);
        }

        updateProgress(92, 'Saving PDF...');
        const outBytes = await destDoc.save();
        updateProgress(98, 'Downloading...');
        const blob = new Blob([outBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${state.pdfFileName.replace(/\.pdf$/i, '')}_with_header.pdf`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        setTimeout(() => { loadingOverlay.classList.remove('active'); loaderTitle.textContent = 'Đang xử lý...'; showToast('Header added successfully!', 'success'); }, 800);
    } catch (err) {
        console.error(err);
        loadingOverlay.classList.remove('active');
        loaderTitle.textContent = 'Đang xử lý...';
        showToast(err.message || 'An error occurred!', 'error');
    }
});

// =====================================================
// TAB 2 – CV SUMMARY
// =====================================================

function handleCvPdfsSelected(files) {
    if (!files || files.length === 0) return;

    let addedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (cvState.files.length >= 10) {
            skippedCount += (files.length - i);
            break;
        }

        const fileId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
        cvState.files.push({
            id: fileId,
            file: file,
            name: file.name,
            status: 'draft',
            form: {
                name: '',
                position: '',
                summary: '',
                skills: '',
                english: '',
                notice: ''
            }
        });
        addedCount++;

        if (!cvState.activeFileId) {
            cvState.activeFileId = fileId;
        }
    }

    if (addedCount > 0) {
        showToast(`Đã thêm ${addedCount} file CV PDF!`, 'success');
        cvPdfNameDisplay.textContent = `${cvState.files.length} file đã chọn`;
        cvPdfDropZone.classList.add('has-file');
    }

    if (skippedCount > 0) {
        showToast(`Vượt quá giới hạn! Bỏ qua ${skippedCount} file. Tối đa 10 file.`, 'error');
    }

    renderFileList();
    syncFormWithActiveFile();
    checkCvReadyState();
}

function handleCvPngSelected(file) {
    cvState.pngFile = file;
    cvState.pngFileName = file.name;
    cvPngNameDisplay.textContent = file.name;
    cvPngDropZone.classList.add('has-file');
    showToast('Header PNG loaded!', 'success');
    checkCvReadyState();
}

// Custom Drag and Drop for multi-PDFs
cvPdfDropZone.addEventListener('click', (e) => { if (e.target !== cvPdfInput) cvPdfInput.click(); });
cvPdfDropZone.addEventListener('dragover', (e) => { e.preventDefault(); cvPdfDropZone.classList.add('dragover'); });
cvPdfDropZone.addEventListener('dragleave', () => cvPdfDropZone.classList.remove('dragover'));
cvPdfDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    cvPdfDropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const pdfFiles = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
        if (pdfFiles.length > 0) {
            handleCvPdfsSelected(pdfFiles);
        } else {
            showToast('Vui lòng chỉ chọn các file .pdf', 'error');
        }
    }
});
cvPdfInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
        const pdfFiles = Array.from(e.target.files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
        handleCvPdfsSelected(pdfFiles);
    }
});

// Setup PNG header using shared drag and drop
setupDragAndDrop(cvPngDropZone, cvPngInput, 'png', handleCvPngSelected);

const cvFormPanel = document.querySelector('.summary-form-panel');
const cvFields = {
    name:     document.getElementById('cv-name'),
    position: document.getElementById('cv-position'),
    summary:  document.getElementById('cv-profile-summary'),
    skills:   document.getElementById('cv-skills'),
    english:  document.getElementById('cv-english'),
    notice:   document.getElementById('cv-notice'),
};

const prevFields = {
    name:     document.getElementById('prev-name'),
    position: document.getElementById('prev-position'),
    summary:  document.getElementById('prev-summary'),
    skills:   document.getElementById('prev-skills'),
    english:  document.getElementById('prev-english'),
    notice:   document.getElementById('prev-notice'),
};

function renderFileList() {
    const listContainer = document.getElementById('cv-file-list');
    const countSpan = document.getElementById('cv-count');
    
    listContainer.innerHTML = '';
    countSpan.textContent = cvState.files.length;
    
    if (cvState.files.length === 0) {
        cvPdfNameDisplay.textContent = 'Chưa có file nào được chọn';
        cvPdfDropZone.classList.remove('has-file');
        
        listContainer.innerHTML = `
            <div class="file-list-placeholder">
                <i data-lucide="files" class="placeholder-icon"></i>
                <p>Chưa có file CV nào được chọn.</p>
                <span class="sub-info">Kéo thả file PDF vào ô phía trên để bắt đầu.</span>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    cvState.files.forEach(fileEntry => {
        const item = document.createElement('div');
        item.className = `cv-file-item ${fileEntry.id === cvState.activeFileId ? 'active' : ''}`;
        
        const badgeClass = fileEntry.status === 'ready' ? 'ready' : 'draft';
        const badgeLabel = fileEntry.status === 'ready' ? 'Sẵn sàng' : 'Thiếu TT';
        const badgeIcon = fileEntry.status === 'ready' ? 'check-circle' : 'circle-alert';
        
        item.innerHTML = `
            <div class="cv-file-item-left">
                <i data-lucide="file-text"></i>
                <div class="cv-file-details">
                    <span class="cv-file-name" title="${fileEntry.name}">${fileEntry.name}</span>
                    <span class="status-badge ${badgeClass}">
                        <i data-lucide="${badgeIcon}"></i>
                        <span>${badgeLabel}</span>
                    </span>
                </div>
            </div>
            <button type="button" class="cv-file-remove" title="Xóa file">
                <i data-lucide="trash-2"></i>
            </button>
        `;
        
        item.addEventListener('click', (e) => {
            if (e.target.closest('.cv-file-remove')) {
                removeCvFile(fileEntry.id);
            } else {
                selectCvFile(fileEntry.id);
            }
        });
        
        listContainer.appendChild(item);
    });
    
    lucide.createIcons();
}

function selectCvFile(id) {
    cvState.activeFileId = id;
    renderFileList();
    syncFormWithActiveFile();
    checkCvReadyState();
}

function removeCvFile(id) {
    const index = cvState.files.findIndex(f => f.id === id);
    if (index === -1) return;
    
    cvState.files.splice(index, 1);
    
    if (cvState.activeFileId === id) {
        if (cvState.files.length > 0) {
            cvState.activeFileId = cvState.files[Math.max(0, index - 1)].id;
        } else {
            cvState.activeFileId = null;
        }
    }
    
    if (cvState.files.length > 0) {
        cvPdfNameDisplay.textContent = `${cvState.files.length} file đã chọn`;
    } else {
        cvPdfNameDisplay.textContent = 'Chưa có file nào được chọn';
    }
    
    renderFileList();
    syncFormWithActiveFile();
    checkCvReadyState();
    showToast('Đã xóa file khỏi danh sách', 'info');
}

function syncFormWithActiveFile() {
    const activeFile = cvState.files.find(f => f.id === cvState.activeFileId);
    
    const existingMsg = cvFormPanel.querySelector('.form-disabled-info');
    if (existingMsg) existingMsg.remove();
    
    if (!activeFile) {
        Object.values(cvFields).forEach(field => {
            field.disabled = true;
            field.value = '';
        });
        
        Object.values(prevFields).forEach(field => {
            field.textContent = '—';
        });
        
        const msgDiv = document.createElement('div');
        msgDiv.className = 'form-disabled-info';
        msgDiv.innerHTML = `<i data-lucide="circle-alert"></i> Vui lòng tải lên hoặc chọn một file CV từ danh sách để bắt đầu nhập thông tin.`;
        cvFormPanel.insertBefore(msgDiv, cvFormPanel.querySelector('.form-grid'));
        lucide.createIcons();
        return;
    }
    
    Object.keys(cvFields).forEach(key => {
        cvFields[key].disabled = false;
        cvFields[key].value = activeFile.form[key] || '';
    });
    
    Object.keys(prevFields).forEach(key => {
        prevFields[key].textContent = activeFile.form[key] || '—';
    });
}

// Live preview and state binding
Object.keys(cvFields).forEach(key => {
    const inp = cvFields[key];
    if (inp) {
        inp.addEventListener('input', () => {
            const activeFile = cvState.files.find(f => f.id === cvState.activeFileId);
            if (activeFile) {
                activeFile.form[key] = inp.value;
                
                const prv = prevFields[key];
                if (prv) prv.textContent = inp.value || '—';
                
                const allFilled = Object.values(activeFile.form).every(val => val && val.trim() !== '');
                const oldStatus = activeFile.status;
                activeFile.status = allFilled ? 'ready' : 'draft';
                
                if (oldStatus !== activeFile.status) {
                    renderFileList();
                }
                
                checkCvReadyState();
            }
        });
    }
});

function checkCvReadyState() {
    const activeFile = cvState.files.find(f => f.id === cvState.activeFileId);
    const hasPng = !!cvState.pngFile;
    
    if (activeFile && hasPng && activeFile.status === 'ready') {
        cvGenerateBtn.removeAttribute('disabled');
        cvStatusMessage.textContent = `CV "${activeFile.name}" đã sẵn sàng để xuất!`;
        cvStatusMessage.style.color = 'var(--success-color)';
    } else {
        cvGenerateBtn.setAttribute('disabled', 'true');
        if (!hasPng) {
            cvStatusMessage.textContent = 'Vui lòng tải lên ảnh Header PNG.';
            cvStatusMessage.style.color = 'var(--text-secondary)';
        } else if (!activeFile) {
            cvStatusMessage.textContent = 'Vui lòng tải lên ít nhất một file CV PDF.';
            cvStatusMessage.style.color = 'var(--text-secondary)';
        } else {
            cvStatusMessage.textContent = 'Vui lòng điền đầy đủ cả 6 trường thông tin ứng viên để xuất PDF.';
            cvStatusMessage.style.color = 'var(--text-secondary)';
        }
    }
    
    const anyReady = cvState.files.some(f => f.status === 'ready');
    if (anyReady && hasPng) {
        cvExportAllBtn.removeAttribute('disabled');
    } else {
        cvExportAllBtn.setAttribute('disabled', 'true');
    }
}

// Text wrap helper for pdf-lib
function wrapText(text, maxWidth, font, size) {
    if (!text || !text.trim()) return ['—'];
    const lines = [];
    for (const para of text.split('\n')) {
        if (!para.trim()) { lines.push(''); continue; }
        let line = '';
        for (const word of para.split(/\s+/)) {
            const test = line ? `${line} ${word}` : word;
            let w = maxWidth + 1;
            try { w = font.widthOfTextAtSize(test, size); } catch {}
            if (w > maxWidth && line) { lines.push(line); line = word; }
            else line = test;
        }
        if (line) lines.push(line);
    }
    return lines.length ? lines : ['—'];
}

async function generateReportBytes(fileEntry) {
    const pdfBytes = await readFileAsArrayBuffer(fileEntry.file);
    const pngBytes = await readFileAsArrayBuffer(cvState.pngFile);

    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const outDoc  = await PDFDocument.create();
    const boldFont= await outDoc.embedFont(StandardFonts.HelveticaBold);
    const regFont = await outDoc.embedFont(StandardFonts.Helvetica);

    let pngImage;
    try { pngImage = await outDoc.embedPng(pngBytes); } catch { throw new Error('Ảnh Header PNG không hợp lệ.'); }
    const pngDims = pngImage.scale(1);

    const A4W = 595.28, A4H = 841.89;
    const hdrH = (pngDims.height / pngDims.width) * A4W;

    const C = {
        white:    rgb(1,      1,      1     ),
        accent:   rgb(0.259,  0.690,  0.835 ),
        accentDk: rgb(0.18,   0.50,   0.64  ),
        darkText: rgb(0.12,   0.15,   0.22  ),
        grayText: rgb(0.50,   0.55,   0.65  ),
        row1:     rgb(0.95,   0.96,   0.98  ),
        row2:     rgb(0.98,   0.99,   1.00  ),
        border:   rgb(0.80,   0.84,   0.90  ),
    };

    const sumPage = outDoc.addPage([A4W, A4H]);
    sumPage.drawRectangle({ x: 0, y: 0, width: A4W, height: A4H, color: C.white });
    sumPage.drawImage(pngImage, { x: 0, y: A4H - hdrH, width: A4W, height: hdrH });

    // Title: CANDIDATE SUMMARY
    const blueText = rgb(0.106, 0.459, 0.733); // #1b75bb
    const stTitleY = A4H - hdrH - 45;
    const stTitle  = 'CANDIDATE SUMMARY', stSz = 16;
    const stW = boldFont.widthOfTextAtSize(stTitle, stSz);
    sumPage.drawText(stTitle, { x: (A4W - stW) / 2, y: stTitleY, font: boldFont, size: stSz, color: blueText });

    // Blue underline spanning table width
    const tblX = 40, tblW = A4W - 80, col1W = 148, col2W = tblW - col1W;
    sumPage.drawLine({ start: { x: tblX, y: stTitleY - 12 }, end: { x: tblX + tblW, y: stTitleY - 12 }, thickness: 1.5, color: blueText });

    // Table settings (directly below underline)
    const cellPad = 9, lineH = 13, minRowH = 34;
    const tblStartY = stTitleY - 32;
    let curY = tblStartY;

    const rows = [
        ['Name',            fileEntry.form.name],
        ['Position Applied',fileEntry.form.position],
        ['Profile Summary', fileEntry.form.summary],
        ['Top Skills',      fileEntry.form.skills],
        ['English',         fileEntry.form.english],
        ['Notice Period',   fileEntry.form.notice],
    ];

    rows.forEach(([label, value], idx) => {
        const lines  = wrapText(value, col2W - cellPad * 2, regFont, 10);
        const rowH   = Math.max(minRowH, lines.length * lineH + cellPad * 2);
        const rowY   = curY - rowH;
        // Alternating zebra striping: Row 1, 3, 5 are light blue/grey, Row 2, 4, 6 are white
        const bgFill = idx % 2 === 0 ? C.row1 : C.white;

        // Draw backgrounds for cells
        sumPage.drawRectangle({ x: tblX, y: rowY, width: col1W, height: rowH, color: C.accent }); // Label cell (Accent: #42b0d5)
        sumPage.drawRectangle({ x: tblX + col1W, y: rowY, width: col2W, height: rowH, color: bgFill }); // Value cell (White / Light blue-grey)

        // Row separator (bottom line of current row)
        sumPage.drawLine({ start: { x: tblX, y: rowY }, end: { x: tblX + tblW, y: rowY }, thickness: 0.6, color: C.border });

        // Label text — bold & white (vertically centered)
        const lblSz = 10;
        sumPage.drawText(label, {
            x: tblX + cellPad,
            y: rowY + rowH / 2 - lblSz / 2,
            font: boldFont, size: lblSz, color: C.white,
        });

        // Value text — dark text & regular font (always)
        lines.forEach((ln, li) => {
            if (ln.trim()) {
                sumPage.drawText(ln, {
                    x: tblX + col1W + cellPad,
                    y: rowY + rowH - cellPad - 10 - li * lineH,
                    font: regFont, size: 10, color: C.darkText,
                });
            }
        });
        curY -= rowH;
    });

    // Table borders (Top line + outer borders + column divider using C.border)
    sumPage.drawLine({ start: { x: tblX, y: tblStartY }, end: { x: tblX + tblW, y: tblStartY }, thickness: 0.6, color: C.border }); // Top line
    sumPage.drawLine({ start: { x: tblX, y: tblStartY }, end: { x: tblX, y: curY }, thickness: 0.6, color: C.border }); // Left outer border
    sumPage.drawLine({ start: { x: tblX + tblW, y: tblStartY }, end: { x: tblX + tblW, y: curY }, thickness: 0.6, color: C.border }); // Right outer border
    sumPage.drawLine({ start: { x: tblX + col1W, y: tblStartY }, end: { x: tblX + col1W, y: curY }, thickness: 0.6, color: C.border }); // Column divider

    // ── DRAW FOOTER GRADIENT (Page 1 Only) ──────────
    const N = 100;
    const stripW = A4W / N;
    for (let j = 0; j < N; j++) {
        const t = j / N;
        // Interpolate from light blue (#42B0D5) to dark blue (#1c4587)
        const r = 0.259 * (1 - t) + 0.110 * t;
        const g = 0.690 * (1 - t) + 0.271 * t;
        const b = 0.835 * (1 - t) + 0.529 * t;
        sumPage.drawRectangle({
            x: j * stripW,
            y: 0,
            width: stripW + 0.5,
            height: 25,
            color: rgb(r, g, b)
        });
    }

    // Center footer text
    const footerText = '© www.teamtechvibe.com';
    const ftSz = 9;
    const ftW = regFont.widthOfTextAtSize(footerText, ftSz);
    sumPage.drawText(footerText, {
        x: (A4W - ftW) / 2,
        y: 12.5 - ftSz / 2,
        font: regFont,
        size: ftSz,
        color: C.white
    });

    // ── PAGES 2+: ORIGINAL CV WITH HEADER ─────────
    const origDoc   = await PDFDocument.load(pdfBytes);
    const origPages = origDoc.getPages();
    const total     = origPages.length;
    const embedded  = await outDoc.embedPdf(origDoc, Array.from({ length: total }, (_, i) => i));

    for (let i = 0; i < total; i++) {
        const op  = origPages[i];
        const cb  = op.getCropBox();
        const [cX, cY, cW, cH] = [cb.x, cb.y, cb.width, cb.height];

        const newPage = outDoc.addPage([op.getWidth(), op.getHeight()]);
        newPage.setCropBox(cX, cY, cW, cH);

        const phH    = (pngDims.height / pngDims.width) * cW;
        const sf     = Math.max(0.5, (cH - phH - 12) / cH);
        const dW     = op.getWidth()  * sf;
        const dH     = op.getHeight() * sf;
        const dX     = cX + (cW - cW * sf) / 2 - cX * sf;
        const dY     = cY - cY * sf;

        newPage.drawPage(embedded[i], { x: dX, y: dY, width: dW, height: dH });
        newPage.drawImage(pngImage, { x: cX, y: cY + cH - phH, width: cW, height: phH });
    }

    const outBytes = await outDoc.save();
    return outBytes;
}

cvGenerateBtn.addEventListener('click', async () => {
    const activeFile = cvState.files.find(f => f.id === cvState.activeFileId);
    if (!activeFile || !cvState.pngFile || activeFile.status !== 'ready') return;

    try {
        loadingOverlay.classList.add('active');
        loaderTitle.textContent = 'Generating CV Report...';
        updateProgress(20, 'Reading files & processing PDF...');

        const outBytes = await generateReportBytes(activeFile);
        
        updateProgress(90, 'Downloading...');
        const blob = new Blob([outBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${activeFile.name.replace(/\.pdf$/i, '')}_CV_Report.pdf`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);

        setTimeout(() => {
            loadingOverlay.classList.remove('active');
            loaderTitle.textContent = 'Đang xử lý tài liệu...';
            showToast('CV Report generated successfully!', 'success');
        }, 800);

    } catch (err) {
        console.error(err);
        loadingOverlay.classList.remove('active');
        loaderTitle.textContent = 'Đang xử lý tài liệu...';
        showToast(err.message || 'An error occurred!', 'error');
    }
});

cvExportAllBtn.addEventListener('click', async () => {
    const readyFiles = cvState.files.filter(f => f.status === 'ready');
    if (readyFiles.length === 0 || !cvState.pngFile) return;

    try {
        loadingOverlay.classList.add('active');
        loaderTitle.textContent = 'Xuất hàng loạt CV...';
        updateProgress(5, 'Khởi tạo...');

        const zip = new JSZip();
        
        for (let i = 0; i < readyFiles.length; i++) {
            const fileEntry = readyFiles[i];
            const pct = 5 + Math.floor((i / readyFiles.length) * 85);
            updateProgress(pct, `Đang xử lý (${i + 1}/${readyFiles.length}): ${fileEntry.name}...`);
            
            const outBytes = await generateReportBytes(fileEntry);
            
            const fileName = `${fileEntry.name.replace(/\.pdf$/i, '')}_CV_Report.pdf`;
            zip.file(fileName, outBytes);
        }

        updateProgress(90, 'Đang đóng gói file ZIP...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        updateProgress(98, 'Đang tải xuống...');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `CV_Reports_${Date.now()}.zip`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);

        setTimeout(() => {
            loadingOverlay.classList.remove('active');
            loaderTitle.textContent = 'Đang xử lý tài liệu...';
            showToast(`Đã đóng gói và tải xuống thành công ${readyFiles.length} file CV!`, 'success');
        }, 800);

    } catch (err) {
        console.error(err);
        loadingOverlay.classList.remove('active');
        loaderTitle.textContent = 'Đang xử lý tài liệu...';
        showToast(err.message || 'Có lỗi xảy ra khi đóng gói hàng loạt!', 'error');
    }
});

// Initialize form state
syncFormWithActiveFile();
