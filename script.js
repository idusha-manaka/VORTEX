document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash');
    const mainToggle = document.getElementById('mainToggle');
    const visualOrb = document.getElementById('visualOrb');
    const statusBadge = document.getElementById('statusBadge');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const btnText = mainToggle.querySelector('.btn-text');

    setTimeout(() => {
        splash.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }, 2500);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
            console.log('Vortex SW Registered');

            // Check for new SW waiting
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version is ready → show toast
                        showUpdateToast();
                    }
                });
            });
        }).catch(err => console.error('SW Error:', err));

        // When SW activates new version, reload the page
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) { refreshing = true; window.location.reload(); }
        });
    }

    function showUpdateToast() {
        const toast = document.createElement('div');
        toast.id = 'update-toast';
        toast.innerHTML = `
            <span>🚀 New version available!</span>
            <button id="update-now-btn">UPDATE NOW</button>
        `;
        document.body.appendChild(toast);

        document.getElementById('update-now-btn').addEventListener('click', () => {
            navigator.serviceWorker.controller?.postMessage('SKIP_WAITING');
            toast.remove();
        });

        // Auto-dismiss after 10 seconds
        setTimeout(() => toast?.remove(), 10000);
    }

    let isActive = false;
    let currentMode = 'tilespin';
    let walkerDirection = 'forward';
    let massageType = 'neck';
    let vibrationInterval = null;
    let tilespinDirection = 'left'; // 'left' = CCW, 'right' = CW

    // ── MASSAGE PATTERNS ──────────────────────────────────────────────────────
    const massagePatterns = {
        // Neck Wave: Gentle rolling waves - feels like kneading
        neck:       [100, 50, 150, 50, 200, 100, 150, 50, 100, 50, 80, 100],
        // Deep Shoulder: Strong slow pulses - deep tissue feel
        shoulder:   [500, 200, 500, 200, 500, 200, 300, 300, 500, 200],
        // Hand Pulse: Rapid light taps - finger/palm stimulation
        hand:       [50, 30, 50, 30, 50, 30, 50, 80, 50, 30, 50, 30],
        // ASMR Tingle: Ultra-gentle micro-vibrations
        asmr:       [20, 80, 20, 80, 20, 150, 20, 80, 20, 80, 20, 300],
        // Deep Relax: Slow rhythmic waves, increasing then decreasing
        relax:      [200, 200, 300, 200, 400, 200, 500, 200, 400, 200, 300, 200, 200, 400],
        // Heartbeat: Two-beat rhythm like a real heart
        heartbeat:  [80, 80, 150, 500, 80, 80, 150, 500, 80, 80, 150, 500],
    };

    // ── TILE SPIN PATTERNS ────────────────────────────────────────────────────
    // LEFT (CCW) — long burst, short gap → motor pulls left
    const tilespinPatternLeft = [
        400, 25, 400, 25, 350, 20,
        400, 25, 350, 20, 400, 25,
        300, 20, 400, 25,
    ];
    // RIGHT (CW) — Resonance Sweep Pattern
    // Uses a mix of frequencies to find the drift-point of the hardware.
    const tilespinPatternRight = [
        10, 20, 10, 20, 10, 20, 30, 50,  // High frequency micro-taps
        40, 10, 40, 10, 40, 10, 100, 50, // Medium "kick" pulses
        15, 15, 15, 15, 15, 15, 80, 20,  // Sharp staccato
        200, 100, 10, 10, 10, 10         // Decelerating burst
    ];
    const tilespinPattern = tilespinPatternLeft; // default

    // ── WALKER PATTERNS ───────────────────────────────────────────────────────
    const walkerPatterns = {
        forward:  [200, 20, 200, 20, 200, 20, 80, 80, 80, 80],
        backward: [80, 80, 80, 80, 200, 20, 200, 20, 200, 20],
        left:     [300, 10, 50, 100, 300, 10, 50, 100, 300, 10],
        right:    [50, 100, 300, 10, 50, 100, 300, 10, 50, 100],
        spin:     [200, 30, 80, 30, 200, 30, 80, 30, 200, 30, 80, 30],
    };

    const patterns = {
        tilespin:  tilespinPatternLeft,
        massage:   massagePatterns.neck,
        walker:    walkerPatterns.forward,
        cycloramic:[150,50,100,30,150,50,80,30,150,50,100,30,150,50,80,30,
                    150,50,100,30,150,50,80,30,150,50,100,30,150,50,80,30],
        continuous:[1000],
        pulse:     [100,50,100,50,100,50,100,50],
        vortex:    [200,100,150,80,100,50,50,30,20,10,50,100],
        turbo:     [500,100,10,10,10,10,500,100,10,10,10,10],
        resonance: [50,50,100,100,150,150,200,200,150,150,100,100,50,50],
        calibration: [10, 100, 20, 100, 30, 100, 40, 100, 50, 100, 60, 100, 70, 100, 80, 100]
    };

    // ── DIRECTION TOGGLE (TILE SPIN) ──────────────────────────────────────────
    const dirBtns = document.querySelectorAll('.dir-btn');
    const spinHint = document.getElementById('spinHint');
    dirBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            dirBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tilespinDirection = btn.dataset.dir;
            patterns.tilespin = tilespinDirection === 'right' ? tilespinPatternRight : tilespinPatternLeft;

            if (spinHint) {
                spinHint.textContent = tilespinDirection === 'right'
                    ? '💡 Phone naturally goes RIGHT? Perfect! This mode amplifies that.'
                    : '💡 Phone naturally goes LEFT? Perfect! This mode amplifies that.';
            }

            if (isActive && currentMode === 'tilespin') {
                navigator.vibrate(0);
                clearInterval(vibrationInterval);
                setTimeout(() => {
                    executeVibration();
                    vibrationInterval = setInterval(executeVibration, 2500);
                }, 100);
            }
        });
    });

    // ── MASSAGE SUB-BUTTONS ───────────────────────────────────────────────────
    const massageBtns = document.querySelectorAll('.massage-btn');
    massageBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            massageBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            massageType = btn.dataset.massage;
            patterns.massage = massagePatterns[massageType];

            // Update status badge label
            const labels = {
                neck:'🌊 NECK WAVE', shoulder:'💪 DEEP SHOULDER',
                hand:'✋ HAND PULSE', asmr:'✨ ASMR', relax:'😌 RELAX', heartbeat:'❤️ HEARTBEAT'
            };
            if (isActive) {
                statusBadge.textContent = labels[massageType] || 'MASSAGE ACTIVE';
                navigator.vibrate(0);
                clearInterval(vibrationInterval);
                setTimeout(() => {
                    executeVibration();
                    vibrationInterval = setInterval(executeVibration, getMassageLoop());
                }, 100);
            }
        });
    });

    function getMassageLoop() {
        const loops = { neck:1500, shoulder:3000, hand:800, asmr:2000, relax:4000, heartbeat:2500 };
        return loops[massageType] || 2000;
    }

    // ── D-PAD CONTROLS ────────────────────────────────────────────────────────
    const dpadBtns = {
        up:    document.getElementById('dpad-up'),
        down:  document.getElementById('dpad-down'),
        left:  document.getElementById('dpad-left'),
        right: document.getElementById('dpad-right'),
        spin:  document.getElementById('dpad-spin'),
    };
    const directionMap = { up:'forward', down:'backward', left:'left', right:'right', spin:'spin' };

    Object.entries(dpadBtns).forEach(([key, btn]) => {
        if (!btn) return;
        btn.addEventListener('click', () => {
            Object.values(dpadBtns).forEach(b => b && b.classList.remove('dpad-active'));
            btn.classList.add('dpad-active');
            walkerDirection = directionMap[key];
            patterns.walker = walkerPatterns[walkerDirection];
            if (isActive) {
                navigator.vibrate(0);
                clearInterval(vibrationInterval);
                setTimeout(() => { executeVibration(); vibrationInterval = setInterval(executeVibration, 1200); }, 100);
            }
        });
    });

    // ── MODE SELECTION ────────────────────────────────────────────────────────
    const cardMap = {
        tilespin:   '.tilespin-instructions',
        massage:    '.massage-panel',
        walker:     '.walker-panel',
        cycloramic: '.cycloramic-instructions',
    };

    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isActive) stopVibration();
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;

            // Hide all cards
            document.querySelectorAll('.info-card').forEach(c => c.style.display = 'none');
            // Show relevant card
            const selector = cardMap[currentMode] || '.general-instructions';
            const card = document.querySelector(selector);
            if (card) card.style.display = 'block';
        });
    });

    // ── MAIN TOGGLE ───────────────────────────────────────────────────────────
    mainToggle.addEventListener('click', () => {
        if (!isActive) startVibration();
        else stopVibration();
    });

    function getLoopInterval() {
        if (currentMode === 'massage')    return getMassageLoop();
        if (currentMode === 'tilespin')   return 2500;
        if (currentMode === 'walker')     return 1200;
        if (currentMode === 'cycloramic') return 1500;
        if (currentMode === 'continuous') return 1000;
        if (currentMode === 'calibration') return 2000;
        return 2000;
    }

    function getMassageStatusLabel() {
        const labels = {
            neck:'🌊 NECK WAVE', shoulder:'💪 SHOULDER', hand:'✋ HAND PULSE',
            asmr:'✨ ASMR MODE', relax:'😌 DEEP RELAX', heartbeat:'❤️ HEARTBEAT'
        };
        return labels[massageType] || 'MASSAGE ACTIVE';
    }

    function startVibration() {
        if (!("vibrate" in navigator)) {
            alert("Vibration API not supported on this device/browser.");
            return;
        }
        isActive = true;
        mainToggle.classList.add('active');
        visualOrb.classList.add('active');
        statusBadge.textContent = currentMode === 'massage' ? getMassageStatusLabel() : 'VORTEX ACTIVE';
        btnText.textContent = 'HALT VORTEX';

        executeVibration();
        vibrationInterval = setInterval(executeVibration, getLoopInterval());
    }

    function stopVibration() {
        isActive = false;
        navigator.vibrate(0);
        if (vibrationInterval) clearInterval(vibrationInterval);
        mainToggle.classList.remove('active');
        visualOrb.classList.remove('active');
        statusBadge.textContent = 'READY';
        btnText.textContent = 'IGNITE VORTEX';
    }

    function executeVibration() {
        if (!isActive) return;
        let pattern;
        if (currentMode === 'walker')   pattern = walkerPatterns[walkerDirection];
        else if (currentMode === 'massage') pattern = massagePatterns[massageType];
        else pattern = patterns[currentMode];
        navigator.vibrate(pattern);
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden && isActive) stopVibration();
    });
});
