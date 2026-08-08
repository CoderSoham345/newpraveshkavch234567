/**
 * PraveshKavach™ Unified Enterprise Camera Service
 * Handles Camera Permissions, Native Android Capacitor Camera Bridge,
 * WebRTC MediaStream fallback, Lifecycle Management, and Diagnostics Logging.
 */

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { App } from '@capacitor/app';

export interface CameraPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  error?: string;
}

export interface CameraStreamOptions {
  facingMode: 'environment' | 'user';
}

export interface CameraInitResult {
  stream: MediaStream | null;
  error: string | null;
  permissionState: CameraPermissionState;
}

/**
 * Enterprise Camera Logger
 */
export function logCamera(message: string, ...args: any[]) {
  console.log(`[PraveshKavach][Camera] ${message}`, ...args);
}

/**
 * Detects current platform ('android' | 'ios' | 'web')
 */
export function getPlatform(): 'android' | 'ios' | 'web' {
  if (Capacitor.isNativePlatform()) {
    const platform = Capacitor.getPlatform();
    return platform === 'android' ? 'android' : platform === 'ios' ? 'ios' : 'web';
  }
  return 'web';
}

/**
 * Checks current camera permissions status without prompting the user.
 */
export async function checkCameraPermissions(): Promise<CameraPermissionState> {
  const platform = getPlatform();
  logCamera(`Checking camera permission (Platform: ${platform})`);

  if (Capacitor.isNativePlatform()) {
    try {
      const status = await Camera.checkPermissions();
      const state = status.camera;
      logCamera(`Capacitor checkPermissions result:`, state);

      if (state === 'granted') {
        logCamera(`Permission status: granted`);
        return { granted: true, denied: false, prompt: false };
      } else if (state === 'denied') {
        logCamera(`Permission status: denied`);
        return { granted: false, denied: true, prompt: false };
      } else {
        logCamera(`Permission status: prompt`);
        return { granted: false, denied: false, prompt: true };
      }
    } catch (err: any) {
      logCamera(`Capacitor checkPermissions error:`, err);
    }
  }

  // Web Browser Check
  if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
    try {
      const res = await navigator.permissions.query({ name: 'camera' as any });
      logCamera(`Web permissions query state:`, res.state);
      if (res.state === 'granted') {
        return { granted: true, denied: false, prompt: false };
      } else if (res.state === 'denied') {
        return { granted: false, denied: true, prompt: false };
      }
    } catch (e) {
      // Ignore non-standard web permission query errors
    }
  }

  return { granted: false, denied: false, prompt: true };
}

/**
 * Requests camera permission from Android OS / Capacitor or Web Browser.
 * On Android APK, triggers the REAL system camera permission dialog.
 */
let activeRequestPromise: Promise<CameraPermissionState> | null = null;

export async function requestCameraPermissions(): Promise<CameraPermissionState> {
  if (activeRequestPromise) {
    return activeRequestPromise;
  }

  activeRequestPromise = (async () => {
    const platform = getPlatform();
    logCamera(`Requesting camera permission (Platform: ${platform})`);

    // Check existing state first
    const current = await checkCameraPermissions();
    if (current.granted) {
      logCamera(`Camera permission already granted`);
      return current;
    }

    // Request Native Android / iOS system permission
    if (Capacitor.isNativePlatform()) {
      try {
        logCamera(`Triggering native Android camera permission dialog...`);
        const status = await Camera.requestPermissions({ permissions: ['camera'] });
        logCamera(`Native requestPermissions status:`, status.camera);

        if (status.camera === 'granted') {
          logCamera(`Camera permission granted`);
          return { granted: true, denied: false, prompt: false };
        } else {
          logCamera(`Permission status: denied`);
          return {
            granted: false,
            denied: true,
            prompt: false,
            error: 'Camera permission was denied in Android system dialog.',
          };
        }
      } catch (err: any) {
        logCamera(`Camera.requestPermissions error:`, err);
        return {
          granted: false,
          denied: true,
          prompt: false,
          error: err?.message || 'Failed to request camera permission via native bridge.',
        };
      }
    }

    // Web Browser Fallback Request via getUserMedia
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
        testStream.getTracks().forEach((track) => track.stop());
        logCamera(`Camera permission granted`);
        return { granted: true, denied: false, prompt: false };
      } catch (err: any) {
        logCamera(`Web getUserMedia permission error:`, err);
        return {
          granted: false,
          denied: true,
          prompt: false,
          error: err.name === 'NotAllowedError' ? 'Camera permission denied in browser.' : err.message,
        };
      }
    }

    return { granted: true, denied: false, prompt: false };
  })();

  try {
    return await activeRequestPromise;
  } finally {
    activeRequestPromise = null;
  }
}

/**
 * Opens system application settings for PraveshKavach.
 */
export async function openAppSettings(): Promise<void> {
  logCamera(`Opening system application settings...`);
  if (Capacitor.isNativePlatform()) {
    try {
      if (typeof (App as any).openSettings === 'function') {
        await (App as any).openSettings();
      } else if (typeof (App as any).openAppSettings === 'function') {
        await (App as any).openAppSettings();
      }
    } catch (err) {
      logCamera(`App openSettings error:`, err);
    }
  }
}

/**
 * Main Camera Initialization Pipeline:
 * 1. Log platform & open state
 * 2. Check permission
 * 3. Request permission if required
 * 4. Wait for permission
 * 5. If granted, initialize live camera feed with resilient constraint fallbacks
 */
export async function initializeDocumentCamera(options: CameraStreamOptions): Promise<CameraInitResult> {
  logCamera(`Scanner opened`);
  const platform = getPlatform();
  logCamera(`Platform: ${platform}`);

  logCamera(`Checking camera permission`);
  let perm = await checkCameraPermissions();

  if (!perm.granted) {
    logCamera(`Requesting camera permission`);
    perm = await requestCameraPermissions();
  }

  if (!perm.granted) {
    logCamera(`Permission status: denied`);
    return {
      stream: null,
      error: perm.error || 'Camera permission is required to scan identity documents.',
      permissionState: perm,
    };
  }

  logCamera(`Camera permission granted`);
  logCamera(`Initializing native camera`);

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    const error = 'MediaDevices API not supported on this device/browser.';
    logCamera(`Camera error: ${error}`);
    return {
      stream: null,
      error,
      permissionState: perm,
    };
  }

  // Resilient constraint waterfall
  const constraintsList = [
    {
      video: {
        facingMode: { ideal: options.facingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    },
    {
      video: {
        facingMode: { ideal: options.facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    },
    {
      video: {
        facingMode: { ideal: options.facingMode },
      },
      audio: false,
    },
    {
      video: true,
      audio: false,
    },
  ];

  let stream: MediaStream | null = null;
  let lastError: any = null;

  for (let i = 0; i < constraintsList.length; i++) {
    try {
      logCamera(`Attempting stream start with constraint level ${i + 1}`);
      stream = await navigator.mediaDevices.getUserMedia(constraintsList[i]);
      if (stream) {
        logCamera(`Camera initialized`);
        logCamera(`Document scanner started`);
        break;
      }
    } catch (err: any) {
      logCamera(`Constraint level ${i + 1} failed:`, err);
      lastError = err;
    }
  }

  if (!stream) {
    const errorMsg = lastError?.name === 'NotAllowedError'
      ? 'Camera stream access denied.'
      : lastError?.message || 'Failed to initialize camera video stream.';
    logCamera(`Camera error: ${errorMsg}`);
    return {
      stream: null,
      error: errorMsg,
      permissionState: perm,
    };
  }

  // Configure continuous focus if available
  try {
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
      const caps = videoTrack.getCapabilities() as any;
      if (caps.focusMode && Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
        await videoTrack.applyConstraints({
          advanced: [{ focusMode: 'continuous' }] as any,
        });
      }
    }
  } catch (e) {
    // Non-fatal constraint application error
  }

  return {
    stream,
    error: null,
    permissionState: perm,
  };
}

/**
 * Safely stops all tracks in a MediaStream
 */
export function stopCameraStream(stream: MediaStream | null): void {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      track.stop();
      logCamera(`Camera track stopped: ${track.label || track.kind}`);
    });
  } catch (err) {
    logCamera(`Error stopping camera track:`, err);
  }
}

/**
 * Captures a photo using the native Capacitor Camera picker if live WebRTC fails.
 */
export async function takeNativePhoto(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    logCamera(`Capture started via native photo picker`);
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    logCamera(`Capture successful`);
    return photo.dataUrl || null;
  } catch (err: any) {
    logCamera(`Native photo capture cancelled or failed:`, err);
    return null;
  }
}

/**
 * Registers Android app lifecycle resume listeners to re-check permissions and restart camera.
 */
export function registerAppResumeListener(onResume: () => void): () => void {
  if (Capacitor.isNativePlatform()) {
    try {
      const handle = App.addListener('appStateChange', (state) => {
        if (state.isActive) {
          logCamera(`App resumed from background. Re-checking camera...`);
          onResume();
        }
      });
      return () => {
        handle.then((h) => h.remove()).catch(() => {});
      };
    } catch (err) {
      logCamera(`App state listener setup error:`, err);
    }
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      logCamera(`Document page became visible. Re-checking camera...`);
      onResume();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
