// Sample data fallback
const studentsMock = [
    { name: "Esperando registros...", doc: "---", time: "---", status: "N/A" }
];

const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
let currentFichaFilter = '';
let globalChartInstance = null;

async function renderTable(fichaFilter = currentFichaFilter) {
    currentFichaFilter = fichaFilter;
    try {
        const response = await fetch(`${API_BASE}/api/attendance`);
        let history = await response.json();
        if (fichaFilter) history = history.filter(h => h.group === fichaFilter);

        const updateList = (id) => {
            const list = document.getElementById(id);
            if (!list) return;
            list.innerHTML = (history.length > 0 ? history : studentsMock).map((s, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${s.name}</td>
                    <td>${s.doc}</td>
                    <td>${s.time || '--:--'}</td>
                    <td>
                        <span onclick="toggleStatus('${s.doc}', '${s.status}')" 
                              class="status-badge ${s.status === 'Presente' ? 'status-presente' : (s.status === 'Tarde' ? 'status-tarde' : 'status-ausente')}" 
                              style="cursor: pointer;">
                            ${s.status}
                        </span>
                    </td>
                </tr>
            `).join('');
        };
        updateList('attendanceList');
        updateList('attendanceListToma');
        
        const totalStat = document.querySelector('.stat-card.total .stat-value');
        const presentStat = document.querySelector('.stat-card.presentes .stat-value');
        const lateStat = document.querySelector('.stat-card.tardes .stat-value');
        const absentStat = document.querySelector('.stat-card.ausentes .stat-value');
        if (totalStat) {
            totalStat.textContent = history.length;
            presentStat.textContent = history.filter(s => s.status === 'Presente').length;
            lateStat.textContent = history.filter(s => s.status === 'Tarde').length;
            absentStat.textContent = history.filter(s => s.status === 'Ausente').length;
        }
        renderAlerts(history, fichaFilter);
    } catch (err) { console.error(err); }
}

async function toggleStatus(doc, currentStatus) {
    if (doc === '---') return;
    let newStatus = currentStatus === 'Presente' ? 'Tarde' : (currentStatus === 'Tarde' ? 'Ausente' : 'Presente');
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    try {
        const response = await fetch(`${API_BASE}/api/attendance/${doc}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, time: time })
        });
        if (response.ok) renderTable();
    } catch (err) { console.error(err); }
}

async function renderAlerts(history, fichaFilter) {
    try {
        const response = await fetch(`${API_BASE}/api/students`);
        let allStudents = await response.json();
        if (fichaFilter) allStudents = allStudents.filter(s => s.group === fichaFilter);
        const alertList = document.querySelector('.alert-list');
        if (!alertList) return;
        const presentIds = history.map(h => h.doc);
        const missing = allStudents.filter(s => !presentIds.includes(s.id)).slice(0, 5);
        alertList.innerHTML = missing.map(s => `
            <div class="alert-item alert-warning"><i data-lucide="user-x" style="width:14px; margin-right:8px;"></i>${s.name} - Ausente</div>
        `).join('') || '<div class="alert-item alert-success">Sin alertas pendientes</div>';
        
        const badge = document.querySelector('.notification-badge');
        if (badge) badge.textContent = missing.length;
        
        lucide.createIcons();
    } catch (err) { console.error(err); }
}

setInterval(() => renderTable(), 5000);
renderTable();

// Modals Setup
document.getElementById('btnActualizarDash')?.addEventListener('click', async () => {
    document.getElementById('absenceModal').style.display = 'flex';
    const [studentsRes, attendanceRes] = await Promise.all([fetch(`${API_BASE}/api/students`), fetch(`${API_BASE}/api/attendance`)]);
    let students = await studentsRes.json();
    let attendance = await attendanceRes.json();
    if (currentFichaFilter) {
        students = students.filter(s => s.group === currentFichaFilter);
        attendance = attendance.filter(a => a.group === currentFichaFilter);
    }
    const presentIds = attendance.map(a => a.doc);
    const missing = students.filter(s => !presentIds.includes(s.id));
    const container = document.getElementById('absenceListContainer');
    container.innerHTML = missing.length === 0 ? '<p style="text-align:center; padding:20px;">Todo al día.</p>' : missing.map(s => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #f1f5f9;">
            <div><div style="font-weight:600; font-size:0.9rem;">${s.name}</div><div style="font-size:0.75rem; color:var(--text-muted);">${s.id}</div></div>
            <button onclick="markAsAbsent('${s.id}', '${s.name}', '${s.group}')" class="btn-primary" style="padding:6px 12px; font-size:0.75rem; background:#f59e0b;">Falta</button>
        </div>
    `).join('');
});

async function markAsAbsent(id, name, group) {
    try {
        await fetch(`${API_BASE}/api/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, doc: id, group, status: 'Ausente' })
        });
        document.getElementById('btnActualizarDash').click();
        renderTable();
    } catch (err) { console.error(err); }
}

document.getElementById('closeAbsenceModal')?.addEventListener('click', () => document.getElementById('absenceModal').style.display = 'none');
document.getElementById('closeClassModal')?.addEventListener('click', () => document.getElementById('newClassModal').style.display = 'none');
document.getElementById('closeStudentModal')?.addEventListener('click', () => document.getElementById('newStudentModal').style.display = 'none');
document.getElementById('nuevaClaseBtn')?.addEventListener('click', () => document.getElementById('newClassModal').style.display = 'flex');

document.getElementById('newClassForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newClass = {
        name: document.getElementById('className').value,
        description: document.getElementById('classDesc').value,
        instructor: document.getElementById('classInstructor').value,
        room: document.getElementById('classRoom').value,
        time: document.getElementById('classTime').value,
        color: '#00e5e5' // Default teal color
    };
    try {
        const res = await fetch(`${API_BASE}/api/classes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClass)
        });
        if (res.ok) {
            document.getElementById('newClassModal').style.display = 'none';
            document.getElementById('newClassForm').reset();
            renderFichas();
            initTomaAsistencia();
        }
    } catch (err) { console.error(err); }
});

// New Student Logic
let activeFichaForStudent = '';
document.getElementById('addStudentBtn')?.addEventListener('click', () => {
    const title = document.getElementById('selectedFichaTitle').textContent;
    activeFichaForStudent = title.replace('Estudiantes - Ficha ', '').replace('Ficha ', '');
    document.getElementById('newStudentModal').style.display = 'flex';
});

document.getElementById('newStudentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newStudent = {
        name: document.getElementById('studentName').value,
        id: document.getElementById('studentId').value,
        group: activeFichaForStudent,
        status: 'Activo'
    };
    try {
        const response = await fetch(`${API_BASE}/api/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newStudent)
        });
        if (response.ok) {
            document.getElementById('newStudentModal').style.display = 'none';
            document.getElementById('newStudentForm').reset();
            openFicha(activeFichaForStudent);
        }
    } catch (err) { console.error(err); }
});

// Bell / Notification Logic
let dismissedAlerts = JSON.parse(localStorage.getItem('dismissedAlerts') || '[]');

document.querySelector('.notification-btn')?.addEventListener('click', async () => {
    await renderNotificationModal();
    document.getElementById('notificationModal').style.display = 'flex';
});

document.getElementById('closeNotificationModal')?.addEventListener('click', () => {
    document.getElementById('notificationModal').style.display = 'none';
});

document.getElementById('clearAllAlerts')?.addEventListener('click', () => {
    const alerts = document.querySelectorAll('.notification-item');
    alerts.forEach(alert => {
        const id = alert.getAttribute('data-id');
        if (id) dismissedAlerts.push(id);
    });
    localStorage.setItem('dismissedAlerts', JSON.stringify(dismissedAlerts));
    renderNotificationModal();
    renderAlertas();
});

async function renderNotificationModal() {
    const [students, attendance] = await Promise.all([
        fetch(`${API_BASE}/api/students`).then(r => r.json()),
        fetch(`${API_BASE}/api/attendance`).then(r => r.json())
    ]);

    const list = document.getElementById('notificationList');
    const alerts = students.map(s => {
        const studentAbsences = attendance.filter(a => a.doc === s.id && a.status === 'Ausente').length;
        return { ...s, absences: studentAbsences };
    }).filter(s => s.absences > 0 && !dismissedAlerts.includes(s.id));

    list.innerHTML = alerts.map(a => `
        <div class="notification-item" data-id="${a.id}" style="display:flex; align-items:center; gap:15px; padding:15px; background: #fffaf0; border-left: 5px solid #f59e0b; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <div style="color: #92400e;">
                <i data-lucide="user-x" style="width:20px; height:20px;"></i>
            </div>
            <div style="font-size: 0.95rem; color: #92400e; font-weight: 500;">
                ${a.name.toLowerCase()} - Ausente
            </div>
        </div>
    `).join('') || '<p style="text-align:center; padding:40px; color:var(--text-muted); font-size:0.9rem;">No hay notificaciones pendientes.</p>';
    
    const badge = document.querySelector('.notification-badge');
    if (badge) badge.textContent = alerts.length;
    
    lucide.createIcons();
}

window.dismissAlert = async (id) => {
    try {
        // Enviar al servidor para cambiar el estado a "Justificado"
        await fetch(`${API_BASE}/api/attendance/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Justificado' })
        });
        
        // Guardar también en localStorage para consistencia de la UI
        if (!dismissedAlerts.includes(id)) {
            dismissedAlerts.push(id);
            localStorage.setItem('dismissedAlerts', JSON.stringify(dismissedAlerts));
        }
        
        await renderAlertas();
        renderNotificationModal();
    } catch (error) {
        console.error('Error al justificar:', error);
    }
};

// QR Logic
let qrcodeToma;
let serverIp = 'localhost', serverPort = '3000';
async function initTomaAsistencia() {
    try {
        const info = await (await fetch(`${API_BASE}/api/info`)).json();
        serverIp = info.ip; serverPort = info.port;
        const classes = await (await fetch(`${API_BASE}/api/classes`)).json();
        const selector = document.getElementById('fichaSelectorToma');
        if (selector && selector.getAttribute('data-loaded') !== 'true') {
            selector.innerHTML = '<option value="">-- Todas las Fichas --</option>' + classes.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            selector.setAttribute('data-loaded', 'true');
            selector.addEventListener('change', (e) => {
                const ficha = e.target.value;
                renderTable(ficha);
                const container = document.getElementById('qrContainerToma'), placeholder = document.getElementById('qrPlaceholderToma');
                if (ficha) {
                    container.style.display = 'block'; placeholder.style.display = 'none';
                    if (!qrcodeToma) qrcodeToma = new QRCode(document.getElementById("qrcode-toma"), { width: 200, height: 200 });
                    
                    const publicUrl = document.getElementById('publicUrlInput').value;
                    const baseUrl = publicUrl ? publicUrl.replace(/\/$/, '') : `http://${serverIp}:${serverPort}`;
                    qrcodeToma.makeCode(`${baseUrl}/checkin.html?ficha=${ficha}`);
                } else { container.style.display = 'none'; placeholder.style.display = 'block'; }
            });
        }
    } catch (err) { console.error(err); }
}

document.getElementById('regenerarQrBtnToma')?.addEventListener('click', () => {
    const ficha = document.getElementById('fichaSelectorToma').value;
    if (ficha && qrcodeToma) {
        const publicUrl = document.getElementById('publicUrlInput').value;
        const baseUrl = publicUrl ? publicUrl.replace(/\/$/, '') : `http://${serverIp}:${serverPort}`;
        const url = `${baseUrl}/checkin.html?ficha=${ficha}&t=${Date.now()}`;
        qrcodeToma.clear();
        qrcodeToma.makeCode(url);
    }
});

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const text = link.textContent.trim().toLowerCase();
        let viewId = 'view-dashboard';
        if (text.includes('dashboard')) viewId = 'view-dashboard';
        else if (text.includes('fichas')) viewId = 'view-fichas';
        else if (text.includes('toma')) viewId = 'view-toma-de-asistencia';
        else if (text.includes('seguimiento')) viewId = 'view-seguimiento';
        else if (text.includes('alertas')) viewId = 'view-alertas';
        else if (text.includes('reportes')) viewId = 'view-reportes';
        const targetView = document.getElementById(viewId);
        if (targetView) {
            e.preventDefault();
            document.querySelectorAll('.content-view').forEach(v => v.style.display = 'none');
            targetView.style.display = 'block';
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            if (viewId === 'view-fichas') renderFichas();
            if (viewId === 'view-toma-de-asistencia') { initTomaAsistencia(); renderTable(document.getElementById('fichaSelectorToma')?.value || ''); }
            if (viewId === 'view-alertas') renderAlertas();
            if (viewId === 'view-dashboard') updateDashboard();
            if (viewId === 'view-seguimiento') renderSeguimientoChart();
        }
    });
});

async function renderSeguimientoChart(fichaFilter = '') {
    try {
        const [studentsRes, attendanceRes, classesRes] = await Promise.all([
            fetch(`${API_BASE}/api/students`),
            fetch(`${API_BASE}/api/attendance`),
            fetch(`${API_BASE}/api/classes`)
        ]);
        let students = await studentsRes.json();
        let attendance = await attendanceRes.json();
        const classes = await classesRes.json();

        // Populate selector once
        const selector = document.getElementById('fichaSelectorSeguimiento');
        if (selector && selector.getAttribute('data-loaded') !== 'true') {
            selector.innerHTML = '<option value="">Todas las Fichas</option>' + classes.map(c => `<option value="${c.name}">Ficha ${c.name}</option>`).join('');
            selector.setAttribute('data-loaded', 'true');
            selector.addEventListener('change', (e) => renderSeguimientoChart(e.target.value));
        }

        if (fichaFilter) {
            students = students.filter(s => s.group === fichaFilter);
            attendance = attendance.filter(a => a.group === fichaFilter);
            document.getElementById('seguimientoChartTitle').textContent = `Ficha ${fichaFilter}`;
        } else {
            document.getElementById('seguimientoChartTitle').textContent = `Resumen General`;
        }

        const stats = {
            presentes: attendance.filter(a => a.status === 'Presente').length,
            tardes: attendance.filter(a => a.status === 'Tarde').length,
            ausentes: students.length - attendance.filter(a => a.status === 'Presente' || a.status === 'Tarde').length
        };

        const ctx = document.getElementById('globalAttendanceChart')?.getContext('2d');
        if (ctx) {
            if (globalChartInstance) globalChartInstance.destroy();
            globalChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Presentes', 'Tardes', 'Ausentes'],
                    datasets: [{
                        data: [stats.presentes, stats.tardes, stats.ausentes],
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { padding: 20, font: { size: 12, weight: '500' } }
                        }
                    },
                    cutout: '70%'
                }
            });
        }
    } catch (err) { console.error(err); }
}

async function renderFichas() {
    const classes = await (await fetch(`${API_BASE}/api/classes`)).json();
    const container = document.getElementById('fichasContainer');
    if (!container) return;
    container.innerHTML = classes.map(c => `
        <div class="section-card" style="border-left: 5px solid ${c.color};">
            <div style="display:flex; justify-content:space-between;">
                <div><h2>${c.name}</h2><p>${c.description}</p></div>
                <button onclick="confirmDeleteFicha('${c.id}', '${c.name}')" style="color:#ef4444; background:none; border:none; cursor:pointer;"><i data-lucide="trash-2"></i></button>
            </div>
            <p><strong>Instructor:</strong> ${c.instructor}</p>
            <button class="btn-primary" onclick="openFicha('${c.name}')" style="background:${c.color}; width:100%; margin-top:10px;">Abrir</button>
        </div>
    `).join('');
    lucide.createIcons();
}

let deleteId = null;
function confirmDeleteFicha(id, name) {
    deleteId = id; document.getElementById('modalTitle').textContent = `¿Eliminar ${name}?`; document.getElementById('customModal').style.display = 'flex';
}
document.getElementById('modalCancel')?.addEventListener('click', () => document.getElementById('customModal').style.display = 'none');
document.getElementById('modalConfirm')?.addEventListener('click', async () => {
    if (deleteId) { await fetch(`${API_BASE}/api/classes/${deleteId}`, { method: 'DELETE' }); document.getElementById('customModal').style.display = 'none'; renderFichas(); }
});

async function renderAlertas() {
    try {
        const [students, attendance] = await Promise.all([
            fetch(`${API_BASE}/api/students`).then(r => r.json()),
            fetch(`${API_BASE}/api/attendance`).then(r => r.json())
        ]);

        const alertContainer = document.getElementById('alertDetailContainer');
        const dashAlertList = document.querySelector('.alert-list');
        
        const allAlerts = students.map(s => {
            const absences = attendance.filter(a => a.doc === s.id && a.status === 'Ausente').length;
            return { ...s, absences };
        }).filter(s => s.absences > 0).sort((a, b) => b.absences - a.absences);

        const visibleAlerts = allAlerts.filter(a => !dismissedAlerts.includes(a.id));

        const alertHtml = visibleAlerts.map(a => `
            <div class="alert-item ${a.absences >= 3 ? 'alert-danger' : 'alert-warning'}">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <div>
                        <strong>${a.name}</strong> (Ficha: ${a.group})
                        <div style="font-size: 0.8rem; opacity: 0.8;">${a.absences} inasistencias detectadas</div>
                    </div>
                    <div style="display:flex; gap: 10px;">
                        <button onclick="dismissAlert('${a.id}')" class="notification-btn" style="padding:5px; background:rgba(0,0,0,0.05);"><i data-lucide="check" style="width:16px;"></i></button>
                    </div>
                </div>
            </div>
        `).join('');

        if (alertContainer) {
            alertContainer.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <span style="font-size:0.9rem; color:var(--text-muted);">${visibleAlerts.length} alertas activas</span>
                    <button onclick="restoreAlerts()" class="btn-modal-secondary" style="font-size:0.7rem; padding:5px 10px;">Restablecer Todas</button>
                </div>
                ${alertHtml || '<p style="text-align:center; padding:20px; color:var(--text-muted);">No hay alertas activas.</p>'}
            `;
        }
        
        if (dashAlertList) dashAlertList.innerHTML = alertHtml || '<p style="text-align:center; padding:10px; font-size:0.8rem; color:var(--text-muted);">Sin alertas pendientes.</p>';
        
        const badge = document.querySelector('.notification-badge');
        if (badge) badge.textContent = visibleAlerts.length;
        
        lucide.createIcons();
    } catch (err) { console.error(err); }
}

window.restoreAlerts = () => {
    dismissedAlerts = [];
    localStorage.removeItem('dismissedAlerts');
    renderAlertas();
    renderNotificationModal();
};

async function updateDashboard() {
    try {
        const [students, attendance] = await Promise.all([
            fetch(`${API_BASE}/api/students`).then(r => r.json()),
            fetch(`${API_BASE}/api/attendance`).then(r => r.json())
        ]);
        
        const stats = {
            total: students.length,
            presentes: attendance.filter(a => a.status === 'Presente').length,
            tardes: attendance.filter(a => a.status === 'Tarde').length,
            ausentes: attendance.filter(a => a.status === 'Ausente').length
        };

        document.querySelectorAll('.stat-value').forEach((el, i) => {
            const keys = ['total', 'presentes', 'tardes', 'ausentes'];
            el.textContent = stats[keys[i]];
        });

        const list = document.getElementById('attendanceList');
        if (list) {
            list.innerHTML = attendance.slice(-10).reverse().map((a, i) => `
                <tr>
                    <td>${attendance.length - i}</td>
                    <td>${a.name}</td>
                    <td>${a.doc}</td>
                    <td>${a.time || '--:--'}</td>
                    <td><span class="status-badge ${a.status.toLowerCase()}">${a.status}</span></td>
                </tr>
            `).join('');
        }
        renderAlertas();
    } catch (err) { console.error(err); }
}

// Initial load
updateDashboard();

async function openFicha(fichaName) {
    document.getElementById('fichasMain').style.display = 'none'; 
    document.getElementById('fichaDetail').style.display = 'block';
    document.getElementById('selectedFichaTitle').textContent = `Ficha ${fichaName}`;
    
    const [students, attendance] = await Promise.all([
        fetch(`${API_BASE}/api/students`).then(r => r.json()),
        fetch(`${API_BASE}/api/attendance`).then(r => r.json())
    ]);

    const fichaStudents = students.filter(s => s.group === fichaName);
    const list = document.getElementById('fichaStudentsList');
    
    list.innerHTML = fichaStudents.map(s => {
        const studentAttendance = attendance.filter(a => a.doc === s.id);
        const presentCount = studentAttendance.filter(a => a.status === 'Presente').length;
        const totalSessions = studentAttendance.length || 0;
        const percent = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
        
        return `
            <tr>
                <td>${s.id}</td>
                <td>${s.name}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${percent}%; height: 100%; background: ${percent > 80 ? '#10b981' : (percent > 50 ? '#f59e0b' : '#ef4444')};"></div>
                        </div>
                        <span style="font-size: 0.8rem; font-weight: 600;">${percent}%</span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function showFichasMain() { 
    document.getElementById('fichasMain').style.display = 'block'; 
    document.getElementById('fichaDetail').style.display = 'none'; 
}
