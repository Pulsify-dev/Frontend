const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    console.log('Starting PDF generation...');
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      headless: 'new'
    });
    console.log('Browser launched.');
    
    const page = await browser.newPage();
    const htmlPath = path.resolve(__dirname, 'Pulsify_Phase3_Report.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    console.log('HTML content loaded.');

    const pdfPath = path.resolve(__dirname, 'Pulsify_Phase3_Report.pdf');
    await page.pdf({ 
      path: pdfPath, 
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
    });
    
    console.log('PDF generated successfully at: ' + pdfPath);
    await browser.close();
  } catch (err) {
    console.error('Failed to generate PDF:', err);
    process.exit(1);
  }
})();
