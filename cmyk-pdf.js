/**
 * LINK GÔNDOLAS WF - PDF Generator
 * Generates ISO 32000 compliant PDF documents in Native Colors (DeviceRGB)
 * preserving 100% of the original colors, saturation and quality.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CmykPdf = factory();
    root.PdfEngine = root.CmykPdf;
  }
})(typeof self !== 'undefined' ? self : this, function () {

  // Convert Base64 Data URL to Uint8Array binary bytes
  function dataUriToUint8Array(dataUri) {
    const base64 = dataUri.split(',')[1];
    const binaryStr = atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  }

  // Encode ASCII string into Uint8Array
  function asciiToBytes(str) {
    const arr = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      arr[i] = str.charCodeAt(i) & 0xff;
    }
    return arr;
  }

  // Concatenate multiple Uint8Arrays into one
  function concatArrays(arrays) {
    let totalLength = 0;
    for (let i = 0; i < arrays.length; i++) {
      totalLength += arrays[i].length;
    }
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (let i = 0; i < arrays.length; i++) {
      result.set(arrays[i], offset);
      offset += arrays[i].length;
    }
    return result;
  }

  /**
   * Builds an ISO 32000 compliant PDF document using Original Colors (DeviceRGB)
   * via high-quality DCTDecode (JPEG 98% quality).
   */
  function buildPdf({
    canvas,
    layout = 'a4-4x', // 'a4-full', 'a4-4x', 'a4-2x', 'a5-single'
    cropMarks = true,
    safeMarginMm = 0 // 0 for bleed, 5 for office printer safe margin
  }) {
    // 1 mm in PDF points (72 pt per inch)
    const mmToPt = 72 / 25.4;
    const a4WidthPt = 210 * mmToPt; // ~595.28 pt
    const a4HeightPt = 297 * mmToPt; // ~841.89 pt

    let pageWidthPt = a4WidthPt;
    let pageHeightPt = a4HeightPt;

    const imgW = canvas.width;
    const imgH = canvas.height;

    // Export canvas with original colors at highest fidelity (JPEG 98%)
    const jpegDataUri = canvas.toDataURL('image/jpeg', 0.98);
    const imgBytes = dataUriToUint8Array(jpegDataUri);

    // Build Content Stream commands
    let contentStream = 'q\n';
    const safeMarginPt = safeMarginMm * mmToPt;

    if (layout === 'a4-full') {
      // Single flyer covering whole A4 sheet
      const drawX = safeMarginPt;
      const drawY = safeMarginPt;
      const drawW = pageWidthPt - 2 * safeMarginPt;
      const drawH = pageHeightPt - 2 * safeMarginPt;

      contentStream += `q ${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${drawX.toFixed(2)} ${drawY.toFixed(2)} cm /Im1 Do Q\n`;

      if (cropMarks && safeMarginPt > 0) {
        contentStream += `q 0.5 w [2 2] 0 d 0.4 G\n`;
        contentStream += `${drawX.toFixed(2)} 0 m ${drawX.toFixed(2)} ${pageHeightPt.toFixed(2)} l S\n`;
        contentStream += `${(drawX + drawW).toFixed(2)} 0 m ${(drawX + drawW).toFixed(2)} ${pageHeightPt.toFixed(2)} l S\n`;
        contentStream += `0 ${drawY.toFixed(2)} m ${pageWidthPt.toFixed(2)} ${drawY.toFixed(2)} l S\n`;
        contentStream += `0 ${(drawY + drawH).toFixed(2)} m ${pageWidthPt.toFixed(2)} ${(drawY + drawH).toFixed(2)} l S\n`;
        contentStream += `Q\n`;
      }

    } else if (layout === 'a4-4x') {
      // 4 flyers per A4 sheet (2x2 grid)
      pageWidthPt = a4WidthPt;
      pageHeightPt = a4HeightPt;

      const colW = pageWidthPt / 2; // 297.64 pt
      const rowH = pageHeightPt / 2; // 420.945 pt

      const cardW = colW - 2 * safeMarginPt;
      const cardH = rowH - 2 * safeMarginPt;

      // 4 grid cells: (col, row)
      const slots = [
        { col: 0, row: 1 }, // Top-Left
        { col: 1, row: 1 }, // Top-Right
        { col: 0, row: 0 }, // Bottom-Left
        { col: 1, row: 0 }  // Bottom-Right
      ];

      slots.forEach(slot => {
        const x = slot.col * colW + safeMarginPt;
        const y = slot.row * rowH + safeMarginPt;
        contentStream += `q ${cardW.toFixed(2)} 0 0 ${cardH.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im1 Do Q\n`;
      });

      if (cropMarks) {
        contentStream += `q 0.5 w [3 3] 0 d 0.4 G\n`;
        // Vertical divider
        contentStream += `${colW.toFixed(2)} 0 m ${colW.toFixed(2)} ${pageHeightPt.toFixed(2)} l S\n`;
        // Horizontal divider
        contentStream += `0 ${rowH.toFixed(2)} m ${pageWidthPt.toFixed(2)} ${rowH.toFixed(2)} l S\n`;

        if (safeMarginPt > 0) {
          slots.forEach(slot => {
            const x = slot.col * colW + safeMarginPt;
            const y = slot.row * rowH + safeMarginPt;
            contentStream += `${x.toFixed(2)} ${y.toFixed(2)} ${cardW.toFixed(2)} ${cardH.toFixed(2)} re S\n`;
          });
        }
        contentStream += `Q\n`;
      }

    } else if (layout === 'a4-2x') {
      // 2 flyers per A4 sheet (A4 Landscape, 2 columns of A5)
      pageWidthPt = a4HeightPt; // 841.89 pt
      pageHeightPt = a4WidthPt; // 595.28 pt

      const colW = pageWidthPt / 2; // 420.945 pt
      const cardW = colW - 2 * safeMarginPt;
      const cardH = pageHeightPt - 2 * safeMarginPt;

      // Left flyer
      const x1 = safeMarginPt;
      const y1 = safeMarginPt;
      contentStream += `q ${cardW.toFixed(2)} 0 0 ${cardH.toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)} cm /Im1 Do Q\n`;

      // Right flyer
      const x2 = colW + safeMarginPt;
      const y2 = safeMarginPt;
      contentStream += `q ${cardW.toFixed(2)} 0 0 ${cardH.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)} cm /Im1 Do Q\n`;

      if (cropMarks) {
        contentStream += `q 0.5 w [3 3] 0 d 0.4 G\n`;
        contentStream += `${colW.toFixed(2)} 0 m ${colW.toFixed(2)} ${pageHeightPt.toFixed(2)} l S\n`;
        contentStream += `Q\n`;
      }
    }

    contentStream += 'Q\n';
    const contentBytes = asciiToBytes(contentStream);

    // Assemble PDF Objects with native DeviceRGB color space and DCTDecode (JPEG)
    const imageHeader = asciiToBytes(
      `4 0 obj\n` +
      `<<\n` +
      `  /Type /XObject\n` +
      `  /Subtype /Image\n` +
      `  /Width ${imgW}\n` +
      `  /Height ${imgH}\n` +
      `  /ColorSpace /DeviceRGB\n` +
      `  /BitsPerComponent 8\n` +
      `  /Filter /DCTDecode\n` +
      `  /Length ${imgBytes.length}\n` +
      `>>\n` +
      `stream\n`
    );
    const imageFooter = asciiToBytes(`\nendstream\nendobj\n`);

    const chunks = [];
    const offsets = [];
    let currentOffset = 0;

    function pushChunk(chunk) {
      chunks.push(chunk);
      currentOffset += chunk.length;
    }

    // PDF Header
    pushChunk(asciiToBytes(`%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`));

    // 1 0 obj: Catalog
    offsets.push(currentOffset);
    pushChunk(asciiToBytes(
      `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`
    ));

    // 2 0 obj: Pages
    offsets.push(currentOffset);
    pushChunk(asciiToBytes(
      `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`
    ));

    // 3 0 obj: Page
    offsets.push(currentOffset);
    pushChunk(asciiToBytes(
      `3 0 obj\n` +
      `<<\n` +
      `  /Type /Page\n` +
      `  /Parent 2 0 R\n` +
      `  /MediaBox [0 0 ${pageWidthPt.toFixed(2)} ${pageHeightPt.toFixed(2)}]\n` +
      `  /Resources <<\n` +
      `    /ProcSet [/PDF /ImageC]\n` +
      `    /XObject << /Im1 4 0 R >>\n` +
      `  >>\n` +
      `  /Contents 5 0 R\n` +
      `>>\n` +
      `endobj\n`
    ));

    // 4 0 obj: Image XObject (DeviceRGB original colors)
    offsets.push(currentOffset);
    pushChunk(imageHeader);
    pushChunk(imgBytes);
    pushChunk(imageFooter);

    // 5 0 obj: Contents Stream
    offsets.push(currentOffset);
    pushChunk(asciiToBytes(
      `5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`
    ));
    pushChunk(contentBytes);
    pushChunk(asciiToBytes(`\nendstream\nendobj\n`));

    // XREF Table
    const xrefOffset = currentOffset;
    let xrefStr = `xref\n0 6\n0000000000 65535 f \n`;
    for (let i = 0; i < offsets.length; i++) {
      const offStr = String(offsets[i]).padStart(10, '0');
      xrefStr += `${offStr} 00000 n \n`;
    }
    xrefStr += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    pushChunk(asciiToBytes(xrefStr));

    return concatArrays(chunks);
  }

  // Trigger browser download of Blob
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  return {
    buildPdf,
    buildCmykPdf: buildPdf, // backward compatibility
    downloadBlob
  };
});
