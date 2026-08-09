// Sample data fallback
const studentsMock = [
    { name: "Esperando registros...", doc: "---", time: "---", status: "N/A" }
];

const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
let currentFichaFilter = '';
let globalChartInstance = null;

function initUserProfile() {
    const name = sessionStorage.getItem('sena_name') || 'Juan Pérez';
    const role = sessionStorage.getItem('sena_role') || 'INSTRUCTOR';
    
    const sidebarName = document.getElementById('sidebarUserName');
    const sidebarRole = document.getElementById('sidebarUserRole');
    const headerName  = document.getElementById('headerUserName');
    
    if (sidebarName) sidebarName.textContent = name;
    if (sidebarRole) sidebarRole.textContent = role;
    if (headerName)  headerName.textContent  = name;

    // Ocultar "Mis Fichas" si el rol es Coordinador
    const navMisFichas = document.getElementById('navMisFichas');
    if (navMisFichas) {
        navMisFichas.style.display = (role === 'COORDINADOR') ? 'none' : '';
    }

    // Load saved avatar
    const savedAvatar = localStorage.getItem('sena_avatar');
    updateAllAvatars(savedAvatar);
}

function updateAllAvatars(src) {
    if (!src) {
        src = 'https://upload.wikimedia.org/wikipedia/commons/8/83/Sena_Colombia_logo.svg';
    }
    const isCustom = !src.includes('Sena_Colombia_logo.svg');
    const imgs = document.querySelectorAll('#profileAvatarImg, .avatar');
    imgs.forEach(img => {
        img.src = src;
        if (isCustom) {
            img.style.padding = '0';
            img.style.objectFit = 'cover';
            img.style.background = 'none';
        } else {
            if (img.id === 'profileAvatarImg') {
                img.style.padding = '10px';
                img.style.objectFit = 'contain';
                img.style.background = '#dcfce7';
            } else {
                img.style.padding = '4px';
                img.style.objectFit = 'contain';
                img.style.background = '#dcfce7';
            }
        }
    });
}


function changeProfileAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;

        // Show preview modal
        let previewModal = document.getElementById('avatarPreviewModal');
        if (!previewModal) {
            previewModal = document.createElement('div');
            previewModal.id = 'avatarPreviewModal';
            previewModal.style.cssText = `
                position: fixed; inset: 0; background: rgba(0,0,0,0.55); 
                display: flex; align-items: center; justify-content: center; 
                z-index: 9999; backdrop-filter: blur(4px);
                animation: fadeInModal 0.2s ease-out;
            `;
            document.body.appendChild(previewModal);
        }

        previewModal.innerHTML = `
            <div style="background: #fff; border-radius: 20px; padding: 36px 32px; 
                        max-width: 380px; width: 90%; text-align: center;
                        box-shadow: 0 25px 60px rgba(0,0,0,0.25);
                        animation: slideUp 0.3s ease-out;">
                <h3 style="margin: 0 0 6px; font-size: 1.15rem; color: #1a2e1a;">Vista Previa de Foto</h3>
                <p style="margin: 0 0 24px; font-size: 0.82rem; color: #94a3b8;">¿Deseas usar esta imagen como tu foto de perfil?</p>

                <div style="position: relative; display: inline-block; margin-bottom: 24px;">
                    <img src="${base64}" alt="Vista previa" 
                         style="width: 130px; height: 130px; border-radius: 50%; 
                                object-fit: cover; border: 5px solid #009900;
                                box-shadow: 0 8px 24px rgba(0,153,0,0.2);">
                    <span style="position: absolute; bottom: 4px; right: 4px; 
                                 background: #009900; color: white; width: 30px; height: 30px; 
                                 border-radius: 50%; display: flex; align-items: center; 
                                 justify-content: center; border: 2.5px solid white;
                                 font-size: 14px;">✓</span>
                </div>

                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button onclick="cancelAvatarPreview()" 
                            style="flex: 1; padding: 11px; border: 1.5px solid #e2e8f0; 
                                   background: #fff; border-radius: 10px; cursor: pointer; 
                                   font-size: 0.9rem; font-weight: 600; color: #64748b;
                                   transition: all 0.2s;"
                            onmouseover="this.style.background='#f8fafc'" 
                            onmouseout="this.style.background='#fff'">
                        Cancelar
                    </button>
                    <button onclick="confirmAvatarChange('${base64}')" 
                            style="flex: 1; padding: 11px; border: none; 
                                   background: #009900; border-radius: 10px; cursor: pointer; 
                                   font-size: 0.9rem; font-weight: 700; color: #fff;
                                   transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,153,0,0.3);"
                            onmouseover="this.style.background='#007700'" 
                            onmouseout="this.style.background='#009900'">
                        ✓ Usar esta foto
                    </button>
                </div>
            </div>
        `;

        previewModal.style.display = 'flex';

        // Reset file input so the same file can be re-selected
        event.target.value = '';
    };
    reader.readAsDataURL(file);
}

function confirmAvatarChange(base64) {
    localStorage.setItem('sena_avatar', base64);
    updateAllAvatars(base64);
    cancelAvatarPreview();
}

function cancelAvatarPreview() {
    const modal = document.getElementById('avatarPreviewModal');
    if (modal) modal.style.display = 'none';
}


function openEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (!modal) return;

    const currentName = sessionStorage.getItem('sena_name') || 'Juan Pérez';
    const currentRole = sessionStorage.getItem('sena_role') || 'INSTRUCTOR';
    const currentUser = sessionStorage.getItem('sena_user') || 'OBSENA2026@gmail.com';

    document.getElementById('editProfileName').value = currentName;
    document.getElementById('editProfileRole').value = currentRole;
    document.getElementById('editProfileUser').value = currentUser;

    modal.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
}

document.getElementById('closeEditProfileModal')?.addEventListener('click', () => {
    const modal = document.getElementById('editProfileModal');
    if (modal) modal.style.display = 'none';
});

document.getElementById('editProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = document.getElementById('editProfileName').value.trim();
    const newRole = document.getElementById('editProfileRole').value.trim();
    const newUser = document.getElementById('editProfileUser').value.trim();

    if (!newName || !newRole) return;

    sessionStorage.setItem('sena_name', newName);
    sessionStorage.setItem('sena_role', newRole);
    if (newUser) sessionStorage.setItem('sena_user', newUser);

    initUserProfile();

    const modal = document.getElementById('editProfileModal');
    if (modal) modal.style.display = 'none';

    await showConfirmModal({
        title: '¡Perfil Actualizado!',
        message: `La información de perfil se ha guardado correctamente como ${newName} (${newRole}).`,
        confirmText: 'Entendido',
        cancelText: '',
        confirmBg: '#009900',
        iconName: 'user-check',
        iconBg: 'rgba(0, 153, 0, 0.15)',
        iconColor: '#009900'
    });
});

document.addEventListener('DOMContentLoaded', initUserProfile);
initUserProfile();

async function renderTable(fichaFilter = currentFichaFilter) {
    currentFichaFilter = fichaFilter;
    try {
        const response = await fetch(`${API_BASE}/api/attendance`);
        let history = await response.json();
        if (fichaFilter) history = history.filter(h => h.group === fichaFilter);

        const updateList = (id) => {
            const list = document.getElementById(id);
            if (!list) return;
            
            // Sort by timestamp descending so the newest records are at the top for all lists
            const data = (history.length > 0 ? [...history].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) : studentsMock);
            const total = data.length;

            list.innerHTML = data.map((s, index) => {
                const rowNum = total - index;
                return `
                    <tr>
                        <td>${rowNum}</td>
                        <td>${s.name}</td>
                        <td>${s.docType || '--'}</td>
                        <td>${s.doc}</td>
                        <td>${s.time || '--:--'}</td>
                        <td>
                            <span onclick="toggleStatus('${s.doc}', '${s.status}')" 
                                  class="status-badge ${s.status === 'Presente' ? 'status-presente' : (s.status === 'Tarde' ? 'status-tarde' : (s.status === 'Ausente' ? 'status-ausente' : 'status-justificado'))}" 
                                  style="cursor: pointer;">
                                ${s.status}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');

            // Remove pagination controls if they exist
            const paginationId = id === 'attendanceList' ? 'paginationDash' : 'paginationToma';
            const pagContainer = document.getElementById(paginationId);
            if (pagContainer) {
                pagContainer.innerHTML = '';
            }
        };
        updateList('attendanceList');
        updateList('attendanceListToma');
        
        const totalStat   = document.querySelector('.stat-card.total .stat-value');
        const presentStat = document.querySelector('.stat-card.presentes .stat-value');
        const lateStat    = document.querySelector('.stat-card.tardes .stat-value');
        const absentStat  = document.querySelector('.stat-card.ausentes .stat-value');
        if (totalStat) {
            // Total = aprendices inscritos en la ficha (desde students.json)
            try {
                const studRes = await fetch(`${API_BASE}/api/students`);
                let allStudents = await studRes.json();
                if (fichaFilter) {
                    allStudents = allStudents.filter(s => s.group === fichaFilter && s.status !== 'Desertor');
                } else {
                    allStudents = allStudents.filter(s => s.status !== 'Desertor');
                }
                totalStat.textContent = allStudents.length;
            } catch (_) {
                totalStat.textContent = '—';
            }
            presentStat.textContent = history.filter(s => s.status === 'Presente').length;
            lateStat.textContent    = history.filter(s => s.status === 'Tarde').length;
            absentStat.textContent  = history.filter(s => s.status === 'Ausente').length;
        }
        renderAlerts(history, fichaFilter);
    } catch (err) { console.error(err); }
}

// Helper: fecha y hora exacta del momento
function _getNow() {
    const now = new Date();
    const fecha = now.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora  = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return { fecha, hora, timestamp: now.getTime() };
}

async function toggleStatus(doc, currentStatus) {
    if (doc === '---') return;
    let newStatus = currentStatus === 'Presente' ? 'Tarde' : (currentStatus === 'Tarde' ? 'Ausente' : 'Presente');
    const { fecha, hora, timestamp } = _getNow();
    try {
        const response = await fetch(`${API_BASE}/api/attendance/${doc}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, time: hora, fecha, timestamp })
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
            <button onclick="markAsAbsent('${s.id}', '${s.name}', '${s.group}', '${s.docType}')" class="btn-primary" style="padding:6px 12px; font-size:0.75rem; background:#f59e0b;">Falta</button>
        </div>
    `).join('');
});

async function markAsAbsent(id, name, group, docType) {
    try {
        const { fecha, hora, timestamp } = _getNow();
        await fetch(`${API_BASE}/api/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, doc: id, docType, group, status: 'Ausente', time: hora, fecha, timestamp })
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
        color: '#009900' // Color verde predeterminado
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
        docType: document.getElementById('studentDocType').value,
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

// Barcode Logic
let serverIp = 'localhost', serverPort = '3000';
async function initTomaAsistencia() {
    try {
        const info = await (await fetch(`${API_BASE}/api/info`)).json();
        serverIp = info.ip; serverPort = info.port;
    } catch (err) { console.error(err); }
}

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
        else if (text.includes('perfil')) viewId = 'view-perfil';
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
            if (viewId === 'view-perfil') openProfileView();
        }
    });
});

function updateProfileRoleFields(role) {
    const isCoord = (role || '').toUpperCase() === 'COORDINADOR';
    
    const badgeInfo = document.getElementById('profileRoleBadgeInfo');
    const label1 = document.getElementById('labelField1');
    const field1 = document.getElementById('viewField1');
    const label2 = document.getElementById('labelField2');
    const field2 = document.getElementById('viewField2');
    const m1 = document.getElementById('profileMetric1');
    const m1Label = document.getElementById('profileMetric1Label');
    const m2 = document.getElementById('profileMetric2');
    const m2Label = document.getElementById('profileMetric2Label');

    const metricsContainer = document.getElementById('profileMetricsContainer');
    const fichasContainer = document.getElementById('fichasFieldContainer');

    if (isCoord) {
        if (badgeInfo) badgeInfo.textContent = 'Información de Coordinación Académica';
        if (label1) label1.textContent = 'Coordinación / Dependencia';
        if (field1) field1.value = 'Coordinación Académica de Teleinformática';
        if (label2) label2.textContent = 'Alcance / Supervisión';
        if (field2) field2.value = 'Supervisión General de Fichas e Instructores';
        // Ocultar fichas para coordinador
        if (metricsContainer) metricsContainer.style.display = 'none';
        if (fichasContainer) fichasContainer.style.display = 'none';
    } else {
        if (badgeInfo) badgeInfo.textContent = 'Información de Instructor';
        if (label1) label1.textContent = 'Área Académica / Programa';
        if (field1) field1.value = 'Análisis y Desarrollo de Software (ADSO)';
        if (label2) label2.textContent = 'Fichas / Alcance Asignado';
        if (field2) field2.value = 'Ficha 3292060, Ficha 2558390';
        if (m1) m1.textContent = '2';
        if (m1Label) m1Label.textContent = 'Fichas Asignadas';
        if (m2) m2.textContent = 'Activo';
        if (m2Label) m2Label.textContent = 'Estado Instructor';
        // Mostrar fichas para instructor
        if (metricsContainer) metricsContainer.style.display = 'grid';
        if (fichasContainer) fichasContainer.style.display = 'block';
    }
}

function openProfileView() {
    const targetView = document.getElementById('view-perfil');
    if (!targetView) return;

    document.querySelectorAll('.content-view').forEach(v => v.style.display = 'none');
    targetView.style.display = 'block';

    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active');
        if (l.textContent.toLowerCase().includes('perfil')) {
            l.classList.add('active');
        }
    });

    const currentName = sessionStorage.getItem('sena_name') || 'Juan Pérez';
    const currentRole = sessionStorage.getItem('sena_role') || 'INSTRUCTOR';
    const currentUser = sessionStorage.getItem('sena_user') || 'OBSENA2026@gmail.com';

    if (document.getElementById('profileCardName')) document.getElementById('profileCardName').textContent = currentName;
    if (document.getElementById('profileCardRole')) document.getElementById('profileCardRole').textContent = currentRole;

    if (document.getElementById('viewProfileName')) document.getElementById('viewProfileName').value = currentName;
    if (document.getElementById('viewProfileRole')) document.getElementById('viewProfileRole').value = currentRole;
    if (document.getElementById('viewProfileUser')) document.getElementById('viewProfileUser').value = currentUser;

    updateProfileRoleFields(currentRole);

    if (window.lucide) window.lucide.createIcons();
}

async function saveProfileFromView(e) {
    if (e) e.preventDefault();
    const newName = document.getElementById('viewProfileName').value.trim();
    const newRole = document.getElementById('viewProfileRole').value.trim();
    const newUser = document.getElementById('viewProfileUser').value.trim();

    if (!newName || !newRole) return;

    sessionStorage.setItem('sena_name', newName);
    sessionStorage.setItem('sena_role', newRole);
    if (newUser) sessionStorage.setItem('sena_user', newUser);

    initUserProfile();

    if (document.getElementById('profileCardName')) document.getElementById('profileCardName').textContent = newName;
    if (document.getElementById('profileCardRole')) document.getElementById('profileCardRole').textContent = newRole;

    await showConfirmModal({
        title: '¡Perfil Actualizado!',
        message: `Los datos de tu perfil se han guardado exitosamente.`,
        confirmText: 'Entendido',
        cancelText: '',
        confirmBg: '#009900',
        iconName: 'user-check',
        iconBg: 'rgba(0, 153, 0, 0.15)',
        iconColor: '#009900'
    });
}

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
                        backgroundColor: ['#009900', '#f59e0b', '#ef4444'],
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

function showConfirmModal({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', confirmBg = '#ef4444', iconName = 'alert-triangle', iconBg = 'rgba(239, 68, 68, 0.15)', iconColor = '#ef4444' }) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalCancel = document.getElementById('modalCancel');
        const modalConfirm = document.getElementById('modalConfirm');
        const modalIcon = modal ? modal.querySelector('.modal-icon') : null;

        if (!modal) {
            resolve(false);
            return;
        }

        if (modalTitle) modalTitle.textContent = title;
        if (modalMessage) modalMessage.textContent = message;
        if (modalConfirm) {
            modalConfirm.textContent = confirmText;
            modalConfirm.style.background = confirmBg;
            modalConfirm.style.color = '#ffffff';
        }
        if (modalCancel) modalCancel.textContent = cancelText;

        if (modalIcon) {
            modalIcon.style.background = iconBg;
            modalIcon.style.color = iconColor;
            modalIcon.innerHTML = `<i data-lucide="${iconName}"></i>`;
            if (window.lucide) window.lucide.createIcons();
        }

        modal.style.display = 'flex';

        const cleanup = (result) => {
            modal.style.display = 'none';
            if (modalCancel) modalCancel.removeEventListener('click', onCancel);
            if (modalConfirm) modalConfirm.removeEventListener('click', onConfirm);
            resolve(result);
        };

        const onCancel = () => cleanup(false);
        const onConfirm = () => cleanup(true);

        if (modalCancel) modalCancel.addEventListener('click', onCancel);
        if (modalConfirm) modalConfirm.addEventListener('click', onConfirm);
    });
}

async function confirmDeleteFicha(id, name) {
    const confirmed = await showConfirmModal({
        title: `¿Eliminar Ficha ${name}?`,
        message: 'Esta acción eliminará la ficha del sistema. Esta acción no se puede deshacer.',
        confirmText: 'Eliminar Ficha',
        cancelText: 'Cancelar',
        confirmBg: '#ef4444',
        iconName: 'trash-2',
        iconBg: 'rgba(239, 68, 68, 0.15)',
        iconColor: '#ef4444'
    });
    if (confirmed) {
        await fetch(`${API_BASE}/api/classes/${id}`, { method: 'DELETE' });
        renderFichas();
    }
}


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

        const alertHtml = visibleAlerts.map(a => {
            const safeName = a.name ? a.name.replace(/'/g, "\\'") : '';
            return `
            <div class="alert-item ${a.absences >= 3 ? 'alert-danger' : 'alert-warning'}">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%; flex-wrap:wrap; gap:10px;">
                    <div>
                        <strong>${a.name}</strong> (Ficha: ${a.group})
                        <div style="font-size: 0.8rem; opacity: 0.85;">${a.absences} inasistencia(s) detectada(s)</div>
                    </div>
                    <div style="display:flex; gap: 8px; align-items:center;">
                        <button onclick="openEmailModal('${a.id}', '${safeName}', '${a.group}', ${a.absences}, '${a.email || ''}')" 
                                class="btn-primary" 
                                style="padding: 6px 12px; font-size: 0.75rem; background: #0284c7; border: none; border-radius: 6px; display: flex; align-items: center; gap: 4px; color: #fff; cursor: pointer; font-weight: 600;"
                                title="Enviar correo por inasistencia">
                            <i data-lucide="mail" style="width: 14px; height: 14px;"></i> Notificar Correo
                        </button>
                        <button onclick="dismissAlert('${a.id}')" class="notification-btn" style="padding: 6px; background: rgba(0,0,0,0.05); border-radius: 6px; border: none; cursor: pointer;" title="Marcar como revisada">
                            <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        if (alertContainer) {
            alertContainer.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
                    <div>
                        <span style="font-size:0.95rem; font-weight:600; color:var(--text-main);">${visibleAlerts.length} alertas activas de inasistencia</span>
                    </div>
                    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                        <button onclick="openGenericEmailModal()" class="btn-primary" style="background:#009900; font-size:0.8rem; padding:8px 14px; display:flex; align-items:center; gap:6px; font-weight:600; cursor:pointer;" title="Redactar y enviar correo a aprendiz">
                            <i data-lucide="mail" style="width:16px; height:16px;"></i> Enviar Correo a Aprendiz
                        </button>
                        ${visibleAlerts.length > 0 ? `
                        <button onclick="notifyAllAlertsByEmail()" class="btn-primary" style="background:#0369a1; font-size:0.8rem; padding:8px 14px; display:flex; align-items:center; gap:6px; font-weight:600; cursor:pointer;">
                            <i data-lucide="mail-check" style="width:16px; height:16px;"></i> Notificar a Todos (${visibleAlerts.length})
                        </button>` : ''}
                        <button onclick="restoreAlerts()" class="btn-modal-secondary" style="font-size:0.8rem; padding:8px 14px;">Restablecer Alertas</button>
                    </div>
                </div>
                ${alertHtml || '<p style="text-align:center; padding:30px; color:var(--text-muted); font-size:0.9rem;">No hay alertas de inasistencia activas en este momento.</p>'}
            `;
        }
        
        if (dashAlertList) dashAlertList.innerHTML = alertHtml || '<p style="text-align:center; padding:10px; font-size:0.8rem; color:var(--text-muted);">Sin alertas pendientes.</p>';
        
        const badge = document.querySelector('.notification-badge');
        if (badge) badge.textContent = visibleAlerts.length;
        
        if (window.lucide) lucide.createIcons();
    } catch (err) { console.error(err); }
}

window.restoreAlerts = () => {
    dismissedAlerts = [];
    localStorage.removeItem('dismissedAlerts');
    renderAlertas();
    renderNotificationModal();
};

function openGenericEmailModal() {
    openEmailModal('', 'Aprendiz', 'General', 1, '');
}

function openEmailModal(studentId, studentName, group, absences, currentEmail) {
    const modal = document.getElementById('sendEmailModal');
    if (!modal) return;

    document.getElementById('emailStudentId').value = studentId;
    document.getElementById('emailStudentSub').textContent = studentName !== 'Aprendiz' ? `${studentName} — Ficha ${group}` : 'Notificación General';
    
    document.getElementById('emailStudentInput').value = currentEmail || '';

    document.getElementById('emailSubjectInput').value = `Notificación Oficial de Inasistencia ${group !== 'General' ? '- Ficha ' + group : ''} - SENA`;

    const bodyText = `Estimado(a) Aprendiz ${studentName !== 'Aprendiz' ? studentName : ''},

Le informamos que en el sistema oficial del SENA se registra un acumulado de ${absences} inasistencia(s) no justificadas.

Le solicitamos ponerse en contacto con su instructor y/o coordinación académica a la mayor brevedad para justificar sus faltas o regularizar su situación académica.

Atentamente,
Coordinación Académica - SENA`;

    document.getElementById('emailBodyInput').value = bodyText;

    modal.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
}

document.getElementById('closeEmailModal')?.addEventListener('click', () => {
    const modal = document.getElementById('sendEmailModal');
    if (modal) modal.style.display = 'none';
});

document.getElementById('sendEmailForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('emailStudentId').value;
    const email = document.getElementById('emailStudentInput').value.trim();
    const subject = document.getElementById('emailSubjectInput').value.trim();
    const body = document.getElementById('emailBodyInput').value.trim();

    const submitBtn = document.querySelector('#sendEmailForm button[type="submit"]');
    const oldHtml = submitBtn ? submitBtn.innerHTML : 'Enviar Correo';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando correo...';
    }

    try {
        if (studentId && email) {
            await fetch(`${API_BASE}/api/students/${studentId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            }).catch(() => {});
        }

        const res = await fetch(`${API_BASE}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: email, subject, body })
        });

        const data = await res.json();

        const modal = document.getElementById('sendEmailModal');
        if (modal) modal.style.display = 'none';

        if (res.ok && data.success) {
            await showConfirmModal({
                title: '¡Correo Enviado!',
                message: `El correo de notificación fue enviado directamente a ${email} con éxito.`,
                confirmText: 'Entendido',
                cancelText: '',
                confirmBg: '#009900',
                iconName: 'check-circle',
                iconBg: 'rgba(0, 153, 0, 0.15)',
                iconColor: '#009900'
            });
        } else {
            alert(data.error || 'No se pudo enviar el correo.');
        }
    } catch (err) {
        console.error(err);
        alert('Error al enviar el correo desde la plataforma.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = oldHtml;
            if (window.lucide) window.lucide.createIcons();
        }
    }
});

async function notifyAllAlertsByEmail() {
    try {
        const [students, attendance] = await Promise.all([
            fetch(`${API_BASE}/api/students`).then(r => r.json()),
            fetch(`${API_BASE}/api/attendance`).then(r => r.json())
        ]);
        
        const allAlerts = students.map(s => {
            const absences = attendance.filter(a => a.doc === s.id && a.status === 'Ausente').length;
            return { ...s, absences };
        }).filter(s => s.absences > 0 && !dismissedAlerts.includes(s.id));

        if (allAlerts.length === 0) {
            alert('No hay aprendices pendientes con alertas de inasistencia.');
            return;
        }

        const validAlerts = allAlerts.filter(s => s.email);
        if (validAlerts.length === 0) {
            alert('Los aprendices en alerta aún no tienen correo personal registrado. Usa la opción individual para ingresar su correo (Gmail, Hotmail, etc.).');
            return;
        }

        let sentCount = 0;
        for (const s of validAlerts) {
            const subject = `Notificación Oficial de Inasistencias - Ficha ${s.group} - SENA`;
            const body = `Estimado(a) Aprendiz ${s.name},\n\nLe informamos que registra ${s.absences} inasistencia(s) no justificadas en la Ficha ${s.group}.\n\nPor favor ponerse en contacto con su instructor a la mayor brevedad.\n\nAtentamente,\nCoordinación Académica - SENA`;
            
            await fetch(`${API_BASE}/api/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: s.email, subject, body })
            }).then(() => sentCount++).catch(() => {});
        }

        await showConfirmModal({
            title: 'Notificación Masiva Completada',
            message: `Se enviaron directamente ${sentCount} correos de notificación de inasistencia.`,
            confirmText: 'Entendido',
            cancelText: '',
            confirmBg: '#0284c7',
            iconName: 'mail-check',
            iconBg: 'rgba(2, 132, 199, 0.15)',
            iconColor: '#0284c7'
        });
    } catch (err) {
        console.error(err);
    }
}

async function updateDashboard() {
    try {
        const [students, attendance, classes] = await Promise.all([
            fetch(`${API_BASE}/api/students`).then(r => r.json()),
            fetch(`${API_BASE}/api/attendance`).then(r => r.json()),
            fetch(`${API_BASE}/api/classes`).then(r => r.json())
        ]);
        
        // Populate dashboard selector once
        const selectorDash = document.getElementById('fichaSelectorDash');
        if (selectorDash && selectorDash.getAttribute('data-loaded') !== 'true') {
            selectorDash.innerHTML = '<option value="">Todas las Fichas</option>' + classes.map(c => `<option value="${c.name}">Ficha ${c.name}</option>`).join('');
            selectorDash.setAttribute('data-loaded', 'true');
            selectorDash.addEventListener('change', async (e) => {
                const ficha = e.target.value;
                renderTable(ficha);

                const banner     = document.getElementById('fichaActivaInfo');
                const nombreEl   = document.getElementById('fichaActivaNombre');
                const totalEl    = document.getElementById('fichaActivaTotal');

                if (ficha) {
                    // Buscar nombre de la clase
                    const claseSeleccionada = classes.find(c => c.name === ficha);
                    const desc = claseSeleccionada ? `${ficha} — ${claseSeleccionada.description || ''}` : ficha;

                    // Contar inscritos en esa ficha (excluyendo desertores)
                    const studRes = await fetch(`${API_BASE}/api/students`);
                    const allSt   = await studRes.json();
                    const count   = allSt.filter(s => s.group === ficha && s.status !== 'Desertor').length;

                    if (nombreEl) nombreEl.textContent = desc;
                    if (totalEl)  totalEl.textContent  = count;
                    if (banner)   banner.style.display = 'flex';
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                } else {
                    if (banner) banner.style.display = 'none';
                }
            });
        }

        
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

        await renderTable(currentFichaFilter);
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
        
        const isDesertor = s.status === 'Desertor';
        const nameStyle = isDesertor ? 'text-decoration: line-through; color: #94a3b8;' : '';
        const nameText = isDesertor ? `${s.name} <span style="color: #ef4444; font-size: 0.75rem; font-weight: 600; text-decoration: none; display: inline-block; margin-left: 8px;">Desertó</span>` : s.name;
        
        return `
            <tr style="${isDesertor ? 'background-color: #f1f5f9; color: #94a3b8;' : ''}">
                <td style="${isDesertor ? 'color: #94a3b8;' : ''}">${s.docType || '--'}</td>
                <td style="${isDesertor ? 'color: #94a3b8;' : ''}">${s.id}</td>
                <td style="${nameStyle}">${nameText}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${percent}%; height: 100%; background: ${isDesertor ? '#94a3b8' : (percent > 80 ? '#009900' : (percent > 50 ? '#f59e0b' : '#ef4444'))};"></div>
                        </div>
                        <span style="font-size: 0.8rem; font-weight: 600; color: ${isDesertor ? '#94a3b8' : 'inherit'};">${percent}%</span>
                    </div>
                </td>
                <td>
                    <button class="btn-primary" 
                            style="background: ${isDesertor ? '#009900' : '#d97706'}; color: #ffffff; font-size: 0.8rem; padding: 6px 12px; border-radius: 6px; display: flex; align-items: center; gap: 4px; border: none; font-weight: 600;" 
                            onclick="toggleStudentDesertor('${s.id}', '${s.status || 'Activo'}', '${fichaName}')">
                        <i data-lucide="${isDesertor ? 'user-check' : 'user-x'}" style="width: 14px; height: 14px;"></i>
                        ${isDesertor ? 'Reincorporar' : 'Desertar'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    // Re-initialize lucide icons inside the table
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

async function toggleStudentDesertor(id, currentStatus, fichaName) {
    const newStatus = currentStatus === 'Desertor' ? 'Activo' : 'Desertor';
    const isDesertar = newStatus === 'Desertor';
    
    const confirmed = await showConfirmModal({
        title: isDesertar ? 'Declarar Deserción' : 'Reincorporar Aprendiz',
        message: isDesertar 
            ? '¿Estás seguro de marcar a este aprendiz como DESERTOR? No aparecerá en los listados activos de asistencia.' 
            : '¿Estás seguro de reincorporar a este aprendiz a las actividades académicas?',
        confirmText: isDesertar ? 'Sí, Desertar' : 'Sí, Reincorporar',
        cancelText: 'Cancelar',
        confirmBg: isDesertar ? '#d97706' : '#009900',
        iconName: isDesertar ? 'user-x' : 'user-check',
        iconBg: isDesertar ? 'rgba(217, 119, 6, 0.15)' : 'rgba(0, 153, 0, 0.15)',
        iconColor: isDesertar ? '#d97706' : '#009900'
    });

    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE}/api/students/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
            openFicha(fichaName);
        } else {
            alert('Error al actualizar el estado del aprendiz.');
        }
    } catch (err) {
        console.error(err);
        alert('Error de conexión.');
    }
}

function showFichasMain() { 
    document.getElementById('fichasMain').style.display = 'block'; 
    document.getElementById('fichaDetail').style.display = 'none'; 
}

// ============================================
// Búsqueda de Aprendiz
// ============================================

let _cachedStudents = null;
let _autoSearchTimer = null;

async function _getAllStudents() {
    if (_cachedStudents) return _cachedStudents;
    try {
        const studentsRes = await fetch(`${API_BASE}/api/students`);
        const allStudents = await studentsRes.json();
        let students = [];

        if (Array.isArray(allStudents)) {
            // Array plano: cada estudiante tiene su 'group' como ficha
            allStudents.forEach(s => {
                students.push({ ...s, ficha: s.group || '' });
            });
        } else {
            // Objeto agrupado por ficha (compatibilidad)
            for (const className in allStudents) {
                const classStudents = allStudents[className];
                if (Array.isArray(classStudents)) {
                    classStudents.forEach(s => {
                        students.push({ ...s, ficha: className });
                    });
                }
            }
        }

        _cachedStudents = students;
        setTimeout(() => { _cachedStudents = null; }, 30000);
        return students;
    } catch (error) {
        console.error('Error cargando estudiantes:', error);
        return [];
    }
}

function autoSearchByDoc() {
    clearTimeout(_autoSearchTimer);
    const docNumber = document.getElementById('searchDocNumber').value.trim();

    if (docNumber.length < 2) {
        document.getElementById('searchResults').style.display = 'none';
        _clearAutoFilledFields();
        return;
    }

    // Debounce: esperar 300ms después de que el usuario deje de escribir
    _autoSearchTimer = setTimeout(async () => {
        const students = await _getAllStudents();
        const query = docNumber.toLowerCase();

        // 1) Coincidencia exacta (excluyendo desertores)
        const exactMatch = students.find(s => (s.id || '').toLowerCase() === query && s.status !== 'Desertor');

        if (exactMatch) {
            _autoFillFields(exactMatch);
        } else {
            // 2) Coincidencias parciales (excluyendo desertores)
            const results = students.filter(s => (s.id || '').toLowerCase().includes(query) && s.status !== 'Desertor');
            if (results.length === 1) {
                // Solo un resultado → autocompletar igual
                _autoFillFields(results[0]);
            } else {
                _clearAutoFilledFields();
                _renderSearchResults(results);
            }
        }
    }, 300);
}

function _autoFillFields(student) {
    const nameField    = document.getElementById('searchName');
    const docTypeField = document.getElementById('searchDocType');
    const phoneField   = document.getElementById('searchPhone');

    if (nameField) {
        nameField.value = student.name || '';
        nameField.style.borderColor = '#009900';
        nameField.style.boxShadow   = '0 0 0 3px rgba(0,153,0,0.15)';
        nameField.style.background  = '#f0fdf4';
    }
    if (docTypeField && student.docType) {
        docTypeField.value = student.docType;
        docTypeField.style.borderColor = '#009900';
        docTypeField.style.boxShadow   = '0 0 0 3px rgba(0,153,0,0.15)';
        docTypeField.style.background  = '#f0fdf4';
    }
    if (phoneField) {
        phoneField.value = student.phone || '';
        if (student.phone) {
            phoneField.style.borderColor = '#009900';
            phoneField.style.boxShadow   = '0 0 0 3px rgba(0,153,0,0.15)';
            phoneField.style.background  = '#f0fdf4';
        }
    }

    // Mostrar tarjeta de confirmación del aprendiz encontrado
    const resultsContainer = document.getElementById('searchResults');
    const resultsList      = document.getElementById('searchResultsList');
    resultsContainer.style.display = 'block';
    resultsList.innerHTML = `
        <div class="search-result-item" style="border-left-color: #009900; background: #f0fdf4;">
            <div class="result-info">
                <div class="result-name" style="color: #009900;">
                    ✓ Aprendiz encontrado
                </div>
                <div class="result-details">
                    ${student.docType ? student.docType + ': ' : ''}${student.id}
                    · <strong>${student.name}</strong>
                    · Ficha: ${student.ficha}
                    ${student.phone ? ' · Tel: ' + student.phone : ''}
                </div>
            </div>
            <div class="result-action">
                <button class="btn-primary" style="background: #009900; font-size: 0.8rem; padding: 6px 16px;"
                    onclick="selectSearchResult('${student.id}', '${student.name}', '${student.ficha}', '${student.docType || ''}')">
                    Registrar Asistencia
                </button>
            </div>
        </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function _clearAutoFilledFields() {
    const fields = ['searchName', 'searchPhone'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.dataset.autofilled) {
            el.value = '';
            delete el.dataset.autofilled;
        }
        if (el) {
            el.style.borderColor = '';
            el.style.boxShadow   = '';
            el.style.background  = '';
        }
    });
    const docTypeField = document.getElementById('searchDocType');
    if (docTypeField) {
        docTypeField.style.borderColor = '';
        docTypeField.style.boxShadow   = '';
        docTypeField.style.background  = '';
    }
}

async function searchStudent(event) {
    event.preventDefault();

    const docType  = document.getElementById('searchDocType').value;
    const docNumber = document.getElementById('searchDocNumber').value.trim().toLowerCase();
    const name      = document.getElementById('searchName').value.trim().toLowerCase();

    const students = await _getAllStudents();

    let results = students.filter(s => {
        let match = s.status !== 'Desertor';
        if (docType) {
            match = match && (s.docType || '').toUpperCase() === docType.toUpperCase();
        }
        if (docNumber) {
            match = match && (s.id || '').toLowerCase().includes(docNumber);
        }
        if (name) {
            match = match && (s.name || '').toLowerCase().includes(name);
        }
        return match;
    });

    _renderSearchResults(results);
}

function _renderSearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    const resultsList = document.getElementById('searchResultsList');

    if (results.length === 0) {
        resultsContainer.style.display = 'block';
        resultsList.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--text-muted);">
                <i data-lucide="search-x" style="width: 40px; height: 40px; margin-bottom: 10px; opacity: 0.5;"></i>
                <p style="font-size: 0.9rem;">No se encontraron aprendices con esos criterios.</p>
            </div>
        `;
    } else {
        resultsContainer.style.display = 'block';
        resultsList.innerHTML = results.map(s => `
            <div class="search-result-item">
                <div class="result-info">
                    <div class="result-name">${s.name}</div>
                    <div class="result-details">
                        ${s.docType ? s.docType + ': ' : 'Doc: '}${s.id} · Ficha: ${s.ficha}
                        ${s.phone ? ' · Tel: ' + s.phone : ''}
                    </div>
                </div>
                <div class="result-action">
                    <button class="btn-primary" style="background: var(--primary); font-size: 0.8rem; padding: 6px 16px;" onclick="selectSearchResult('${s.id}', '${s.name}', '${s.ficha}', '${s.docType || ''}')">
                        Registrar Asistencia
                    </button>
                </div>
            </div>
        `).join('');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function validateDocNumber(input) {
    const original = input.value;
    // Quitar todo lo que no sea dígito
    const onlyNums = original.replace(/\D/g, '');
    const hasInvalid = original !== onlyNums;

    input.value = onlyNums;

    const errorSpan = document.getElementById('studentIdError');
    if (hasInvalid) {
        input.style.borderColor = '#ef4444';
        input.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.2)';
        if (errorSpan) errorSpan.style.display = 'block';
    } else {
        input.style.borderColor = onlyNums.length > 0 ? '#009900' : '#e2e8f0';
        input.style.boxShadow = onlyNums.length > 0 ? '0 0 0 3px rgba(0,153,0,0.15)' : 'none';
        if (errorSpan) errorSpan.style.display = 'none';
    }
}

function clearSearchForm() {
    document.getElementById('searchStudentForm').reset();
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('searchResultsList').innerHTML = '';
}

async function selectSearchResult(id, name, ficha, docType = '') {
    const { fecha, hora, timestamp } = _getNow();
    const resultsList = document.getElementById('searchResultsList');

    try {
        // ── Verificar si ya tiene asistencia hoy en esta ficha ──
        const existingRes = await fetch(`${API_BASE}/api/attendance`);
        const allAttendance = await existingRes.json();
        const yaRegistrado = allAttendance.some(
            a => a.doc === id && a.group === ficha && a.fecha === fecha
        );

        if (yaRegistrado) {
            if (resultsList) {
                resultsList.innerHTML = `
                    <div class="search-result-item" style="border-left-color:#f59e0b; background:#fffbeb;">
                        <div class="result-info">
                            <div class="result-name" style="color:#d97706;">
                                ⚠ Asistencia ya registrada hoy
                            </div>
                            <div class="result-details">
                                <strong>${name}</strong> · ${docType ? docType + ': ' : 'Doc: '}${id} · Ficha: ${ficha}<br>
                                Ya tiene asistencia registrada el 📅 ${fecha}
                            </div>
                        </div>
                    </div>
                `;
            }
            return; // Detener — no registrar duplicado
        }

        // ── Registrar asistencia ──
        const res = await fetch(`${API_BASE}/api/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                doc:     id,
                docType: docType,
                group:   ficha,
                status:  'Presente',
                time:    hora,
                fecha,
                timestamp
            })
        });

        if (res.ok) {
            if (resultsList) {
                resultsList.innerHTML = `
                    <div class="search-result-item" style="border-left-color:#009900; background:#f0fdf4;">
                        <div class="result-info">
                            <div class="result-name" style="color:#009900;">✓ Asistencia registrada exitosamente</div>
                            <div class="result-details">
                                <strong>${name}</strong> · ${docType ? docType + ': ' : 'Doc: '}${id} · Ficha: ${ficha}<br>
                                📅 ${fecha} &nbsp; 🕐 ${hora}
                            </div>
                        </div>
                    </div>
                `;
            }
            setTimeout(() => {
                clearSearchForm();
                renderTable();
            }, 2500);
        } else {
            alert('Error al registrar la asistencia. Intenta de nuevo.');
        }
    } catch (err) {
        console.error(err);
        alert('Error de conexión con el servidor.');
    }
}

// ============================================
// Funciones de Exportación (Excel / PDF)
// ============================================

async function fetchAttendanceExportData() {
    try {
        const response = await fetch(`${API_BASE}/api/attendance`);
        let history = await response.json();
        if (currentFichaFilter) {
            history = history.filter(h => h.group === currentFichaFilter);
        }
        return history.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (err) {
        console.error('Error al obtener datos para exportar:', err);
        return [];
    }
}

async function getSenaLogoBase64() {
    return new Promise(async (resolve) => {
        try {
            // Usamos la copia local de la URL del logo para evitar el bloqueo CORS del navegador
            const url = '/sena_logo.png';
            const response = await fetch(url);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        } catch (e) {
            console.error('Error al obtener el logo:', e);
            resolve(null);
        }
    });
}

async function exportToExcel() {
    const data = await fetchAttendanceExportData();
    if (data.length === 0) {
        alert('No hay registros de asistencia disponibles para exportar.');
        return;
    }

    // Crear libro y hoja con ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Asistencias');

    const logoBase64 = await getSenaLogoBase64('#009900'); // Volvemos al logo verde original
    if (logoBase64) {
        const imageId = workbook.addImage({
            base64: logoBase64.replace(/^data:image\/(png|jpeg);base64,/, ""),
            extension: 'png'
        });
        worksheet.addImage(imageId, {
            tl: { col: 0.2, row: 0.1 },
            ext: { width: 32, height: 32 }
        });
    }


    // ── Agregar título o banner institucional SENA ──
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'REPORTE OFICIAL DE ASISTENCIA - SENA';
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' } // Fondo Blanco
    };
    titleCell.font = {
        name: 'Arial',
        size: 14,
        bold: true,
        color: { argb: 'FF009900' } // Texto Verde SENA
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 40;

    // Subtítulo con detalles del reporte
    worksheet.mergeCells('A2:H2');
    const subtitleCell = worksheet.getCell('A2');
    const fechaReporte = new Date().toLocaleDateString('es-CO');
    const filtroTexto = currentFichaFilter ? `Ficha: ${currentFichaFilter}` : 'Todas las Fichas';
    subtitleCell.value = `Generado el: ${fechaReporte} | ${filtroTexto}`;
    subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF555555' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 25;

    // Fila en blanco
    worksheet.getRow(3).height = 15;

    // ── Definir Cabecera de la Tabla (Fila 4) ──
    const headerRow = worksheet.getRow(4);
    headerRow.values = ['#', 'Aprendiz', 'Tipo de Documento', 'Documento', 'Ficha', 'Fecha', 'Hora', 'Estado'];
    headerRow.height = 28;

    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF009900' } // Verde SENA
        };
        cell.font = {
            name: 'Arial',
            size: 11,
            bold: true,
            color: { argb: 'FFFFFFFF' } // Blanco
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF007700' } },
            bottom: { style: 'medium', color: { argb: 'FF005500' } },
            left: { style: 'thin', color: { argb: 'FF007700' } },
            right: { style: 'thin', color: { argb: 'FF007700' } }
        };
    });

    // ── Cargar Datos de Asistencia (Desde Fila 5) ──
    data.forEach((item, index) => {
        const row = worksheet.addRow([
            index + 1,
            item.name || '---',
            item.docType || '---',
            item.doc || '---',
            item.group || '---',
            item.fecha || '---',
            item.time || '---',
            item.status || '---'
        ]);
        row.height = 22;

        // Estilos para cada celda de datos
        row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', size: 10 };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };

            // Alineación
            if (colNumber === 2) {
                cell.alignment = { horizontal: 'left', vertical: 'middle' };
            } else {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }

            // Destacar estado
            if (colNumber === 8) {
                if (cell.value === 'Presente') {
                    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF008800' } };
                } else if (cell.value === 'Tarde') {
                    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFD97706' } };
                } else if (cell.value === 'Ausente') {
                    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFDC2626' } };
                }
            }
        });
    });

    // ── Autoajuste de Ancho de Columnas ──
    worksheet.columns.forEach((column) => {
        let maxLen = 12;
        column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
            // Ignorar filas de título y subtítulo para el cálculo del ancho
            if (rowNumber > 3 && cell.value) {
                const len = cell.value.toString().length;
                if (len > maxLen) maxLen = len;
            }
        });
        column.width = maxLen + 4;
    });

    // ── Proteger la hoja para que no se pueda modificar y el logo no se pueda mover o borrar ──
    worksheet.protect('', {
        selectLockedCells: true,
        selectUnlockedCells: true
    });

    // ── Descargar el Archivo en el Navegador ──
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `Reporte_Asistencia_${currentFichaFilter || 'General'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveAs(new Blob([buffer]), fileName);
}

async function exportToPDF() {
    const data = await fetchAttendanceExportData();
    if (data.length === 0) {
        alert('No hay registros de asistencia disponibles para exportar.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const logoBase64 = await getSenaLogoBase64();
    if (logoBase64) {
        // En PDF se puede poner el logo en la parte superior
        doc.addImage(logoBase64, 'PNG', 14, 10, 15, 15);
        doc.setFontSize(16);
        doc.setTextColor(0, 153, 0); // Verde SENA
        doc.text('Reporte de Asistencia Digital - SENA', 33, 20);
    } else {
        doc.setFontSize(16);
        doc.setTextColor(0, 153, 0); // Verde SENA
        doc.text('Reporte de Asistencia Digital - SENA', 14, 20);
    }

    doc.setFontSize(10);
    doc.setTextColor(100);
    const fechaReporte = new Date().toLocaleDateString('es-CO');
    const filtroTexto = currentFichaFilter ? `Ficha: ${currentFichaFilter}` : 'Todas las Fichas';
    doc.text(`Generado el: ${fechaReporte} | ${filtroTexto}`, 14, 28);

    const tableColumn = ['#', 'Aprendiz', 'Tipo Doc', 'Documento', 'Ficha', 'Fecha', 'Hora', 'Estado'];
    const tableRows = data.map((item, index) => [
        index + 1,
        item.name || '---',
        item.docType || '---',
        item.doc || '---',
        item.group || '---',
        item.fecha || '---',
        item.time || '---',
        item.status || '---'
    ]);

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 34,
        headStyles: { fillColor: [0, 153, 0] },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        styles: { fontSize: 8 }
    });

    const fileName = `Reporte_Asistencia_${currentFichaFilter || 'General'}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
}
