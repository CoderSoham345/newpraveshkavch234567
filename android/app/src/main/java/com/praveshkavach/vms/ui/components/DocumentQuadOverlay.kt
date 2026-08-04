package com.praveshkavach.vms.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke

@Composable
fun DocumentQuadOverlay(
    quad: List<Pair<Float, Float>>?,         // Normalized corner points (TL, TR, BR, BL)
    analysisSize: Size,                       // Upright analysis image size
    isConfidentAndStable: Boolean = false     // True when 4 corners confirmed & steady for ~1s
) {
    Canvas(modifier = Modifier.fillMaxSize()) {
        if (quad == null || quad.size != 4) return@Canvas
        val vW = size.width; val vH = size.height
        val aW = analysisSize.width; val aH = analysisSize.height

        // Center-crop mapping (PreviewView uses FILL_CENTER)
        val scale = maxOf(vW / aW, vH / aH)
        val offX = (vW - aW * scale) / 2
        val offY = (vH - aH * scale) / 2

        val strokeColor = if (isConfidentAndStable) Color(0xFF10B981) else Color(0xFFFFC800)
        val fillColor = if (isConfidentAndStable) Color(0x3310B981) else Color(0x33FFC800)

        val mappedPoints = quad.map { p ->
            val x = p.first * aW * scale + offX
            val y = p.second * aH * scale + offY
            Offset(x, y)
        }

        val path = Path().apply {
            mappedPoints.forEachIndexed { i, pt ->
                if (i == 0) moveTo(pt.x, pt.y) else lineTo(pt.x, pt.y)
            }
            close()
        }

        // 1. Draw Translucent Polygon Fill
        drawPath(path, fillColor)

        // 2. Draw Polygon Border Contour
        drawPath(path, strokeColor, style = Stroke(width = if (isConfidentAndStable) 10f else 6f))

        // 3. Draw Corner Reticle Circles
        mappedPoints.forEach { pt ->
            drawCircle(Color.White, radius = 10f, center = pt)
            drawCircle(strokeColor, radius = 18f, center = pt, style = Stroke(width = 4f))
        }
    }
}
