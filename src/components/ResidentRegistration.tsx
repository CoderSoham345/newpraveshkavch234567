/**
 * ResidentRegistration Component for PraveshKavach™
 * Allows administrators to register residents and configure Telegram
 */

import React, { useState } from 'react';
import { Mail, Phone, Home, Upload, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { residentService, ResidentFormData } from '../services/residentService';

interface ResidentRegistrationProps {
  buildings: string[];
  onSuccess?: (residentId: string) => void;
  onError?: (error: string) => void;
}

export function ResidentRegistration({ buildings, onSuccess, onError }: ResidentRegistrationProps) {
  const [formData, setFormData] = useState<ResidentFormData>({
    name: '',
    mobile: '',
    email: '',
    building: buildings[0] || '',
    wing: '',
    flat: '',
    telegramChatId: '',
    emergencyContact: '',
    status: 'active',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setMessage(null);
    }
  };

  const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdProofFile(file);
      setMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const result = await residentService.createResident({
        ...formData,
        photoFile: photoFile || undefined,
        idProofFile: idProofFile || undefined,
      });

      if (result.success) {
        setMessage({ type: 'success', text: `Resident created: ${formData.name}` });
        // Reset form
        setFormData({
          name: '',
          mobile: '',
          email: '',
          building: buildings[0] || '',
          wing: '',
          flat: '',
          telegramChatId: '',
          emergencyContact: '',
          status: 'active',
        });
        setPhotoFile(null);
        setIdProofFile(null);
        
        if (onSuccess && result.residentId) {
          onSuccess(result.residentId);
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create resident' });
        if (onError) onError(result.error || 'Unknown error');
      }
    } catch (error) {
      const errorMsg = `${error}`;
      setMessage({ type: 'error', text: errorMsg });
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-slate-900/50 rounded-lg border border-slate-800">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Home className="w-5 h-5 text-cyan-400" />
          Register New Resident
        </h2>
        <p className="text-sm text-slate-400 mt-1">Add a resident to the system</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-900/20 border border-green-500/30 text-green-300' 
            : 'bg-red-900/20 border border-red-500/30 text-red-300'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Rajesh Sharma"
            required
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Building, Wing, Flat */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Building *</label>
            <select
              name="building"
              value={formData.building}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="">Select Building</option>
              {buildings.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Wing *</label>
            <input
              type="text"
              name="wing"
              value={formData.wing}
              onChange={handleInputChange}
              placeholder="A"
              required
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Flat *</label>
            <input
              type="text"
              name="flat"
              value={formData.flat}
              onChange={handleInputChange}
              placeholder="101"
              required
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Mobile & Email */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1">
              <Phone className="w-4 h-4" />
              Mobile *
            </label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              placeholder="9876543210"
              required
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="rajesh@example.com"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Telegram Chat ID */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Telegram Chat ID *
            <span className="text-xs text-slate-400 font-normal ml-2">(Message @userinfobot to get your Chat ID)</span>
          </label>
          <input
            type="text"
            name="telegramChatId"
            value={formData.telegramChatId}
            onChange={handleInputChange}
            placeholder="123456789"
            required
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <p className="text-xs text-slate-400 mt-1">This is where visitor approvals will be sent on Telegram</p>
        </div>

        {/* Emergency Contact */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Emergency Contact</label>
          <input
            type="text"
            name="emergencyContact"
            value={formData.emergencyContact}
            onChange={handleInputChange}
            placeholder="Name & Phone"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1">
            <Upload className="w-4 h-4" />
            Resident Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm file:bg-cyan-600/20 file:border-cyan-400 file:rounded file:px-3 file:py-1 file:text-cyan-400"
          />
          {photoFile && <p className="text-xs text-green-400 mt-1">✓ Photo selected</p>}
        </div>

        {/* ID Proof Upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1">
            <Upload className="w-4 h-4" />
            ID Proof (Aadhaar/PAN)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleIdProofChange}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm file:bg-cyan-600/20 file:border-cyan-400 file:rounded file:px-3 file:py-1 file:text-cyan-400"
          />
          {idProofFile && <p className="text-xs text-green-400 mt-1">✓ ID proof selected</p>}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 text-white font-semibold rounded transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Register Resident'
          )}
        </button>
      </form>
    </div>
  );
}
