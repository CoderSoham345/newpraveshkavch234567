/**
 * PraveshKavach™ Unified Enterprise Camera Service
 * Powered strictly by Web MediaDevices API (navigator.mediaDevices.getUserMedia)
 * No dependency on @capacitor/camera
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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

export type CameraPermissionStatus = 
  | 'CHECKING_PERMISSION'
  | 'REQUESTING_PERMISSION'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_DENIED'
  | 'CAMERA_STARTING'
  | 'CAMERA_ACTIVE'
  | 'CAMERA_ERROR'
  | 'CAPTURED'
  | 'CAMERA_STOPPED';

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
  logCamera(`Checking camera permission`);

  if (Capacitor.isNativePlatform()) {
    try {
      const capPerm = await Camera.checkPermissions();
      logCamera(`Capacitor native camera permission check:`, capPerm);
      if (capPerm.camera === 'granted') {
        return { granted: true, denied: false, prompt: false };
      } else if (capPerm.camera === 'denied') {
        return { granted: false, denied: true, prompt: false };
      }
    } catch (e) {
      logCamera(`Capacitor checkPermissions exception:`, e);
    }
  }

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
 * Requests camera permission via Capacitor Camera plugin and getUserMedia.
 * In Capacitor Android WebView, this triggers the native Android runtime permission dialog.
 */
let activeRequestPromise: Promise<CameraPermissionState> | null = null;

export async function requestCameraPermissions(): Promise<CameraPermissionState> {
  if (activeRequestPromise) {
    return activeRequestPromise;
  }

  activeRequestPromise = (async () => {
    logCamera(`Requesting camera permission...`);

    if (Capacitor.isNativePlatform()) {
      try {
        const capReq = await Camera.requestPermissions({ permissions: ['camera'] });
        logCamera(`Capacitor requestPermissions result:`, capReq);
        if (capReq.camera === 'granted') {
          return { granted: true, denied: false, prompt: false };
        } else if (capReq.camera === 'denied') {
          return {
            granted: false,
            denied: true,
            prompt: false,
            error: 'Camera permission was denied. Please allow camera access in Android system settings.',
          };
        }
      } catch (e) {
        logCamera(`Capacitor requestPermissions error:`, e);
      }
    }

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        testStream.getTracks().forEach((track) => track.stop());
        logCamera(`getUserMedia camera permission granted`);
        return { granted: true, denied: false, prompt: false };
      } catch (err: any) {
        logCamera(`getUserMedia permission error:`, err);
        return {
          granted: false,
          denied: true,
          prompt: false,
          error: err.name === 'NotAllowedError'
            ? 'PraveshKavach needs camera access to scan the visitor\'s identity document.'
            : err.message || 'Camera permission denied.',
        };
      }
    }

    return {
      granted: false,
      denied: true,
      prompt: false,
      error: 'MediaDevices API is not supported on this browser or platform.',
    };
  })();

  try {
    return await activeRequestPromise;
  } finally {
    activeRequestPromise = null;
  }
}

/**
 * Native Camera Photo Fallback via @capacitor/camera
 */
export async function takeNativePhoto(): Promise<string | null> {
  logCamera(`Taking native camera photo via Capacitor Camera plugin...`);
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    return image.dataUrl || null;
  } catch (err) {
    logCamera(`Native camera getPhoto error:`, err);
    return null;
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
 * Prefers rear/world-facing camera (facingMode: { ideal: 'environment' })
 * Resolution: 1920x1080 ideal
 */
export async function initializeDocumentCamera(options: CameraStreamOptions): Promise<CameraInitResult> {
  logCamera(`Initializing document camera stream...`);
  const facing = options.facingMode || 'environment';

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    const error = 'MediaDevices API not supported on this device or WebView.';
    logCamera(`Camera error: ${error}`);
    return {
      stream: null,
      error,
      permissionState: { granted: false, denied: true, prompt: false, error },
    };
  }

  // Resilient constraint waterfall
  const constraintsList = [
    {
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    },
    {
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    },
    {
      video: {
        facingMode: { ideal: facing },
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
      logCamera(`Attempting camera stream level ${i + 1}`);
      stream = await navigator.mediaDevices.getUserMedia(constraintsList[i]);
      if (stream) {
        logCamera(`Live camera stream initialized successfully`);
        break;
      }
    } catch (err: any) {
      logCamera(`Constraint level ${i + 1} failed:`, err);
      lastError = err;
    }
  }

  if (!stream) {
    const errorMsg = lastError?.name === 'NotAllowedError'
      ? 'PraveshKavach needs camera access to scan the visitor\'s identity document.'
      : lastError?.message || 'Failed to initialize camera stream.';
    
    return {
      stream: null,
      error: errorMsg,
      permissionState: {
        granted: false,
        denied: lastError?.name === 'NotAllowedError',
        prompt: lastError?.name !== 'NotAllowedError',
        error: errorMsg,
      },
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
    // Non-fatal
  }

  return {
    stream,
    error: null,
    permissionState: { granted: true, denied: false, prompt: false },
  };
}

/**
 * Safely stops all tracks in a MediaStream
 */
export function stopCameraStream(stream: MediaStream | null): void {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      track.enabled = false;
      track.stop();
      logCamera(`Stopped & disabled camera track: ${track.label || track.kind}`);
    });
  } catch (err) {
    logCamera(`Error stopping camera track:`, err);
  }
}

/**
 * Registers app resume listener to re-check permissions / restart camera.
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
      logCamera(`Page became visible. Re-checking camera...`);
      onResume();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
