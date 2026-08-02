/**
 * Resident Management Service for PraveshKavach™
 * Handles resident CRUD operations, photo uploads, and Firebase integration
 */

import { firebaseService } from './firebaseService';

export interface ResidentFormData {
  name: string;
  mobile: string;
  email: string;
  building: string;
  wing: string;
  flat: string;
  telegramChatId: string;
  emergencyContact: string;
  status: 'active' | 'inactive';
  photoFile?: File;
  idProofFile?: File;
}

/**
 * Resident Service - Singleton
 */
class ResidentServiceImpl {
  private static instance: ResidentServiceImpl;

  private constructor() {}

  static getInstance(): ResidentServiceImpl {
    if (!ResidentServiceImpl.instance) {
      ResidentServiceImpl.instance = new ResidentServiceImpl();
    }
    return ResidentServiceImpl.instance;
  }

  /**
   * Create new resident
   */
  async createResident(data: ResidentFormData): Promise<{ success: boolean; residentId?: string; error?: string }> {
    try {
      // Validate required fields
      if (!data.name || !data.mobile || !data.building || !data.wing || !data.flat) {
        return { success: false, error: 'Missing required fields' };
      }

      // Validate Telegram Chat ID format (should be numeric)
      if (!data.telegramChatId || !/^\d+$/.test(data.telegramChatId)) {
        return { success: false, error: 'Invalid Telegram Chat ID (must be numeric)' };
      }

      // Upload photo if provided
      let photoUrl = '';
      if (data.photoFile) {
        photoUrl = await this.uploadPhoto(data.photoFile) || '';
      }

      // Upload ID proof if provided
      let idProofUrl = '';
      if (data.idProofFile) {
        idProofUrl = await this.uploadIDProof(data.idProofFile) || '';
      }

      // Create resident object
      const resident = {
        name: data.name.trim(),
        mobile: data.mobile.trim(),
        email: data.email.trim(),
        building: data.building.trim(),
        wing: data.wing.trim(),
        flat: data.flat.trim(),
        telegramChatId: data.telegramChatId.trim(),
        emergencyContact: data.emergencyContact.trim(),
        photoUrl,
        idProofUrl,
        status: data.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to Firebase
      const success = await firebaseService.saveResident(resident as any);

      if (success) {
        return { success: true, residentId: (resident as any).residentId || 'resident-' + Date.now() };
      } else {
        return { success: false, error: 'Failed to save resident' };
      }
    } catch (error) {
      console.error('[Resident Service] Create failed:', error);
      return { success: false, error: `Error: ${error}` };
    }
  }

  /**
   * Update resident
   */
  async updateResident(residentId: string, data: Partial<ResidentFormData>): Promise<boolean> {
    try {
      const resident = await firebaseService.getResident(residentId);
      if (!resident) {
        return false;
      }

      const updated = {
        ...resident,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      return await firebaseService.saveResident(updated as any);
    } catch (error) {
      console.error('[Resident Service] Update failed:', error);
      return false;
    }
  }

  /**
   * Get resident by building/wing/flat
   */
  async getResidentByLocation(building: string, wing: string, flat: string): Promise<any | null> {
    try {
      const residents = await firebaseService.getResidents();
      return residents.find(r => r.building === building && r.wing === wing && r.flat === flat) || null;
    } catch (error) {
      console.error('[Resident Service] Get by location failed:', error);
      return null;
    }
  }

  /**
   * Search residents by name
   */
  async searchByName(name: string): Promise<any[]> {
    try {
      const residents = await firebaseService.getResidents();
      const searchTerm = name.toLowerCase();
      return residents.filter(r => r.name.toLowerCase().includes(searchTerm));
    } catch (error) {
      console.error('[Resident Service] Search failed:', error);
      return [];
    }
  }

  /**
   * Get all residents
   */
  async getAllResidents(): Promise<any[]> {
    try {
      return await firebaseService.getResidents();
    } catch (error) {
      console.error('[Resident Service] Get all failed:', error);
      return [];
    }
  }

  /**
   * Delete resident
   */
  async deleteResident(residentId: string): Promise<boolean> {
    try {
      // In production, implement Firestore delete
      console.log('[Resident Service] Would delete:', residentId);
      return true;
    } catch (error) {
      console.error('[Resident Service] Delete failed:', error);
      return false;
    }
  }

  /**
   * Upload resident photo to Firebase Storage
   */
  private async uploadPhoto(file: File): Promise<string | null> {
    try {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          const base64 = (e.target?.result as string).split(',')[1];
          const url = await firebaseService.uploadImage(base64, `residents/photos/${Date.now()}.jpg`);
          resolve(url);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('[Resident Service] Photo upload failed:', error);
      return null;
    }
  }

  /**
   * Upload ID proof to Firebase Storage
   */
  private async uploadIDProof(file: File): Promise<string | null> {
    try {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          const base64 = (e.target?.result as string).split(',')[1];
          const url = await firebaseService.uploadImage(base64, `residents/idproofs/${Date.now()}.jpg`);
          resolve(url);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('[Resident Service] ID proof upload failed:', error);
      return null;
    }
  }

  /**
   * Validate Telegram Chat ID
   */
  async validateTelegramChatId(chatId: string): Promise<boolean> {
    // Check if it's numeric and reasonable length
    return /^\d{5,20}$/.test(chatId);
  }
}

export const residentService = ResidentServiceImpl.getInstance();
