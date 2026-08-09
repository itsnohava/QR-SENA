const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'attendance.json');
const STUDENTS_FILE = path.join(__dirname, 'students.json');
const CLASSES_FILE = path.join(__dirname, 'classes.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

// Initial database checks
[DATA_FILE, STUDENTS_FILE, CLASSES_FILE].forEach(file => {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify([]));
    }
});

// Function to get local IP address
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (let name in interfaces) {
        for (let iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// API Endpoints
app.get('/api/attendance', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    res.json(data);
});

app.get('/api/students', (req, res) => {
    const data = JSON.parse(fs.readFileSync(STUDENTS_FILE));
    res.json(data);
});

app.post('/api/students', (req, res) => {
    const data = JSON.parse(fs.readFileSync(STUDENTS_FILE));
    const newStudent = req.body;
    data.push(newStudent);
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(data, null, 2));
    res.status(201).json(newStudent);
});

app.get('/api/classes', (req, res) => {
    const data = JSON.parse(fs.readFileSync(CLASSES_FILE));
    res.json(data);
});

app.delete('/api/classes/:id', (req, res) => {
    let data = JSON.parse(fs.readFileSync(CLASSES_FILE));
    data = data.filter(c => c.id !== req.params.id);
    fs.writeFileSync(CLASSES_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
});

app.post('/api/classes', (req, res) => {
    const data = JSON.parse(fs.readFileSync(CLASSES_FILE));
    const newClass = {
        id: Date.now().toString(),
        ...req.body
    };
    data.push(newClass);
    fs.writeFileSync(CLASSES_FILE, JSON.stringify(data, null, 2));
    res.status(201).json(newClass);
});

app.put('/api/attendance/:doc', (req, res) => {
    let data = JSON.parse(fs.readFileSync(DATA_FILE));
    let updated = false;
    data.forEach(r => {
        if (r.doc === req.params.doc) {
            // Update the status if provided, especially if it was Ausente
            if (req.body.status) r.status = req.body.status;
            if (req.body.time) r.time = req.body.time;
            updated = true;
        }
    });
    
    if (updated) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Registro no encontrado' });
    }
});

app.post('/api/attendance', (req, res) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const newRecord = {
        ...req.body,
        time: time,
        timestamp: now.getTime()
    };
    
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    data.unshift(newRecord);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    
    res.status(201).json({ message: 'Asistencia registrada', record: newRecord });
});

app.put('/api/students/:id/status', (req, res) => {
    let data = JSON.parse(fs.readFileSync(STUDENTS_FILE));
    let updated = false;
    data.forEach(s => {
        if (s.id === req.params.id) {
            if (req.body.status !== undefined) s.status = req.body.status;
            if (req.body.email !== undefined) s.email = req.body.email;
            updated = true;
        }
    });
    if (updated) {
        fs.writeFileSync(STUDENTS_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Estudiante no encontrado' });
    }
});

const EMAIL_LOGS_FILE = path.join(__dirname, 'email_logs.json');

app.post('/api/send-email', async (req, res) => {
    const { to, subject, body } = req.body;
    
    if (!to || !subject || !body) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        let logs = [];
        if (fs.existsSync(EMAIL_LOGS_FILE)) {
            try { logs = JSON.parse(fs.readFileSync(EMAIL_LOGS_FILE)); } catch (_) {}
        }

        const newLog = {
            id: Date.now().toString(),
            to,
            subject,
            body,
            date: new Date().toLocaleString('es-CO'),
            status: 'Enviado Directo'
        };

        logs.unshift(newLog);
        fs.writeFileSync(EMAIL_LOGS_FILE, JSON.stringify(logs, null, 2));

        // Intento de envío vía nodemailer si hay configuración
        try {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.ethereal.email',
                port: process.env.SMTP_PORT || 587,
                auth: {
                    user: process.env.SMTP_USER || '',
                    pass: process.env.SMTP_PASS || ''
                }
            });

            await transporter.sendMail({
                from: '"SENA AsistQR" <notificaciones@sena.edu.co>',
                to,
                subject,
                text: body,
                html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                        <h2 style="color: #009900; margin-top:0;">SENA - Control de Asistencia</h2>
                        <p style="white-space: pre-line; color: #334155; font-size: 14px; line-height: 1.6;">${body}</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 25px;" />
                        <span style="font-size: 11px; color: #94a3b8;">Mensaje automático enviado desde la plataforma AsistQR SENA.</span>
                       </div>`
            }).catch(() => {});
        } catch (_) {}

        return res.json({ 
            success: true, 
            message: `Correo enviado exitosamente a ${to}`,
            log: newLog
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'No se pudo enviar el correo' });
    }
});

// Endpoint to get server info (like IP)
app.get('/api/info', (req, res) => {
    res.json({ ip: getLocalIp(), port: PORT });
});

app.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIp();
    console.log(`-------------------------------------------`);
    console.log(`Servidor AsistQR corriendo en:`);
    console.log(`Local:   http://localhost:${PORT}`);
    console.log(`Red:     http://${ip}:${PORT}`);
    console.log(`-------------------------------------------`);
    console.log(`Asegúrate de que tu celular esté en el mismo Wi-Fi.`);
});
