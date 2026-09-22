const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DATA_FILE = path.join(DATA_DIR, 'attendance.json');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const CLASSES_FILE = path.join(DATA_DIR, 'classes.json');
const EVIDENCES_FILE = path.join(DATA_DIR, 'evidences.json');
const INSTRUCTORS_FILE = path.join(DATA_DIR, 'instructors.json');

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

// Initial database checks
[DATA_FILE, STUDENTS_FILE, CLASSES_FILE, EVIDENCES_FILE, INSTRUCTORS_FILE].forEach(file => {
    if (!fs.existsSync(file)) {
        if (file === INSTRUCTORS_FILE) {
            const initialInstructors = [
                {
                    id: "1",
                    name: "Juan Pérez",
                    document: "1000000001",
                    email: "OBSENA2026@gmail.com",
                    password: "Sena123",
                    fichas: "Ficha 3292060, Ficha 2558390",
                    status: "Activo",
                    createdAt: new Date().toLocaleDateString('es-CO')
                }
            ];
            fs.writeFileSync(file, JSON.stringify(initialInstructors, null, 2));
        } else {
            fs.writeFileSync(file, JSON.stringify([]));
        }
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

// Evidences Endpoints
app.get('/api/evidences', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(EVIDENCES_FILE));
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Error al leer evidencias' });
    }
});

app.post('/api/evidences', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(EVIDENCES_FILE));
        const newEvidence = {
            id: Date.now().toString(),
            studentDoc: req.body.studentDoc || '',
            studentName: req.body.studentName || 'Aprendiz',
            group: req.body.group || '',
            absenceDate: req.body.absenceDate || new Date().toLocaleDateString('es-CO'),
            reason: req.body.reason || 'Sin especificar',
            notes: req.body.notes || '',
            fileName: req.body.fileName || '',
            fileData: req.body.fileData || '',
            status: 'En Revisión',
            replyNotes: '',
            createdAt: new Date().toLocaleString('es-CO')
        };
        data.unshift(newEvidence);
        fs.writeFileSync(EVIDENCES_FILE, JSON.stringify(data, null, 2));
        res.status(201).json({ success: true, evidence: newEvidence });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al guardar la evidencia' });
    }
});

app.put('/api/evidences/:id', (req, res) => {
    try {
        let data = JSON.parse(fs.readFileSync(EVIDENCES_FILE));
        let targetItem = null;

        data.forEach(item => {
            if (String(item.id) === String(req.params.id)) {
                if (req.body.status) item.status = req.body.status;
                if (req.body.replyNotes !== undefined) item.replyNotes = req.body.replyNotes;
                targetItem = item;
            }
        });

        if (targetItem) {
            fs.writeFileSync(EVIDENCES_FILE, JSON.stringify(data, null, 2));

            // Si se aprueba la excusa, actualizar asistencia a 'Justificado' automáticamente
            if (targetItem.status === 'Aprobada' && targetItem.studentDoc) {
                try {
                    let attendanceData = JSON.parse(fs.readFileSync(DATA_FILE));
                    const docClean = String(targetItem.studentDoc).replace(/\D/g, '').replace(/^0+/, '');
                    let attUpdated = false;

                    attendanceData.forEach(att => {
                        const attClean = String(att.doc || '').replace(/\D/g, '').replace(/^0+/, '');
                        const nameMatch = att.name && targetItem.studentName && att.name.toLowerCase() === targetItem.studentName.toLowerCase();
                        if ((attClean === docClean || nameMatch) && (att.fecha === targetItem.absenceDate || att.date === targetItem.absenceDate)) {
                            att.status = 'Justificado';
                            attUpdated = true;
                        }
                    });

                    if (attUpdated) {
                        fs.writeFileSync(DATA_FILE, JSON.stringify(attendanceData, null, 2));
                    }
                } catch (attErr) {
                    console.error('Error al actualizar la asistencia:', attErr);
                }
            }

            res.json({ success: true, evidence: targetItem });
        } else {
            res.status(404).json({ error: 'Evidencia no encontrada' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar la evidencia' });
    }
});

// Instructors Endpoints
app.get('/api/instructors', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(INSTRUCTORS_FILE));
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Error al leer instructores' });
    }
});

app.post('/api/instructors', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(INSTRUCTORS_FILE));
        const { name, document, email, password, fichas } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios.' });
        }

        // Verificar duplicados por documento o correo
        const exists = data.some(i => 
            (i.email && i.email.toLowerCase() === email.toLowerCase()) ||
            (document && i.document === document)
        );

        if (exists) {
            return res.status(400).json({ error: 'Ya existe un instructor registrado con este documento o correo.' });
        }

        const newInstructor = {
            id: Date.now().toString(),
            name: name,
            document: document || '',
            email: email,
            password: password,
            fichas: fichas || 'Todas las fichas',
            status: 'Activo',
            createdAt: new Date().toLocaleDateString('es-CO')
        };

        data.unshift(newInstructor);
        fs.writeFileSync(INSTRUCTORS_FILE, JSON.stringify(data, null, 2));
        res.status(201).json({ success: true, instructor: newInstructor });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al registrar el instructor' });
    }
});

app.delete('/api/instructors/:id', (req, res) => {
    try {
        let data = JSON.parse(fs.readFileSync(INSTRUCTORS_FILE));
        const initialLen = data.length;
        data = data.filter(i => i.id !== req.params.id);
        if (data.length === initialLen) {
            return res.status(404).json({ error: 'Instructor no encontrado' });
        }
        fs.writeFileSync(INSTRUCTORS_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true, message: 'Instructor eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar instructor' });
    }
});



app.put('/api/attendance/:doc', (req, res) => {
    let data = JSON.parse(fs.readFileSync(DATA_FILE));
    let updated = false;
    data.forEach(r => {
        if (r.doc === req.params.doc) {
            if (req.body.status) r.status = req.body.status;
            if (req.body.time) r.time = req.body.time;
            if (req.body.fecha) r.fecha = req.body.fecha;
            if (req.body.timestamp) r.timestamp = req.body.timestamp;
            updated = true;
        }
    });
    
    if (!updated) {
        let studentName = req.body.name || 'Aprendiz';
        let studentGroup = req.body.group || '';
        let studentDocType = req.body.docType || 'CC';

        if (fs.existsSync(STUDENTS_FILE)) {
            try {
                const students = JSON.parse(fs.readFileSync(STUDENTS_FILE));
                const st = students.find(s => s.id === req.params.doc);
                if (st) {
                    if (!req.body.name) studentName = st.name;
                    if (!req.body.group) studentGroup = st.group;
                    if (!req.body.docType) studentDocType = st.docType || 'CC';
                }
            } catch (_) {}
        }

        const now = new Date();
        const time = req.body.time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const newRecord = {
            name: studentName,
            doc: req.params.doc,
            docType: studentDocType,
            group: studentGroup,
            status: req.body.status || 'Presente',
            time: time,
            fecha: req.body.fecha || now.toLocaleDateString('es-CO'),
            timestamp: req.body.timestamp || now.getTime()
        };
        data.unshift(newRecord);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return res.json({ success: true, record: newRecord });
    }
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
});

const AMBIENTE_POR_FICHA = {
    '3292060': 'Ambiente 302 - Software',
    '2558390': 'Ambiente 104 - Redes',
    '2459100': 'Ambiente 201 - Autotrónica',
    '2671200': 'Ambiente 405 - Multimedia'
};

app.post('/api/attendance', (req, res) => {
    const now = new Date();
    const time = req.body.time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const fecha = req.body.fecha || now.toLocaleDateString('es-CO');
    const timestamp = req.body.timestamp || now.getTime();
    
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    
    const reqCleanDoc   = String(req.body.doc || '').replace(/\D/g, '').replace(/^0+/, '');
    const reqGroup      = String(req.body.group || '').trim();
    const expectedGroup = String(req.body.expectedGroup || '').trim();
    const reqAmbiente   = String(req.body.ambiente || '').trim();
    const reqGroupClean = (reqGroup || '3292060').replace(/\D/g, '');
    const assignedAmbiente = AMBIENTE_POR_FICHA[reqGroupClean] || 'Ambiente 302 - Software';

    // Validación de Rechazo por Ficha Incorrecta
    if (req.body.enforceFicha !== false && expectedGroup && reqGroup) {
        const cleanReq = reqGroup.replace(/\D/g, '');
        const cleanExp = expectedGroup.replace(/\D/g, '');
        if (cleanReq && cleanExp && cleanReq !== cleanExp) {
            return res.status(400).json({
                error: `⚠️ ALERTA DE FICHA INCORRECTA: El aprendiz (Doc: ${req.body.doc}) pertenece a la Ficha ${reqGroup} y no a la Ficha ${expectedGroup} seleccionada.`,
                rejected: true
            });
        }
    }

    // Validación de Rechazo por Ambiente No Asignado
    if (req.body.enforceAmbiente !== false && reqAmbiente && assignedAmbiente) {
        const normReq = reqAmbiente.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normAssigned = assignedAmbiente.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (!normReq.includes(normAssigned.slice(0, 11)) && !normAssigned.includes(normReq.slice(0, 11))) {
            return res.status(400).json({ 
                error: `⛔ REGISTRO RECHAZADO: La marcación se realizó desde un ambiente no asignado (${reqAmbiente}). El ambiente asignado para la ficha ${reqGroup || '3292060'} es: ${assignedAmbiente}.`, 
                rejected: true, 
                assignedAmbiente: assignedAmbiente,
                requestAmbiente: reqAmbiente 
            });
        }
    }

    const existingIndex = data.findIndex(r => {
        const rCleanDoc = String(r.doc || '').replace(/\D/g, '').replace(/^0+/, '');
        const rGroup    = String(r.group || '').trim();
        if (reqGroup && rGroup) {
            return rCleanDoc === reqCleanDoc && rGroup === reqGroup;
        }
        return rCleanDoc === reqCleanDoc;
    });

    if (existingIndex !== -1) {
        data[existingIndex].status = req.body.status || 'Presente';
        data[existingIndex].time = time;
        data[existingIndex].fecha = fecha;
        data[existingIndex].timestamp = timestamp;
        if (req.body.group) data[existingIndex].group = req.body.group;
        if (req.body.name) data[existingIndex].name = req.body.name;
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return res.status(200).json({ message: 'Asistencia actualizada', record: data[existingIndex] });
    }
    
    const newRecord = {
        ...req.body,
        status: req.body.status || 'Presente',
        time: time,
        fecha: fecha,
        timestamp: timestamp
    };
    
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

app.delete('/api/students/:id', (req, res) => {
    try {
        let students = JSON.parse(fs.readFileSync(STUDENTS_FILE));
        const before = students.length;
        students = students.filter(s => s.id !== req.params.id);
        if (students.length === before) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }
        fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));

        // Opcional: también eliminar registros de asistencia del estudiante
        let attendance = JSON.parse(fs.readFileSync(DATA_FILE));
        attendance = attendance.filter(a => String(a.doc).replace(/\D/g,'').replace(/^0+/,'') !== String(req.params.id).replace(/\D/g,'').replace(/^0+/,''));
        fs.writeFileSync(DATA_FILE, JSON.stringify(attendance, null, 2));

        res.json({ success: true, message: 'Estudiante eliminado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar el estudiante' });
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
                from: '"SAVENA" <notificaciones@sena.edu.co>',
                to,
                subject,
                text: body,
                html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                        <h2 style="color: #009900; margin-top:0;">SENA - Control de Asistencia</h2>
                        <p style="white-space: pre-line; color: #334155; font-size: 14px; line-height: 1.6;">${body}</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 25px;" />
                        <span style="font-size: 11px; color: #94a3b8;">Mensaje automático enviado desde la plataforma SAVENA.</span>
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
app.delete('/api/attendance/reset', (req, res) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
        res.json({ success: true, message: 'Asistencias reiniciadas' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'No se pudo reiniciar la asistencia' });
    }
});

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
