import { Resident, VisitorRecord, SystemBuilding, AuditLogItem, AnalyticsStats } from '../types';

/**
 * ALL MOCK DATA HAS BEEN REMOVED
 * 
 * CRITICAL FIX: This file previously contained:
 * - Hardcoded residents (Rajesh Sharma, Priya Patel, etc.)
 * - Fabricated visitor records with impossible data
 * - Sample OCR data for testing
 * 
 * REMOVAL REASON: Data hallucination - users could click "Use Sample" button
 * to inject fake visitor data that appeared to be OCR-detected
 * 
 * NEW APPROACH: All data now comes from:
 * 1. Real OCR processing via Google Gemini API
 * 2. Firebase Firestore (residents database)
 * 3. Real-time user input verification
 * 
 * See ROOT_CAUSE_ANALYSIS.md for complete details
 */

// Empty arrays - All data will come from Firebase Firestore at runtime
export const INITIAL_RESIDENTS: Resident[] = [];
export const INITIAL_VISITORS: VisitorRecord[] = [];
export const INITIAL_BUILDINGS: SystemBuilding[] = [];
export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];

export const INITIAL_ANALYTICS: AnalyticsStats = {
  totalVisitorsToday: 0,
  currentlyInside: 0,
  pendingApprovals: 0,
  rejectedVisitorsToday: 0,
  avgVerificationTimeSec: 0,
  peakHour: '10:00 AM',
  weeklyTrends: [],
  hourlyTraffic: [],
  purposeBreakdown: [],
};

/**
 * REMOVED: MOCK_SAMPLE_IDS array
 * Previously allowed users to inject fake OCR data via "Use Sample" button
 * This has been completely removed - no sample data injection allowed
 */
export const MOCK_SAMPLE_IDS: any[] = [];
