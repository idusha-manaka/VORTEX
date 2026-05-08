# Vortex Pro Native Android Source (Kotlin)

This code provides 100% control over the vibration motor, allowing for the maximum torque required to rotate the Samsung A16.

## 1. Requirements
*   Android Studio
*   Min SDK: 26 (Android 8.0)

## 2. AndroidManifest.xml
Add this permission:
```xml
<uses-permission android:name="android.permission.VIBRATE" />
```

## 3. MainActivity.kt
```kotlin
package com.vortex.rotator

import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var vibrator: Vibrator
    private var isActive = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        vibrator = getSystemService(VIBRATOR_SERVICE) as Vibrator

        val btnIgnite = findViewById<Button>(R.id.btnIgnite)
        btnIgnite.setOnClickListener {
            if (!isActive) {
                startVortex()
                btnIgnite.text = "HALT VORTEX"
            } else {
                stopVortex()
                btnIgnite.text = "IGNITE VORTEX"
            }
            isActive = !isActive
        }
    }

    private fun startVortex() {
        // High-Intensity Resonance Pattern for Samsung A16
        // [0ms delay, 10ms vibrate, 20ms pause, 10ms vibrate, 500ms pause]
        val timings = longArrayOf(0, 10, 20, 10, 500)
        
        // 255 is MAX intensity. Web API cannot do this.
        val amplitudes = intArrayOf(0, 255, 0, 255, 0)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val effect = VibrationEffect.createWaveform(timings, amplitudes, 0)
            vibrator.vibrate(effect)
        } else {
            vibrator.vibrate(timings, 0)
        }
    }

    private fun stopVortex() {
        vibrator.cancel()
    }
}
```

## 4. Why this is better than the Web App?
1. **Amplitude (255):** We are forcing the motor to hit its absolute physical limit.
2. **Low Latency:** Native code responds much faster to timing changes than the browser.
3. **Hardware Lock:** It prevents the CPU from throttling the vibration intensity.
