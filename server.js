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
app.use(express.static(__dirname));

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
