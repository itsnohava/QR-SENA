// Sample data fallback
const studentsMock = [
    { name: "Esperando registros...", doc: "---", time: "---", status: "N/A" }
];

const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
let currentFichaFilter = '';
let globalChartInstance = null;

function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    let backdrop = document.getElementById('sidebarBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'sidebarBackdrop';
        backdrop.style.position = 'fixed';
        backdrop.style.inset = '0';
        backdrop.style.background = 'rgba(0,0,0,0.5)';
        backdrop.style.zIndex = '998';
        backdrop.style.display = 'none';
        backdrop.onclick = closeMobileSidebar;
        document.body.appendChild(backdrop);
    }

    if (sidebar) {
        sidebar.classList.toggle('active');
        if (sidebar.classList.contains('active')) {
            backdrop.style.display = 'block';
        } else {
            backdrop.style.display = 'none';
        }
    }
}

function closeMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.remove('active');
    if (backdrop) backdrop.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 900) {
                closeMobileSidebar();
            }
        });
    });
});

function initUserProfile() {
    const name = sessionStorage.getItem('sena_name') || 'Juan Pérez';
    const role = sessionStorage.getItem('sena_role') || 'INSTRUCTOR';
    
    const sidebarName = document.getElementById('sidebarUserName');
    const sidebarRole = document.getElementById('sidebarUserRole');
    const headerName  = document.getElementById('headerUserName');
    
    if (sidebarName) sidebarName.textContent = name;
    if (sidebarRole) sidebarRole.textContent = role;
    if (headerName)  headerName.textContent  = name;

    // --- Visibilidad de ítems del menú por rol ---

    // Dashboard: visible para Instructor y Coordinador, oculto para Aprendiz
    const navDashboard = document.getElementById('navDashboard');
    if (navDashboard) navDashboard.style.display = (role === 'APRENDIZ') ? 'none' : '';

    // Mis Fichas: solo visible para Instructor
    const navMisFichas = document.getElementById('navMisFichas');
    if (navMisFichas) navMisFichas.style.display = (role === 'INSTRUCTOR') ? '' : 'none';

    // Toma de Asistencia: solo visible para Instructor
    const navTomaAsistencia = document.getElementById('navTomaAsistencia');
    if (navTomaAsistencia) navTomaAsistencia.style.display = (role === 'INSTRUCTOR') ? '' : 'none';

    // Seguimiento: visible para Instructor y Coordinador
    const navSeguimiento = document.getElementById('navSeguimiento');
    if (navSeguimiento) navSeguimiento.style.display = (role === 'APRENDIZ') ? 'none' : '';

    // Alertas: visible para todos
    const navAlertas = document.getElementById('navAlertas');
    if (navAlertas) navAlertas.style.display = '';

    // Reportes: visible para Instructor y Coordinador
    const navReportes = document.getElementById('navReportes');
    if (navReportes) navReportes.style.display = (role === 'APRENDIZ') ? 'none' : '';

    // Gestión Instructores: solo visible para Coordinador
    const navInstructores = document.getElementById('navInstructores');
    if (navInstructores) navInstructores.style.display = (role === 'COORDINADOR') ? '' : 'none';

    // Evidencias: visible para todos
    const navEvidencias = document.getElementById('navEvidencias');
    if (navEvidencias) navEvidencias.style.display = '';

    // Mi Perfil: visible para todos
    const navMiPerfil = document.getElementById('navMiPerfil');
    if (navMiPerfil) navMiPerfil.style.display = '';

    // --- Título tabla evidencias ---
    const titleElem = document.getElementById('titleTablaEvidencias');
    if (titleElem) {
        titleElem.textContent = (role === 'APRENDIZ') 
            ? 'Mis Evidencias Enviadas' 
            : 'Evidencias Recibidas de Aprendices';
    }

    // --- Comportamiento especial por rol ---
    if (role === 'APRENDIZ') {
        // Aprendiz: mostrar el formulario de subida de evidencias
        const cardForm = document.getElementById('cardFormEvidencia');
        if (cardForm) cardForm.style.display = 'block';

        // Navegar automáticamente a la vista de evidencias
        document.querySelectorAll('.content-view').forEach(v => v.style.display = 'none');
        const viewEvid = document.getElementById('view-evidencias');
        if (viewEvid) viewEvid.style.display = 'block';

        // Marcar nav activo en Evidencias
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        if (navEvidencias) {
            const a = navEvidencias.querySelector('a');
            if (a) a.classList.add('active');
        }

        renderEvidencias();
    } else {
        // Instructor / Coordinador: ocultar el formulario de envío (solo revisan)
        const cardForm = document.getElementById('cardFormEvidencia');
        if (cardForm) cardForm.style.display = 'none';
    }

    // Load saved avatar
    const savedAvatar = localStorage.getItem('sena_avatar');
    updateAllAvatars(savedAvatar);

    // Actualizar insignias de evidencias pendientes en el menú y campana
    updatePendingEvidencesBadge();
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

function _cleanDocId(val) {
    if (!val) return '';
    return String(val).replace(/\D/g, '').replace(/^0+/, '');
}

async function renderTable(fichaFilter = currentFichaFilter) {
    currentFichaFilter = fichaFilter;
    try {
        const [attRes, studRes] = await Promise.all([
            fetch(`${API_BASE}/api/attendance`),
            fetch(`${API_BASE}/api/students`)
        ]);
        let history = attRes.ok ? await attRes.json() : [];
        let allStudents = studRes.ok ? await studRes.json() : [];

        let activeStudents = allStudents.filter(s => s.status !== 'Desertor');

        if (fichaFilter) {
            history = history.filter(h => h.group === fichaFilter);
            activeStudents = activeStudents.filter(s => s.group === fichaFilter);
        }

        // Ordenar registros por marca de tiempo más reciente primero
        const data = [...history].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        const updateList = (id) => {
            const list = document.getElementById(id);
            if (!list) return;

            if (data.length === 0) {
                list.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 25px; color: var(--text-muted);">
                            Esperando registros de asistencia...
                        </td>
                    </tr>
                `;
                return;
            }

            list.innerHTML = data.map((s, index) => {
                const rowNum = data.length - index;
                const ambienteCell = (id === 'attendanceListToma') 
                    ? `<td style="white-space: nowrap;"><span style="font-size: 0.78rem; font-weight: 700; color: #009900; background: #f0fdf4; padding: 4px 10px; border-radius: 8px; border: 1px solid #bbf7d0; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="map-pin" style="width: 12px; height: 12px;"></i> ${s.ambiente || 'Ambiente 302'}</span></td>`
                    : '';
                return `
                    <tr>
                        <td>${rowNum}</td>
                        <td>${s.name}</td>
                        <td>${s.docType || 'CC'}</td>
                        <td>${s.doc}</td>
                        ${ambienteCell}
                        <td>${s.time || '--:--'}</td>
                        <td>
                            <span onclick="toggleStatus('${s.doc}', '${s.status}', '${encodeURIComponent(s.name)}', '${s.group}', '${s.docType}')" 
                                  class="status-badge ${s.status === 'Presente' ? 'status-presente' : (s.status === 'Tarde' ? 'status-tarde' : (s.status === 'Ausente' ? 'status-ausente' : 'status-justificado'))}" 
                                  style="cursor: pointer;" title="Haz clic para cambiar estado">
                                ${s.status}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');

            if (window.lucide) window.lucide.createIcons();

            const paginationId = id === 'attendanceList' ? 'paginationDash' : 'paginationToma';
            const pagContainer = document.getElementById(paginationId);
            if (pagContainer) pagContainer.innerHTML = '';
        };

        updateList('attendanceList');
        updateList('attendanceListToma');

        // Actualizar tarjetas de estadísticas
        const totalStat   = document.querySelector('.stat-card.total .stat-value');
        const presentStat = document.querySelector('.stat-card.presentes .stat-value');
        const lateStat    = document.querySelector('.stat-card.tardes .stat-value');
        const absentStat  = document.querySelector('.stat-card.ausentes .stat-value');

        if (totalStat) totalStat.textContent   = history.length;
        if (presentStat) presentStat.textContent = history.filter(s => s.status === 'Presente').length;
        if (lateStat) lateStat.textContent    = history.filter(s => s.status === 'Tarde').length;
        if (absentStat) absentStat.textContent  = history.filter(s => s.status === 'Ausente').length;

        renderAlerts(history, fichaFilter);
    } catch (err) { console.error(err); }
}

function updateAmbienteVinculado() {
    const sel = document.getElementById('ambienteSelectorToma');
    if (!sel) return;
    const val = sel.value;
    localStorage.setItem('sena_ambiente_activo', val);

    const inputFicha = document.getElementById('fichaAmbienteInput');
    if (inputFicha) {
        const fichaSel = document.getElementById('fichaSelectorToma')?.value || 'ADSO 3292060';
        inputFicha.value = `Ficha ${fichaSel}`;
    }

    const badge = document.getElementById('ambienteStatusBadge');
    if (badge) {
        badge.innerHTML = `<span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block;"></span> Lector Vinculado: ${val.split(' - ')[0]}`;
    }
}

// Helper: fecha y hora exacta del momento
function _getNow() {
    const now = new Date();
    const fecha = now.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora  = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return { fecha, hora, timestamp: now.getTime() };
}

async function toggleStatus(doc, currentStatus, encodedName = '', group = '', docType = '') {
    if (!doc || doc === '---') return;
    const name = encodedName ? decodeURIComponent(encodedName) : '';
    let newStatus = (currentStatus === 'Ausente' || !currentStatus) ? 'Presente' : (currentStatus === 'Presente' ? 'Tarde' : 'Ausente');
    const { fecha, hora, timestamp } = _getNow();
    const ambiente = document.getElementById('ambienteSelectorToma')?.value || localStorage.getItem('sena_ambiente_activo') || 'Ambiente 302 - Software';
    const enforceAmbiente = document.getElementById('checkEnforceAmbiente')?.checked !== false;

    try {
        const response = await fetch(`${API_BASE}/api/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doc: String(doc).trim(), status: newStatus, time: hora, fecha, timestamp, name, group, docType, ambiente, enforceAmbiente })
        });
        if (response.ok) {
            await renderTable();
        } else {
            const errData = await response.json();
            await showConfirmModal({
                title: '⛔ Marcación Rechazada',
                message: errData.error || 'No se permite registrar la asistencia desde un ambiente no asignado a esta ficha.',
                confirmText: 'Entendido',
                cancelText: '',
                confirmBg: '#ef4444',
                iconName: 'shield-off',
                iconBg: 'rgba(239, 68, 68, 0.15)',
                iconColor: '#ef4444'
            });
        }
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
        else if (text.includes('instructor')) viewId = 'view-instructores';
        else if (text.includes('evidencia')) viewId = 'view-evidencias';
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
            if (viewId === 'view-instructores') renderInstructores();
            if (viewId === 'view-evidencias') renderEvidencias();
            if (viewId === 'view-perfil') openProfileView();
        }
    });
});

function updateProfileRoleFields(role) {
    const roleUpper = (role || '').toUpperCase();
    const isCoord = roleUpper === 'COORDINADOR';
    const isAprendiz = roleUpper === 'APRENDIZ';
    
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

    if (isAprendiz) {
        if (badgeInfo) badgeInfo.textContent = 'Información de Aprendiz SENA';
        if (label1) label1.textContent = 'Programa de Formación';
        if (field1) field1.value = 'Análisis y Desarrollo de Software (ADSO)';
        if (label2) label2.textContent = 'Ficha de Formación';
        if (field2) field2.value = 'Ficha 3292060';
        if (m1) m1.textContent = '3292060';
        if (m1Label) m1Label.textContent = 'Mi Ficha';
        if (m2) m2.textContent = 'En Formación';
        if (m2Label) m2Label.textContent = 'Estado Aprendiz';
        if (metricsContainer) metricsContainer.style.display = 'grid';
        if (fichasContainer) fichasContainer.style.display = 'block';
    } else if (isCoord) {
        if (badgeInfo) badgeInfo.textContent = 'Información de Coordinación Académica';
        if (label1) label1.textContent = 'Coordinación / Dependencia';
        if (field1) field1.value = 'Coordinación Académica de Teleinformática';
        if (label2) label2.textContent = 'Alcance / Supervisión';
        if (field2) field2.value = 'Supervisión General de Fichas e Instructores';
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
            total: attendance.length,
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
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <button class="btn-primary" 
                                style="background: ${isDesertor ? '#009900' : '#d97706'}; color: #ffffff; font-size: 0.8rem; padding: 6px 12px; border-radius: 6px; display: flex; align-items: center; gap: 4px; border: none; font-weight: 600; cursor: pointer;" 
                                onclick="toggleStudentDesertor('${s.id}', '${s.status || 'Activo'}', '${fichaName}')">
                            <i data-lucide="${isDesertor ? 'user-check' : 'user-x'}" style="width: 14px; height: 14px;"></i>
                            ${isDesertor ? 'Reincorporar' : 'Desertar'}
                        </button>
                        <button class="btn-primary" 
                                style="background: #ef4444; color: #ffffff; font-size: 0.8rem; padding: 6px 12px; border-radius: 6px; display: flex; align-items: center; gap: 4px; border: none; font-weight: 600; cursor: pointer;" 
                                onclick="deleteStudent('${s.id}', '${s.name.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', '${fichaName}')">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                            Eliminar
                        </button>
                    </div>
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

async function deleteStudent(id, name, fichaName) {
    const confirmed = await showConfirmModal({
        title: 'Eliminar Aprendiz',
        message: `¿Estás seguro de <strong>eliminar permanentemente</strong> a <strong>${name}</strong> del sistema? Esta acción también borrará sus registros de asistencia y no se puede deshacer.`,
        confirmText: 'Sí, Eliminar',
        cancelText: 'Cancelar',
        confirmBg: '#ef4444',
        iconName: 'trash-2',
        iconBg: 'rgba(239, 68, 68, 0.12)',
        iconColor: '#ef4444'
    });

    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE}/api/students/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            openFicha(fichaName);
        } else {
            const err = await res.json();
            alert(err.error || 'Error al eliminar el aprendiz.');
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

function _cleanDocId(str) {
    if (!str) return '';
    const s = String(str).trim();
    // Extraer secuencias de dígitos (aplica para carnet, lector de barras o entrada manual)
    const digitMatches = s.match(/\d{5,12}/g);
    if (digitMatches && digitMatches.length > 0) {
        return digitMatches[0];
    }
    return s.replace(/\D/g, '') || s.toLowerCase();
}

function autoSearchByDoc() {
    clearTimeout(_autoSearchTimer);
    const input = document.getElementById('searchDocNumber');
    if (!input) return;
    const rawDoc = input.value.trim();

    if (rawDoc.length < 2) {
        const res = document.getElementById('searchResults');
        if (res) res.style.display = 'none';
        _clearAutoFilledFields();
        return;
    }

    _autoSearchTimer = setTimeout(async () => {
        const students = await _getAllStudents();
        const cleanScanned = _cleanDocId(rawDoc);

        const match = students.find(s => {
            if (s.status === 'Desertor') return false;
            const cleanId = _cleanDocId(s.id);
            return cleanId === cleanScanned || 
                   (cleanScanned.length >= 4 && cleanId.includes(cleanScanned)) || 
                   (cleanId.length >= 4 && cleanScanned.includes(cleanId)) ||
                   (s.id || '').toLowerCase().includes(rawDoc.toLowerCase());
        });

        if (match) {
            _autoFillFields(match);
        } else {
            _clearAutoFilledFields();
            const resultsContainer = document.getElementById('searchResults');
            const resultsList      = document.getElementById('searchResultsList');
            if (resultsContainer && resultsList) {
                resultsContainer.style.display = 'block';
                resultsList.innerHTML = `
                    <div class="search-result-item" style="border-left-color: #ef4444; background: #fef2f2;">
                        <div class="result-info">
                            <div class="result-name" style="color: #ef4444;">
                                ⚠️ No se encontró ningún aprendiz registrado con el documento "${rawDoc}"
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    }, 150);
}

function _autoFillFields(student) {
    const nameField    = document.getElementById('searchName');
    const docTypeField = document.getElementById('searchDocType');
    const phoneField   = document.getElementById('searchPhone');

    if (nameField) {
        nameField.value = student.name || '';
        nameField.dataset.autofilled = 'true';
        nameField.style.borderColor = '#009900';
        nameField.style.boxShadow   = '0 0 0 3px rgba(0,153,0,0.15)';
        nameField.style.background  = '#f0fdf4';
        nameField.style.fontWeight  = '700';
        nameField.style.color       = '#009900';
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
            phoneField.dataset.autofilled = 'true';
            phoneField.style.borderColor = '#009900';
            phoneField.style.boxShadow   = '0 0 0 3px rgba(0,153,0,0.15)';
            phoneField.style.background  = '#f0fdf4';
        }
    }

    // Mostrar tarjeta de confirmación del aprendiz encontrado
    const resultsContainer = document.getElementById('searchResults');
    const resultsList      = document.getElementById('searchResultsList');
    if (resultsContainer && resultsList) {
        resultsContainer.style.display = 'block';
        resultsList.innerHTML = `
            <div class="search-result-item" style="border-left-color: #009900; background: #f0fdf4; padding: 14px 18px; border-radius: 12px;">
                <div class="result-info">
                    <div class="result-name" style="color: #009900; font-weight: 800; font-size: 1.05rem; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="check-circle" style="width: 18px; height: 18px;"></i>
                        ${student.name}
                    </div>
                    <div class="result-details" style="margin-top: 4px; font-size: 0.88rem; color: #334155;">
                        ${student.docType || 'CC'}: <strong>${student.id}</strong>
                        · Ficha: <strong>${student.ficha || student.group || 'General'}</strong>
                        ${student.phone ? ' · Tel: ' + student.phone : ''}
                    </div>
                </div>
                <div class="result-action" style="display: flex; gap: 8px; margin-top: 10px;">
                    <button type="button" class="btn-primary" style="background: transparent; color: var(--text-muted); border: 1px solid var(--text-muted); font-size: 0.8rem; padding: 6px 12px; transition: all 0.2s;"
                        onmouseover="this.style.color='#009900'; this.style.borderColor='#009900';" onmouseout="this.style.color='var(--text-muted)'; this.style.borderColor='var(--text-muted)';"
                        onclick="showStudentHistoryModal('${student.id}', '${student.name}', '${student.ficha || student.group || ''}')">
                        Ver Historial
                    </button>
                    <button type="button" class="btn-primary" style="background: #009900; font-size: 0.8rem; padding: 6px 16px;"
                        onclick="selectSearchResult('${student.id}', '${student.name}', '${student.ficha || student.group || ''}', '${student.docType || 'CC'}')">
                        Registrar Asistencia
                    </button>
                </div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
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
            el.style.fontWeight  = '';
            el.style.color       = '';
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
    if (event && event.preventDefault) event.preventDefault();

    const docTypeInput   = document.getElementById('searchDocType');
    const docNumberInput = document.getElementById('searchDocNumber');
    const nameInput      = document.getElementById('searchName');

    const docType   = docTypeInput ? docTypeInput.value : '';
    const rawDoc    = docNumberInput ? docNumberInput.value.trim() : '';
    const name      = nameInput ? nameInput.value.trim().toLowerCase() : '';

    if (!rawDoc && !name && !docType) return;

    const students = await _getAllStudents();

    // ── Búsqueda limpia para lectores de código de barras / cédulas ──
    if (rawDoc) {
        const cleanScanned = _cleanDocId(rawDoc);
        const matches = students.filter(s => {
            if (s.status === 'Desertor') return false;
            const cleanId = _cleanDocId(s.id);
            return cleanId === cleanScanned || 
                   (cleanScanned.length >= 4 && cleanId.includes(cleanScanned)) || 
                   (cleanId.length >= 4 && cleanScanned.includes(cleanId)) ||
                   (s.id || '').toLowerCase() === rawDoc.toLowerCase();
        });

        if (matches.length > 0) {
            for (const st of matches) {
                await selectSearchResult(st.id, st.name, st.group || st.ficha || '', st.docType || 'CC');
            }
            return;
        }
    }

    let results = students.filter(s => {
        let match = s.status !== 'Desertor';
        if (docType) {
            match = match && (s.docType || '').toUpperCase() === docType.toUpperCase();
        }
        if (rawDoc) {
            const cleanScanned = _cleanDocId(rawDoc);
            const cleanId = _cleanDocId(s.id);
            match = match && (cleanId.includes(cleanScanned) || cleanScanned.includes(cleanId) || (s.id || '').toLowerCase().includes(rawDoc.toLowerCase()));
        }
        if (name) {
            match = match && (s.name || '').toLowerCase().includes(name);
        }
        return match;
    });

    if (results.length > 0 && rawDoc) {
        for (const st of results) {
            await selectSearchResult(st.id, st.name, st.group || st.ficha || '', st.docType || 'CC');
        }
        return;
    }

    _renderSearchResults(results);
}

// ── Listener global para lector USB de código de barras / cédulas ──
let _barcodeBuffer = '';
let _barcodeTimeout = null;

document.addEventListener('keydown', (e) => {
    const tomaView = document.getElementById('view-toma-de-asistencia');
    if (!tomaView || tomaView.style.display === 'none') return;

    // Si el foco está en un input distinto a searchDocNumber, ignorar
    if (document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.id !== 'searchDocNumber') {
        return;
    }

    if (e.key === 'Enter') {
        if (_barcodeBuffer.length >= 3) {
            const input = document.getElementById('searchDocNumber');
            if (input) input.value = _barcodeBuffer;
            searchStudent(e);
            _barcodeBuffer = '';
        }
    } else if (e.key.length === 1) {
        _barcodeBuffer += e.key;
        clearTimeout(_barcodeTimeout);
        _barcodeTimeout = setTimeout(() => { _barcodeBuffer = ''; }, 400);
    }
});

async function resetSessionAttendance() {
    try {
        const res = await fetch(`${API_BASE}/api/attendance/reset`, { method: 'DELETE' });
        if (res.ok) {
            clearSearchForm();
            await renderTable();
        }
    } catch (err) {
        console.error('Error al reiniciar sesión:', err);
    }
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
                        ${s.docType ? s.docType + ': ' : 'Doc: '}${s.id} · Ficha: ${s.group || s.ficha || ''}
                        ${s.phone ? ' · Tel: ' + s.phone : ''}
                    </div>
                </div>
                <div class="result-action">
                    <button class="btn-primary" style="background: var(--primary); font-size: 0.8rem; padding: 6px 16px;" onclick="selectSearchResult('${s.id}', '${s.name.replace(/'/g, "\\'")}', '${s.group || s.ficha || ''}', '${s.docType || ''}')">
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
    const form = document.getElementById('searchStudentForm');
    if (form) form.reset();
    const resContainer = document.getElementById('searchResults');
    if (resContainer) resContainer.style.display = 'none';
    const resList = document.getElementById('searchResultsList');
    if (resList) resList.innerHTML = '';
}

function toggleEnforceAmbiente(checked) {
    const label = document.getElementById('labelEnforceAmbiente');
    if (label) {
        label.textContent = checked ? 'Activado (Rechazo Activo)' : 'Desactivado (Permisivo)';
        label.style.color = checked ? '#009900' : '#64748b';
    }
}

async function selectSearchResult(id, name, ficha, docType = '') {
    const { fecha, hora, timestamp } = _getNow();
    const resultsList = document.getElementById('searchResultsList');
    const ambiente = document.getElementById('ambienteSelectorToma')?.value || localStorage.getItem('sena_ambiente_activo') || 'Ambiente 302 - Software';
    const enforceAmbiente = document.getElementById('checkEnforceAmbiente')?.checked !== false;

    try {
        const res = await fetch(`${API_BASE}/api/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                doc:     id,
                docType: docType || 'CC',
                group:   ficha || '',
                status:  'Presente',
                time:    hora,
                fecha,
                timestamp,
                ambiente,
                enforceAmbiente
            })
        });

        if (res.ok) {
            await renderTable();

            if (resultsList) {
                resultsList.innerHTML = `
                    <div class="search-result-item" style="border-left-color:#009900; background:#f0fdf4;">
                        <div class="result-info">
                            <div class="result-name" style="color:#009900;">✓ Asistencia registrada: ${name}</div>
                            <div class="result-details">
                                Doc: ${id} · Ficha: ${ficha || 'General'}<br>
                                📍 ${ambiente} · 📅 ${fecha} &nbsp; 🕐 ${hora}
                            </div>
                        </div>
                    </div>
                `;
            }

            setTimeout(() => {
                clearSearchForm();
            }, 1000);
        } else {
            const errData = await res.json();
            await showConfirmModal({
                title: '⛔ Marcación Rechazada',
                message: errData.error || 'No se permite registrar la asistencia desde un ambiente no asignado a esta ficha.',
                confirmText: 'Entendido',
                cancelText: '',
                confirmBg: '#ef4444',
                iconName: 'shield-off',
                iconBg: 'rgba(239, 68, 68, 0.15)',
                iconColor: '#ef4444'
            });
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

// ============================================
// Modal de Historial desde Búsqueda (Diseño Premium)
// ============================================
let historyParticlesAnimId = null;

function startHistoryParticles() {
    const canvas = document.getElementById('historyParticlesCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    for (let i = 0; i < 80; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 4 + 1.5,
            dx: (Math.random() - 0.5) * 0.5,
            dy: (Math.random() - 0.5) * 0.5,
            alpha: Math.random() * 0.5 + 0.5,
            pulse: Math.random() * Math.PI * 2
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            p.pulse += 0.025;
            const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 80, ${currentAlpha})`;
            ctx.shadowBlur = 20;
            ctx.shadowColor = `rgba(0, 255, 80, ${currentAlpha})`;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        historyParticlesAnimId = requestAnimationFrame(animate);
    }
    animate();
}

function stopHistoryParticles() {
    if (historyParticlesAnimId) {
        cancelAnimationFrame(historyParticlesAnimId);
        historyParticlesAnimId = null;
    }
    const canvas = document.getElementById('historyParticlesCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

async function showStudentHistoryModal(docId, studentName, ficha) {
    try {
        const response = await fetch(`${API_BASE}/api/attendance`);
        const allAttendance = await response.json();
        
        const records = allAttendance.filter(r => r.doc === docId);
        records.sort((a, b) => b.timestamp - a.timestamp);
        
        const modal = document.getElementById('historyModal');
        const modalTitle = document.getElementById('historyModalTitle');
        const listContainer = document.getElementById('historyModalList');
        
        modalTitle.textContent = studentName;
        
        // Fondo oscuro premium
        modal.style.background = 'rgba(10, 15, 10, 0.85)';
        modal.style.backdropFilter = 'blur(8px)';
        
        if (records.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align:center; padding: 30px 10px; color: #94a3b8;">
                    <div style="font-size: 2rem; margin-bottom: 8px;">📋</div>
                    <div style="font-size: 0.85rem;">No hay registros de asistencia para este aprendiz.</div>
                </div>`;
        } else {
            let html = `<div style="margin-bottom: 12px; font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Total: ${records.length} registro${records.length > 1 ? 's' : ''}</div>`;
            records.forEach((r, i) => {
                let statusColor = '#16a34a';
                let statusBg = 'rgba(22,163,74,0.1)';
                let statusBorder = 'rgba(22,163,74,0.2)';
                if (r.status === 'Tarde') {
                    statusColor = '#ea580c';
                    statusBg = 'rgba(234,88,12,0.1)';
                    statusBorder = 'rgba(234,88,12,0.2)';
                } else if (r.status === 'Ausente') {
                    statusColor = '#dc2626';
                    statusBg = 'rgba(220,38,38,0.1)';
                    statusBorder = 'rgba(220,38,38,0.2)';
                } else if (r.status === 'Justificado') {
                    statusColor = '#6366f1';
                    statusBg = 'rgba(99,102,241,0.1)';
                    statusBorder = 'rgba(99,102,241,0.2)';
                }
                
                const isLast = i === records.length - 1;
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding: 12px 0; ${isLast ? '' : 'border-bottom: 1px solid #f1f5f9;'}">
                        <div>
                            <div style="font-weight: 700; color: #1e293b; font-size: 0.88rem; font-family: 'Outfit', sans-serif;">${r.fecha || 'Sin fecha'}</div>
                            <div style="color: #94a3b8; font-size: 0.78rem; margin-top: 2px;">${r.time || 'Sin hora'}</div>
                        </div>
                        <div style="background: ${statusBg}; color: ${statusColor}; padding: 4px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; border: 1px solid ${statusBorder}; letter-spacing: 0.3px;">
                            ${r.status}
                        </div>
                    </div>
                `;
            });
            listContainer.innerHTML = html;
        }
        
        modal.style.display = 'flex';
        startHistoryParticles();
        
        // Re-render iconos de Lucide en el modal
        if (window.lucide) lucide.createIcons();
        
    } catch (err) {
        console.error('Error cargando el historial:', err);
        alert('Ocurrió un error al cargar el historial.');
    }
}

function closeHistoryModal() {
    stopHistoryParticles();
    document.getElementById('historyModal').style.display = 'none';
}

// ==========================================
// GESTIÓN DE EVIDENCIAS DE INASISTENCIA
// ==========================================

async function submitEvidence(event) {
    event.preventDefault();
    
    const fecha = document.getElementById('evidFecha').value;
    const motivo = document.getElementById('evidMotivo').value;
    const notas = document.getElementById('evidNotas').value.trim();
    const fileInput = document.getElementById('evidArchivo');
    
    if (!fecha || !motivo) {
        alert('Por favor completa los campos obligatorios.');
        return;
    }
    
    let fileName = '';
    let fileData = '';
    
    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        if (file.size > 8 * 1024 * 1024) {
            alert('El archivo no debe superar los 8MB.');
            return;
        }
        fileName = file.name;
        fileData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    const studentName = sessionStorage.getItem('sena_name') || 'Aprendiz';
    const studentUser = sessionStorage.getItem('sena_user') || '';
    
    const payload = {
        studentDoc: studentUser,
        studentName: studentName,
        group: 'ADSO 3292060',
        absenceDate: fecha,
        reason: motivo,
        notes: notas,
        fileName: fileName,
        fileData: fileData
    };
    
    try {
        const res = await fetch(`${API_BASE}/api/evidences`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            await showConfirmModal({
                title: '¡Evidencia Enviada!',
                message: 'Tu reporte de inasistencia ha sido subido correctamente y está en proceso de revisión por el instructor.',
                confirmText: 'Aceptar',
                cancelText: '',
                confirmBg: '#009900',
                iconName: 'check-circle',
                iconBg: 'rgba(0, 153, 0, 0.15)',
                iconColor: '#009900'
            });
            document.getElementById('formSubirEvidencia').reset();
            clearEvidFile();
            renderEvidencias();
        } else {
            alert('Ocurrió un error al enviar la evidencia.');
        }
    } catch (err) {
        console.error(err);
        alert('No se pudo conectar con el servidor.');
    }
}

function handleEvidFileSelect(event) {
    const fileInput = event.target;
    const previewContainer = document.getElementById('evidFilePreview');
    const mediaBox = document.getElementById('previewMediaContainer');
    const nameBox = document.getElementById('previewFileName');
    const sizeBox = document.getElementById('previewFileSize');

    if (!fileInput.files || !fileInput.files[0]) {
        if (previewContainer) previewContainer.style.display = 'none';
        return;
    }

    const file = fileInput.files[0];

    if (file.size > 8 * 1024 * 1024) {
        alert('El archivo no debe superar los 8MB.');
        fileInput.value = '';
        if (previewContainer) previewContainer.style.display = 'none';
        return;
    }

    if (nameBox) nameBox.textContent = file.name;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    if (sizeBox) sizeBox.textContent = `Tamaño: ${sizeMB} MB`;

    if (mediaBox) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                mediaBox.innerHTML = `<img src="${e.target.result}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
            };
            reader.readAsDataURL(file);
        } else {
            mediaBox.innerHTML = `<div style="text-align: center; color: #ef4444;"><i data-lucide="file-text" style="width: 32px; height: 32px;"></i><div style="font-size: 0.65rem; font-weight: 700;">PDF</div></div>`;
            if (window.lucide) window.lucide.createIcons();
        }
    }

    if (previewContainer) previewContainer.style.display = 'flex';
}

function clearEvidFile() {
    const fileInput = document.getElementById('evidArchivo');
    if (fileInput) fileInput.value = '';
    const previewContainer = document.getElementById('evidFilePreview');
    if (previewContainer) previewContainer.style.display = 'none';
}

function openMediaModal(src, title, fileName) {
    const modal = document.getElementById('modalVerEvidenciaMedia');
    if (!modal) return;
    const titleEl = document.getElementById('mediaModalTitle');
    const imgEl = document.getElementById('mediaModalImage');
    const iframeEl = document.getElementById('mediaModalIframe');
    const downloadEl = document.getElementById('mediaModalDownload');

    if (titleEl) titleEl.innerHTML = `<i data-lucide="file-text" style="color: #009900; width: 20px; height: 20px;"></i> Evidencia de ${title || 'Aprendiz'}`;
    if (downloadEl) {
        downloadEl.href = src;
        downloadEl.download = fileName || 'evidencia';
    }

    if (src.startsWith('data:image/') || /\.(png|jpg|jpeg)$/i.test(fileName || '')) {
        imgEl.src = src;
        imgEl.style.display = 'block';
        iframeEl.style.display = 'none';
    } else {
        iframeEl.src = src;
        iframeEl.style.display = 'block';
        imgEl.style.display = 'none';
    }

    modal.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
}

function closeMediaModal(e) {
    if (e && e.target !== e.currentTarget && e.type === 'click') return;
    const modal = document.getElementById('modalVerEvidenciaMedia');
    if (modal) modal.style.display = 'none';
}

async function renderEvidencias() {
    const tbody = document.getElementById('evidenciasTableBody');
    if (!tbody) return;
    
    const role = (sessionStorage.getItem('sena_role') || '').toUpperCase();
    const currentName = sessionStorage.getItem('sena_name') || '';
    const currentUser = sessionStorage.getItem('sena_user') || '';

    const titleElem = document.getElementById('titleTablaEvidencias');
    if (titleElem) {
        titleElem.textContent = (role === 'APRENDIZ') 
            ? 'Mis Evidencias Enviadas' 
            : 'Evidencias Recibidas de Aprendices';
    }

    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px; color: #64748b;">Cargando registros...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/api/evidences`);
        if (!res.ok) throw new Error('Error de red');
        let evidences = await res.json();

        // Filtrar si es aprendiz
        if (role === 'APRENDIZ') {
            evidences = evidences.filter(e => 
                (e.studentName && e.studentName.toLowerCase().includes(currentName.toLowerCase())) ||
                (e.studentDoc && e.studentDoc.toLowerCase() === currentUser.toLowerCase())
            );
        }

        if (evidences.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 32px; color: #64748b;">
                        <i data-lucide="inbox" style="width: 36px; height: 36px; color: #cbd5e1; margin-bottom: 8px;"></i>
                        <div>No hay evidencias registradas en este momento.</div>
                    </td>
                </tr>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        tbody.innerHTML = evidences.map((item, index) => {
            let badgeStyle = 'background: #fef3c7; color: #b45309; border: 1px solid #fde68a;'; // En Revisión
            if (item.status === 'Aprobada') {
                badgeStyle = 'background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;';
            } else if (item.status === 'Rechazada') {
                badgeStyle = 'background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca;';
            }

            let fileHtml = '<span style="color: #94a3b8; font-size: 0.8rem; white-space: nowrap;">Sin archivo</span>';
            if (item.fileData) {
                const isImage = item.fileData.startsWith('data:image/') || /\.(png|jpg|jpeg)$/i.test(item.fileName || '');
                if (isImage) {
                    fileHtml = `
                        <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap;">
                            <div onclick="openMediaModal('${item.fileData}', '${(item.studentName || 'Aprendiz').replace(/'/g, "\\'")}', '${(item.fileName || 'evidencia.png').replace(/'/g, "\\'")}')" 
                                 style="width: 40px; height: 40px; border-radius: 8px; overflow: hidden; border: 1.5px solid #009900; cursor: pointer; position: relative; background: #f0fdf4; flex-shrink: 0;" title="Ver imagen completa">
                                <img src="${item.fileData}" alt="Evidencia" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 2px; text-align: left;">
                                <button type="button" onclick="openMediaModal('${item.fileData}', '${(item.studentName || 'Aprendiz').replace(/'/g, "\\'")}', '${(item.fileName || 'evidencia.png').replace(/'/g, "\\'")}')" 
                                        style="background: none; border: none; color: #009900; font-weight: 700; font-size: 0.78rem; cursor: pointer; text-align: left; padding: 0; white-space: nowrap;">
                                    🔍 Ver Imagen
                                </button>
                                <a href="${item.fileData}" download="${item.fileName || 'evidencia.png'}" style="font-size: 0.72rem; color: #64748b; text-decoration: none; white-space: nowrap;">⬇ Descargar</a>
                            </div>
                        </div>
                    `;
                } else {
                    fileHtml = `
                        <a href="${item.fileData}" download="${item.fileName || 'evidencia.pdf'}" 
                           style="display: inline-flex; align-items: center; gap: 4px; color: #009900; font-weight: 600; text-decoration: none; font-size: 0.82rem; padding: 5px 10px; background: rgba(0,153,0,0.08); border-radius: 8px; border: 1px solid rgba(0,153,0,0.2); white-space: nowrap;" target="_blank">
                            <i data-lucide="file-text" style="width: 15px; height: 15px;"></i>
                            ${item.fileName || 'Descargar PDF'}
                        </a>
                    `;
                }
            }

            let actionsHtml = '-';
            if (role === 'INSTRUCTOR' || role === 'COORDINADOR') {
                const isPending = !item.status || item.status === 'En Revisión';
                if (isPending) {
                    actionsHtml = `
                        <div style="display: flex; gap: 6px; white-space: nowrap;">
                            <button onclick="updateEvidenceStatus('${item.id}', 'Aprobada')" title="Aprobar Excusa" style="background: #10b981; color: white; border: none; padding: 5px 10px; border-radius: 8px; cursor: pointer; font-size: 0.78rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                                ✓ Aprobar
                            </button>
                            <button onclick="updateEvidenceStatus('${item.id}', 'Rechazada')" title="Rechazar Excusa" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 8px; cursor: pointer; font-size: 0.78rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                                ✕ Rechazar
                            </button>
                        </div>
                    `;
                } else {
                    actionsHtml = `<span style="font-size: 0.78rem; font-weight: 700; color: #64748b; background: #f1f5f9; padding: 4px 10px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: nowrap;">🔒 Evaluada</span>`;
                }
            }

            return `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px 10px; font-weight: 600; color: #64748b; text-align: center; vertical-align: middle;">${index + 1}</td>
                    <td style="padding: 12px 10px; font-weight: 600; color: #1e293b; vertical-align: middle;">
                        ${item.studentName || 'Aprendiz'}
                        <div style="font-size: 0.75rem; color: #64748b; font-weight: normal;">${item.group || ''}</div>
                    </td>
                    <td style="padding: 12px 10px; font-weight: 600; color: #0f172a; white-space: nowrap; vertical-align: middle;">${item.absenceDate || '---'}</td>
                    <td style="padding: 12px 10px; font-size: 0.85rem; color: #334155; vertical-align: middle;">${item.reason || '---'}</td>
                    <td style="padding: 12px 10px; font-size: 0.82rem; color: #64748b; max-width: 180px; word-wrap: break-word; vertical-align: middle;">${item.notes || '---'}</td>
                    <td style="padding: 12px 10px; vertical-align: middle;">${fileHtml}</td>
                    <td style="padding: 12px 10px; vertical-align: middle; white-space: nowrap;">
                        <span style="font-size: 0.78rem; font-weight: 700; padding: 4px 10px; border-radius: 12px; display: inline-block; white-space: nowrap; ${badgeStyle}">
                            ${item.status || 'En Revisión'}
                        </span>
                    </td>
                    <td style="padding: 12px 10px; font-size: 0.82rem; color: #64748b; vertical-align: middle;">${item.replyNotes || 'Ninguna'}</td>
                    <td style="padding: 12px 10px; vertical-align: middle; white-space: nowrap;">${actionsHtml}</td>
                </tr>
            `;
        }).join('');

        if (window.lucide) window.lucide.createIcons();
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px; color: #ef4444;">Error al cargar las evidencias.</td></tr>`;
    }
}

function showReplyModal(isApprove) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modalRespuestaEvidencia');
        if (!modal) {
            resolve(isApprove ? 'Excusa Aprobada' : 'Evidencia Rechazada');
            return;
        }

        const iconBg = document.getElementById('replyModalIconBg');
        const icon = document.getElementById('replyModalIcon');
        const title = document.getElementById('replyModalTitle');
        const subtitle = document.getElementById('replyModalSubtitle');
        const input = document.getElementById('replyModalInput');
        const confirmBtn = document.getElementById('replyModalConfirmBtn');

        if (isApprove) {
            if (iconBg) iconBg.style.background = 'rgba(16, 185, 129, 0.15)';
            if (icon) {
                icon.setAttribute('data-lucide', 'check-circle');
                icon.style.color = '#10b981';
            }
            if (title) title.textContent = 'Aprobar Excusa Médica / Evidencia';
            if (subtitle) subtitle.textContent = 'La falta del aprendiz cambiará a Justificado automáticamente.';
            if (input) input.value = 'Excusa Aprobada';
            if (confirmBtn) {
                confirmBtn.style.background = '#10b981';
                confirmBtn.innerHTML = `<i data-lucide="check" style="width: 16px; height: 16px;"></i> Aprobar Excusa`;
            }
        } else {
            if (iconBg) iconBg.style.background = 'rgba(239, 68, 68, 0.15)';
            if (icon) {
                icon.setAttribute('data-lucide', 'x-circle');
                icon.style.color = '#ef4444';
            }
            if (title) title.textContent = 'Rechazar Evidencia';
            if (subtitle) subtitle.textContent = 'Indica el motivo del rechazo para informar al aprendiz.';
            if (input) input.value = 'Evidencia Rechazada';
            if (confirmBtn) {
                confirmBtn.style.background = '#ef4444';
                confirmBtn.innerHTML = `<i data-lucide="x" style="width: 16px; height: 16px;"></i> Rechazar Evidencia`;
            }
        }

        if (window.lucide) window.lucide.createIcons();
        modal.style.display = 'flex';

        window._replyModalResolve = resolve;
    });
}

function closeReplyModal(confirmed) {
    const modal = document.getElementById('modalRespuestaEvidencia');
    if (modal) modal.style.display = 'none';
    if (window._replyModalResolve) {
        if (confirmed) {
            const inputVal = document.getElementById('replyModalInput')?.value.trim();
            window._replyModalResolve(inputVal || 'Respuesta enviada');
        } else {
            window._replyModalResolve(null);
        }
        window._replyModalResolve = null;
    }
}

async function updateEvidenceStatus(id, newStatus) {
    const isApprove = newStatus === 'Aprobada';
    const replyNotes = await showReplyModal(isApprove);

    // Si presiona Cancelar en el modal
    if (replyNotes === null) return;

    try {
        const res = await fetch(`${API_BASE}/api/evidences/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: newStatus,
                replyNotes: replyNotes || (isApprove ? 'Excusa Aprobada' : 'Evidencia Rechazada')
            })
        });
        
        if (res.ok) {
            await showConfirmModal({
                title: isApprove ? '¡Evidencia Aprobada!' : 'Evidencia Rechazada',
                message: isApprove 
                    ? 'La inasistencia del aprendiz ha sido <strong>justificada</strong> correctamente en el sistema.' 
                    : 'La solicitud fue marcada como rechazada.',
                confirmText: 'Entendido',
                cancelText: '',
                confirmBg: isApprove ? '#10b981' : '#ef4444',
                iconName: isApprove ? 'check-circle' : 'x-circle',
                iconBg: isApprove ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                iconColor: isApprove ? '#10b981' : '#ef4444'
            });
            renderEvidencias();
            updatePendingEvidencesBadge();
        } else {
            alert('No se pudo actualizar el estado de la evidencia.');
        }
    } catch (err) {
        console.error(err);
        alert('Error de conexión.');
    }
}

async function updatePendingEvidencesBadge() {
    try {
        const res = await fetch(`${API_BASE}/api/evidences`);
        if (!res.ok) return;
        const evidences = await res.json();
        
        const role = (sessionStorage.getItem('sena_role') || '').toUpperCase();
        const currentName = sessionStorage.getItem('sena_name') || '';
        const currentUser = sessionStorage.getItem('sena_user') || '';

        let pendingCount = 0;

        if (role === 'APRENDIZ') {
            const userEvidences = evidences.filter(e => 
                (e.studentName && e.studentName.toLowerCase().includes(currentName.toLowerCase())) ||
                (e.studentDoc && e.studentDoc.toLowerCase() === currentUser.toLowerCase())
            );
            pendingCount = userEvidences.filter(e => e.status === 'Aprobada' || e.status === 'Rechazada').length;
        } else {
            pendingCount = evidences.filter(e => e.status === 'En Revisión' || !e.status).length;
        }

        const sidebarBadge = document.getElementById('evidBadgeCounter');
        const headerBadge = document.getElementById('headerNotificationBadge');

        if (sidebarBadge) {
            if (pendingCount > 0) {
                sidebarBadge.textContent = pendingCount;
                sidebarBadge.style.display = 'inline-block';
            } else {
                sidebarBadge.style.display = 'none';
            }
        }

        if (headerBadge) {
            if (pendingCount > 0) {
                headerBadge.textContent = pendingCount;
                headerBadge.style.display = 'flex';
            } else {
                headerBadge.style.display = 'none';
            }
        }
    } catch (err) {
        console.error('Error al actualizar contador de notificaciones:', err);
    }
}

function openNotificationsView() {
    const navEvid = document.getElementById('navEvidencias');
    if (navEvid) {
        const link = navEvid.querySelector('a');
        if (link) link.click();
    }
}

// ==========================================
// GESTIÓN DE INSTRUCTORES (COORDINACIÓN)
// ==========================================

function openAgregarInstructorModal() {
    const modal = document.getElementById('modalAgregarInstructor');
    if (modal) {
        document.getElementById('formAgregarInstructor')?.reset();
        modal.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons();
    }
}

function closeAgregarInstructorModal() {
    const modal = document.getElementById('modalAgregarInstructor');
    if (modal) modal.style.display = 'none';
}

async function saveInstructor(event) {
    event.preventDefault();
    const name = document.getElementById('instNombre').value.trim();
    const documentVal = document.getElementById('instDoc').value.trim();
    const email = document.getElementById('instCorreo').value.trim();
    const password = document.getElementById('instPass').value;
    const fichas = document.getElementById('instFichas').value.trim();

    if (!name || !email || !password) {
        alert('Nombre, correo y contraseña son obligatorios.');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/instructors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                document: documentVal,
                email,
                password,
                fichas
            })
        });

        const data = await res.json();

        if (res.ok) {
            closeAgregarInstructorModal();
            await showConfirmModal({
                title: '¡Instructor Registrado!',
                message: `El instructor <strong>${name}</strong> ha sido creado con éxito. Ya puede iniciar sesión con el correo <strong>${email}</strong>.`,
                confirmText: 'Entendido',
                cancelText: '',
                confirmBg: '#009900',
                iconName: 'user-check',
                iconBg: 'rgba(0, 153, 0, 0.15)',
                iconColor: '#009900'
            });
            renderInstructores();
        } else {
            alert(data.error || 'No se pudo registrar al instructor.');
        }
    } catch (err) {
        console.error(err);
        alert('Error al conectar con el servidor.');
    }
}

async function renderInstructores() {
    const tbody = document.getElementById('instructoresTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: #64748b;">Cargando instructores...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/api/instructors`);
        if (!res.ok) throw new Error('Error al obtener lista');
        const instructors = await res.json();

        if (instructors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 32px; color: #64748b;">
                        <i data-lucide="users" style="width: 36px; height: 36px; color: #cbd5e1; margin-bottom: 8px;"></i>
                        <div>No hay instructores registrados. Haz clic en "Registrar Nuevo Instructor".</div>
                    </td>
                </tr>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        tbody.innerHTML = instructors.map((inst, index) => {
            return `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px; font-weight: 600; color: #64748b;">${index + 1}</td>
                    <td style="padding: 12px; font-weight: 700; color: #1e293b;">
                        ${inst.name}
                        <div style="font-size: 0.75rem; color: #64748b; font-weight: normal;">Registrado: ${inst.createdAt || '---'}</div>
                    </td>
                    <td style="padding: 12px; font-size: 0.88rem; color: #334155;">${inst.document || '---'}</td>
                    <td style="padding: 12px; font-size: 0.88rem; font-weight: 600; color: #009900;">${inst.email}</td>
                    <td style="padding: 12px; font-size: 0.85rem; font-family: monospace; color: #64748b;">••••••••</td>
                    <td style="padding: 12px; font-size: 0.85rem; color: #334155;">${inst.fichas || 'Todas'}</td>
                    <td style="padding: 12px;">
                        <span style="font-size: 0.78rem; font-weight: 700; padding: 3px 10px; border-radius: 12px; background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;">
                            ● Activo
                        </span>
                    </td>
                    <td style="padding: 12px;">
                        <button onclick="deleteInstructor('${inst.id}', '${inst.name.replace(/'/g, "\\'")}')" 
                                style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.78rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"
                                title="Eliminar acceso">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Eliminar
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        if (window.lucide) window.lucide.createIcons();
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: #ef4444;">Error al cargar los instructores.</td></tr>`;
    }
}

async function deleteInstructor(id, name) {
    const confirmed = await showConfirmModal({
        title: 'Eliminar Instructor',
        message: `¿Estás seguro de <strong>eliminar el acceso</strong> para el instructor <strong>${name}</strong>? Ya no podrá iniciar sesión en la plataforma.`,
        confirmText: 'Sí, Eliminar Acceso',
        cancelText: 'Cancelar',
        confirmBg: '#ef4444',
        iconName: 'trash-2',
        iconBg: 'rgba(239, 68, 68, 0.12)',
        iconColor: '#ef4444'
    });

    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE}/api/instructors/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            renderInstructores();
        } else {
            alert('Error al eliminar el instructor.');
        }
    } catch (err) {
        console.error(err);
        alert('Error de conexión.');
    }
}


