/**
 * Telegram Service - Handles all Telegram Bot API interactions
 * 
 * CRITICAL WORKFLOW FIX:
 * - Approval messages go to RESIDENT (not security guard)
 * - Resident approves/rejects entry via inline buttons
 * - Tablet receives real-time status updates via Firebase
 */

import { ExtractedDocData, FaceVerificationData } from '../types';

export interface TelegramApprovalMessage {
  visitorId: string;
  visitorName: string;
  visitorPhoto: string; // Base64
  aadhaarPhoto: string; // Base64
  aadhaarNumber: string;
  dob: string;
  age: string;
  gender: string;
  address: string;
  pinCode: string;
  purpose: string;
  building: string;
  wing: string;
  flat: string;
  visitorTime: string;
  securityGuardName: string;
  gateNumber: string;
  residentChatId: string; // CRITICAL: Send to resident, not guard
  residentName: string;
  faceVerificationScore: number;
}

export interface TelegramApprovalResponse {
  success: boolean;
  visitorId: string;
  residentId: string;
  approvalStatus: 'approved' | 'rejected' | 'pending';
  telegramMessageId?: string;
  message: string;
}

class TelegramService {
  private botToken: string;
  private apiBaseUrl = 'https://api.telegram.org';

  constructor() {
    this.botToken = import.meta.env.VITE_BOT_TOKEN || process.env.BOT_TOKEN || '';
  }

  /**
   * Verify Telegram Bot Connection
   */
  async verifyBotConnection(): Promise<boolean> {
    try {
      if (!this.botToken) {
        console.warn('Telegram Bot Token not configured');
        return false;
      }

      const response = await fetch(`${this.apiBaseUrl}/bot${this.botToken}/getMe`);
      const data = await response.json();
      return data.ok === true;
    } catch (error) {
      console.error('Telegram connection verification failed:', error);
      return false;
    }
  }

  /**
   * Send Visitor Approval Request to RESIDENT (CRITICAL FIX)
   * 
   * Sends detailed visitor info with photo and inline approval buttons
   * Message goes to resident's Telegram chat ID, NOT to security guard
   */
  async sendApprovalRequestToResident(approval: TelegramApprovalMessage): Promise<TelegramApprovalResponse> {
    try {
      if (!this.botToken) {
        return {
          success: false,
          visitorId: approval.visitorId,
          residentId: approval.residentChatId,
          approvalStatus: 'pending',
          message: 'Telegram Bot not configured',
        };
      }

      // Validate resident chat ID
      if (!approval.residentChatId || approval.residentChatId === 'default') {
        return {
          success: false,
          visitorId: approval.visitorId,
          residentId: approval.residentChatId,
          approvalStatus: 'pending',
          message: 'Resident Telegram Chat ID not found',
        };
      }

      // Build message text with all visitor information
      const messageText = `
🔔 *VISITOR APPROVAL REQUEST*

👤 *Visitor Name:* ${approval.visitorName}
🎂 *Date of Birth:* ${approval.dob}
📊 *Age:* ${approval.age}
👨 *Gender:* ${approval.gender}
📞 *Purpose:* ${approval.purpose}
🏢 *Building:* ${approval.building}
🔑 *Unit:* ${approval.wing}-${approval.flat}
📍 *Address:* ${approval.address}
📮 *PIN Code:* ${approval.pinCode}
🪪 *Aadhaar:* ${approval.aadhaarNumber}

⏰ *Arrival Time:* ${approval.visitorTime}
🚪 *Gate:* ${approval.gateNumber}
👮 *Security Guard:* ${approval.securityGuardName}

🤖 *Face Match Score:* ${approval.faceVerificationScore}%

*Please review and approve or reject this visitor entry.*
`;

      // Create inline buttons for approval/rejection
      const inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '✅ Approve Entry', callback_data: `approve_${approval.visitorId}` },
            { text: '❌ Reject Entry', callback_data: `reject_${approval.visitorId}` },
          ],
          [{ text: '📄 View Complete Details', callback_data: `details_${approval.visitorId}` }],
          [{ text: '📞 Call Security', callback_data: `call_security_${approval.visitorId}` }],
        ],
      };

      // Send message with photos (if available)
      let messageId: string | undefined;

      // Send visitor photo first
      if (approval.visitorPhoto) {
        try {
          const photoResponse = await this.sendPhoto(
            approval.residentChatId,
            approval.visitorPhoto,
            `Visitor Photo: ${approval.visitorName}`
          );
          console.log('[Telegram] Visitor photo sent');
        } catch (e) {
          console.warn('[Telegram] Failed to send visitor photo:', e);
        }
      }

      // Send Aadhaar photo
      if (approval.aadhaarPhoto) {
        try {
          const aadhaarResponse = await this.sendPhoto(
            approval.residentChatId,
            approval.aadhaarPhoto,
            `Aadhaar Document`
          );
          console.log('[Telegram] Aadhaar photo sent');
        } catch (e) {
          console.warn('[Telegram] Failed to send Aadhaar photo:', e);
        }
      }

      // Send approval request message with buttons
      const response = await fetch(`${this.apiBaseUrl}/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: approval.residentChatId,
          text: messageText,
          parse_mode: 'Markdown',
          reply_markup: inlineKeyboard,
        }),
      });

      const data = await response.json();

      if (data.ok && data.result) {
        return {
          success: true,
          visitorId: approval.visitorId,
          residentId: approval.residentChatId,
          approvalStatus: 'pending',
          telegramMessageId: String(data.result.message_id),
          message: `Approval request sent to resident: ${approval.residentName}`,
        };
      } else {
        console.error('[Telegram] API Error:', data);
        return {
          success: false,
          visitorId: approval.visitorId,
          residentId: approval.residentChatId,
          approvalStatus: 'pending',
          message: `Telegram API Error: ${data.description || 'Unknown error'}`,
        };
      }
    } catch (error: any) {
      console.error('[Telegram] Error sending approval request:', error);
      return {
        success: false,
        visitorId: approval.visitorId,
        residentId: approval.residentChatId,
        approvalStatus: 'pending',
        message: `Error: ${error.message}`,
      };
    }
  }

  /**
   * Send photo to Telegram chat
   */
  private async sendPhoto(chatId: string, imageBase64: string, caption?: string): Promise<any> {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await fetch(`${this.apiBaseUrl}/bot${this.botToken}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: cleanBase64,
        caption: caption || '',
        parse_mode: 'Markdown',
      }),
    });

    return response.json();
  }

  /**
   * Send approval status update to resident
   */
  async sendApprovalStatus(
    residentChatId: string,
    visitorName: string,
    status: 'approved' | 'rejected'
  ): Promise<boolean> {
    try {
      const emoji = status === 'approved' ? '✅' : '❌';
      const statusText = status === 'approved' ? 'APPROVED' : 'REJECTED';

      const messageText = `
${emoji} *VISITOR ENTRY ${statusText}*

Visitor: *${visitorName}*
Status: *${statusText}*
Time: ${new Date().toLocaleTimeString()}
`;

      const response = await fetch(`${this.apiBaseUrl}/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: residentChatId,
          text: messageText,
          parse_mode: 'Markdown',
        }),
      });

      const data = await response.json();
      return data.ok === true;
    } catch (error) {
      console.error('[Telegram] Error sending status update:', error);
      return false;
    }
  }

  /**
   * Send QR pass to resident
   */
  async sendQRPass(residentChatId: string, visitorName: string, qrCodeImage: string): Promise<boolean> {
    try {
      const caption = `🎫 *VISITOR PASS*\n\nVisitor: ${visitorName}\nValid for this visit\nShow at gate.`;

      return !!(await this.sendPhoto(residentChatId, qrCodeImage, caption));
    } catch (error) {
      console.error('[Telegram] Error sending QR pass:', error);
      return false;
    }
  }

  /**
   * Answer inline button callback (used by backend webhook)
   */
  async answerCallbackQuery(callbackQueryId: string, text: string, showAlert = false): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/bot${this.botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text,
          show_alert: showAlert,
        }),
      });

      const data = await response.json();
      return data.ok === true;
    } catch (error) {
      console.error('[Telegram] Error answering callback:', error);
      return false;
    }
  }

  /**
   * Edit message (update approval status in existing message)
   */
  async editMessage(
    chatId: string,
    messageId: string,
    newText: string,
    inlineKeyboard?: any
  ): Promise<boolean> {
    try {
      const body: any = {
        chat_id: chatId,
        message_id: messageId,
        text: newText,
        parse_mode: 'Markdown',
      };

      if (inlineKeyboard) {
        body.reply_markup = inlineKeyboard;
      }

      const response = await fetch(`${this.apiBaseUrl}/bot${this.botToken}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return data.ok === true;
    } catch (error) {
      console.error('[Telegram] Error editing message:', error);
      return false;
    }
  }

  /**
   * Send test message to verify setup
   */
  async sendTestMessage(chatId: string): Promise<boolean> {
    try {
      const messageText = `
🔔 *PRAVESHKAVACH™ TELEGRAM TEST*

✅ Telegram Bot is connected and operational!

🤖 *Bot:* PraveshKavach Visitor Management
💬 *Chat ID:* ${chatId}
⏰ *Time:* ${new Date().toLocaleString()}

Ready for visitor approvals!
`;

      const response = await fetch(`${this.apiBaseUrl}/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: 'Markdown',
        }),
      });

      const data = await response.json();
      return data.ok === true;
    } catch (error) {
      console.error('[Telegram] Error sending test message:', error);
      return false;
    }
  }
}

export const telegramService = new TelegramService();
