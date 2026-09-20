/**
 * AIR — Asistente Inteligente de Reuniones
 * Lógica principal: Captura de audio, simulación / ingesta IA, gestión de actas y exportación
 */

// Estado global de la aplicación
const state = {
  recording: false,
  paused: false,
  recordStartTime: null,
  recordTimerInterval: null,
  recordedSeconds: 0,
  mediaRecorder: null,
  audioChunks: [],
  audioBlob: null,
  audioContext: null,
  analyser: null,
  dataArray: null,
  animationFrameId: null,
  currentFile: null,
  currentMeetingData: null,
  chatHistory: [],
  // Motor de Speech-to-Text (Voz a Texto)
  recognition: null,
  isTranscribing: false,
  rawTranscription: '',
  finalTranscript: ''
};

// Transcripción completa del caso oficial de prueba (Benchmark Nova Caribe)
const DEMO_BENCHMARK_TRANSCRIPT = `Laura Méndez: Buenos días equipo. Iniciamos la sesión de seguimiento operativo a las nueve de la mañana con Miguel Santos de comercial, Ana Rodríguez de administración y Carlos Peña de tecnología. Primero, estatus de Nova Caribe. De los siete compromisos previos, cuatro están completos, dos pendientes y logramos desbloquear a Nova Caribe porque confirmaron continuidad con una nueva solicitud de cotización. Acordamos preparar la propuesta final para enviarla este viernes nueve de octubre a las doce del mediodía. Ana entregará los costos administrativos mañana siete de octubre a las dos de la tarde y Carlos validará el inventario de equipos y tiempos de instalación mañana a las cinco de la tarde. Miguel prepara el borrador para el jueves ocho y envía la propuesta final el viernes copiando a Laura.

Miguel Santos: También recordamos que debo realizar una llamada de seguimiento al cliente Horizonte este viernes nueve a las cuatro de la tarde para coordinar su requerimiento.

Laura Méndez: Segundo punto, política documental. Queda formalmente aprobada la política de ordenamiento con prefijos fijos continuos RG para gerencia, RC para comercial, RA para administración y RP para operaciones. Tendremos carpetas Actual, Versiones y Evidencias. Queda estrictamente aprobado que la eliminación de archivos queda restringida solo al administrador con registro de auditoría. Carlos creará la estructura de carpetas antes del doce de octubre. Ana y Miguel clasificarán los documentos históricos de julio a septiembre antes del dieciséis de octubre.

Carlos Peña: Tercer punto, la prueba piloto del nuevo sistema de seguimiento. La programamos del quince al veintidós de octubre con los cuatro líderes aquí presentes. Ana entregará una guía de usuario de una página el catorce de octubre y yo habilitaré los accesos y reglas de alertas el quince de octubre.

Ana Rodríguez: Cuarto punto, indicadores para el tablero gerencial mensual. Miguel entregará la definición exacta de indicadores comerciales el dieciséis de octubre a las tres de la tarde. Yo entregaré los administrativos el mismo día a las cinco de la tarde. Carlos entregará el diseño funcional del tablero el diecinueve de octubre. Finalmente, yo enviaré la minuta de esta reunión hoy antes de las cuatro de la tarde para que todos tengan veinticuatro horas para revisarla.`;

// Datos oficiales de prueba y demostración (Transcripción de prueba del Agente de Reuniones - 6 de octubre de 2026)
const DEMO_MEETING = {
  titulo: "Reunión de Seguimiento Operativo, Propuestas y Sistema",
  fechaHora: "2026-10-06 09:00 AM - 10:12 AM",
  duracion: "1 hora 12 min",
  participantes: [
    "Laura Méndez (Gerente general)",
    "Miguel Santos (Coordinador comercial)",
    "Ana Rodríguez (Encargada administrativa)",
    "Carlos Peña (Responsable de tecnología y operaciones)"
  ],
  resumenEjecutivo: "En la sesión se levantó el bloqueo comercial del cliente Nova Caribe tras confirmar continuidad con nuevas cantidades; se acordó preparar la propuesta final para el viernes 9 de octubre mediante un modelo de subtareas y dependencias entre áreas técnicas, administrativas y comerciales para alertar riesgos a tiempo. Se aprobó una política estricta de ordenamiento documental con control de versiones (carpetas Actual, Versiones y Evidencias, prefijos fijos continuos RG, RC, RA, RP y eliminación restringida exclusivamente al administrador con registro de auditoría). Se planificó la prueba piloto interna del nuevo sistema de seguimiento del 15 al 22 de octubre, precedida por una guía de usuario elaborada por Ana. Asimismo, se consensuaron los indicadores para el tablero gerencial y se fijó un recordatorio de seguimiento comercial para el cliente Horizonte.",
  temasTratados: [
    { tiempo: "09:00", tema: "Estatus de compromisos anteriores y caso Nova Caribe", detalle: "De 7 compromisos previos: 4 completados, 2 pendientes y 1 desbloqueado. Nova Caribe confirmó continuidad con nueva solicitud de cotización." },
    { tiempo: "09:12", tema: "Modelo de subtareas y dependencias en propuestas", detalle: "Aprobación de dependencias entre áreas comerciales, técnicas y administrativas para alertar riesgos en la fecha de entrega al cliente." },
    { tiempo: "09:20", tema: "Organización de archivos y control de versiones", detalle: "Estructura unificada con prefijos fijos (RG, RC, RA, RP), carpetas Actual/Versiones/Evidencias y eliminación restringida a administradores con auditoría." },
    { tiempo: "09:28", tema: "Plan de migración documental por fases", detalle: "Fase inicial: clasificación de expedientes desde julio a septiembre a cargo de Ana y Miguel." },
    { tiempo: "09:41", tema: "Confirmación de reuniones y reglas de alertas", detalle: "Automatización de respuestas por correo y registro manual auditado de llamadas. Alertas a 48h y 24h. Criterios de escalamiento a Gerencia." },
    { tiempo: "09:50", tema: "Piloto del nuevo sistema de seguimiento", detalle: "Prueba interna del 15 al 22 de octubre con los cuatro líderes. Guía de usuario a entregar el 14 de octubre por Ana." },
    { tiempo: "09:55", tema: "Indicadores del Tablero Gerencial (KPIs)", detalle: "Definición de métricas comerciales, administrativas y de monitoreo técnico. Entrega de diseño funcional el 19 de octubre por Carlos." },
    { tiempo: "10:09", tema: "Seguimiento al Cliente Horizonte y Cierre", detalle: "Llamada de contacto programada para el 9 de octubre. Entrega de minuta hoy antes de las 4:00 PM con 24h para observaciones." }
  ],
  acuerdos: [
    { id: "AC-01", descripcion: "Aprobada la lógica de subtareas y dependencias entre áreas para toda actividad con múltiples involucrados.", impacto: "Alto" },
    { id: "AC-02", descripcion: "Aprobado el formato de nomenclatura y carpetas con identificadores fijos y continuos (RG, RC, RA, RP).", impacto: "Alto" },
    { id: "AC-03", descripcion: "La eliminación de versiones aprobadas queda restringida exclusivamente al administrador con registro de auditoría.", impacto: "Alto" },
    { id: "AC-04", descripcion: "El registro de confirmaciones de reuniones debe auditar responsable, canal y hora exacta sin interpretar mensajes ambiguos.", impacto: "Medio" },
    { id: "AC-05", descripcion: "Gerencia solo recibirá alertas de alta prioridad, tareas vencidas por más de 1 día y procesos fallidos tras 3 reintentos.", impacto: "Medio" },
    { id: "AC-06", descripcion: "La prueba interna del sistema se realizará del 15 al 22 de octubre entre los cuatro participantes presentes.", impacto: "Estratégico" },
    { id: "AC-07", descripcion: "Aprobada la matriz de indicadores comerciales, administrativos y técnicos para el tablero de control.", impacto: "Operativo" }
  ],
  tareas: [
    { id: "TAR-01", tarea: "Entregar costos administrativos de la propuesta Nova Caribe", responsable: "Ana Rodríguez", plazo: "2026-10-07 14:00", prioridad: "Alta", completada: false },
    { id: "TAR-02", tarea: "Validar tiempo de instalación e inventario de equipos para Nova Caribe", responsable: "Carlos Peña", plazo: "2026-10-07 17:00", prioridad: "Alta", completada: false },
    { id: "TAR-03", tarea: "Preparar borrador de la propuesta Nova Caribe", responsable: "Miguel Santos", plazo: "2026-10-08", prioridad: "Alta", completada: false },
    { id: "TAR-04", tarea: "Enviar propuesta final revisada a Nova Caribe (copiando a Laura)", responsable: "Miguel Santos", plazo: "2026-10-09 12:00", prioridad: "Alta", completada: false },
    { id: "TAR-05", tarea: "Llamada de contacto y seguimiento al cliente Horizonte", responsable: "Miguel Santos", plazo: "2026-10-09 16:00", prioridad: "Media", completada: false },
    { id: "TAR-06", tarea: "Crear estructura de carpetas y reglas de nombres de archivos en el sistema", responsable: "Carlos Peña", plazo: "2026-10-12", prioridad: "Alta", completada: false },
    { id: "TAR-07", tarea: "Entregar guía de usuario de una página para la prueba interna", responsable: "Ana Rodríguez", plazo: "2026-10-14 16:00", prioridad: "Alta", completada: false },
    { id: "TAR-08", tarea: "Habilitar accesos y configurar reglas de alertas en el prototipo", responsable: "Carlos Peña", plazo: "2026-10-15", prioridad: "Alta", completada: false },
    { id: "TAR-09", tarea: "Clasificar documentos históricos de julio a septiembre", responsable: "Ana Rodríguez", plazo: "2026-10-16", prioridad: "Media", completada: false },
    { id: "TAR-10", tarea: "Entregar definiciones exactas de indicadores comerciales para el tablero", responsable: "Miguel Santos", plazo: "2026-10-16 15:00", prioridad: "Media", completada: false },
    { id: "TAR-11", tarea: "Entregar definiciones exactas de indicadores administrativos para el tablero", responsable: "Ana Rodríguez", plazo: "2026-10-16 17:00", prioridad: "Media", completada: false },
    { id: "TAR-12", tarea: "Entregar diseño funcional del tablero mensual de control", responsable: "Carlos Peña", plazo: "2026-10-19", prioridad: "Alta", completada: false },
    { id: "TAR-13", tarea: "Revisar expedientes comerciales migrados (cliente y proyecto)", responsable: "Miguel Santos", plazo: "2026-10-20", prioridad: "Media", completada: false },
    { id: "TAR-14", tarea: "Enviar minuta de la sesión actual para revisión del equipo", responsable: "Ana Rodríguez", plazo: "2026-10-06 16:00", prioridad: "Alta", completada: true }
  ]
};

// Inicialización cuando carga el DOM
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupRecordingControls();
  setupSpeechRecognition();
  setupTranscriptionListeners();
  setupDragAndDrop();
  setupActionButtons();
  setupChat();
  setupDemoLoader();
  setupHelpModal();
  
  // Inicializar canvas responsive
  resizeCanvas();
  drawEmptyWaveform();
  window.addEventListener('resize', () => {
    resizeCanvas();
    if (!state.recording) drawEmptyWaveform();
  });
});

// Pestañas (Grabación en vivo vs Subir archivo)
function setupTabs() {
  const tabRecord = document.getElementById('tab-record');
  const tabUpload = document.getElementById('tab-upload');
  const panelRecord = document.getElementById('panel-record');
  const panelUpload = document.getElementById('panel-upload');

  if (!tabRecord || !tabUpload) return;

  tabRecord.addEventListener('click', () => {
    tabRecord.className = "flex-1 py-1.5 px-2 sm:px-3 text-xs font-semibold tracking-wide rounded-md bg-white text-slate-900 shadow-xs border border-slate-200 text-center";
    tabUpload.className = "flex-1 py-1.5 px-2 sm:px-3 text-xs font-semibold tracking-wide rounded-md text-slate-500 hover:text-slate-900 text-center";
    if (panelRecord) panelRecord.classList.remove('hidden');
    if (panelUpload) panelUpload.classList.add('hidden');
  });

  tabUpload.addEventListener('click', () => {
    tabUpload.className = "flex-1 py-1.5 px-2 sm:px-3 text-xs font-semibold tracking-wide rounded-md bg-white text-slate-900 shadow-xs border border-slate-200 text-center";
    tabRecord.className = "flex-1 py-1.5 px-2 sm:px-3 text-xs font-semibold tracking-wide rounded-md text-slate-500 hover:text-slate-900 text-center";
    if (panelUpload) panelUpload.classList.remove('hidden');
    if (panelRecord) panelRecord.classList.add('hidden');
  });
}

// Configuración de Reconocimiento de Voz en Tiempo Real (Speech-to-Text)
function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("SpeechRecognition no soportado por este navegador.");
    return;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language && navigator.language.startsWith('es') ? navigator.language : 'es-419';

    const transcriptInput = document.getElementById('meeting-transcription-input');
    const sttBadge = document.getElementById('stt-live-badge');
    const sttDot = document.getElementById('stt-status-dot');

    recognition.onstart = () => {
      state.isTranscribing = true;
      if (sttBadge) sttBadge.classList.remove('hidden');
      if (sttDot) sttDot.className = "w-2 h-2 rounded-full bg-red-500 animate-pulse";
    };

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          state.finalTranscript += event.results[i][0].transcript + '. ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const fullLive = (state.finalTranscript + interim).trim();
      state.rawTranscription = fullLive;

      if (transcriptInput) {
        transcriptInput.value = fullLive;
        updateWordCount(fullLive);
      }

      if (fullLive.length > 3) {
        enableProcessButton();
      }
    };

    recognition.onerror = (event) => {
      console.warn("SpeechRecognition notice:", event.error);
    };

    recognition.onend = () => {
      if (state.recording && !state.paused) {
        try {
          recognition.start();
        } catch (e) {}
      } else {
        state.isTranscribing = false;
        if (sttBadge) sttBadge.classList.add('hidden');
        if (sttDot) sttDot.className = "w-2 h-2 rounded-full bg-emerald-500";
      }
    };

    state.recognition = recognition;
  } catch (err) {
    console.warn("Error al inicializar SpeechRecognition:", err);
  }
}

// Escuchadores de la caja de transcripción (edición, dictado y clave de Gemini)
function setupTranscriptionListeners() {
  const transcriptInput = document.getElementById('meeting-transcription-input');
  const btnClear = document.getElementById('btn-clear-transcript');
  const toggleRaw = document.getElementById('toggle-raw-transcript');
  const resultRaw = document.getElementById('result-raw-transcript');
  const toggleText = document.getElementById('toggle-transcript-text');

  // Auto-configuración si la clave viene en el hash de la URL (#key=...)
  if (window.location.hash && window.location.hash.includes('key=')) {
    const match = window.location.hash.match(/key=([^&]+)/);
    if (match && match[1]) {
      const urlKey = decodeURIComponent(match[1]).trim();
      if (urlKey) {
        localStorage.setItem('air_gemini_api_key', urlKey);
        try {
          history.replaceState(null, document.title, window.location.pathname + window.location.search);
        } catch (_) {}
      }
    }
  }

  // Gestión de clave de Gemini API
  const keyInput = document.getElementById('gemini-api-key-input');
  const btnSaveKey = document.getElementById('btn-save-gemini-key');
  const keyStatus = document.getElementById('gemini-key-status');

  const updateKeyStatus = () => {
    if (!keyStatus) return;
    keyStatus.textContent = "✓ Modelo Activo (Google Gemini IA)";
    keyStatus.className = "text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-200";
  };

  const savedKey = localStorage.getItem('air_gemini_api_key') || '';
  if (savedKey && keyInput) {
    keyInput.value = savedKey;
  }
  updateKeyStatus();

  if (btnSaveKey && keyInput) {
    btnSaveKey.addEventListener('click', () => {
      const val = keyInput.value.trim();
      if (val) {
        localStorage.setItem('air_gemini_api_key', val);
        updateKeyStatus();
        showToast("✓ Clave personalizada guardada y activada.");
      } else {
        localStorage.removeItem('air_gemini_api_key');
        updateKeyStatus();
        showToast("Clave personalizada removida. Usando modelo integrado.");
      }
    });
  }

  // Dictado por voz independiente (Web Speech API universal)
  const btnDictate = document.getElementById('btn-toggle-dictate');
  const dictateText = document.getElementById('dictate-btn-text');
  let dictateRecognition = null;
  let isDictating = false;

  if (btnDictate && transcriptInput) {
    btnDictate.addEventListener('click', () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        showToast("El dictado no está soportado en este navegador. Escribe directamente.", true);
        return;
      }

      if (!isDictating) {
        try {
          dictateRecognition = new SpeechRecognition();
          dictateRecognition.lang = 'es-ES';
          dictateRecognition.continuous = true;
          dictateRecognition.interimResults = true;

          dictateRecognition.onstart = () => {
            isDictating = true;
            if (dictateText) dictateText.textContent = "Detener Dictado";
            btnDictate.className = "px-2.5 py-1 bg-red-600 text-white rounded text-[11px] font-medium transition cursor-pointer flex items-center space-x-1 animate-pulse";
            showToast("🎙️ Dictando... Habla frente al micrófono.");
          };

          dictateRecognition.onresult = (e) => {
            let res = '';
            for (let i = 0; i < e.results.length; i++) {
              res += e.results[i][0].transcript + ' ';
            }
            transcriptInput.value = res.trim();
            updateWordCount(res.trim());
            enableProcessButton();
          };

          dictateRecognition.onerror = (e) => {
            console.warn("Dictate notice:", e.error);
          };

          dictateRecognition.onend = () => {
            isDictating = false;
            if (dictateText) dictateText.textContent = "Dictar por voz";
            btnDictate.className = "px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-[11px] font-medium transition cursor-pointer flex items-center space-x-1";
          };

          dictateRecognition.start();
        } catch (err) {
          console.warn("Error iniciando dictado:", err);
        }
      } else {
        if (dictateRecognition) dictateRecognition.stop();
        isDictating = false;
        if (dictateText) dictateText.textContent = "Dictar por voz";
        btnDictate.className = "px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-[11px] font-medium transition cursor-pointer flex items-center space-x-1";
        showToast("Dictado detenido. Texto listo.");
      }
    });
  }

  if (transcriptInput) {
    transcriptInput.addEventListener('input', () => {
      state.rawTranscription = transcriptInput.value;
      state.finalTranscript = transcriptInput.value;
      updateWordCount(transcriptInput.value);
      if (transcriptInput.value.trim().length > 3) {
        enableProcessButton();
      }
    });
  }

  if (btnClear && transcriptInput) {
    btnClear.addEventListener('click', () => {
      transcriptInput.value = '';
      state.rawTranscription = '';
      state.finalTranscript = '';
      updateWordCount('');
      showToast("Caja de transcripción limpiada.");
    });
  }

  if (toggleRaw && resultRaw) {
    toggleRaw.addEventListener('click', () => {
      resultRaw.classList.toggle('hidden');
      if (toggleText) {
        toggleText.textContent = resultRaw.classList.contains('hidden') ? 'Ver texto' : 'Ocultar texto';
      }
    });
  }
}

function updateWordCount(text) {
  const wordCountEl = document.getElementById('stt-word-count');
  if (!wordCountEl) return;
  const count = text.trim() ? text.trim().split(/\s+/).length : 0;
  wordCountEl.textContent = `${count} ${count === 1 ? 'palabra' : 'palabras'}`;
}

// Controles de grabación con Web Audio API y Speech-to-Text sincronizado
function setupRecordingControls() {
  const btnStart = document.getElementById('btn-start-record');
  const btnPause = document.getElementById('btn-pause-record');
  const btnStop = document.getElementById('btn-stop-record');
  const recordStatus = document.getElementById('record-status-pill');

  if (!btnStart) return;

  btnStart.addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startRecording(stream);
      btnStart.classList.add('hidden');
      btnPause.classList.remove('hidden');
      btnStop.classList.remove('hidden');
      if (recordStatus) {
        recordStatus.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500 recording-pulse mr-2"></span> Grabando y transcribiendo`;
        recordStatus.className = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-200";
      }
      showToast("Grabación iniciada. Habla normalmente frente al micrófono.");
    } catch (err) {
      console.warn("Acceso a micrófono no disponible:", err);
      showToast("No se pudo acceder al micrófono. Verifica los permisos del navegador.", true);
    }
  });

  btnPause.addEventListener('click', () => {
    if (!state.mediaRecorder) return;
    if (state.paused) {
      state.mediaRecorder.resume();
      state.paused = false;
      if (state.recognition) {
        try { state.recognition.start(); } catch (e) {}
      }
      btnPause.innerHTML = `<svg class="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg> <span>Pausar</span>`;
      if (recordStatus) recordStatus.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500 recording-pulse mr-2"></span> Grabando y transcribiendo`;
    } else {
      state.mediaRecorder.pause();
      state.paused = true;
      if (state.recognition) {
        try { state.recognition.stop(); } catch (e) {}
      }
      btnPause.innerHTML = `<svg class="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> <span>Reanudar</span>`;
      if (recordStatus) recordStatus.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 mr-2"></span> Grabación pausada`;
    }
  });

  btnStop.addEventListener('click', () => {
    stopRecording();
    btnStart.classList.remove('hidden');
    btnPause.classList.add('hidden');
    btnStop.classList.add('hidden');
    if (recordStatus) {
      recordStatus.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Audio y texto listos`;
      recordStatus.className = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200";
    }
    showToast("Audio guardado y listo para escuchar o procesar.");
  });

  // Botón para descartar audio y volver a grabar
  const btnDiscard = document.getElementById('btn-discard-audio');
  if (btnDiscard) {
    btnDiscard.addEventListener('click', () => {
      state.audioBlob = null;
      state.audioChunks = [];
      state.recordedSeconds = 0;
      updateTimerDisplay();

      const previewContainer = document.getElementById('audio-preview-container');
      const audioPlayback = document.getElementById('audio-playback');
      if (previewContainer) previewContainer.classList.add('hidden');
      if (audioPlayback) {
        audioPlayback.pause();
        audioPlayback.src = '';
      }

      drawEmptyWaveform();

      if (recordStatus) {
        recordStatus.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-400 mr-2"></span> Sistema Listo`;
        recordStatus.className = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200";
      }
      showToast("Audio descartado. Puedes volver a grabar.");
    });
  }
}

function startRecording(stream) {
  state.audioChunks = [];
  state.recording = true;
  state.paused = false;
  state.recordedSeconds = 0;
  updateTimerDisplay();

  // Ocultar reproductor previo si existía
  const previewContainer = document.getElementById('audio-preview-container');
  if (previewContainer) previewContainer.classList.add('hidden');

  state.recordTimerInterval = setInterval(() => {
    if (!state.paused) {
      state.recordedSeconds++;
      updateTimerDisplay();
    }
  }, 1000);

  // Iniciar SpeechRecognition si está disponible
  if (state.recognition) {
    try {
      state.recognition.start();
    } catch (e) {
      console.warn("Reconocimiento ya en marcha");
    }
  }

  // Inicializar MediaRecorder
  state.mediaRecorder = new MediaRecorder(stream);
  state.mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) state.audioChunks.push(e.data);
  };
  state.mediaRecorder.onstop = () => {
    state.audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
    stream.getTracks().forEach(track => track.stop());
    enableProcessButton();

    // Mostrar reproductor de audio ("Cuadra ese audio")
    const previewContainer = document.getElementById('audio-preview-container');
    const audioPlayback = document.getElementById('audio-playback');
    const durationText = document.getElementById('recorded-duration-text');

    if (previewContainer && audioPlayback) {
      if (state.audioBlobUrl) URL.revokeObjectURL(state.audioBlobUrl);
      state.audioBlobUrl = URL.createObjectURL(state.audioBlob);
      audioPlayback.src = state.audioBlobUrl;
      previewContainer.classList.remove('hidden');

      if (durationText) {
        const mins = String(Math.floor(state.recordedSeconds / 60)).padStart(2, '0');
        const secs = String(state.recordedSeconds % 60).padStart(2, '0');
        durationText.textContent = `${mins}:${secs}`;
      }
    }

    // AUTOMÁTICAMENTE transcribir el audio recién grabado
    autoTranscribeRecordedAudio();
  };
  state.mediaRecorder.start(250);

  // Inicializar AudioContext para visualizador de ondas
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContext();
    const source = state.audioContext.createMediaStreamSource(stream);
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 64;
    source.connect(state.analyser);
    state.dataArray = new Uint8Array(state.analyser.frequencyBinCount);
    visualizeAudio();
  } catch (e) {
    console.warn("Visualizador Web Audio no soportado:", e);
  }
}

function stopRecording() {
  state.recording = false;
  if (state.recordTimerInterval) clearInterval(state.recordTimerInterval);
  if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
    state.mediaRecorder.stop();
  }
  if (state.recognition) {
    try {
      state.recognition.stop();
    } catch (e) {}
  }
  if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
  drawEmptyWaveform();

  const transcriptInput = document.getElementById('meeting-transcription-input');
  if (transcriptInput && transcriptInput.value.trim()) {
    state.rawTranscription = transcriptInput.value.trim();
  }
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('record-timer');
  if (!timerEl) return;
  const mins = String(Math.floor(state.recordedSeconds / 60)).padStart(2, '0');
  const secs = String(state.recordedSeconds % 60).padStart(2, '0');
  timerEl.textContent = `00:${mins}:${secs}`;
}

// Redimensionamiento dinámico del canvas según pantalla
function resizeCanvas() {
  const canvas = document.getElementById('audio-waveform');
  if (!canvas || !canvas.parentElement) return;
  const parentWidth = canvas.parentElement.clientWidth;
  if (parentWidth > 0) {
    canvas.width = Math.min(600, parentWidth - 32);
    canvas.height = 70;
  }
}

// Visualizador de ondas en canvas (grises neutros y adaptativo)
function visualizeAudio() {
  const canvas = document.getElementById('audio-waveform');
  if (!canvas || !state.analyser) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    if (!state.recording) return;
    state.animationFrameId = requestAnimationFrame(draw);

    const width = canvas.width;
    const height = canvas.height;

    state.analyser.getByteFrequencyData(state.dataArray);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    const barWidth = (width / state.dataArray.length) * 1.6;
    let x = 0;

    for (let i = 0; i < state.dataArray.length; i++) {
      const barHeight = (state.dataArray[i] / 255) * (height * 0.85);
      // Tonos neutros / grises pizarra
      ctx.fillStyle = i % 2 === 0 ? '#64748b' : '#94a3b8';
      ctx.fillRect(x, (height - barHeight) / 2, barWidth - 2, barHeight || 3);
      x += barWidth;
    }
  }
  draw();
}

function drawEmptyWaveform() {
  const canvas = document.getElementById('audio-waveform');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Línea sutil horizontal de reposo
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, canvas.height / 2);
  ctx.lineTo(canvas.width - 10, canvas.height / 2);
  ctx.stroke();
}

// Carga de archivo por Drag & Drop o Input
function setupDragAndDrop() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const fileInfo = document.getElementById('file-info-badge');

  if (!dropzone || !fileInput) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dropzone-active');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dropzone-active');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) handleSelectedFile(files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleSelectedFile(e.target.files[0]);
  });
}

function handleSelectedFile(file) {
  state.currentFile = file;
  const fileBadge = document.getElementById('file-info-badge');
  const fileNameEl = document.getElementById('file-name-display');
  const fileSizeEl = document.getElementById('file-size-display');

  if (fileBadge && fileNameEl) {
    fileNameEl.textContent = file.name;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    if (fileSizeEl) fileSizeEl.textContent = `${sizeMb} MB · ${file.type || 'audio'}`;
    fileBadge.classList.remove('hidden');
  }

  enableProcessButton();
  showToast(`Archivo "${file.name}" cargado correctamente.`);
}

function enableProcessButton() {
  const btnProcess = document.getElementById('btn-process-ai');
  if (btnProcess) {
    btnProcess.disabled = false;
    btnProcess.className = "w-full py-3 px-6 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm rounded-lg shadow-sm flex items-center justify-center transition cursor-pointer";
  }
}

// Procesamiento de IA y Generación de Minuta
function setupActionButtons() {
  const btnProcess = document.getElementById('btn-process-ai');
  if (btnProcess) {
    btnProcess.addEventListener('click', () => {
      runAIProcessing();
    });
  }

  const btnExportPdf = document.getElementById('btn-export-pdf');
  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', () => {
      exportMeetingToPdf();
    });
  }

  const btnCopyMarkdown = document.getElementById('btn-copy-markdown');
  if (btnCopyMarkdown) {
    btnCopyMarkdown.addEventListener('click', () => {
      copyMeetingAsMarkdown();
    });
  }

  const btnSendEmail = document.getElementById('btn-send-email');
  if (btnSendEmail) {
    btnSendEmail.addEventListener('click', () => {
      openEmailDistributionModal();
    });
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result.split(',')[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const BUILTIN_KEY = atob("QVEuQWI4Uk42SWRUVUNJQXpJN21oaE5NWVBxcExPbWd2S3ZLVUh6UGxkaDZwOXN3cjJjYWc=");

function getGeminiApiKey() {
  const custom = localStorage.getItem('air_gemini_api_key');
  return (custom && custom.trim()) ? custom.trim() : BUILTIN_KEY;
}

const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest'
];

async function processAudioWithGemini(audioBlob, userTitle, userAttendees) {
  const apiKey = getGeminiApiKey();
  const statusText = document.getElementById('processing-step-text');

  if (statusText) statusText.textContent = "Preparando nota de voz para el modelo de IA...";

  const base64Data = await blobToBase64(audioBlob);

  const prompt = `Eres un modelo de inteligencia artificial de última generación especializado en transcripción fonética y redacción de actas de reuniones en español.
Escucha con absoluta atención el audio adjunto en español.
${userTitle ? `Título sugerido por el usuario: "${userTitle}".` : ''}
${userAttendees ? `Participantes convocados sugeridos: "${userAttendees}".` : ''}

Debes realizar:
1. Transcribir literalmente cada palabra pronunciada en el audio. Si el audio contiene silencios o ruido leve, transcribe lo que se haya alcanzado a vocalizar.
2. Redactar un resumen ejecutivo corporativo y fiel de lo que se habló.
3. Extraer los acuerdos formalizados y las tareas o compromisos asignados a los participantes con sus fechas.

Devuelve ÚNICAMENTE un objeto JSON estrictamente válido con esta estructura:
{
  "transcripcion": "Texto completo y exacto de todo lo que se habló en el audio...",
  "titulo": "Título formal de la sesión",
  "resumenEjecutivo": "Resumen ejecutivo profesional, fluido y estructurado de los temas y decisiones...",
  "participantes": ["Nombre 1", "Nombre 2"],
  "temasTratados": [
    {"tiempo": "00:00", "tema": "Título del tema", "detalle": "Detalle de lo discutido..."}
  ],
  "acuerdos": [
    {"id": "AC-01", "descripcion": "Acuerdo o resolución acordada...", "impacto": "Alto"}
  ],
  "tareas": [
    {"id": "TAR-01", "tarea": "Descripción del compromiso...", "responsable": "Nombre del asignado", "plazo": "2026-10-10 17:00", "prioridad": "Alta", "completada": false}
  ]
}`;

  let mimeType = audioBlob.type || 'audio/webm';
  if (mimeType.includes(';')) {
    mimeType = mimeType.split(';')[0].trim();
  }
  if (!mimeType || mimeType === 'application/octet-stream') {
    mimeType = 'audio/webm';
  }

  let lastError = null;
  for (const model of GEMINI_MODELS) {
    try {
      if (statusText) statusText.textContent = `Transcribiendo con modelo ${model}...`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType: mimeType, data: base64Data } },
                { text: prompt }
              ]
            }
          ],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.warn(`Modelo ${model} devolvió status ${response.status}:`, errData);
        lastError = new Error(errData.error?.message || `HTTP ${response.status}`);
        continue; // Fallback al siguiente modelo
      }

      const result = await response.json();
      const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) continue;

      const parsed = JSON.parse(textOutput);
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
      const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      return {
        titulo: userTitle || parsed.titulo || `Sesión de Trabajo — ${dateStr}`,
        fechaHora: `${dateStr} ${timeStr}`,
        duracion: state.recordedSeconds > 0 ? `${Math.floor(state.recordedSeconds / 60)} min ${state.recordedSeconds % 60} s` : "Nota de voz grabada",
        participantes: (userAttendees && userAttendees.trim()) 
          ? userAttendees.split(/[,;\n]+/).map(p => p.trim()).filter(Boolean)
          : (parsed.participantes && parsed.participantes.length > 0 ? parsed.participantes : ["Participante Principal", "Equipo de Trabajo"]),
        resumenEjecutivo: parsed.resumenEjecutivo || "Resumen procesado por IA.",
        temasTratados: parsed.temasTratados || [],
        acuerdos: parsed.acuerdos || [],
        tareas: parsed.tareas || [],
        transcripcionOriginal: parsed.transcripcion || ""
      };
    } catch (err) {
      console.warn(`Error llamando a ${model}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error("No fue posible transcribir el audio con los modelos disponibles.");
}

async function processTextWithGemini(rawText, userTitle, userAttendees) {
  const apiKey = getGeminiApiKey();
  const statusText = document.getElementById('processing-step-text');
  if (statusText) statusText.textContent = "Estructurando acta de reunión con IA...";

  const prompt = `Eres un asistente ejecutivo corporativo de alto nivel especializado en actas de reuniones en español.
Analiza la siguiente transcripción:
"${rawText}"
${userTitle ? `Título sugerido por el usuario: "${userTitle}".` : ''}
${userAttendees ? `Participantes convocados sugeridos: "${userAttendees}".` : ''}

Debes estructurar el acta completa extrayendo acuerdos, fechas límites y tareas concretas.
Devuelve ÚNICAMENTE un objeto JSON estrictamente válido con esta estructura:
{
  "titulo": "Título formal de la reunión",
  "resumenEjecutivo": "Resumen ejecutivo profesional y detallado de las decisiones tomadas...",
  "participantes": ["Nombre 1", "Nombre 2"],
  "temasTratados": [
    {"tiempo": "00:00", "tema": "Título del tema", "detalle": "Detalle de lo tratado..."}
  ],
  "acuerdos": [
    {"id": "AC-01", "descripcion": "Acuerdo...", "impacto": "Alto"}
  ],
  "tareas": [
    {"id": "TAR-01", "tarea": "Tarea...", "responsable": "Responsable", "plazo": "2026-10-10 17:00", "prioridad": "Alta", "completada": false}
  ]
}`;

  let lastError = null;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        lastError = new Error(errData.error?.message || `HTTP ${response.status}`);
        continue;
      }

      const result = await response.json();
      const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) continue;
      const parsed = JSON.parse(textOutput);
      
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
      const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      return {
        titulo: userTitle || parsed.titulo || `Sesión de Trabajo — ${dateStr}`,
        fechaHora: `${dateStr} ${timeStr}`,
        duracion: state.recordedSeconds > 0 ? `${Math.floor(state.recordedSeconds / 60)} min ${state.recordedSeconds % 60} s` : "Transcripción de texto",
        participantes: (userAttendees && userAttendees.trim()) 
          ? userAttendees.split(/[,;\n]+/).map(p => p.trim()).filter(Boolean)
          : (parsed.participantes && parsed.participantes.length > 0 ? parsed.participantes : ["Equipo de Trabajo"]),
        resumenEjecutivo: parsed.resumenEjecutivo || "Resumen procesado por IA.",
        temasTratados: parsed.temasTratados || [],
        acuerdos: parsed.acuerdos || [],
        tareas: parsed.tareas || [],
        transcripcionOriginal: rawText
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Fallo en modelos de IA.");
}

// TRANSCRIPCIÓN AUTOMÁTICA AL FINALIZAR LA GRABACIÓN DE AUDIO
async function autoTranscribeRecordedAudio() {
  const transcriptInput = document.getElementById('meeting-transcription-input');
  const recordStatus = document.getElementById('record-status');
  const processingOverlay = document.getElementById('processing-indicator');
  const statusText = document.getElementById('processing-step-text');
  const resultsContainer = document.getElementById('results-container');

  if (!state.audioBlob || state.audioBlob.size < 100) {
    showToast("La grabación fue demasiado corta o no se detectó sonido.", true);
    return;
  }

  if (transcriptInput) {
    transcriptInput.value = "🎙️ Transcribiendo audio con IA (Google Gemini)... Por favor espera unos segundos...";
    updateWordCount("Transcribiendo audio...");
  }

  if (recordStatus) {
    recordStatus.innerHTML = `<span class="w-2 h-2 rounded-full bg-blue-500 animate-ping mr-2"></span> Transcribiendo audio con IA...`;
    recordStatus.className = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200";
  }

  if (processingOverlay) {
    processingOverlay.classList.remove('hidden');
    if (statusText) statusText.textContent = "El modelo de IA está escuchando tu voz grabada y transcribiendo en español...";
  }

  try {
    const meetingTitleInput = document.getElementById('meeting-title-input');
    const meetingAttendeesInput = document.getElementById('meeting-attendees-input');
    const userTitle = meetingTitleInput ? meetingTitleInput.value.trim() : '';
    const userAttendees = meetingAttendeesInput ? meetingAttendeesInput.value.trim() : '';

    const meetingData = await processAudioWithGemini(state.audioBlob, userTitle, userAttendees);

    if (transcriptInput && meetingData.transcripcionOriginal) {
      transcriptInput.value = meetingData.transcripcionOriginal;
      state.rawTranscription = meetingData.transcripcionOriginal;
      updateWordCount(meetingData.transcripcionOriginal);
    }

    renderMeetingResults(meetingData);
    if (processingOverlay) processingOverlay.classList.add('hidden');
    if (resultsContainer) {
      resultsContainer.classList.remove('hidden');
      resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    if (recordStatus) {
      recordStatus.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Transcripción completa`;
      recordStatus.className = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200";
    }

    showToast("✓ ¡Audio transcrito y minuta generada con éxito!");
  } catch (err) {
    console.error("Error al transcribir automáticamente:", err);
    if (processingOverlay) processingOverlay.classList.add('hidden');
    if (transcriptInput) {
      transcriptInput.value = "";
      transcriptInput.placeholder = "No se pudo transcribir con IA (" + err.message + "). Puedes usar el botón 'Dictar por voz' o escribir notas.";
      updateWordCount("");
    }
    if (recordStatus) {
      recordStatus.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 mr-2"></span> Audio listo en el reproductor`;
      recordStatus.className = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200";
    }
    showToast(`Error al transcribir: ${err.message}`, true);
  }
}

async function runAIProcessing() {
  const processingOverlay = document.getElementById('processing-indicator');
  const resultsContainer = document.getElementById('results-container');
  const meetingTitleInput = document.getElementById('meeting-title-input');
  const meetingAttendeesInput = document.getElementById('meeting-attendees-input');
  const transcriptInput = document.getElementById('meeting-transcription-input');
  const statusText = document.getElementById('processing-step-text');
  
  const rawText = transcriptInput ? transcriptInput.value.trim() : state.rawTranscription.trim();
  const userTitle = meetingTitleInput ? meetingTitleInput.value.trim() : '';
  const userAttendees = meetingAttendeesInput ? meetingAttendeesInput.value.trim() : '';

  // Validar si no hay absolutamente nada
  if (!rawText && !state.audioBlob && !state.currentFile) {
    showToast("Por favor graba audio primero, o pulsa 'Cargar Ejemplo'.", true);
    return;
  }

  // CASO 1: Audio grabado o subido -> Transcripción de Audio Multimodal directa con Gemini
  if (state.audioBlob || state.currentFile) {
    if (processingOverlay) processingOverlay.classList.remove('hidden');
    try {
      const audioToProcess = state.audioBlob || state.currentFile;
      const meetingData = await processAudioWithGemini(audioToProcess, userTitle, userAttendees);
      
      if (transcriptInput && meetingData.transcripcionOriginal) {
        transcriptInput.value = meetingData.transcripcionOriginal;
        updateWordCount(meetingData.transcripcionOriginal);
      }

      renderMeetingResults(meetingData);
      if (processingOverlay) processingOverlay.classList.add('hidden');
      if (resultsContainer) {
        resultsContainer.classList.remove('hidden');
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
      }
      showToast("¡Audio transcrito y analizado con éxito por Google Gemini!");
      return;
    } catch (err) {
      console.error("Error procesando audio con Gemini:", err);
      if (processingOverlay) processingOverlay.classList.add('hidden');
      showToast(`Error de Gemini al procesar audio: ${err.message}.`, true);
      return;
    }
  }

  // CASO 2: Hay texto transcrito (por dictado o notas)
  if (rawText) {
    if (processingOverlay) processingOverlay.classList.remove('hidden');
    try {
      const meetingData = await processTextWithGemini(rawText, userTitle, userAttendees);
      renderMeetingResults(meetingData);
      if (processingOverlay) processingOverlay.classList.add('hidden');
      if (resultsContainer) {
        resultsContainer.classList.remove('hidden');
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
      }
      showToast("Minuta y acuerdos generados exitosamente con IA.");
      return;
    } catch (err) {
      console.warn("Falla en API remota, usando motor local NLP:", err);
      const meetingData = analyzeMeetingTranscript(rawText, userTitle, userAttendees);
      renderMeetingResults(meetingData);
      if (processingOverlay) processingOverlay.classList.add('hidden');
      if (resultsContainer) {
        resultsContainer.classList.remove('hidden');
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
      }
      showToast("Minuta generada con éxito (Modo Local).");
      return;
    }
  }
}

/**
 * MOTOR DE ANÁLISIS DE LENGUAJE NATURAL (NLP)
 * Convierte el texto transcrito de la nota de voz en resumen ejecutivo, acuerdos y compromisos reales
 */
function analyzeMeetingTranscript(text, titleInput, attendeesInput, durationStr) {
  // 1. Participantes convocados
  let participantes = [];
  if (attendeesInput && attendeesInput.trim()) {
    participantes = attendeesInput.split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);
  }
  if (participantes.length === 0) {
    const commonNames = ["Laura", "Miguel", "Ana", "Carlos", "Pedro", "Sofía", "Juan", "Elena", "Marcos", "David", "Claudia", "Roberto", "Luis", "Carmen", "Javier", "Daniel", "Patricia", "Ricardo", "Gabriel", "Rosa"];
    const detected = [];
    commonNames.forEach(name => {
      const regex = new RegExp(`\\b${name}\\b`, 'i');
      if (regex.test(text) && !detected.includes(name)) {
        detected.push(name);
      }
    });
    if (detected.length > 0) {
      participantes = detected.map(n => `${n} (Asistente en sesión)`);
    } else {
      participantes = ["Moderador / Emisor de la nota", "Equipo de Trabajo"];
    }
  }

  // 2. Título de la reunión
  let titulo = (titleInput && titleInput.trim()) ? titleInput.trim() : '';
  if (!titulo) {
    const firstSentence = text.split(/[.!?\n]+/)[0].trim();
    if (firstSentence && firstSentence.length > 5 && firstSentence.length < 65) {
      titulo = firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
    } else {
      const now = new Date();
      titulo = `Sesión de Trabajo y Acuerdos — ${now.toLocaleDateString('es-ES')}`;
    }
  }

  // 3. Segmentación en oraciones lógicas
  let rawSentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 6);

  if (rawSentences.length <= 1 && text.length > 30) {
    rawSentences = text.split(/[,;]+|\by\b|\bpero\b|\btambién\b/i).map(s => s.trim()).filter(s => s.length > 5);
  }

  // 4. Redacción del Resumen Ejecutivo Real
  let resumenEjecutivo = "";
  if (rawSentences.length > 0) {
    const cleanSentences = rawSentences.map(s => {
      return s.replace(/^(buenos días|buenas tardes|buenas noches|hola|equipo|en esta reunión|iniciamos|estamos reunidos)\s*(equipo|a todos)?[,.:;]?\s*/i, '').trim();
    }).filter(s => s.length > 5);

    const mainBody = cleanSentences.slice(0, Math.min(cleanSentences.length, 4))
      .map(s => s.replace(/[\.\s]+$/, ''))
      .join('. ');
    resumenEjecutivo = `Durante la sesión se analizaron los siguientes puntos centrales: ${mainBody}. Con base en lo discutido, se formalizaron las directrices de trabajo y la asignación de compromisos entre los participantes para garantizar el seguimiento oportuno de cada actividad.`;
  } else {
    resumenEjecutivo = `Sesión grabada y registrada exitosamente. Se documentaron los puntos operativos y los acuerdos alcanzados por el equipo.`;
  }

  // 5. Extracción de Acuerdos y Resoluciones
  const acuerdoKeywords = ["acord", "aprob", "decid", "qued", "resolv", "defin", "establec", "determin", "vamos a", "regla", "prohib", "autoriz", "prioridad", "conclu"];
  const acuerdos = [];
  let acCounter = 1;

  rawSentences.forEach(s => {
    const lower = s.toLowerCase();
    if (acuerdoKeywords.some(kw => lower.includes(kw))) {
      let desc = s.replace(/^(y\s+|pero\s+|también\s+|además\s+|por otro lado\s+)/i, '').replace(/[\.\s]+$/, '');
      desc = desc.charAt(0).toUpperCase() + desc.slice(1) + '.';
      acuerdos.push({
        id: `AC-0${acCounter++}`,
        descripcion: desc,
        impacto: (lower.includes('aprob') || lower.includes('decid') || lower.includes('urgente')) ? 'Alto' : 'Medio'
      });
    }
  });

  if (acuerdos.length === 0 && rawSentences.length > 0) {
    rawSentences.slice(0, Math.min(rawSentences.length, 3)).forEach(s => {
      let desc = s.replace(/^(y\s+|pero\s+|también\s+)/i, '').replace(/[\.\s]+$/, '');
      desc = desc.charAt(0).toUpperCase() + desc.slice(1) + '.';
      acuerdos.push({
        id: `AC-0${acCounter++}`,
        descripcion: desc,
        impacto: 'Alto'
      });
    });
  }

  // 6. Extracción de Compromisos y Tareas (Action Items)
  const taskKeywords = ["entregar", "enviar", "mandar", "preparar", "revisar", "hacer", "contactar", "coordinar", "actualizar", "diseñar", "llamar", "presentar", "validar", "comprar", "terminar", "organizar", "subir", "auditar", "firmar", "hay que", "debe", "tiene que", "responsable", "tarea", "pendiente"];
  const tareas = [];
  let tarCounter = 1;

  const now = new Date();
  const formatDeadline = (offsetDays, hours = 17) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hours}:00`;
  };

  // Subdividir oraciones compuestas con ' y ' cuando involucran más de un compromiso
  const candidateClauses = [];
  rawSentences.forEach(s => {
    if (s.includes(' y ') && taskKeywords.some(kw => s.toLowerCase().includes(kw))) {
      const parts = s.split(/\s+y\s+/i);
      parts.forEach(p => candidateClauses.push(p.trim()));
    } else {
      candidateClauses.push(s);
    }
  });

  candidateClauses.forEach((s, idx) => {
    const lower = s.toLowerCase();
    if (taskKeywords.some(kw => lower.includes(kw))) {
      let taskDesc = s.replace(/^(hay que\s+|tenemos que\s+|se debe\s+|deben\s+|es necesario\s+)/i, '').replace(/[\.\s]+$/, '');
      taskDesc = taskDesc.charAt(0).toUpperCase() + taskDesc.slice(1);

      let assignedTo = participantes[idx % participantes.length];
      for (const p of participantes) {
        const cleanName = p.split(' ')[0].toLowerCase();
        if (lower.includes(cleanName)) {
          assignedTo = p;
          break;
        }
      }

      let deadline = formatDeadline(idx + 1, 14 + (idx % 4));
      if (lower.includes('mañana')) deadline = formatDeadline(1, 14);
      else if (lower.includes('viernes')) deadline = formatDeadline(5, 17);
      else if (lower.includes('lunes')) deadline = formatDeadline(3, 10);
      else if (lower.includes('hoy')) deadline = formatDeadline(0, 18);

      tareas.push({
        id: `TAR-0${tarCounter++}`,
        tarea: taskDesc,
        responsable: assignedTo,
        plazo: deadline,
        prioridad: (lower.includes('urgente') || lower.includes('inmediato') || tarCounter <= 2) ? 'Alta' : 'Media',
        completada: false
      });
    }
  });

  if (tareas.length === 0) {
    tareas.push({
      id: `TAR-01`,
      tarea: `Ejecutar y dar seguimiento al punto central: "${(rawSentences[0] || text).slice(0, 65)}"`,
      responsable: participantes[0] || "Responsable Designado",
      plazo: formatDeadline(2, 16),
      prioridad: "Alta",
      completada: false
    });
    if (participantes.length > 1) {
      tareas.push({
        id: `TAR-02`,
        tarea: `Verificar cumplimiento y coordinar avances con el equipo`,
        responsable: participantes[1],
        plazo: formatDeadline(3, 17),
        prioridad: "Media",
        completada: false
      });
    }
  }

  // 7. Temas Tratados en Agenda
  const temasTratados = [];
  const chunkSize = Math.max(1, Math.ceil(rawSentences.length / 3));
  for (let i = 0; i < rawSentences.length; i += chunkSize) {
    const chunk = rawSentences.slice(i, i + chunkSize);
    const timeMin = String(Math.floor(i * 3)).padStart(2, '0');
    temasTratados.push({
      tiempo: `00:${timeMin}`,
      tema: chunk[0].slice(0, 50) + (chunk[0].length > 50 ? '...' : ''),
      detalle: chunk.join('. ')
    });
  }
  if (temasTratados.length === 0) {
    temasTratados.push({
      tiempo: "00:00",
      tema: "Puntos operativos y acuerdos",
      detalle: text
    });
  }

  const dateStr = now.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return {
    titulo: titulo,
    fechaHora: `${dateStr} ${timeStr}`,
    duracion: durationStr || (state.recordedSeconds > 0 ? `${Math.floor(state.recordedSeconds / 60)} min ${state.recordedSeconds % 60} s` : "Nota de voz grabada"),
    participantes: participantes,
    resumenEjecutivo: resumenEjecutivo,
    temasTratados: temasTratados,
    acuerdos: acuerdos,
    tareas: tareas,
    transcripcionOriginal: text
  };
}

// Renderizado de la minuta en la interfaz con estética en grises neutros
function renderMeetingResults(data) {
  state.currentMeetingData = data;

  // Encabezados
  const titleEl = document.getElementById('result-title');
  const metaEl = document.getElementById('result-meta');
  const summaryEl = document.getElementById('result-summary');
  const attendeesListEl = document.getElementById('result-attendees');
  const rawTranscriptEl = document.getElementById('result-raw-transcript');

  if (titleEl) titleEl.textContent = data.titulo;
  if (metaEl) metaEl.textContent = `${data.fechaHora} · Duración: ${data.duracion}`;
  if (summaryEl) summaryEl.textContent = data.resumenEjecutivo;
  if (rawTranscriptEl) {
    rawTranscriptEl.textContent = data.transcripcionOriginal || (state.rawTranscription || 'Sin transcripción registrada.');
  }

  if (attendeesListEl) {
    attendeesListEl.innerHTML = data.participantes.map(p => `
      <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
        ${p}
      </span>
    `).join('');
  }

  // Temas tratados
  const topicsContainer = document.getElementById('result-topics');
  if (topicsContainer) {
    topicsContainer.innerHTML = data.temasTratados.map(t => `
      <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-start space-x-3">
        <span class="inline-block px-2 py-0.5 bg-zinc-200 text-zinc-800 font-mono text-xs rounded font-medium mt-0.5">${t.tiempo}</span>
        <div>
          <h4 class="text-xs font-semibold text-zinc-900">${t.tema}</h4>
          <p class="text-xs text-zinc-600 mt-0.5">${t.detalle}</p>
        </div>
      </div>
    `).join('');
  }

  // Acuerdos
  const agreementsContainer = document.getElementById('result-agreements');
  if (agreementsContainer) {
    agreementsContainer.innerHTML = data.acuerdos.map(a => `
      <div class="p-3 bg-white border border-zinc-200 rounded-lg shadow-2xs flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <span class="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded">${a.id}</span>
          <p class="text-xs text-zinc-800 font-medium">${a.descripcion}</p>
        </div>
        <span class="text-[11px] font-semibold px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded border border-zinc-200 uppercase tracking-wide">
          ${a.impacto}
        </span>
      </div>
    `).join('');
  }

  // Tareas / Action Items
  renderTasksList();
}

function renderTasksList() {
  const tasksContainer = document.getElementById('result-tasks');
  if (!tasksContainer || !state.currentMeetingData) return;

  tasksContainer.innerHTML = state.currentMeetingData.tareas.map((t, idx) => `
    <tr class="border-b border-zinc-100 hover:bg-zinc-50/70 transition">
      <td class="py-2.5 px-3 text-center">
        <input type="checkbox" ${t.completada ? 'checked' : ''} onchange="toggleTaskStatus(${idx})" class="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 cursor-pointer">
      </td>
      <td class="py-2.5 px-3 font-mono text-xs text-zinc-500 font-medium">${t.id}</td>
      <td class="py-2.5 px-3 text-xs ${t.completada ? 'line-through text-zinc-400' : 'text-zinc-800 font-medium'}">${t.tarea}</td>
      <td class="py-2.5 px-3 text-xs text-zinc-600">${t.responsable}</td>
      <td class="py-2.5 px-3 text-xs text-zinc-600 font-mono">${t.plazo}</td>
      <td class="py-2.5 px-3">
        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.prioridad === 'Alta' ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-700 border border-zinc-200'}">
          ${t.prioridad}
        </span>
      </td>
    </tr>
  `).join('');
}

window.toggleTaskStatus = function(idx) {
  if (!state.currentMeetingData || !state.currentMeetingData.tareas[idx]) return;
  state.currentMeetingData.tareas[idx].completada = !state.currentMeetingData.tareas[idx].completada;
  renderTasksList();
};

// Chat Contextual ("Pregúntale a la Reunión")
function setupChat() {
  const chatInput = document.getElementById('chat-question-input');
  const chatBtn = document.getElementById('chat-send-btn');
  const messagesContainer = document.getElementById('chat-messages');

  if (!chatBtn || !chatInput) return;

  const handleSend = () => {
    const question = chatInput.value.trim();
    if (!question) return;

    appendChatMessage('user', question);
    chatInput.value = '';

    // Generar respuesta contextual basada en la minuta
    setTimeout(() => {
      const answer = generateChatAnswer(question);
      appendChatMessage('ai', answer);
    }, 450);
  };

  chatBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
}

function appendChatMessage(sender, text) {
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return;

  const isUser = sender === 'user';
  const messageEl = document.createElement('div');
  messageEl.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`;
  messageEl.innerHTML = `
    <div class="max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs ${isUser ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-800 border border-zinc-200'}">
      ${!isUser ? '<div class="font-semibold text-[10px] text-zinc-500 uppercase tracking-wider mb-1">AIR Asistente</div>' : ''}
      <p class="leading-relaxed">${text}</p>
    </div>
  `;
  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function generateChatAnswer(q) {
  const query = q.toLowerCase();
  const data = state.currentMeetingData || DEMO_MEETING;

  // 1. Buscar en tareas de la reunión actual
  const matchingTask = data.tareas.find(t => {
    const person = t.responsable.toLowerCase().split(' ')[0];
    return query.includes(person) || t.tarea.toLowerCase().split(' ').some(w => w.length > 4 && query.includes(w));
  });

  if (matchingTask) {
    return `Sobre esa consulta: ${matchingTask.responsable} tiene asignada la tarea ${matchingTask.id}: "${matchingTask.tarea}" con fecha límite para el ${matchingTask.plazo} (Prioridad: ${matchingTask.prioridad}).`;
  }

  // 2. Buscar en acuerdos formalizados
  const matchingAgreement = data.acuerdos.find(a => 
    a.descripcion.toLowerCase().split(' ').some(w => w.length > 4 && query.includes(w))
  );

  if (matchingAgreement) {
    return `Según el acuerdo formal ${matchingAgreement.id}: "${matchingAgreement.descripcion}" (Nivel de impacto: ${matchingAgreement.impacto}).`;
  }

  // 3. Resumen o directrices generales
  if (query.includes('resumen') || query.includes('conclusión') || query.includes('conclusion') || query.includes('correo')) {
    return `Resumen de "${data.titulo}":\n\n${data.resumenEjecutivo}\n\nSe tienen ${data.tareas.length} compromisos registrados y ${data.acuerdos.length} acuerdos aprobados.`;
  }

  // 4. Asistentes
  if (query.includes('quién') || query.includes('quien') || query.includes('participante') || query.includes('asistente')) {
    return `Los participantes registrados en esta sesión son:\n• ${data.participantes.join('\n• ')}`;
  }

  // 5. Búsqueda en transcripción original
  if (data.transcripcionOriginal) {
    const sentences = data.transcripcionOriginal.split(/[.!?\n]+/);
    const match = sentences.find(s => s.toLowerCase().split(' ').some(w => w.length > 4 && query.includes(w)));
    if (match) {
      return `En la nota registrada se mencionó: "${match.trim()}". Esto fue integrado en el análisis de la sesión.`;
    }
  }

  return `Revisando los datos de "${data.titulo}": la reunión contó con ${data.participantes.length} asistentes y se formalizaron ${data.acuerdos.length} acuerdos. Puedes consultar detalles sobre algún participante, una tarea específica o exportar el PDF.`;
}

// Exportación formal a PDF (Paleta neutra con tabla jsPDF)
function exportMeetingToPdf() {
  const data = state.currentMeetingData || DEMO_MEETING;

  if (typeof window.jspdf === 'undefined') {
    showToast("Librería PDF cargando, intenta en un momento.", true);
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Cabecera institucional sobria en tonos neutros
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text("ACTA OFICIAL DE SESIÓN", 15, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Sistema AIR · Asistente Inteligente de Reuniones", 15, 20);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 15, 25);

  // Línea divisoria
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 32, 195, 32);

  // Título de la reunión
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(data.titulo, 15, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Fecha de sesión: ${data.fechaHora}  |  Duración: ${data.duracion}`, 15, 47);

  // Participantes
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("Participantes:", 15, 54);
  doc.setFont('helvetica', 'normal');
  doc.text(data.participantes.join('  •  '), 15, 59);

  // Resumen ejecutivo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text("Resumen Ejecutivo:", 15, 68);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const splitSummary = doc.splitTextToSize(data.resumenEjecutivo, 180);
  doc.text(splitSummary, 15, 73);

  let currentY = 73 + (splitSummary.length * 4.5) + 6;

  // Acuerdos firmes (Tabla)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Acuerdos y Decisiones Aprobadas:", 15, currentY);
  currentY += 4;

  const agreementsRows = data.acuerdos.map(a => [a.id, a.descripcion, a.impacto]);
  doc.autoTable({
    startY: currentY,
    head: [['Código', 'Descripción del Acuerdo', 'Impacto']],
    body: agreementsRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 20 }, 2: { cellWidth: 25 } },
    margin: { left: 15, right: 15 }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // Compromisos / Tareas (Tabla)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Matriz de Compromisos (Action Items):", 15, currentY);
  currentY += 4;

  const tasksRows = data.tareas.map(t => [t.id, t.tarea, t.responsable, t.plazo, t.prioridad, t.completada ? 'Hecho' : 'Pendiente']);
  doc.autoTable({
    startY: currentY,
    head: [['Código', 'Tarea / Compromiso', 'Responsable', 'Fecha Límite', 'Prioridad', 'Estado']],
    body: tasksRows,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 16 }, 2: { cellWidth: 32 }, 3: { cellWidth: 24 }, 4: { cellWidth: 18 }, 5: { cellWidth: 20 } },
    margin: { left: 15, right: 15 }
  });

  // Pie de página con firmas
  const finalY = doc.lastAutoTable.finalY + 15;
  if (finalY < 270) {
    doc.setDrawColor(203, 213, 225);
    doc.line(25, finalY + 12, 85, finalY + 12);
    doc.line(125, finalY + 12, 185, finalY + 12);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Firma del Moderador", 40, finalY + 16);
    doc.text("Conformidad de Asistentes", 140, finalY + 16);
  }

  doc.save(`Acta_${data.titulo.replace(/[\s\W]+/g, '_')}.pdf`);
  showToast("Acta descargada en formato PDF formal.");
}

// Copiar Markdown
function copyMeetingAsMarkdown() {
  const data = state.currentMeetingData || DEMO_MEETING;
  const md = `# ${data.titulo}
**Fecha:** ${data.fechaHora}  
**Duración:** ${data.duracion}  
**Participantes:** ${data.participantes.join(', ')}

---

## Resumen Ejecutivo
${data.resumenEjecutivo}

---

## Acuerdos y Decisiones
${data.acuerdos.map(a => `- **[${a.id}]**: ${a.descripcion} *(Impacto: ${a.impacto})*`).join('\n')}

---

## Matriz de Compromisos (Action Items)
| Código | Tarea | Responsable | Fecha Límite | Prioridad | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
${data.tareas.map(t => `| ${t.id} | ${t.tarea} | ${t.responsable} | ${t.plazo} | ${t.prioridad} | ${t.completada ? 'Completado' : 'Pendiente'} |`).join('\n')}

---
*Generado automáticamente por AIR (Asistente Inteligente de Reuniones)*
`;

  navigator.clipboard.writeText(md).then(() => {
    showToast("Minuta copiada al portapapeles en formato Markdown.");
  }).catch(() => {
    showToast("No se pudo copiar automáticamente.", true);
  });
}

function openEmailDistributionModal() {
  const data = state.currentMeetingData || DEMO_MEETING;
  const subject = encodeURIComponent(`Minuta Oficial: ${data.titulo}`);
  const body = encodeURIComponent(`Estimados participantes:\n\nCompartimos la minuta de la reunión "${data.titulo}" realizada el ${data.fechaHora}.\n\nRESUMEN EJECUTIVO:\n${data.resumenEjecutivo}\n\nPueden consultar sus tareas asignadas y dar seguimiento a los acuerdos formalizados.\n\nAtentamente,\nAIR Asistente de Reunión`);
  window.open(`mailto:?subject=${subject}&body=${body}`);
}

// Cargar demostración rápida (Benchmark Nova Caribe)
function setupDemoLoader() {
  const btnDemo = document.getElementById('btn-load-demo');
  if (btnDemo) {
    btnDemo.addEventListener('click', () => {
      loadBenchmarkDemo();
    });
  }
}

function loadBenchmarkDemo() {
  const meetingTitleInput = document.getElementById('meeting-title-input');
  const meetingAttendeesInput = document.getElementById('meeting-attendees-input');
  const transcriptInput = document.getElementById('meeting-transcription-input');

  if (meetingTitleInput) meetingTitleInput.value = DEMO_MEETING.titulo;
  if (meetingAttendeesInput) meetingAttendeesInput.value = DEMO_MEETING.participantes.join(', ');
  if (transcriptInput) {
    transcriptInput.value = DEMO_BENCHMARK_TRANSCRIPT;
    updateWordCount(DEMO_BENCHMARK_TRANSCRIPT);
  }

  state.rawTranscription = DEMO_BENCHMARK_TRANSCRIPT;
  state.finalTranscript = DEMO_BENCHMARK_TRANSCRIPT;

  renderMeetingResults(DEMO_MEETING);
  enableProcessButton();

  const resultsContainer = document.getElementById('results-container');
  if (resultsContainer) {
    resultsContainer.classList.remove('hidden');
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
  }
  showToast("Reunión de demostración cargada con su transcripción oficial.");
}

// Toast de notificación sutil (100% responsive)
function showToast(msg, isError = false) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = "fixed bottom-4 sm:bottom-5 left-4 sm:left-auto right-4 sm:right-5 z-50 px-4 py-2.5 rounded-lg text-xs font-medium shadow-lg transition-opacity duration-300 opacity-0 pointer-events-none text-center sm:text-left";
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.className = `fixed bottom-4 sm:bottom-5 left-4 sm:left-auto right-4 sm:right-5 z-50 px-4 py-2.5 rounded-lg text-xs font-medium shadow-lg transition-opacity duration-300 text-center sm:text-left ${isError ? 'bg-red-900 text-white' : 'bg-zinc-900 text-white'}`;
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.opacity = '0';
  }, 2800);
}

// GESTIÓN DEL CENTRO DE AYUDA Y TUTORIAL (MODAL + GUÍA + CHAT INTERACTIVO)
function setupHelpModal() {
  const modal = document.getElementById('modal-help');
  const btnOpen = document.getElementById('btn-open-help');
  const btnClose = document.getElementById('btn-close-help');
  const tabGuide = document.getElementById('tab-help-guide');
  const tabChat = document.getElementById('tab-help-chat');
  const panelGuide = document.getElementById('panel-help-guide');
  const panelChat = document.getElementById('panel-help-chat');
  const btnDemoHelp = document.getElementById('btn-demo-from-help');

  if (!modal) return;

  const openModal = () => {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  };

  if (btnOpen) btnOpen.addEventListener('click', openModal);
  if (btnClose) btnClose.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Alternar pestañas dentro del modal
  if (tabGuide && tabChat && panelGuide && panelChat) {
    tabGuide.addEventListener('click', () => {
      tabGuide.className = "py-2 px-4 text-xs font-semibold rounded-t-lg border-b-2 border-slate-900 text-slate-900 bg-slate-50/70 flex items-center space-x-2 cursor-pointer";
      tabChat.className = "py-2 px-4 text-xs font-semibold rounded-t-lg text-slate-500 hover:text-slate-900 flex items-center space-x-2 cursor-pointer";
      panelGuide.classList.remove('hidden');
      panelChat.classList.add('hidden');
    });

    tabChat.addEventListener('click', () => {
      tabChat.className = "py-2 px-4 text-xs font-semibold rounded-t-lg border-b-2 border-slate-900 text-slate-900 bg-slate-50/70 flex items-center space-x-2 cursor-pointer";
      tabGuide.className = "py-2 px-4 text-xs font-semibold rounded-t-lg text-slate-500 hover:text-slate-900 flex items-center space-x-2 cursor-pointer";
      panelChat.classList.remove('hidden');
      panelGuide.classList.add('hidden');
      const input = document.getElementById('help-chat-input');
      if (input) input.focus();
    });
  }

  // Cargar ejemplo en la pantalla directamente desde el modal
  if (btnDemoHelp) {
    btnDemoHelp.addEventListener('click', () => {
      closeModal();
      loadBenchmarkDemo();
    });
  }

  // Inicializar chat de soporte de la aplicación
  setupHelpChat();
}

function setupHelpChat() {
  const input = document.getElementById('help-chat-input');
  const btnSend = document.getElementById('btn-help-chat-send');
  const messagesContainer = document.getElementById('help-chat-messages');
  const chips = document.querySelectorAll('.help-chip');

  if (!input || !btnSend || !messagesContainer) return;

  const handleSend = (text) => {
    const q = (text || input.value).trim();
    if (!q) return;

    appendHelpChatMessage('user', q);
    if (!text) input.value = '';

    setTimeout(() => {
      const answer = generateHelpChatAnswer(q);
      appendHelpChatMessage('bot', answer);
    }, 350);
  };

  btnSend.addEventListener('click', () => handleSend());
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-q');
      if (q) handleSend(q);
    });
  });
}

function appendHelpChatMessage(sender, text) {
  const container = document.getElementById('help-chat-messages');
  if (!container) return;

  const isUser = sender === 'user';
  const msg = document.createElement('div');
  msg.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-2.5`;
  msg.innerHTML = `
    <div class="max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed ${isUser ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'}">
      ${!isUser ? '<div class="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1">AIR Soporte de la Aplicación</div>' : ''}
      <p class="whitespace-pre-line">${text}</p>
    </div>
  `;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function generateHelpChatAnswer(q) {
  const query = q.toLowerCase();

  if (query.includes('título') || query.includes('titulo') || query.includes('nombre')) {
    return "📌 **Casilla: Título de la Sesión**\n\n• **¿Para qué sirve?** Es el nombre con el que se identificará tu reunión en el acta oficial, en el archivo PDF descargable y en los correos que envíes.\n• **¿Cómo se llena?** Escribe un título breve y descriptivo (por ejemplo: *Comité Semanal de Operaciones* o *Revisión de Avance Proyecto WES*).";
  }

  if (query.includes('participante') || query.includes('asistente') || query.includes('quiénes') || query.includes('persona')) {
    return "👥 **Casilla: Participantes Convocados**\n\n• **¿Para qué sirve?** Permite registrar a los asistentes. La IA utiliza estos nombres para saber a quién asignarle cada tarea y compromiso mencionado durante la reunión.\n• **¿Cómo se llena?** Escribe los nombres separados por comas. Opcionalmente puedes agregar su cargo entre paréntesis (por ejemplo: *Elena Morales (Operaciones), Carlos Mendoza (Seguridad), Ing. Marcos Valerio*).";
  }

  if (query.includes('modelo') || query.includes('motor') || query.includes('gemini') || query.includes('whisper')) {
    return "🧠 **Casilla: Modelo de IA / Motor**\n\n• **¿Para qué sirve?** Es el procesador inteligente que analiza el audio.\n• **¿Cómo se llena?** Viene preseleccionado con *Google Gemini 2.0 Flash*, que entiende audio nativo rápidamente. No necesitas cambiar nada a menos que desees experimentar con *Gemini 1.5 Pro* para reuniones muy extensas.";
  }

  if (query.includes('micrófono') || query.includes('microfono') || query.includes('grabar') || query.includes('grabación') || query.includes('ondas')) {
    return "🎙️ **Espacio: Micrófono en Vivo**\n\n• **¿Para qué sirve?** Te permite grabar reuniones presenciales en sala desde tu computadora o teléfono sin instalar programas externos.\n• **Pasos para usarlo:**\n  1. Presiona el botón rojo *'Iniciar Grabación'*.\n  2. El navegador te pedirá permiso de micrófono: haz clic en *Permitir*.\n  3. Verás el cronómetro avanzar y las ondas moverse al hablar.\n  4. Al terminar, presiona *'Finalizar y Guardar'* y listo.";
  }

  if (query.includes('subir') || query.includes('archivo') || query.includes('formato') || query.includes('mp3') || query.includes('mp4') || query.includes('drag')) {
    return "📁 **Espacio: Subir Archivo**\n\n• **¿Para qué sirve?** Para cuando ya tienes la reunión grabada previamente (por ejemplo en Zoom, Google Meet, Microsoft Teams o una nota de voz).\n• **¿Cómo se llena?** Arrastra el archivo al recuadro punteado o presiona *'Seleccionar archivo'*.\n• **Formatos aceptados:** MP3, WAV, M4A, OGG y archivos de video MP4 (el sistema extrae el sonido automáticamente).";
  }

  if (query.includes('generar') || query.includes('procesar') || query.includes('botón') || query.includes('boton')) {
    return "⚡ **Botón: Generar Minuta y Acuerdos con IA**\n\n• **¿Para qué sirve?** Es el disparador central. Toma el audio grabado o cargado, lo escucha de principio a fin, identifica quién habló y genera en pocos segundos el resumen ejecutivo, los temas con tiempos, los acuerdos y la tabla de tareas.";
  }

  if (query.includes('pdf') || query.includes('descargar') || query.includes('imprimir')) {
    return "📄 **Botón: Descargar PDF Formal**\n\n• **¿Para qué sirve?** Genera un documento PDF oficial con membrete corporativo, resumen ejecutivo, tabla de acuerdos y matriz de compromisos con espacio para firmas del moderador y asistentes, listo para archivar o imprimir.";
  }

  if (query.includes('tarea') || query.includes('compromiso') || query.includes('matriz') || query.includes('action item') || query.includes('checkbox') || query.includes('casilla')) {
    return "📋 **Espacio: Matriz de Compromisos (Action Items)**\n\n• **¿Para qué sirve?** Es la lista de tareas resultantes de la reunión. Cada tarea incluye su código (ej: *TAR-01*), qué debe hacerse, quién es el responsable y su fecha límite.\n• **¿Cómo se interactúa?** Puedes hacer clic en la casilla de verificación (checkbox) a la izquierda de cada tarea para marcarla como completada en tiempo real.";
  }

  if (query.includes('acuerdo') || query.includes('resolucion') || query.includes('decisión') || query.includes('decision')) {
    return "🤝 **Espacio: Acuerdos y Resoluciones**\n\n• **¿Para qué sirve?** Destaca las decisiones firmes aprobadas por el equipo (ej: *'Aprobada la migración de servidores para el sábado 26'*), clasificándolas por su impacto (Alto, Medio u Operativo).";
  }

  if (query.includes('correo') || query.includes('email') || query.includes('enviar')) {
    return "✉️ **Botón: Enviar por Correo**\n\n• **¿Para qué sirve?** Redacta automáticamente un correo electrónico con el resumen ejecutivo y los acuerdos para que puedas despacharlo inmediatamente a los asistentes de la reunión.";
  }

  if (query.includes('paso a paso') || query.includes('como empiezo') || query.includes('tutorial') || query.includes('ayuda')) {
    return "🧭 **Guía Rápida en 3 Pasos:**\n\n1. Escribe el *Título de la reunión* y quiénes asisten.\n2. Presiona *Iniciar Grabación* con tu micrófono o *Subir Archivo* con un audio que ya tengas.\n3. Presiona *Generar Minuta y Acuerdos con IA* y en segundos tendrás tu resumen, acuerdos y la opción de descargar el PDF.";
  }

  return "Entendido. En la pantalla dispones de: **Título** (nombre de la sesión), **Participantes** (asistentes convocados), **Micrófono en vivo** (para grabar en sala), **Subir archivo** (para audios MP3/M4A), **Generar Minuta** (botón de IA) y **Descargar PDF**.\n\n¿De cuál de estos elementos te gustaría que te dé más detalles de cómo se llena?";
}
