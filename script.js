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
    let currentMode = 'continuous';
    let vibrationInterval = null;

    const patterns = {
        continuous: [10000],
        pulse: [100, 50, 100, 50, 100, 50, 100, 50],
        vortex: [200, 100, 150, 80, 100, 50, 50, 30, 20, 10, 50, 100],
        stand: [20, 50, 20, 50, 20, 50, 20, 50] // Micro-vibrations for stability
    };

    // Mode Selection Logic
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isActive) stopVibration();
            
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
        });
    });

    // Main Toggle Logic
    mainToggle.addEventListener('click', () => {
        if (!isActive) {
            startVibration();
        } else {
            stopVibration();
        }
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
        
        // Loop for patterns that are short
        if (currentMode !== 'continuous') {
            vibrationInterval = setInterval(executeVibration, 1000);
        }
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
        
        const pattern = patterns[currentMode];
        navigator.vibrate(pattern);
    }

    // Safety: Stop if tab is hidden
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && isActive) {
            stopVibration();
        }
    });
});
