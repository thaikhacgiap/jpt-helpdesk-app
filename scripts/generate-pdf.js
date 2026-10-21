const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function printPdf(htmlFilePath, outputPdfPath) {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9225;
  const tempProfile = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_cdp_pdf_' + Date.now();
  
  console.log('Khởi chạy trình duyệt headless Chrome...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`
  ]);

  let version = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      version = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/json/version`, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
      if (version) break;
    } catch (e) {}
  }

  if (!version) {
    chrome.kill();
    throw new Error('Không thể kết nối Chrome DevTools Protocol');
  }

  // Get existing page or create new one
  const tabs = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json/list`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  let targetTab = tabs.find(t => t.type === 'page');
  if (!targetTab) {
    targetTab = await new Promise((resolve, reject) => {
      const req = http.request({
        host: '127.0.0.1',
        port: port,
        path: '/json/new',
        method: 'PUT'
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.end();
    });
  }

  const wsUrl = targetTab.webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise(resolve => ws.onopen = resolve);

  await send('Page.enable');
  
  const fileUrl = 'file:///' + path.resolve(htmlFilePath).replace(/\\/g, '/');
  console.log('Đang tải nội dung tài liệu:', fileUrl);
  await send('Page.navigate', { url: fileUrl });

  // Wait for rendering
  await new Promise(r => setTimeout(r, 2000));

  console.log('Đang xuất bản file PDF chuẩn A4...');
  const pdfResult = await send('Page.printToPDF', {
    printBackground: true,
    paperWidth: 8.27, // A4 dimensions in inches
    paperHeight: 11.69,
    marginTop: 0.4,
    marginBottom: 0.5,
    marginLeft: 0.4,
    marginRight: 0.4,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 8px; font-family: Segoe UI, -apple-system, sans-serif; color: #64748b; width: 100%; padding-left: 20px; padding-right: 20px; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;"><span>Tài Liệu Hướng Dẫn Sử Dụng - JPT Helpdesk &amp; Project Management v4.0</span><span>JPROTECH COMPANY</span></div>',
    footerTemplate: '<div style="font-size: 8px; font-family: Segoe UI, -apple-system, sans-serif; color: #64748b; width: 100%; padding-left: 20px; padding-right: 20px; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 3px;"><span>Bản quyền © 2026 JPROTECH COMPANY</span><span>Trang <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'
  });

  const buffer = Buffer.from(pdfResult.data, 'base64');
  fs.writeFileSync(outputPdfPath, buffer);
  console.log(`Đã tạo thành công file PDF: ${outputPdfPath} (${(buffer.length / 1024).toFixed(1)} KB)`);

  ws.close();
  chrome.kill();
  try {
    fs.rmSync(tempProfile, { recursive: true, force: true });
  } catch (e) {}
}

const inputHtml = path.resolve('HUONG_DAN_SU_DUNG_PHAN_MEM.html');
const outputPdf = path.resolve('HUONG_DAN_SU_DUNG_PHAN_MEM_JPT_HELPDESK.pdf');

printPdf(inputHtml, outputPdf)
  .then(() => {
    console.log('=== XUẤT FILE PDF HOÀN TẤT ===');
    process.exit(0);
  })
  .catch(err => {
    console.error('LỖI KHI XUẤT PDF:', err);
    process.exit(1);
  });
