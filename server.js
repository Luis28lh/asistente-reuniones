// Servidor local de desarrollo para AIR v1.1 — Asistente Inteligente de Reuniones
const http = require('http');
const fs = require('fs');
const path = require('path');
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (_) {
  console.log('[AIR Server] nodemailer no instalado');
}

const PORT = process.env.PORT || 3005;
const PUBLIC_DIR = __dirname;
const MINUTAS_DIR = path.join(PUBLIC_DIR, 'minutas_generadas');

// Asegurar existencia de carpeta minutas_generadas
if (!fs.existsSync(MINUTAS_DIR)) {
  fs.mkdirSync(MINUTAS_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Configuración de CORS para pruebas locales
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqUrl = req.url.split('?')[0];

  // API 1: Guardar minuta en carpeta minutas_generadas/
  if (req.method === 'POST' && reqUrl === '/api/minutas') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const cleanTitle = (data.titulo || 'Minuta').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_').substring(0, 30);
        const filename = `Minuta_${timestamp}_${cleanTitle}.json`;
        const targetPath = path.join(MINUTAS_DIR, filename);

        fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, filename, path: `/minutas_generadas/${filename}` }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 2: Listar archivos de minutas en carpeta minutas_generadas/
  if (req.method === 'GET' && reqUrl === '/api/minutas') {
    try {
      const files = fs.readdirSync(MINUTAS_DIR).filter(f => f.endsWith('.json'));
      const minutas = files.map(file => {
        const fullPath = path.join(MINUTAS_DIR, file);
        const stats = fs.statSync(fullPath);
        let summary = {};
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          summary = {
            titulo: content.titulo || 'Sin título',
            fechaHora: content.fechaHora || stats.mtime.toLocaleString('es-ES'),
            participantes: content.participantes || []
          };
        } catch (_) {}
        return {
          filename: file,
          url: `/minutas_generadas/${file}`,
          size: stats.size,
          createdAt: stats.mtime,
          ...summary
        };
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: minutas.length, minutas }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // API 3: Despacho de correo oficial personalizado con logo y PDF adjunto
  if (req.method === 'POST' && reqUrl === '/api/send-email') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        if (!nodemailer) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'El módulo nodemailer no está disponible en el servidor.' }));
          return;
        }

        const payload = JSON.parse(body || '{}');
        const { to, subject, html, text, pdfBase64, pdfFilename, smtp } = payload;

        if (!to || (Array.isArray(to) && to.length === 0)) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'No se indicaron correos destinatarios.' }));
          return;
        }

        let transporter;
        const smtpHost = smtp?.host || process.env.SMTP_HOST;
        const smtpUser = smtp?.user || process.env.SMTP_USER;
        const smtpPass = smtp?.pass || process.env.SMTP_PASS;
        const smtpPort = Number(smtp?.port || process.env.SMTP_PORT || 587);

        let isTest = false;
        if (smtpHost && smtpUser && smtpPass) {
          transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass
            }
          });
        } else {
          // Si no se proporcionaron credenciales SMTP personalizadas, usamos buzón seguro de prueba Ethereal
          isTest = true;
          const testAccount = await nodemailer.createTestAccount();
          transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
          });
        }

        const attachments = [];
        if (pdfBase64) {
          const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
          attachments.push({
            filename: pdfFilename || 'Acta_Minuta_Oficial.pdf',
            content: Buffer.from(cleanBase64, 'base64'),
            contentType: 'application/pdf'
          });
        }

        const fromAddress = smtpUser
          ? `"AIR — Asistente de Reuniones" <${smtpUser}>`
          : '"AIR — Asistente de Reuniones" <despacho@air-reuniones.local>';

        const recipientsList = Array.isArray(to) ? to.join(', ') : to;

        const info = await transporter.sendMail({
          from: fromAddress,
          to: recipientsList,
          subject: subject || 'Minuta Oficial de Sesión',
          text: text || '',
          html: html || '',
          attachments
        });

        const testPreviewUrl = isTest ? nodemailer.getTestMessageUrl(info) : null;

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          messageId: info.messageId,
          isTest,
          testPreviewUrl,
          accepted: info.accepted
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Servir archivos estáticos
  if (reqUrl === '/' || reqUrl === '') {
    reqUrl = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, reqUrl);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Prohibido');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Recurso no encontrado');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`[AIR v1.1 Server] Asistente de Reuniones activo en: http://localhost:${PORT}`);
});
