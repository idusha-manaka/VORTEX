document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash');
    const mainToggle = document.getElementById('mainToggle');
    const visualOrb = document.getElementById('visualOrb');
    const statusBadge = document.getElementById('statusBadge');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const btnText = mainToggle.querySelector('.btn-text');

    // Splash Screen Dismissal
    setTimeout(() => {
        splash.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }, 2500);

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Vortex Service Worker Registered'))
            .catch(err => console.error('SW Registration Failed:', err));
    }

    let isActive = false;
    let currentMode = 'walker';
    let walkerDirection = 'forward'; // default walker direction
    let vibrationInterval = null;

    // ─── TABLE WALKER PATTERNS ───────────────────────────────────────────────
    // Asymmetric bursts: Heavy-side vibration pushes phone in opposite direction.
    // Pattern = [vibrate_ms, pause_ms, ...]
    const walkerPatterns = {
        // Forward: stronger burst at start → momentum pushes phone forward
        forward:  [200, 20, 200, 20, 200, 20, 80, 80, 80, 80],
        // Backward: long pause first then burst → phone slides back
        backward: [80, 80, 80, 80, 200, 20, 200, 20, 200, 20],
        // Left: escalating short bursts biased asymmetrically
        left:     [300, 10, 50, 100, 300, 10, 50, 100, 300, 10],
        // Right: mirror of left
        right:    [50, 100, 300, 10, 50, 100, 300, 10, 50, 100],
        // Spin: alternating heavy/light to create rotational torque
        spin:     [200, 30, 80, 30, 200, 30, 80, 30, 200, 30, 80, 30],
    };

    const patterns = {
        // Walker uses walkerPatterns, so just a placeholder here
        walker: walkerPatterns.forward,

        // CYCLORAMIC MODE - Samsung A16 Optimized for Standing Rotation
        cycloramic: [
            150, 50, 100, 30, 150, 50, 80, 30,
            150, 50, 100, 30, 150, 50, 80, 30,
            150, 50, 100, 30, 150, 50, 80, 30,
            150, 50, 100, 30, 150, 50, 80, 30,
        ],
        continuous: [1000],
        pulse:      [100, 50, 100, 50, 100, 50, 100, 50],
        vortex:     [200, 100, 150, 80, 100, 50, 50, 30, 20, 10, 50, 100],
        turbo:      [500, 100, 10, 10, 10, 10, 500, 100, 10, 10, 10, 10],
        resonance:  [50, 50, 100, 100, 150, 150, 200, 200, 150, 150, 100, 100, 50, 50],
    };

    // ─── D-PAD CONTROLS ──────────────────────────────────────────────────────
    const dpadBtns = {
        up:    document.getElementById('dpad-up'),
        down:  document.getElementById('dpad-down'),
        left:  document.getElementById('dpad-left'),
        right: document.getElementById('dpad-right'),
        spin:  document.getElementById('dpad-spin'),
    };

    const directionMap = {
        up:    'forward',
        down:  'backward',
        left:  'left',
        right: 'right',
        spin:  'spin',
    };

    Object.entries(dpadBtns).forEach(([key, btn]) => {
        if (!btn) return;
        btn.addEventListener('click', () => {
            // Highlight selected direction
            Object.values(dpadBtns).forEach(b => b && b.classList.remove('dpad-active'));
            btn.classList.add('dpad-active');

            walkerDirection = directionMap[key];
            patterns.walker = walkerPatterns[walkerDirection];

            // If already running, restart with new pattern
            if (isActive) {
                navigator.vibrate(0);
                clearInterval(vibrationInterval);
                setTimeout(() => {
                    executeVibration();
                    vibrationInterval = setInterval(executeVibration, 1200);
                }, 100);
            }
        });
    });

    // ─── MODE SELECTION ───────────────────────────────────────────────────────
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isActive) stopVibration();

            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;

            // Show/hide instruction cards
            document.querySelector('.walker-panel').style.display          = currentMode === 'walker'     ? 'block' : 'none';
            document.querySelector('.cycloramic-instructions').style.display = currentMode === 'cycloramic' ? 'block' : 'none';
            document.querySelector('.general-instructions').style.display    = !['walker','cycloramic'].includes(currentMode) ? 'block' : 'none';
        });
    });

    // ─── MAIN TOGGLE ─────────────────────────────────────────────────────────
    mainToggle.addEventListener('click', () => {
        if (!isActive) startVibration();
        else stopVibration();
    });

    function startVibration() {
        if (!("vibrate" in navigator)) {
            alert("Vibration API not supported on this device/browser.");
            return;
        }

        isActive = true;
        mainToggle.classList.add('active');
        visualOrb.classList.add('active');
        statusBadge.textContent = 'VORTEX ACTIVE';
        btnText.textContent = 'HALT VORTEX';

        executeVibration();

        const loopInterval =
            currentMode === 'walker'     ? 1200 :
            currentMode === 'cycloramic' ? 1500 :
            currentMode === 'continuous' ? 1000 : 2000;

        vibrationInterval = setInterval(executeVibration, loopInterval);
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
        const pattern = currentMode === 'walker'
            ? walkerPatterns[walkerDirection]
            : patterns[currentMode];
        navigator.vibrate(pattern);
    }

    // Safety: Stop if tab is hidden
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && isActive) stopVibration();
    });
});
