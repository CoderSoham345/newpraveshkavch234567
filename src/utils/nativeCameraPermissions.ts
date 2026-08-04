import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface CameraPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  error?: string;
}

/**
 * Checks current camera permissions on native Android or Web.
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
 */
export async function requestCameraPermissions(): Promise<CameraPermissionState> {
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
          error: 'Camera permission denied in Android system dialog.',
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

  // Web request fallback
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
}
