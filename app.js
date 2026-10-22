/**
 * LINK GÔNDOLAS WF - Main Application Logic
 * Typography: Amsi Pro Ultra (AmsiPro-Ultra)
 * Color Mode: Native Original Colors (RGB)
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const productNameInput = document.getElementById('productName');
  const productPriceInput = document.getElementById('productPrice');
  
  const productFontSizeSlider = document.getElementById('productFontSize');
  const productFontSizeVal = document.getElementById('productFontSizeVal');
  const priceFontSizeSlider = document.getElementById('priceFontSize');
  const priceFontSizeVal = document.getElementById('priceFontSizeVal');
  const textOffsetYSlider = document.getElementById('textOffsetY');
  const textOffsetYVal = document.getElementById('textOffsetYVal');
  
  const autoFitToggle = document.getElementById('autoFitToggle');
  const cropMarksToggle = document.getElementById('cropMarksToggle');
  const safeMarginToggle = document.getElementById('safeMarginToggle');
  
  const btnPdf4x = document.getElementById('btnPdf4x');
  const btnPdfA4 = document.getElementById('btnPdfA4');
  const btnPdf2x = document.getElementById('btnPdf2x');
  const btnDownloadPng = document.getElementById('btnDownloadPng');
  const btnPrint = document.getElementById('btnPrint');
  
  const tabBtns = document.querySelectorAll('.tab-btn');
  const canvasViewport = document.getElementById('canvasViewport');
  const toastMsg = document.getElementById('toastMsg');
  const toastText = document.getElementById('toastText');
  
  // Hidden master high-definition render canvas (1448 x 2048)
  const masterCanvas = document.createElement('canvas');
  masterCanvas.width = 1448;
  masterCanvas.height = 2048;
  const masterCtx = masterCanvas.getContext('2d');
  
  // Current active preview mode: 'single' | 'a4-4x' | 'a4-full' | 'a4-2x'
  let currentPreviewMode = 'single';
  
  // Base template image
  const templateImg = new Image();
  let templateLoaded = false;
  
  // Toast notification helper
  let toastTimer = null;
  function showToast(message, duration = 3000) {
    if (toastTimer) clearTimeout(toastTimer);
    toastText.textContent = message;
    toastMsg.classList.add('show');
    toastTimer = setTimeout(() => {
      toastMsg.classList.remove('show');
    }, duration);
  }

  // Sanitize filename for export
  function getSafeFilename(prefix, extension = 'pdf') {
    const rawName = productNameInput.value.trim() || 'produto';
    const cleanName = rawName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
    return `${prefix}-${cleanName || 'panfleto'}.${extension}`;
  }

  // Draw Flyer Content on Master Canvas
  function renderMasterCanvas() {
    if (!templateLoaded) return;
    
    const w = masterCanvas.width;   // 1448
    const h = masterCanvas.height;  // 2048
    
    // 1. Draw base clean template with original colors
    masterCtx.clearRect(0, 0, w, h);
    masterCtx.drawImage(templateImg, 0, 0, w, h);
    
    // Values from inputs
    const productName = productNameInput.value.trim() || 'Fralda Babysec Shortinho c/30';
    let productPrice = productPriceInput.value.trim() || '128,99';
    
    // Convert '.' to ',' in price for Brazilian currency standard
    if (productPrice.includes('.') && !productPrice.includes(',')) {
      productPrice = productPrice.replace('.', ',');
    }
    
    const baseProdSize = parseInt(productFontSizeSlider.value, 10);
    const basePriceSize = parseInt(priceFontSizeSlider.value, 10);
    const offsetY = parseInt(textOffsetYSlider.value, 10);
    const isAutoFit = autoFitToggle.checked;
    
    // ==========================================
    // 2. RENDER PRODUCT NAME (Fonte: Amsi Pro Ultra)
    // ==========================================
    const prodCenterX = 724;
    const prodCenterY = 936 + offsetY;
    const maxProdWidth = 1120;
    
    masterCtx.save();
    masterCtx.fillStyle = '#FFFFFF';
    masterCtx.textAlign = 'center';
    masterCtx.textBaseline = 'middle';
    
    let prodFontSize = baseProdSize;
    const prodFontFamily = "'Amsi Pro Ultra', 'AmsiPro-Ultra', 'Nunito', 'Barlow Condensed', sans-serif";
    masterCtx.font = `900 ${prodFontSize}px ${prodFontFamily}`;
    
    // Check if user has explicit line breaks
    const lines = productName.split('\n').map(l => l.trim()).filter(Boolean);
    
    if (lines.length > 1) {
      // Multi-line rendering
      let maxLineWidth = 0;
      lines.forEach(l => {
        const mw = masterCtx.measureText(l).width;
        if (mw > maxLineWidth) maxLineWidth = mw;
      });
      
      if (isAutoFit && maxLineWidth > maxProdWidth) {
        prodFontSize = Math.floor(prodFontSize * (maxProdWidth / maxLineWidth));
        masterCtx.font = `900 ${prodFontSize}px ${prodFontFamily}`;
      }
      
      const lineHeight = prodFontSize * 1.15;
      const startY = prodCenterY - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((l, idx) => {
        masterCtx.fillText(l, prodCenterX, startY + (idx * lineHeight));
      });
    } else {
      // Single line rendering
      let textWidth = masterCtx.measureText(productName).width;
      
      if (isAutoFit && textWidth > maxProdWidth) {
        prodFontSize = Math.floor(prodFontSize * (maxProdWidth / textWidth));
        masterCtx.font = `900 ${prodFontSize}px ${prodFontFamily}`;
      }
      
      masterCtx.fillText(productName, prodCenterX, prodCenterY);
    }
    masterCtx.restore();
    
    // ==========================================
    // 3. RENDER PRICE VALUE (Fonte: Amsi Pro Ultra)
    // ==========================================
    const priceCenterX = 748;
    const priceCenterY = 1354 + offsetY;
    const maxPriceWidth = 980;
    
    masterCtx.save();
    masterCtx.fillStyle = '#FFFFFF';
    masterCtx.textAlign = 'center';
    masterCtx.textBaseline = 'middle';
    
    let priceFontSize = basePriceSize;
    const priceFontFamily = "'Amsi Pro Ultra', 'AmsiPro-Ultra', 'Fredoka', 'Nunito', sans-serif";
    masterCtx.font = `900 ${priceFontSize}px ${priceFontFamily}`;
    
    let priceWidth = masterCtx.measureText(productPrice).width;
    if (isAutoFit && priceWidth > maxPriceWidth) {
      priceFontSize = Math.floor(priceFontSize * (maxPriceWidth / priceWidth));
      masterCtx.font = `900 ${priceFontSize}px ${priceFontFamily}`;
    }
    
    masterCtx.fillText(productPrice, priceCenterX, priceCenterY);
    masterCtx.restore();
    
    // Update the live viewport display
    updateViewportDisplay();
  }

  // Update Viewport according to current active tab
  function updateViewportDisplay() {
    canvasViewport.innerHTML = '';
    
    if (currentPreviewMode === 'single') {
      // Single flyer enlarged
      const wrapper = document.createElement('div');
      wrapper.className = 'sheet-wrapper sheet-single';
      
      const canvas = document.createElement('canvas');
      canvas.width = masterCanvas.width;
      canvas.height = masterCanvas.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(masterCanvas, 0, 0);
      
      wrapper.appendChild(canvas);
      canvasViewport.appendChild(wrapper);
      
    } else if (currentPreviewMode === 'a4-4x') {
      // 4 flyers in 2x2 grid on A4 Sheet
      const sheet = document.createElement('div');
      sheet.className = 'sheet-wrapper sheet-a4-preview';
      
      const grid = document.createElement('div');
      grid.className = 'grid-2x2';
      
      for (let i = 0; i < 4; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        const img = document.createElement('img');
        img.src = masterCanvas.toDataURL('image/jpeg', 0.95);
        cell.appendChild(img);
        grid.appendChild(cell);
      }
      
      sheet.appendChild(grid);
      canvasViewport.appendChild(sheet);
      
    } else if (currentPreviewMode === 'a4-full') {
      // Single large A4 sheet
      const sheet = document.createElement('div');
      sheet.className = 'sheet-wrapper sheet-a4-preview';
      
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.style.width = '100%';
      cell.style.height = '100%';
      
      const img = document.createElement('img');
      img.src = masterCanvas.toDataURL('image/jpeg', 0.95);
      cell.appendChild(img);
      sheet.appendChild(cell);
      canvasViewport.appendChild(sheet);
      
    } else if (currentPreviewMode === 'a4-2x') {
      // 2 flyers side by side (Landscape A4)
      const sheet = document.createElement('div');
      sheet.className = 'sheet-wrapper sheet-a4-preview';
      sheet.style.width = '620px';
      sheet.style.height = '438px';
      
      const grid = document.createElement('div');
      grid.className = 'grid-1x2';
      
      for (let i = 0; i < 2; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        const img = document.createElement('img');
        img.src = masterCanvas.toDataURL('image/jpeg', 0.95);
        cell.appendChild(img);
        grid.appendChild(cell);
      }
      
      sheet.appendChild(grid);
      canvasViewport.appendChild(sheet);
    }
  }

  // PDF Export Trigger (Cores Originais mantidas sem conversão)
  async function exportPdf(layout, prefix) {
    showToast('⚙️ Gerando arquivo PDF com Cores Originais em Alta Resolução...');
    
    setTimeout(() => {
      try {
        const cropMarks = cropMarksToggle.checked;
        const safeMarginMm = safeMarginToggle.checked ? 5 : 0;
        
        const pdfBytes = CmykPdf.buildPdf({
          canvas: masterCanvas,
          layout: layout,
          cropMarks: cropMarks,
          safeMarginMm: safeMarginMm
        });
        
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const filename = getSafeFilename(prefix, 'pdf');
        CmykPdf.downloadBlob(blob, filename);
        
        showToast(`✅ PDF baixado com sucesso: ${filename}!`);
      } catch (err) {
        console.error('Erro ao gerar PDF:', err);
        showToast('❌ Erro na geração do PDF. Verifique o console.');
      }
    }, 40);
  }

  // Event Listeners for Live Updates
  productNameInput.addEventListener('input', renderMasterCanvas);
  productPriceInput.addEventListener('input', renderMasterCanvas);
  
  productFontSizeSlider.addEventListener('input', () => {
    productFontSizeVal.textContent = `${productFontSizeSlider.value}px`;
    renderMasterCanvas();
  });
  
  priceFontSizeSlider.addEventListener('input', () => {
    priceFontSizeVal.textContent = `${priceFontSizeSlider.value}px`;
    renderMasterCanvas();
  });
  
  textOffsetYSlider.addEventListener('input', () => {
    textOffsetYVal.textContent = `${textOffsetYSlider.value}px`;
    renderMasterCanvas();
  });
  
  autoFitToggle.addEventListener('change', renderMasterCanvas);
  cropMarksToggle.addEventListener('change', () => {
    if (currentPreviewMode === 'a4-4x' || currentPreviewMode === 'a4-2x') {
      updateViewportDisplay();
    }
  });
  safeMarginToggle.addEventListener('change', () => {
    if (currentPreviewMode === 'a4-4x' || currentPreviewMode === 'a4-2x') {
      updateViewportDisplay();
    }
  });

  // Tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPreviewMode = btn.getAttribute('data-mode');
      updateViewportDisplay();
    });
  });

  // Preset Chips
  document.querySelectorAll('.chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      const prod = chip.getAttribute('data-prod');
      const price = chip.getAttribute('data-price');
      if (prod) productNameInput.value = prod;
      if (price) productPriceInput.value = price;
      renderMasterCanvas();
      showToast(`Carregado: ${prod}`);
    });
  });

  // Export Buttons
  btnPdf4x.addEventListener('click', () => exportPdf('a4-4x', 'panfleto-gondola-4x-A4'));
  btnPdfA4.addEventListener('click', () => exportPdf('a4-full', 'panfleto-gondola-A4-inteira'));
  btnPdf2x.addEventListener('click', () => exportPdf('a4-2x', 'panfleto-gondola-2x-A5'));

  // PNG High-Res Download
  btnDownloadPng.addEventListener('click', () => {
    masterCanvas.toBlob(blob => {
      const filename = getSafeFilename('panfleto-gondola-hd', 'png');
      CmykPdf.downloadBlob(blob, filename);
      showToast(`✅ Imagem HD baixada: ${filename}`);
    }, 'image/png');
  });

  // Direct Print
  btnPrint.addEventListener('click', () => {
    window.print();
  });

  // Ensure fonts are loaded and trigger re-render
  if (document.fonts) {
    document.fonts.ready.then(() => {
      renderMasterCanvas();
    });
  }

  // Initialize and load template image
  templateImg.onload = () => {
    templateLoaded = true;
    renderMasterCanvas();
  };

  // If base64 embedded template is available, load it instantly (no CORS issue)
  if (typeof TEMPLATE_HD_BASE64 !== 'undefined') {
    templateImg.src = TEMPLATE_HD_BASE64;
  } else if (typeof TEMPLATE_BASE64 !== 'undefined') {
    templateImg.src = TEMPLATE_BASE64;
  } else {
    templateImg.src = 'assets/template_clean_hd.png';
  }
});
