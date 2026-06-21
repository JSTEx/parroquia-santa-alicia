// ============================================
// APLICACIÓN PRINCIPAL - Parroquia Santa Alicia
// Fase 6: Revisión de Funcionalidad y Estado
// ============================================

// Importar configuración y métodos de Firebase
import { 
    db, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    where, 
    serverTimestamp 
} from './firebase-config.js';

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const channelItems = document.querySelectorAll('.channel-item');
    const activeChannelTitle = document.getElementById('activeChannelTitle');
    const messageInput = document.getElementById('messageInput');
    const spaceItems = document.querySelectorAll('.space-item');
    const spaceName = document.querySelector('.space-name');
    const messagesContainer = document.querySelector('.messages-container');
    const spaceHeader = document.querySelector('.space-header');
    const homeButton = document.querySelector('.home-button');
    
    // Mapeo de espacios a sus nombres
    const spaceNames = {
        'confirmacion': 'Confirmación',
        'catequesis': 'Catequesis',
        'coro': 'Coro',
        'pastoral': 'Pastoral'
    };
    
    // Mapeo de espacios a sus canales por defecto
    const spaceDefaultChannels = {
        'confirmacion': 'chat-general',
        'catequesis': 'chat-general',
        'coro': 'chat-general',
        'pastoral': 'chat-general'
    };
    
    // Mapeo de tipos de canal a iconos
    const channelTypeIcons = {
        'text': '#',
        'voice': '🔊',
        'tasks': '📝'
    };
    
    // Estado de la aplicación
    let currentChannel = null;
    let currentChannelType = null;
    let currentSpace = null;
    
    // Variable para guardar la función de desuscripción del listener
    let unsubscribeListener = null;
    
    // Estado de llamada de voz
    let voiceCallActive = false;
    let currentVoiceChannel = null;
    let isMuted = false;
    let isDeafened = false;
    let isScreenSharing = false;
    
    // ============================================
    // MODO HOME (Página de Inicio)
    // ============================================
    
    /**
     * Muestra la página de inicio (Home)
     */
    function showHomeView() {
        // Limpiar estado
        currentChannel = null;
        currentChannelType = null;
        currentSpace = null;
        
        // Limpiar selecciones
        channelItems.forEach(channel => channel.classList.remove('active'));
        spaceItems.forEach(space => space.classList.remove('active'));
        
        // Activar botón de Home
        if (homeButton) homeButton.classList.add('active');
        
        // Actualizar header
        if (activeChannelTitle) activeChannelTitle.textContent = 'Inicio';
        
        if (spaceHeader) {
            const hashElement = spaceHeader.querySelector('.space-hash');
            if (hashElement) hashElement.textContent = '🏠';
        }
        
        // OCULTAR todos los contenedores de contenido
        const chatArea = document.querySelector('.chat-area');
        const classroomContainer = document.querySelector('.classroom-container');
        const homeContainer = document.querySelector('.home-container');
        
        if (chatArea) chatArea.classList.add('hidden');
        if (classroomContainer) classroomContainer.classList.add('hidden');
        
        // Desuscribirse de listener de mensajes
        if (unsubscribeListener) {
            unsubscribeListener();
            unsubscribeListener = null;
        }
        
        // Salir de llamada de voz si está activa
        if (voiceCallActive) {
            leaveVoiceCall();
        }
        
        // MOSTRAR Home
        if (homeContainer) {
            homeContainer.classList.remove('hidden');
        }
        
        console.log('🏠 Modo Home activado');
    }
    
    /**
     * Navega a un canal específico desde Home
     */
    window.navigateToChannel = function(channelName, channelType) {
        const channelElement = document.querySelector(`[data-channel="${channelName}"]`);
        if (channelElement) {
            setActiveChannel(channelElement);
        }
    };
    
    // ============================================
    // FUNCIONALIDAD: Escucha en Tiempo Real (Firestore)
    // ============================================
    
    /**
     * Configura el listener en tiempo real para un canal específico
     * @param {string} channelName - Nombre del canal a escuchar
     */
    function setupRealtimeListener(channelName) {
        // Desuscribirse del listener anterior si existe
        if (unsubscribeListener) {
            unsubscribeListener();
        }
        
        // Limpiar el contenedor de mensajes
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        
        // Crear referencia a la colección de mensajes
        const messagesRef = collection(db, 'messages');
        
        // Query SOLO con filtro por canal (sin orderBy para evitar índice)
        const q = query(messagesRef, where('channel', '==', channelName));
        
        // Escuchar cambios en tiempo real
        unsubscribeListener = onSnapshot(q, (snapshot) => {
            console.log(`📨 Actualización de mensajes para #${channelName}`);
            
            // Limpiar contenedor de mensajes
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }
            
            // Convertir snapshot a array
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Ordenar por timestamp en el lado del cliente
            messages.sort((a, b) => {
                const timeA = a.timestamp ? a.timestamp.toDate() : new Date(0);
                const timeB = b.timestamp ? b.timestamp.toDate() : new Date(0);
                return timeA - timeB;
            });
            
            // Renderizar mensajes ordenados
            messages.forEach((messageData) => {
                renderMessage(messageData);
            });
            
            // Scroll al fondo
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, (error) => {
            console.error('❌ Error al escuchar mensajes:', error);
        });
    }
    
    /**
     * Renderiza un mensaje en el contenedor de mensajes
     * @param {Object} messageData - Datos del mensaje desde Firestore
     */
    function renderMessage(messageData) {
        if (!messagesContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        
        // Formatear la fecha del timestamp
        let timeString = 'Ahora mismo';
        if (messageData.timestamp) {
            const date = messageData.timestamp.toDate();
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) {
                timeString = 'Ahora mismo';
            } else if (diffMins < 60) {
                timeString = `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
            } else if (diffMins < 1440) {
                const hours = Math.floor(diffMins / 60);
                timeString = `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
            } else {
                timeString = date.toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        }
        
        // Escapar el texto del mensaje para prevenir XSS
        const escapedText = escapeHtml(messageData.text || '');
        const escapedUser = escapeHtml(messageData.user || 'Usuario');
        
        messageElement.innerHTML = `
            <div class="message-avatar">👤</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${escapedUser}</span>
                    <span class="message-time">${timeString}</span>
                </div>
                <div class="message-text">${escapedText}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
    }
    
    // ============================================
    // FUNCIONALIDAD: Cambio de Canales
    // ============================================
    
    /**
     * Actualiza el canal activo en la interfaz
     * @param {HTMLElement} clickedChannel - El elemento del canal clickeado
     */
    function setActiveChannel(clickedChannel) {
        // Remover clase active de todos los canales
        channelItems.forEach(channel => {
            channel.classList.remove('active');
        });
        
        // Agregar clase active al canal clickeado
        clickedChannel.classList.add('active');
        
        // Obtener datos del canal
        const channelName = clickedChannel.dataset.channel;
        const channelType = clickedChannel.dataset.type;
        
        // Actualizar canal actual
        currentChannel = channelName;
        currentChannelType = channelType;
        
        // Actualizar el título del canal en el header
        if (activeChannelTitle) {
            activeChannelTitle.textContent = channelName;
        }
        
        // Actualizar el hash del header
        if (spaceHeader) {
            const hashElement = spaceHeader.querySelector('.space-hash');
            if (hashElement) {
                hashElement.textContent = channelTypeIcons[channelType] || '#';
            }
        }
        
        // Actualizar el placeholder del input de mensaje
        if (messageInput) {
            const icon = channelTypeIcons[channelType] || '#';
            messageInput.placeholder = `Mensaje ${icon}${channelName}`;
        }
        
        // Efecto visual: resaltar brevemente el header
        const channelHeader = document.querySelector('.channel-header');
        if (channelHeader) {
            channelHeader.style.backgroundColor = 'var(--bg-hover)';
            setTimeout(() => {
                channelHeader.style.backgroundColor = 'var(--bg-primary)';
            }, 150);
        }
        
        // Manejar según el tipo de canal
        if (channelType === 'voice') {
            handleVoiceChannel(channelName);
        } else if (channelType === 'tasks') {
            handleTasksChannel(channelName);
        } else {
            handleTextChannel(channelName);
        }
        
        console.log(`📌 Canal activo: ${channelName} (${channelType})`);
    }
    
    /**
     * Maneja la selección de un canal de texto
     */
    function handleTextChannel(channelName) {
        // Salir de llamada de voz si está activa
        if (voiceCallActive) {
            leaveVoiceCall();
        }
        
        // OCULTAR todos los contenedores primero
        const chatArea = document.querySelector('.chat-area');
        const classroomContainer = document.querySelector('.classroom-container');
        const homeContainer = document.querySelector('.home-container');
        
        if (classroomContainer) classroomContainer.classList.add('hidden');
        if (homeContainer) homeContainer.classList.add('hidden');
        
        // MOSTRAR solo el chat
        if (chatArea) {
            chatArea.classList.remove('hidden');
        }
        
        // Mostrar input de mensaje
        const messageInputArea = document.querySelector('.message-input-area');
        if (messageInputArea) {
            messageInputArea.classList.remove('hidden');
        }
        
        // Configurar listener de mensajes
        setupRealtimeListener(channelName);
    }
    
    /**
     * Maneja la selección de un canal de voz
     */
    function handleVoiceChannel(channelName) {
        // REGLA DE EXCLUSIVIDAD: Si ya está en un canal de voz, salir primero
        if (voiceCallActive && currentVoiceChannel !== channelName) {
            console.log(`🔄 Cambiando de ${currentVoiceChannel} a ${channelName}`);
            leaveVoiceCall();
        }
        
        // OCULTAR todos los contenedores primero
        const chatArea = document.querySelector('.chat-area');
        const classroomContainer = document.querySelector('.classroom-container');
        const homeContainer = document.querySelector('.home-container');
        
        if (classroomContainer) classroomContainer.classList.add('hidden');
        if (homeContainer) homeContainer.classList.add('hidden');
        
        // MOSTRAR el chat (pero con interfaz de llamada)
        if (chatArea) {
            chatArea.classList.remove('hidden');
        }
        
        // Activar llamada de voz
        joinVoiceCall(channelName);
    }
    
    /**
     * Maneja la selección de un canal de tareas
     */
    function handleTasksChannel(channelName) {
        // Salir de llamada de voz si está activa
        if (voiceCallActive) {
            leaveVoiceCall();
        }
        
        // OCULTAR todos los contenedores primero
        const chatArea = document.querySelector('.chat-area');
        const homeContainer = document.querySelector('.home-container');
        
        if (chatArea) chatArea.classList.add('hidden');
        if (homeContainer) homeContainer.classList.add('hidden');
        
        // MOSTRAR vista de aula virtual
        if (window.showClassroomView) {
            window.showClassroomView(channelName);
        }
    }
    
    // Agregar event listeners a todos los canales
    channelItems.forEach(channel => {
        channel.addEventListener('click', function() {
            setActiveChannel(this);
        });
    });
    
    // ============================================
    // FUNCIONALIDAD: Cambio de Espacios (Servidores)
    // ============================================
    
    /**
     * Actualiza el espacio activo y carga su canal por defecto
     * @param {HTMLElement} clickedSpace - El elemento del espacio clickeado
     */
    function setActiveSpace(clickedSpace) {
        // Remover clase active de todos los espacios
        spaceItems.forEach(space => {
            space.classList.remove('active');
        });
        
        // Remover clase active del botón Home
        if (homeButton) {
            homeButton.classList.remove('active');
        }
        
        // Agregar clase active al espacio clickeado
        clickedSpace.classList.add('active');
        
        // Obtener el nombre del espacio
        const spaceKey = clickedSpace.dataset.space;
        const spaceTitle = spaceNames[spaceKey] || spaceKey;
        
        // Actualizar el nombre del espacio en el header
        if (spaceName) {
            spaceName.textContent = spaceTitle;
        }
        
        // Actualizar espacio actual
        currentSpace = spaceKey;
        
        // Obtener el canal por defecto de este espacio
        const defaultChannel = spaceDefaultChannels[spaceKey] || 'chat-general';
        
        // Buscar el elemento del canal por defecto y activarlo
        const defaultChannelElement = document.querySelector(`[data-channel="${defaultChannel}"]`);
        if (defaultChannelElement) {
            setActiveChannel(defaultChannelElement);
        }
        
        console.log(`Espacio activo: ${spaceTitle}, canal por defecto: #${defaultChannel}`);
    }
    
    // Agregar event listeners a todos los espacios
    spaceItems.forEach(space => {
        space.addEventListener('click', function() {
            setActiveSpace(this);
        });
    });
    
    // ============================================
    // FUNCIONALIDAD: Botón Home
    // ============================================
    
    if (homeButton) {
        homeButton.addEventListener('click', function() {
            // Remover clase active de todos los espacios
            spaceItems.forEach(space => {
                space.classList.remove('active');
            });
            
            // Agregar clase active al botón Home
            this.classList.add('active');
            
            // Mostrar vista Home
            showHomeView();
            
            console.log('🏠 Navegando al Home');
        });
    }
    
    // ============================================
    // FUNCIONALIDAD: Simulación de Canales de Voz (EXCLUSIVA)
    // ============================================
    
    /**
     * Se une a un canal de voz
     * @param {string} channelName - Nombre del canal de voz
     */
    function joinVoiceCall(channelName) {
        voiceCallActive = true;
        currentVoiceChannel = channelName;
        isMuted = false;
        isDeafened = false;
        isScreenSharing = false;
        
        // Agregar indicador visual en el canal
        const activeChannel = document.querySelector('.channel-item.active');
        if (activeChannel) {
            activeChannel.classList.add('voice-active');
        }
        
        // Mostrar panel de control de voz
        showVoiceControlPanel();
        
        // Mostrar interfaz de llamada en el área principal
        showCallInterface();
        
        console.log(`🎙️ Unido a canal de voz: ${channelName}`);
    }
    
    /**
     * Sale del canal de voz
     */
    function leaveVoiceCall() {
        voiceCallActive = false;
        const previousChannel = currentVoiceChannel;
        currentVoiceChannel = null;
        isMuted = false;
        isDeafened = false;
        isScreenSharing = false;
        
        // Remover indicador visual
        const activeChannel = document.querySelector('.channel-item.active');
        if (activeChannel) {
            activeChannel.classList.remove('voice-active');
        }
        
        // Ocultar panel de control
        hideVoiceControlPanel();
        
        // Ocultar interfaz de llamada
        hideCallInterface();
        
        console.log(`🔇 Desconectado de: ${previousChannel}`);
    }
    
    /**
     * Actualiza el estado del micrófono en la interfaz
     */
    function updateMicStatus() {
        const micIndicator = document.querySelector('.mic-indicator');
        const micStatusText = document.querySelector('.mic-status span:last-child');
        
        if (micIndicator) {
            if (isMuted) {
                micIndicator.classList.add('muted');
                micIndicator.classList.remove('active');
            } else {
                micIndicator.classList.remove('muted');
                micIndicator.classList.add('active');
            }
        }
        
        if (micStatusText) {
            micStatusText.textContent = isMuted ? 'Micrófono silenciado' : 'Micrófono activo';
        }
    }
    
    /**
     * Muestra el panel flotante de control de voz
     */
    function showVoiceControlPanel() {
        // Remover panel existente si hay
        hideVoiceControlPanel();
        
        const panel = document.createElement('div');
        panel.className = 'voice-control-panel';
        panel.id = 'voiceControlPanel';
        panel.innerHTML = `
            <div class="voice-panel-content">
                <div class="voice-status">
                    <span class="voice-indicator"></span>
                    <span class="voice-text">Voz conectada</span>
                </div>
                <div class="voice-channel-name">${currentVoiceChannel}</div>
                <div class="voice-controls">
                    <button class="voice-btn mute-btn ${isMuted ? 'muted' : ''}" title="Silenciar micrófono">
                        🎤
                    </button>
                    <button class="voice-btn deafen-btn ${isDeafened ? 'deafened' : ''}" title="Enmudecer">
                        🔊
                    </button>
                    <button class="voice-btn screen-share-btn ${isScreenSharing ? 'sharing' : ''}" title="Compartir pantalla">
                        🖥️
                    </button>
                    <button class="voice-btn disconnect-btn" title="Desconectar">
                        📞
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Agregar event listeners
        const disconnectBtn = panel.querySelector('.disconnect-btn');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', leaveVoiceCall);
        }
        
        const muteBtn = panel.querySelector('.mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', function() {
                isMuted = !isMuted;
                this.classList.toggle('muted');
                updateMicStatus();
                console.log(isMuted ? '🔇 Micrófono silenciado' : '🎤 Micrófono activado');
            });
        }
        
        const deafenBtn = panel.querySelector('.deafen-btn');
        if (deafenBtn) {
            deafenBtn.addEventListener('click', function() {
                isDeafened = !isDeafened;
                this.classList.toggle('deafened');
                console.log(isDeafened ? '🔇 Audio enmudecido' : '🔊 Audio activado');
            });
        }
        
        const screenShareBtn = panel.querySelector('.screen-share-btn');
        if (screenShareBtn) {
            screenShareBtn.addEventListener('click', function() {
                isScreenSharing = !isScreenSharing;
                this.classList.toggle('sharing');
                console.log(isScreenSharing ? '🖥️ Compartiendo pantalla' : '🖥️ Pantalla dejó de compartirse');
            });
        }
    }
    
    /**
     * Oculta el panel de control de voz
     */
    function hideVoiceControlPanel() {
        const panel = document.getElementById('voiceControlPanel');
        if (panel) {
            panel.remove();
        }
    }
    
    /**
     * Muestra la interfaz de llamada en el área principal
     */
    function showCallInterface() {
        // Ocultar mensajes e input
        const messagesContainerEl = document.querySelector('.messages-container');
        const messageInputArea = document.querySelector('.message-input-area');
        
        if (messagesContainerEl) messagesContainerEl.classList.add('hidden');
        if (messageInputArea) messageInputArea.classList.add('hidden');
        
        // Crear o mostrar interfaz de llamada
        let callInterface = document.querySelector('.call-interface');
        if (!callInterface) {
            callInterface = document.createElement('div');
            callInterface.className = 'call-interface';
            document.querySelector('.chat-area').appendChild(callInterface);
        }
        
        // Simular participantes (por ahora solo el usuario)
        const participants = [
            { name: 'Usuario de Prueba', avatar: '👤', isSelf: true }
        ];
        
        callInterface.innerHTML = `
            <div class="call-header">
                <h3>🎙️ ${currentVoiceChannel}</h3>
                <p class="call-status">Llamada activa</p>
            </div>
            <div class="call-participants-single">
                <div class="participant-card self">
                    <div class="participant-avatar-large">👤</div>
                    <div class="participant-info">
                        <h4 class="participant-name-large">Usuario de Prueba</h4>
                        <div class="mic-status">
                            <span class="mic-indicator ${isMuted ? 'muted' : 'active'}"></span>
                            <span>${isMuted ? 'Micrófono silenciado' : 'Micrófono activo'}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="call-actions">
                <button class="call-btn mute-btn ${isMuted ? 'muted' : ''}" title="Silenciar micrófono">
                    <span class="btn-icon">🎤</span>
                    <span class="btn-label">Silenciar</span>
                </button>
                <button class="call-btn deafen-btn ${isDeafened ? 'deafened' : ''}" title="Enmudecer">
                    <span class="btn-icon">🔊</span>
                    <span class="btn-label">Enmudecer</span>
                </button>
                <button class="call-btn screen-share-btn ${isScreenSharing ? 'sharing' : ''}" title="Compartir pantalla">
                    <span class="btn-icon">🖥️</span>
                    <span class="btn-label">Compartir</span>
                </button>
                <button class="call-btn disconnect-btn" title="Desconectar">
                    <span class="btn-icon">📞</span>
                    <span class="btn-label">Colgar</span>
                </button>
            </div>
        `;
        
        callInterface.classList.remove('hidden');
        
        // Agregar event listeners a los botones
        const disconnectBtn = callInterface.querySelector('.disconnect-btn');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', function() {
                leaveVoiceCall();
                showHomeView();
            });
        }
        
        const muteBtn = callInterface.querySelector('.mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', function() {
                isMuted = !isMuted;
                this.classList.toggle('muted');
                updateMicStatus();
                console.log(isMuted ? '🔇 Micrófono silenciado' : '🎤 Micrófono activado');
            });
        }
        
        const deafenBtn = callInterface.querySelector('.deafen-btn');
        if (deafenBtn) {
            deafenBtn.addEventListener('click', function() {
                isDeafened = !isDeafened;
                this.classList.toggle('deafened');
                console.log(isDeafened ? '🔇 Audio enmudecido' : '🔊 Audio activado');
            });
        }
        
        const screenShareBtn = callInterface.querySelector('.screen-share-btn');
        if (screenShareBtn) {
            screenShareBtn.addEventListener('click', function() {
                isScreenSharing = !isScreenSharing;
                this.classList.toggle('sharing');
                console.log(isScreenSharing ? '🖥️ Compartiendo pantalla' : '🖥️ Pantalla dejó de compartirse');
            });
        }
    }
    
    /**
     * Oculta la interfaz de llamada
     */
    function hideCallInterface() {
        const callInterface = document.querySelector('.call-interface');
        if (callInterface) {
            callInterface.classList.add('hidden');
        }
        
        // Mostrar mensajes e input de nuevo
        const messagesContainerEl = document.querySelector('.messages-container');
        const messageInputArea = document.querySelector('.message-input-area');
        
        if (messagesContainerEl) messagesContainerEl.classList.remove('hidden');
        if (messageInputArea) messageInputArea.classList.remove('hidden');
    }
    
    // ============================================
    // FUNCIONALIDAD: Envío de Mensajes a Firestore
    // ============================================
    
    const sendBtn = document.querySelector('.send-btn');
    const attachBtn = document.querySelector('.attach-btn');
    
    /**
     * Envía un mensaje a Firestore
     */
    async function sendMessage() {
        if (!messageInput) return;
        
        const messageText = messageInput.value.trim();
        
        if (messageText === '') {
            messageInput.focus();
            return;
        }
        
        try {
            await addDoc(collection(db, 'messages'), {
                text: messageText,
                user: 'Usuario de Prueba',
                timestamp: serverTimestamp(),
                channel: currentChannel
            });
            
            console.log(`✅ Mensaje enviado en #${currentChannel}`);
            
            messageInput.value = '';
            messageInput.focus();
            
        } catch (error) {
            console.error('❌ Error al enviar mensaje:', error);
            alert('Error al enviar el mensaje. Por favor, intenta de nuevo.');
        }
    }
    
    /**
     * Escapa caracteres HTML para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string} Texto escapado
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Event listener para el botón de enviar
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    // Event listener para el botón de adjuntar (placeholder)
    if (attachBtn) {
        attachBtn.addEventListener('click', function() {
            console.log('Funcionalidad de adjuntar archivo - Por implementar');
        });
    }
    
    // Event listener para enviar con Enter
    if (messageInput) {
        messageInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendMessage();
            }
        });
    }
    
    // ============================================
    // FUNCIONALIDAD: Botón Crear Espacio (Placeholder)
    // ============================================
    
    const createSpaceBtn = document.querySelector('.create-space-btn');
    
    if (createSpaceBtn) {
        createSpaceBtn.addEventListener('click', function() {
            console.log('Funcionalidad de crear espacio - Por implementar');
        });
    }
    
    // ============================================
    // FUNCIONALIDAD: Botón Añadir Sección (Placeholder)
    // ============================================
    
    const addSectionBtn = document.querySelector('.add-section-btn');
    
    if (addSectionBtn) {
        addSectionBtn.addEventListener('click', function() {
            console.log('Funcionalidad de añadir sección - Por implementar');
        });
    }
    
    // ============================================
    // INICIALIZACIÓN
    // ============================================
    
    console.log('🚀 Iniciando aplicación...');
    console.log('🔥 Conectando a Firebase Firestore...');
    console.log('📋 Espacios disponibles:', Object.values(spaceNames).join(', '));
    console.log('💡 Escribe un mensaje y presiona Enter para enviarlo');
    console.log('🔍 Filtrado de mensajes por canal activado (sin índice)');
    console.log('🎙️ Canales de voz simulados activados (exclusivos)');
    console.log('📚 Módulo de Aula Virtual cargado');
    console.log('🏠 Modo Home activado al iniciar');
    console.log('🖱️  Click en casita = Home, Click en servidor = Canal por defecto');
    
    // Mostrar Home al cargar la aplicación
    showHomeView();
    
    // Enfocar el input de mensaje al cargar
    if (messageInput) {
        messageInput.focus();
    }
});

// ============================================
// EXPORTACIONES (Para futura modularidad)
// ============================================

// Si se usa módulos ES6 en el futuro:
// export { setActiveChannel, setActiveSpace, sendMessage };