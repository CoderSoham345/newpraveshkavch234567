import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth, UserRole } from './AuthContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotContextType {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  setIsOpen: (open: boolean) => void;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
  getSuggestedPrompts: () => string[];
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getSuggestedPrompts = useCallback((): string[] => {
    if (!user) return [];

    const prompts: Record<UserRole, string[]> = {
      RESIDENT: [
        'Where is my visitor?',
        'How do I approve a visitor?',
        'What are the building rules?',
        'Emergency contacts',
      ],
      SECURITY_GUARD: [
        'How to scan an Aadhaar card?',
        'Face verification process',
        'Pending approvals',
        'Emergency procedures',
      ],
      ADMIN: [
        'OCR Configuration',
        'Telegram Bot Setup',
        'System Health Status',
        'Generate Report',
      ],
    };

    return prompts[user.role] || [];
  }, [user]);

  const generateBotResponse = useCallback((userMessage: string): string => {
    if (!user) return 'Please log in first.';

    const message = userMessage.toLowerCase();
    
    // Role-specific responses
    if (user.role === 'RESIDENT') {
      if (message.includes('visitor')) {
        return 'Your visitor request is pending approval. You can check the status in your dashboard under "Pending Visitor Requests".';
      }
      if (message.includes('approve')) {
        return 'To approve a visitor: 1) Go to Pending Visitor Requests 2) Review visitor details 3) Click Approve to send to Security Guard.';
      }
      if (message.includes('rule') || message.includes('building')) {
        return 'Building Rules:\n- Visiting hours: 9 AM - 9 PM\n- Valid ID required\n- Security verification mandatory\n- Parking guidelines apply';
      }
    }

    if (user.role === 'SECURITY_GUARD') {
      if (message.includes('scan') || message.includes('aadhaar')) {
        return 'To scan a document:\n1) Click "Scan Documents"\n2) Take photo of front side\n3) Verify extracted data\n4) Scan back side\n5) Proceed with face verification';
      }
      if (message.includes('face') || message.includes('verification')) {
        return 'Face Verification:\n1) Ensure good lighting\n2) Look directly at camera\n3) Keep face centered\n4) Wait for verification (usually <3 seconds)';
      }
      if (message.includes('pending') || message.includes('approval')) {
        return 'Check Pending Approvals in your dashboard. You can see all visitors waiting for resident approval and their status.';
      }
    }

    if (user.role === 'ADMIN') {
      if (message.includes('ocr')) {
        return 'OCR Configuration:\n- Current Engine: OCR.Space v2\n- Languages: English\n- Confidence Threshold: 85%\n- Daily Quota: 25,000 requests';
      }
      if (message.includes('telegram')) {
        return 'Telegram Bot Status:\n- Bot Token: Configured ✓\n- Chat ID: Configured ✓\n- Last Message: 2 hours ago\n- Connection: Active';
      }
      if (message.includes('system') || message.includes('health')) {
        return 'System Health:\n- API Status: Operational ✓\n- Database: Connected ✓\n- Cache: Healthy ✓\n- All systems normal';
      }
    }

    return 'I can help you with your query. Try asking about visitor processes, document scanning, or system configuration based on your role.';
  }, [user]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));

      // Generate bot response
      const botResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: generateBotResponse(content),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [generateBotResponse]);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <ChatbotContext.Provider value={{
      messages,
      isOpen,
      isLoading,
      setIsOpen,
      sendMessage,
      clearHistory,
      getSuggestedPrompts,
    }}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within ChatbotProvider');
  }
  return context;
}
