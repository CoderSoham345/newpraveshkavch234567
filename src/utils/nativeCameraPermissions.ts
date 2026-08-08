/**
 * Native Camera & Permissions Utility
 * Delegating to PraveshKavach Unified Camera Service
 */

export {
  checkCameraPermissions,
  requestCameraPermissions,
  openAppSettings,
  initializeDocumentCamera,
  stopCameraStream,
  registerAppResumeListener,
  logCamera,
  getPlatform,
} from '../services/cameraService';

export type { 
  CameraPermissionState, 
  CameraStreamOptions, 
  CameraInitResult,
  CameraPermissionStatus 
} from '../services/cameraService';
