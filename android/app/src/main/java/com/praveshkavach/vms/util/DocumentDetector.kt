package com.praveshkavach.vms.util

import androidx.camera.core.ImageProxy
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.core.MatOfPoint2f
import org.opencv.core.Point
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc

object DocumentDetector {
    init {
        try {
            System.loadLibrary("opencv_java4")
        } catch (e: Throwable) {
            // OpenCV dynamic library loading safety check
        }
    }

    private const val MAX_WORKING_WIDTH = 480.0  // Downscale for speed (10-15 fps)
    private const val MIN_AREA_RATIO = 0.12      // Card must cover at least 12% of frame

    fun detect(image: ImageProxy): List<Pair<Float, Float>>? {
        val gray = yPlaneToMat(image) ?: return null
        val upright = rotateToUpright(gray, image.imageInfo.rotationDegrees)

        // Downscale for performance
        val scale = minOf(1.0, MAX_WORKING_WIDTH / upright.cols())
        Imgproc.resize(upright, upright, Size(), scale, scale)

        val quad = findQuad(upright)
        val result = quad?.map {
            Pair((it.x / upright.cols()).toFloat(), (it.y / upright.rows()).toFloat())
        }

        upright.release()
        return result
    }

    // ---------- Internal helpers ----------
    private fun yPlaneToMat(image: ImageProxy): Mat? {
        return try {
            val plane = image.planes[0]
            val buffer = plane.buffer
            val rowStride = plane.rowStride
            val w = image.width
            val h = image.height
            val mat = Mat(h, w, CvType.CV_8UC1)

            if (rowStride == w) {
                val bytes = ByteArray(buffer.remaining())
                buffer.get(bytes)
                mat.put(0, 0, bytes)
            } else {
                val row = ByteArray(w)
                for (r in 0 until h) {
                    buffer.position(r * rowStride)
                    buffer.get(row, 0, w)
                    mat.put(r, 0, row)
                }
            }
            mat
        } catch (e: Exception) {
            null
        }
    }

    private fun rotateToUpright(src: Mat, degrees: Int): Mat {
        val out = Mat()
        when (degrees) {
            90  -> Core.rotate(src, out, Core.ROTATE_90_CLOCKWISE)
            180 -> Core.rotate(src, out, Core.ROTATE_180)
            270 -> Core.rotate(src, out, Core.ROTATE_90_COUNTERCLOCKWISE)
            else -> src.copyTo(out)
        }
        src.release()
        return out
    }

    private fun findQuad(mat: Mat): Array<Point>? {
        val blurred = Mat(); Imgproc.GaussianBlur(mat, blurred, Size(5.0, 5.0), 0.0)
        val edges = Mat();   Imgproc.Canny(blurred, edges, 75.0, 200.0)
        val closed = Mat();  Imgproc.dilate(
            edges, closed,
            Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(3.0, 3.0))
        )

        val contours = ArrayList<MatOfPoint>()
        val hierarchy = Mat()
        Imgproc.findContours(closed, contours, hierarchy,
            Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE)

        val imgArea = mat.rows() * mat.cols().toDouble()
        var result: Array<Point>? = null

        for (contour in contours.sortedByDescending { Imgproc.contourArea(it) }) {
            val curve = MatOfPoint2f(*contour.toArray())
            val peri = Imgproc.arcLength(curve, true)
            val approx = MatOfPoint2f()
            Imgproc.approxPolyDP(curve, approx, 0.02 * peri, true)

            if (approx.rows() == 4 && Imgproc.contourArea(approx) > MIN_AREA_RATIO * imgArea) {
                result = orderPoints(approx.toArray())
                approx.release(); curve.release()
                break
            }
            approx.release(); curve.release()
        }

        blurred.release(); edges.release(); closed.release(); hierarchy.release()
        return result
    }

    private fun orderPoints(pts: Array<Point>): Array<Point> {
        val tl = pts.minByOrNull { it.x + it.y }!!
        val br = pts.maxByOrNull { it.x + it.y }!!
        val tr = pts.minByOrNull { it.y - it.x }!!
        val bl = pts.maxByOrNull { it.y - it.x }!!
        return arrayOf(tl, tr, br, bl)
    }
}
