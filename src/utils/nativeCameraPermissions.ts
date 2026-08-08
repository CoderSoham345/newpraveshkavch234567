/**
 * Native Camera & Permissions Utility
 * Delegating to PraveshKavach Unified Camera Service
 */

export {
  checkCameraPermissions,
  requestCameraPermissions,
  openAppSettings,
  takeNativePhoto,
  initializeDocumentCamera,
  stopCameraStream,
  registerAppResumeListener,
  logCamera,
  getPlatform,
} from '../services/cameraService';

export type { CameraPermissionState, CameraStreamOptions, CameraInitResult } from '../services/cameraService';
