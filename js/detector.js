// moved from index.html <script> block
(() => {
    'use strict';

    const PARAMETERS = {
        MIN_READ_TIME_SEC: 10,    // Mínimo 10 segundos para leer (antes 20s+)
        MAX_SCROLL_SPEED: 4000,   // Hasta 4000 px/s (permite impulsos rápidos con el pulgar)
        MAX_SPEED_STRIKES: 3,     // Da hasta 3 advertencias antes de marcar como bot
        MIN_MOUSE_EVENTS: 3,      // Exige al menos 3 toques/movimientos en la pantalla
        MIN_SCROLL_PAUSES: 1,     // Solo exige 1 pausa corta durante toda la lectura
        PAUSE_THRESHOLD_MS: 450   // Registra pausa si frena la pantalla 450 ms (menos de medio segundo)
    };

    let readingState = {
        active: false,
        startTime: 0,
        lastScrollTop: 0,
        lastScrollTime: 0,
        interactionEvents: 0,
        lastInteractionTime: 0,
        pausesCount: 0,
        speedStrikes: 0,
        isBotFlagged: false,
        botReason: '',
        challengeSolved: false,
        mathAnswer: null
    };

    let totalReads = parseInt(localStorage.getItem('totalReads')) || 0;
    let coinsMined = parseInt(localStorage.getItem('coinsMined')) || 0;
    let pauseTimer = null;

    // Elementos DOM
    const readArea = document.getElementById('readArea');
    const progressFill = document.getElementById('progressFill');
    const btnStart = document.getElementById('btnStartReading');
    const btnClaim = document.getElementById('btnClaimCoin');
    const messageDiv = document.getElementById('message');
    const totalReadsSpan = document.getElementById('totalReads');
    const coinsMinedSpan = document.getElementById('coinsMined');
    const avgTimeSpan = document.getElementById('avgTime');
    const challengeBox = document.getElementById('challengeBox');
    const challengeQuestion = document.getElementById('challengeQuestion');
    const challengeAnswer = document.getElementById('challengeAnswer');
    const btnVerifyChallenge = document.getElementById('btnVerifyChallenge');

    function updateStats() {
        totalReadsSpan.textContent = totalReads;
        coinsMinedSpan.textContent = coinsMined;
        const avg = totalReads > 0 ? (totalReads * 0.8).toFixed(1) : 0;
        avgTimeSpan.textContent = avg;
        localStorage.setItem('totalReads', totalReads);
        localStorage.setItem('coinsMined', coinsMined);
    }

    // Registrar interacciones físicas espaciadas (Throttling a 300ms)
    function registerHumanInteraction() {
        if (!readingState.active) return;
        const now = Date.now();
        if (now - readingState.lastInteractionTime > 300) {
            readingState.interactionEvents++;
            readingState.lastInteractionTime = now;
        }
    }

    window.addEventListener('mousemove', registerHumanInteraction);
    window.addEventListener('touchstart', registerHumanInteraction);
    window.addEventListener('touchmove', registerHumanInteraction);

    // Control de scroll y pausas
    readArea.addEventListener('scroll', () => {
        if (!readingState.active) return;

        const now = Date.now();
        const currentScrollTop = readArea.scrollTop;
        const deltaPx = Math.abs(currentScrollTop - readingState.lastScrollTop);
        const deltaTimeSec = (now - readingState.lastScrollTime) / 1000;

        // 1. Detección de velocidad inhumana (con tolerancia de hasta 3 advertencias)
        if (deltaTimeSec > 0) {
            const speed = deltaPx / deltaTimeSec;
            if (speed > PARAMETERS.MAX_SCROLL_SPEED) {
                readingState.speedStrikes++;
                if (readingState.speedStrikes >= PARAMETERS.MAX_SPEED_STRIKES) {
                    readingState.isBotFlagged = true;
                    readingState.botReason = 'Desplazamiento demasiado rápido o automatizado.';
                }
            }
        }

        // 2. Detección de pausas (Se activa después de PAUSE_THRESHOLD_MS de detener el scroll)
        clearTimeout(pauseTimer);
        pauseTimer = setTimeout(() => {
            if (readingState.active && !readingState.isBotFlagged) {
                readingState.pausesCount++;
            }
        }, PARAMETERS.PAUSE_THRESHOLD_MS);

        readingState.lastScrollTop = currentScrollTop;
        readingState.lastScrollTime = now;

        const maxScroll = readArea.scrollHeight - readArea.clientHeight;
        const scrollPercent = Math.min(100, (currentScrollTop / maxScroll) * 100);
        progressFill.style.width = `${scrollPercent}%`;

        if (scrollPercent >= 95) {
            checkHumanStatus();
        }
    });

    // Iniciar Lectura
    btnStart.addEventListener('click', () => {
        readingState = {
            active: true,
            startTime: Date.now(),
            lastScrollTop: readArea.scrollTop,
            lastScrollTime: Date.now(),
            interactionEvents: 0,
            lastInteractionTime: 0,
            pausesCount: 0,
            speedStrikes: 0,
            isBotFlagged: false,
            botReason: '',
            challengeSolved: false,
            mathAnswer: null
        };

        readArea.scrollTop = 0;
        progressFill.style.width = '0%';
        btnClaim.disabled = true;
        challengeBox.style.display = 'none';
        messageDiv.style.color = '#58a6ff';
        messageDiv.textContent = '📖 Lectura en curso. Desplázate a ritmo natural...';
    });

    // Evaluación final
    function checkHumanStatus() {
        if (!readingState.active) return;

        const elapsedTimeSec = (Date.now() - readingState.startTime) / 1000;

        if (elapsedTimeSec < PARAMETERS.MIN_READ_TIME_SEC) {
            readingState.isBotFlagged = true;
            readingState.botReason = `Lectura demasiado rápida (${elapsedTimeSec.toFixed(1)}s). Se requieren mínimo ${PARAMETERS.MIN_READ_TIME_SEC}s.`;
        }

        if (readingState.interactionEvents < PARAMETERS.MIN_MOUSE_EVENTS) {
            readingState.isBotFlagged = true;
            readingState.botReason = 'Falta de interacción táctil o biomecánica suficiente.';
        }

        if (readingState.pausesCount < PARAMETERS.MIN_SCROLL_PAUSES) {
            readingState.isBotFlagged = true;
            readingState.botReason = 'Faltaron pausas de lectura naturales durante el desplazamiento.';
        }

        if (readingState.isBotFlagged) {
            messageDiv.style.color = '#f85149';
            messageDiv.textContent = `🤖 Verificación Fallida: ${readingState.botReason}`;
            btnClaim.disabled = true;
        } else {
            triggerHumanChallenge();
        }
    }

    function triggerHumanChallenge() {
        if (readingState.challengeSolved) return;
        
        const n1 = Math.floor(Math.random() * 9) + 1;
        const n2 = Math.floor(Math.random() * 9) + 1;
        readingState.mathAnswer = n1 + n2;

        challengeQuestion.textContent = `💡 Confirma para reclamar: ¿Cuánto es ${n1} + ${n2}?`;
        challengeBox.style.display = 'block';
        messageDiv.textContent = '🔍 Resuelve la suma para desbloquear la recompensa.';
    }

    btnVerifyChallenge.addEventListener('click', () => {
        const userAns = parseInt(challengeAnswer.value);
        if (userAns === readingState.mathAnswer) {
            readingState.challengeSolved = true;
            challengeBox.style.display = 'none';
            btnClaim.disabled = false;
            messageDiv.style.color = '#3fb950';
            messageDiv.textContent = '✅ ¡Verificación humana completada! Haz clic en Reclamar.';
        } else {
            messageDiv.style.color = '#f85149';
            messageDiv.textContent = '❌ Respuesta incorrecta. Inténtalo de nuevo.';
        }
    });

    btnClaim.addEventListener('click', () => {
        if (!readingState.challengeSolved || readingState.isBotFlagged) return;

        coinsMined += 1;
        totalReads += 1;
        updateStats();

        readingState.active = false;
        btnClaim.disabled = true;
        messageDiv.style.color = '#58a6ff';
        messageDiv.textContent = '🎉 ¡Minado exitoso! Has recibido 1 $LER.';
        progressFill.style.width = '0%';
    });

    document.getElementById('btnContact').addEventListener('click', () => {
        alert('📩 Para patrocinios y campañas verificadas, escribe a: patrocinio@leercoin.com');
    });

    updateStats();
    messageDiv.textContent = '📚 Haz clic en "Empezar a leer" para iniciar el minado.';
})();
