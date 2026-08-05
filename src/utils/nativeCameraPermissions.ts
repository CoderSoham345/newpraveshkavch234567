import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CameraPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  error?: string;
}

// In-flight promise lock to prevent duplicate concurrent Capacitor permission requests
let pendingRequestPromise: Promise<CameraPermissionState> | null = null;

/**
 * Checks current camera permissions on native Android or Web without prompting user.
 */
export async function checkCameraPermissions(): Promise<CameraPermissionState> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await Camera.checkPermissions();
      if (status.camera === 'granted') {
        return { granted: true, denied: false, prompt: false };
      } else if (status.camera === 'denied') {
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
      // Ignore
    }
  }

  return { granted: false, denied: false, prompt: true };
}

/**
 * Requests camera permission from Capacitor / Android OS or Web navigator.
 * Deduplicates parallel calls to avoid duplicate OS permission dialog conflicts.
 */
export async function requestCameraPermissions(): Promise<CameraPermissionState> {
  if (pendingRequestPromise) {
    return pendingRequestPromise;
  }

  pendingRequestPromise = (async () => {
    try {
      // 1. Check if already granted first
      const current = await checkCameraPermissions();
      if (current.granted) {
        return current;
      }

      // 2. Request native permission on Android / iOS
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await Camera.requestPermissions({ permissions: ['camera'] });
          if (status.camera === 'granted') {
            return { granted: true, denied: false, prompt: false };
          } else {
            return {
              granted: false,
              denied: true,
              prompt: false,
              error: 'Camera permission denied in Android system dialog. Please grant camera permission in system settings.',
            };
          }
        } catch (err: any) {
          console.error('Capacitor Camera.requestPermissions error:', err);
          return {
            granted: false,
            denied: true,
            prompt: false,
            error: err?.message || 'Failed to request camera permission.',
          };
        }
      }

      // 3. Web request fallback
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
 * Fallback to capture a photo directly via Capacitor Native Camera plugin UI.
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
