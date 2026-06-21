// ============================================
// MÓDULO DE AULA VIRTUAL (Google Classroom Style)
// Parroquia Santa Alicia - Fase 6
// ============================================

// Datos simulados de tareas y materiales
const classroomData = {
    'entregas-confirmacion': {
        title: 'Entregas Confirmación',
        materials: [
            { id: 1, name: 'Guía de Confirmación - Sesión 1', type: 'pdf', date: '15 Jun 2025' },
            { id: 2, name: 'Lectura: Los Sacramentos de Iniciación', type: 'pdf', date: '18 Jun 2025' },
            { id: 3, name: 'Video: ¿Qué es la Confirmación?', type: 'video', date: '20 Jun 2025' }
        ],
        assignments: [
            { 
                id: 1, 
                title: 'Resumen de lectura - Los Sacramentos',
                description: 'Lee el documento adjunto y escribe un resumen de 200 palabras sobre la importancia de la Confirmación en la vida cristiana.',
                dueDate: '25 Jun 2025',
                status: 'pending',
                submissions: [
                    { student: 'María García', date: '24 Jun 2025', grade: null },
                    { student: 'Juan Pérez', date: null, grade: null },
                    { student: 'Ana López', date: null, grade: null }
                ]
            },
            { 
                id: 2, 
                title: 'Cuestionario de Confirmación',
                description: 'Responde las 10 preguntas del cuestionario sobre la Confirmación. Debes obtener al menos 7 respuestas correctas.',
                dueDate: '30 Jun 2025',
                status: 'pending',
                submissions: [
                    { student: 'María García', date: null, grade: null },
                    { student: 'Juan Pérez', date: null, grade: null },
                    { student: 'Ana López', date: null, grade: null }
                ]
            }
        ]
    },
    'tareas-catequesis': {
        title: 'Tareas Catequesis',
        materials: [
            { id: 1, name: 'Plan de Catequesis 2025', type: 'pdf', date: '10 Jun 2025' },
            { id: 2, name: 'Guía del Catequista', type: 'pdf', date: '12 Jun 2025' }
        ],
        assignments: [
            { 
                id: 1, 
                title: 'Preparación de sesión - La Biblia',
                description: 'Prepara una sesión de 30 minutos sobre la importancia de la Biblia en la vida cristiana. Incluye actividades interactivas.',
                dueDate: '28 Jun 2025',
                status: 'pending',
                submissions: [
                    { student: 'Catequista María', date: null, grade: null },
                    { student: 'Catequista Juan', date: null, grade: null }
                ]
            }
        ]
    }
};

// Simulación de rol del usuario (cambiar a 'coordinador' para ver calificaciones)
let currentUserRole = 'estudiante';

/**
 * Muestra la vista del Aula Virtual
 * @param {string} channelId - ID del canal/tarea seleccionado
 */
function showClassroomView(channelId) {
    const data = classroomData[channelId];
    if (!data) {
        console.error('No se encontraron datos para el canal:', channelId);
        return;
    }

    // Ocultar chat y home
    const chatArea = document.querySelector('.chat-area');
    const homeContainer = document.querySelector('.home-container');
    
    if (chatArea) chatArea.classList.add('hidden');
    if (homeContainer) homeContainer.classList.add('hidden');

    // Obtener o crear el contenedor del aula virtual
    let classroomContainer = document.querySelector('.classroom-container');
    if (!classroomContainer) {
        classroomContainer = document.createElement('div');
        classroomContainer.className = 'classroom-container';
        document.querySelector('.main-content').appendChild(classroomContainer);
    }

    // Renderizar la vista del aula
    classroomContainer.innerHTML = `
        <div class="classroom-header">
            <h2 class="classroom-title">${data.title}</h2>
            <p class="classroom-subtitle">Aula Virtual - Parroquia Santa Alicia</p>
        </div>

        <div class="classroom-tabs">
            <button class="classroom-tab active" data-tab="materials">
                📚 Tablón / Materiales
            </button>
            <button class="classroom-tab" data-tab="assignments">
                📝 Trabajo de Clase
            </button>
            ${currentUserRole === 'coordinador' ? `
                <button class="classroom-tab" data-tab="grades">
                    📊 Calificaciones
                </button>
            ` : ''}
        </div>

        <div class="classroom-content">
            <div class="tab-content active" id="tab-materials">
                <div class="materials-grid">
                    ${data.materials.map(material => `
                        <div class="material-card">
                            <div class="material-icon">
                                ${material.type === 'pdf' ? '📄' : '🎥'}
                            </div>
                            <div class="material-info">
                                <h4 class="material-name">${material.name}</h4>
                                <p class="material-date">Publicado: ${material.date}</p>
                            </div>
                            <button class="material-download-btn" title="Descargar">
                                ⬇️
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="tab-content hidden" id="tab-assignments">
                <div class="assignments-list">
                    ${data.assignments.map(assignment => `
                        <div class="assignment-card">
                            <div class="assignment-header" data-assignment-id="${assignment.id}">
                                <div class="assignment-info">
                                    <h4 class="assignment-title">${assignment.title}</h4>
                                    <p class="assignment-due">📅 Fecha límite: ${assignment.dueDate}</p>
                                </div>
                                <span class="assignment-status ${assignment.status}">
                                    ${assignment.status === 'pending' ? '⏳ Pendiente' : '✅ Entregado'}
                                </span>
                            </div>
                            <div class="assignment-body hidden" id="assignment-${assignment.id}">
                                <div class="assignment-description">
                                    <h5>Instrucciones:</h5>
                                    <p>${assignment.description}</p>
                                </div>
                                <div class="assignment-actions">
                                    <button class="submit-assignment-btn" data-assignment-id="${assignment.id}">
                                        📤 Entregar Tarea
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${currentUserRole === 'coordinador' ? `
                <div class="tab-content hidden" id="tab-grades">
                    <div class="grades-container">
                        ${data.assignments.map(assignment => `
                            <div class="grade-section">
                                <h4 class="grade-assignment-title">${assignment.title}</h4>
                                <div class="grades-table">
                                    <div class="grade-row header">
                                        <span>Estudiante</span>
                                        <span>Fecha de Entrega</span>
                                        <span>Nota</span>
                                        <span>Acción</span>
                                    </div>
                                    ${assignment.submissions.map((submission, index) => `
                                        <div class="grade-row">
                                            <span class="student-name">${submission.student}</span>
                                            <span class="submission-date">
                                                ${submission.date || '⏳ Pendiente'}
                                            </span>
                                            <span class="grade-value">
                                                ${submission.grade !== null ? submission.grade + '/10' : '-'}
                                            </span>
                                            <button class="grade-btn" 
                                                    data-assignment-id="${assignment.id}"
                                                    data-submission-index="${index}"
                                                    ${!submission.date ? 'disabled' : ''}>
                                                ${submission.grade !== null ? '✏️ Editar' : '📝 Asignar'}
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    // Mostrar el contenedor del aula
    classroomContainer.classList.remove('hidden');

    // Agregar event listeners a las pestañas
    const tabs = classroomContainer.querySelectorAll('.classroom-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });

    // Agregar event listeners a las tareas (expandir/colapsar)
    const assignmentHeaders = classroomContainer.querySelectorAll('.assignment-header');
    assignmentHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const assignmentId = this.dataset.assignmentId;
            toggleAssignment(assignmentId);
        });
    });

    // Agregar event listeners a los botones de entrega
    const submitButtons = classroomContainer.querySelectorAll('.submit-assignment-btn');
    submitButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevenir que se expanda/colapse la tarea
            const assignmentId = parseInt(this.dataset.assignmentId);
            submitAssignment(assignmentId);
        });
    });

    // Agregar event listeners a los botones de calificación
    const gradeButtons = classroomContainer.querySelectorAll('.grade-btn');
    gradeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const assignmentId = parseInt(this.dataset.assignmentId);
            const submissionIndex = parseInt(this.dataset.submissionIndex);
            assignGrade(assignmentId, submissionIndex);
        });
    });

    console.log(`📚 Vista de Aula Virtual cargada: ${data.title}`);
}

/**
 * Cambia entre pestañas del aula virtual
 * @param {string} tabName - Nombre de la pestaña a activar
 */
function switchTab(tabName) {
    // Remover clase active de todas las pestañas
    const tabs = document.querySelectorAll('.classroom-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Ocultar todo el contenido de pestañas
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.add('hidden'));

    // Activar la pestaña seleccionada
    const activeTab = document.querySelector(`.classroom-tab[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Mostrar el contenido de la pestaña
    const activeContent = document.getElementById(`tab-${tabName}`);
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }
}

/**
 * Expande/colapsa una tarea
 * @param {number} assignmentId - ID de la tarea
 */
function toggleAssignment(assignmentId) {
    const assignmentBody = document.getElementById(`assignment-${assignmentId}`);
    if (assignmentBody) {
        assignmentBody.classList.toggle('hidden');
    }
}

/**
 * Simula la entrega de una tarea
 * @param {number} assignmentId - ID de la tarea
 */
function submitAssignment(assignmentId) {
    const assignment = findAssignment(assignmentId);
    if (assignment) {
        const confirmSubmit = confirm(`¿Deseas entregar la tarea "${assignment.title}"?`);
        if (confirmSubmit) {
            alert('✅ Tarea entregada exitosamente.\n\n(Simulación: En una versión real, aquí se abriría un selector de archivos)');
            console.log(`📤 Tarea entregada: ${assignment.title}`);
        }
    }
}

/**
 * Simula la asignación de una calificación
 * @param {number} assignmentId - ID de la tarea
 * @param {number} submissionIndex - Índice de la entrega
 */
function assignGrade(assignmentId, submissionIndex) {
    const grade = prompt('Ingresa la calificación (0-10):');
    if (grade !== null && !isNaN(grade) && grade >= 0 && grade <= 10) {
        const assignment = findAssignment(assignmentId);
        if (assignment && assignment.submissions[submissionIndex]) {
            assignment.submissions[submissionIndex].grade = parseInt(grade);
            alert(`✅ Calificación asignada: ${grade}/10`);
            // Recargar la vista
            const activeChannel = document.querySelector('.channel-item.active');
            if (activeChannel) {
                showClassroomView(activeChannel.dataset.channel);
            }
        }
    } else if (grade !== null) {
        alert('❌ Por favor ingresa un número válido entre 0 y 10');
    }
}

/**
 * Busca una tarea por ID en todos los cursos
 * @param {number} assignmentId - ID de la tarea
 * @returns {Object|null} - Datos de la tarea o null
 */
function findAssignment(assignmentId) {
    for (const courseId in classroomData) {
        const course = classroomData[courseId];
        const assignment = course.assignments.find(a => a.id === assignmentId);
        if (assignment) {
            return assignment;
        }
    }
    return null;
}

/**
 * Oculta la vista del aula virtual y muestra el chat
 */
function hideClassroomView() {
    const classroomContainer = document.querySelector('.classroom-container');
    if (classroomContainer) {
        classroomContainer.classList.add('hidden');
    }

    const chatArea = document.querySelector('.chat-area');
    if (chatArea) {
        chatArea.classList.remove('hidden');
    }
}

// Exportar funciones para uso global
window.showClassroomView = showClassroomView;
window.hideClassroomView = hideClassroomView;
window.switchTab = switchTab;
window.toggleAssignment = toggleAssignment;
window.submitAssignment = submitAssignment;
window.assignGrade = assignGrade;