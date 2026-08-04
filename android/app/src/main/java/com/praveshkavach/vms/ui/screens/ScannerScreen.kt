package com.praveshkavach.vms.ui.screens

import android.os.Handler
import android.os.Looper
import android.util.Size as AndroidSize
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.praveshkavach.vms.ui.components.DocumentQuadOverlay
import com.praveshkavach.vms.util.DocumentDetector
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

@Composable
fun ScannerScreen(
    onCaptured: ((String) -> Unit)? = null
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var quad by remember { mutableStateOf<List<Pair<Float, Float>>?>(null) }
    var uprightSize by remember { mutableStateOf(Size(480f, 640f)) }
    val processing = remember { AtomicBoolean(false) }
    val mainHandler = remember { Handler(Looper.getMainLooper()) }
    var detectedFrameCount by remember { mutableStateOf(0) }

    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }
    val imageCapture = remember { ImageCapture.Builder().build() }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                val previewView = PreviewView(ctx)
                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)

                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()

                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                    val imageAnalysis = ImageAnalysis.Builder()
                        .setTargetResolution(AndroidSize(480, 640))
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()
                        .also { analysis ->
                            analysis.setAnalyzer(cameraExecutor) { imageProxy ->
                                if (processing.compareAndSet(false, true)) {
                                    val pts = DocumentDetector.detect(imageProxy)
                                    val rot = imageProxy.imageInfo.rotationDegrees
                                    val w = if (rot == 90 || rot == 270) imageProxy.height else imageProxy.width
                                    val h = if (rot == 90 || rot == 270) imageProxy.width else imageProxy.height

                                    mainHandler.post {
                                        quad = pts
                                        uprightSize = Size(w.toFloat(), h.toFloat())
                                        detectedFrameCount = if (pts != null) detectedFrameCount + 1 else 0
                                        processing.set(false)
                                    }
                                }
                                imageProxy.close()
                            }
                        }

                    try {
                        cameraProvider.unbindAll()
                        cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            CameraSelector.DEFAULT_BACK_CAMERA,
                            preview,
                            imageAnalysis,
                            imageCapture
                        )
                    } catch (exc: Exception) {
                        exc.printStackTrace()
                    }
                }, ContextCompat.getMainExecutor(ctx))

                previewView
            },
            modifier = Modifier.fillMaxSize()
        )

        // Dynamic quadrilateral overlay: Yellow while searching, Green when 4 corners confirmed & detected
        DocumentQuadOverlay(
            quad = quad,
            analysisSize = uprightSize,
            isConfidentAndStable = quad != null && quad!!.size == 4
        )
    }
}
