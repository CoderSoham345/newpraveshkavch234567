import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export interface CameraPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  error?: string;
}

// Single-flight lock to prevent parallel promise conflicts
let pendingRequestPromise: Promise<CameraPermissionState> | null = null;

/**
 * Opens system app settings using Capacitor App API.
 */
export async function openAppSettings(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      if (typeof (App as any).openSettings === 'function') {
        await (App as any).openSettings();
      } else if (typeof (App as any).openAppSettings === 'function') {
        await (App as any).openAppSettings();
      }
      return;
    } catch (err) {
      console.warn('Capacitor App settings error:', err);
    }
  }
}

/**
 * Checks current camera permissions on native Android or Web without prompting user.
 */
export async function checkCameraPermissions(): Promise<CameraPermissionState> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await Camera.checkPermissions();
      const state = status.camera;
      if (state === 'granted') {
        return { granted: true, denied: false, prompt: false };
      } else if (state === 'denied') {
        return { granted: false, denied: true, prompt: false };
      } else {
        return { granted: false, denied: false, prompt: true };
      }
    } catch (err: any) {
      console.warn('Capacitor Camera.checkPermissions error:', err);
    }
  }

  // Web fallback check
  if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
    try {
      const res = await navigator.permissions.query({ name: 'camera' as any });
      if (res.state === 'granted') {
        return { granted: true, denied: false, prompt: false };
      } else if (res.state === 'denied') {
        return { granted: false, denied: true, prompt: false };
      }
    } catch (e) {
      // Ignore query errors in non-standard browsers
    }
  }

  return { granted: false, denied: false, prompt: true };
}

/**
 * Requests camera permission from Capacitor / Android OS or Web navigator.
 * Triggers native Android ActivityCompat permission dialog.
 */
export async function requestCameraPermissions(): Promise<CameraPermissionState> {
  if (pendingRequestPromise) {
    return pendingRequestPromise;
  }

  pendingRequestPromise = (async () => {
    try {
      // Check if already granted
      const current = await checkCameraPermissions();
      if (current.granted) {
        return current;
      }

      // Request native permission via Capacitor Camera plugin
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await Camera.requestPermissions({ permissions: ['camera'] });
          const cameraState = status.camera;

          if (cameraState === 'granted') {
            return { granted: true, denied: false, prompt: false };
          } else {
            return {
              granted: false,
              denied: true,
              prompt: false,
              error: 'Camera permission was denied in Android system dialog.',
            };
          }
        } catch (err: any) {
          console.error('Capacitor Camera.requestPermissions error:', err);
          return {
            granted: false,
            denied: true,
            prompt: false,
            error: err?.message || 'Failed to request camera permission via native bridge.',
          };
        }
      }

      // Web fallback
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((track) => track.stop());
          return { granted: true, denied: false, prompt: false };
        } catch (err: any) {
          return {
            granted: false,
            denied: true,
            prompt: false,
            error: err.name === 'NotAllowedError' ? 'Camera permission denied in browser settings.' : err.message,
          };
        }
      }

      return { granted: true, denied: false, prompt: false };
    } finally {
      pendingRequestPromise = null;
    }
  })();

  return pendingRequestPromise;
}

/**
 * Opens native camera UI directly using Capacitor Camera plugin.
 */
export async function takeNativePhoto(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    return photo.dataUrl || null;
  } catch (err) {
    console.warn('Capacitor Camera.getPhoto cancelled or failed:', err);
    return null;
  }
}
