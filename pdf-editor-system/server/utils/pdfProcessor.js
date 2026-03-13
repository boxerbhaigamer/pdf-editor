const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

// Apply template to a PDF document
const applyTemplateToPdf = async (pdfBuffer, template) => {
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    // Embed fonts
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Define header height (decreased to prevent covering sub-headers)
    const headerHeight = 77;

    // Try to embed logos if they exist
    let leftLogoImage = null;
    let rightLogoImage = null;

    if (template.left_logo_url || template.leftLogoUrl) {
      try {
        const logoUrl = template.left_logo_url || template.leftLogoUrl;
        const logoPath = path.join(__dirname, '..', logoUrl);
        const logoBytes = await fs.readFile(logoPath);
        leftLogoImage = await pdfDoc.embedPng(logoBytes).catch(() => null);
        if (!leftLogoImage) {
          leftLogoImage = await pdfDoc.embedJpg(logoBytes).catch(() => null);
        }
      } catch {
        // Logo file not found, skip
      }
    }

    if (template.right_logo_url || template.rightLogoUrl) {
      try {
        const logoUrl = template.right_logo_url || template.rightLogoUrl;
        const logoPath = path.join(__dirname, '..', logoUrl);
        const logoBytes = await fs.readFile(logoPath);
        rightLogoImage = await pdfDoc.embedPng(logoBytes).catch(() => null);
        if (!rightLogoImage) {
          rightLogoImage = await pdfDoc.embedJpg(logoBytes).catch(() => null);
        }
      } catch {
        // Logo file not found, skip
      }
    }

    // Apply template to each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      // Draw white rectangle to cover existing header
      page.drawRectangle({
        x: 0,
        y: height - headerHeight,
        width: width,
        height: headerHeight,
        color: rgb(1, 1, 1) // White
      });

      // Draw a thin line at bottom of header
      page.drawLine({
        start: { x: 20, y: height - headerHeight },
        end: { x: width - 20, y: height - headerHeight },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7)
      });

      const logoSize = 60;
      const logoPadding = 20;

      // Draw left logo
      if (leftLogoImage) {
        const logoDims = leftLogoImage.scale(logoSize / Math.max(leftLogoImage.width, leftLogoImage.height));
        page.drawImage(leftLogoImage, {
          x: logoPadding,
          y: height - headerHeight + (headerHeight - logoDims.height) / 2,
          width: logoDims.width,
          height: logoDims.height,
        });
      }

      // Draw right logo
      if (rightLogoImage) {
        const logoDims = rightLogoImage.scale(logoSize / Math.max(rightLogoImage.width, rightLogoImage.height));
        page.drawImage(rightLogoImage, {
          x: width - logoPadding - logoDims.width,
          y: height - headerHeight + (headerHeight - logoDims.height) / 2,
          width: logoDims.width,
          height: logoDims.height,
        });
      }

      // Calculate text area (between logos)
      const textAreaStart = leftLogoImage ? logoPadding + logoSize + 10 : logoPadding;
      const textAreaEnd = rightLogoImage ? width - logoPadding - logoSize - 10 : width - logoPadding;
      const textAreaWidth = textAreaEnd - textAreaStart;
      const textCenterX = textAreaStart + textAreaWidth / 2;

      // Tournament title
      const titleText = template.title || '';
      const titleSize = 18;
      const titleWidth = titleFont.widthOfTextAtSize(titleText, titleSize);
      page.drawText(titleText, {
        x: textCenterX - titleWidth / 2,
        y: height - 20,
        size: titleSize,
        font: titleFont,
        color: rgb(0.1, 0.1, 0.1)
      });

      // Subtitle
      const subtitleText = template.subtitle || '';
      if (subtitleText) {
        const subtitleSize = 13;
        const subtitleWidth = bodyFont.widthOfTextAtSize(subtitleText, subtitleSize);
        page.drawText(subtitleText, {
          x: textCenterX - subtitleWidth / 2,
          y: height - 38,
          size: subtitleSize,
          font: bodyFont,
          color: rgb(0.2, 0.2, 0.2)
        });
      }

      // Venue
      const venueText = template.venue || '';
      if (venueText) {
        const venueSize = 11;
        const venueWidth = bodyFont.widthOfTextAtSize(venueText, venueSize);
        page.drawText(venueText, {
          x: textCenterX - venueWidth / 2,
          y: height - 52,
          size: venueSize,
          font: bodyFont,
          color: rgb(0.3, 0.3, 0.3)
        });
      }

      // Dates
      const datesText = template.dates || '';
      if (datesText) {
        const datesSize = 11;
        const datesWidth = bodyFont.widthOfTextAtSize(datesText, datesSize);
        page.drawText(datesText, {
          x: textCenterX - datesWidth / 2,
          y: height - 65,
          size: datesSize,
          font: bodyFont,
          color: rgb(0.3, 0.3, 0.3)
        });
      }
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    return Buffer.from(modifiedPdfBytes);
  } catch (error) {
    throw new Error(`Failed to apply template to PDF: ${error.message}`);
  }
};

module.exports = {
  applyTemplateToPdf
};