package com.vortex.rotator

import android.os.*
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import android.graphics.Color

class MainActivity : AppCompatActivity() {
    private lateinit var vibrator: Vibrator
    private var isActive = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Simple UI created programmatically for maximum reliability
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setBackgroundColor(Color.parseColor("#050505"))
        }

        val btnIgnite = Button(this).apply {
            text = "IGNITE VORTEX PRO"
            textSize = 20f
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#7000ff"))
            setPadding(50, 50, 50, 50)
        }

        val status = TextView(this).apply {
            text = "READY"
            setTextColor(Color.parseColor("#00f2ff"))
            textSize = 16f
            setPadding(0, 50, 0, 0)
        }

        layout.addView(btnIgnite)
        layout.addView(status)
        setContentView(layout)

        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = getSystemService(VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(VIBRATOR_SERVICE) as Vibrator
        }

        btnIgnite.setOnClickListener {
            if (!isActive) {
                startVortex()
                btnIgnite.text = "HALT VORTEX"
                btnIgnite.setBackgroundColor(Color.RED)
                status.text = "PRO VORTEX ACTIVE - 100% INTENSITY"
            } else {
                stopVortex()
                btnIgnite.text = "IGNITE VORTEX PRO"
                btnIgnite.setBackgroundColor(Color.parseColor("#7000ff"))
                status.text = "READY"
            }
            isActive = !isActive
        }
    }

    private fun startVortex() {
        // High-Torque Sweep Engine for Samsung A16
        val timings = longArrayOf(0, 10, 20, 10, 30, 10, 40, 10, 50, 100)
        val amplitudes = intArrayOf(0, 255, 0, 255, 0, 255, 0, 255, 0, 0)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val effect = VibrationEffect.createWaveform(timings, amplitudes, 0)
            vibrator.vibrate(effect)
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(timings, 0)
        }
    }

    private fun stopVortex() {
        vibrator.cancel()
    }
}
