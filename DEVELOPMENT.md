# PraveshKavach™ Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (includes backend)
npm run dev

# Visit app
http://localhost:5173 (or http://localhost:3000)

# Build for production
npm run build

# Run linter
npm run lint
```

---

## System Architecture

### Backend (Node.js + Express)
```
server.ts (1600+ lines)
├── Authentication
│   ├── POST /api/auth/login
│   ├── POST /api/auth/register
│   └── POST /api/auth/logout
├── Visitors
│   ├── POST /api/visitors
│   ├── GET /api/visitors
│   └── PATCH /api/visitors/:id/status
├── Telegram
│   ├── POST /api/telegram/test
│   ├── POST /api/telegram/send-approval
│   └── POST /api/telegram/webhook
├── OCR
│   └── POST /api/ocr
├── Real-time
│   └── GET /api/events (Server-Sent Events)
└── Analytics
    └── GET /api/analytics
```

### Frontend (React + TypeScript)
```
src/
├── pages/
│   ├── LoginPage.tsx          (Login + Registration)
│   ├── RegisterPage.tsx       (Registration component)
│   ├── SecurityGuardWorkflow  (Visitor registration flow)
│   └── Admin/Resident Dashboard
├── context/
│   ├── AuthContext.tsx        (Authentication state)
│   └── ChatbotContext.tsx     (Chatbot state)
├── components/
│   ├── Step1-8 (Visitor workflow)
│   ├── AdminDashboard.tsx
│   └── Navigation/Layout
└── utils/
    ├── ocrSpaceIntegration.ts
    ├── documentFieldExtractors.ts
    └── debugLogger.ts
```

---

## Authentication Flow

### User Registration
```
1. User fills form (name, email, password, role)
2. Frontend validates locally
3. POST /api/auth/register
4. Backend creates user in testUsers array
5. Auto-login with session token
6. Redirect to role-based dashboard
```

### User Login
```
1. User enters email + password
2. POST /api/auth/login
3. Backend validates credentials
4. Backend creates 30-min session token
5. Frontend stores token in sessionStorage
6. Redirect to role-based dashboard
```

### Session Validation
```
Frontend:
- Token stored in sessionStorage
- Sent in Authorization header
- Cleared on logout

Backend:
- Session tokens stored in sessionStore Map
- 30-minute expiration
- Validated on protected endpoints
```

---

## Key Files

### Authentication
- `server.ts` lines 104-266: Auth endpoints
- `src/context/AuthContext.tsx`: Auth state management
- `src/pages/LoginPage.tsx`: Login/Register UI

### Visitor Workflow
- `server.ts` lines 1445-1450: Visitor CRUD
- `src/components/Step1-Step8`: Workflow steps
- `src/utils/documentFieldExtractors.ts`: OCR parsing

### OCR Integration
- `server.ts` lines 1023-1140: OCR endpoint
- `src/utils/ocrSpaceIntegration.ts`: Image preprocessing
- `src/config/ocrConfig.ts`: OCR settings

### Telegram Integration
- `server.ts` lines 323-625: Telegram endpoints
- `src/services/telegramService.ts`: Telegram client
- `src/components/TelegramGuardChatModal.tsx`: UI

---

## Environment Variables

Required for full functionality:

```bash
# Telegram (optional, but recommended)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_DEFAULT_CHAT_ID=your_chat_id_here

# OCR (optional, uses free tier by default)
OCR_SPACE_API_KEY=K87899142

# Next.js specific
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

---

## Common Tasks

### Add a New API Endpoint

```typescript
// In server.ts, add before startServer():

app.post('/api/newfeature', (req, res) => {
  try {
    const { data } = req.body;
    
    // Validate
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'data is required'
      });
    }
    
    // Process
    const result = processData(data);
    
    // Return JSON (never HTML)
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Add a New Component

```typescript
// src/components/NewComponent.tsx

import React from 'react';

interface NewComponentProps {
  title: string;
  onAction: () => void;
}

export function NewComponent({ title, onAction }: NewComponentProps) {
  return (
    <div className="p-4 bg-slate-800 rounded">
      <h2 className="text-white">{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
}
```

### Add Authentication to an Endpoint

```typescript
// Validate session before processing
app.get('/api/protected', (req, res) => {
  const session = validateSession(req);
  
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }
  
  // Access session.userId if needed
  res.json({ success: true });
});
```

### Debug an Issue

1. **Enable debug logging:**
   ```bash
   # In browser console
   localStorage.setItem('V0_DEBUG_LOGS', 'true');
   location.reload();
   ```

2. **Check API response:**
   - DevTools → Network tab
   - Look for `/api/endpoint` request
   - Check Response tab for JSON structure

3. **Check server logs:**
   - `npm run dev` console shows `[v0]` prefixed logs
   - Look for error messages with full context

4. **Check TypeScript errors:**
   ```bash
   npm run lint
   ```

---

## Testing Endpoints

### Using curl

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}'

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"newuser@example.com",
    "password":"password123",
    "name":"New User",
    "role":"RESIDENT"
  }'

# Protected endpoint (with token)
curl -X GET http://localhost:3000/api/visitors \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Create collection "PraveshKavach"
2. Add requests:
   - POST: `http://localhost:3000/api/auth/login`
   - Body: `{"email":"admin@test.com","password":"123456"}`
3. Copy token from response
4. For authenticated requests, add header:
   - Header: `Authorization: Bearer {token}`

---

## Deployment

### Build for Production

```bash
npm run build
```

This creates:
- `dist/index.html` - React app
- `dist/assets/` - JS/CSS bundles
- `dist/server.cjs` - Node.js backend

### Run in Production

```bash
# Using Node directly
node dist/server.cjs

# Production server listens on port 3000
# Visit http://your-domain.com
```

### Environment Variables for Production

```bash
export NODE_ENV=production
export OCR_SPACE_API_KEY=your_key
export TELEGRAM_BOT_TOKEN=your_token
export TELEGRAM_DEFAULT_CHAT_ID=your_chat_id
```

---

## Troubleshooting

### "Unexpected token 'T'" Error
**Cause:** API returning HTML instead of JSON  
**Fix:** Check catch-all route in server.ts (line 1603-1615)

### Login Fails
**Cause:** User not in testUsers array  
**Fix:** Use demo credentials (admin@test.com) or register first

### OCR Returns Empty
**Cause:** No OCR_SPACE_API_KEY configured  
**Fix:** Add API key to environment variables

### Telegram Not Sending
**Cause:** Bot token or chat ID invalid  
**Fix:** Test with `/api/telegram/test` endpoint

### Build Fails
**Cause:** TypeScript errors  
**Fix:** Run `npm run lint` to see errors

---

## Performance Tips

1. **Use React.memo** for expensive components
2. **Lazy load dashboards** with React.lazy
3. **Debounce form inputs** (OCR image uploads)
4. **Cache API responses** with SWR
5. **Compress images** before uploading

---

## Security Best Practices

1. **Never log passwords** - Use [v0] debug prefix
2. **Validate on backend** - Never trust client input
3. **Use HTTPS in production** - Tokens in transit
4. **Expire sessions** - 30 minutes default
5. **Sanitize user input** - Prevent injection attacks
6. **Check authorization** - Use validateSession() before processing

---

## Resources

- API Tests: See `TESTING_GUIDE.md`
- Status Report: See `PROJECT_STATUS.md`
- Audit Report: See `MASTER_AUDIT_AND_FIX_REPORT.md`
- Express Docs: https://expressjs.com
- React Docs: https://react.dev
- TypeScript Docs: https://www.typescriptlang.org

---

**Last Updated:** August 2, 2026  
**Version:** 4.2  
**Status:** Production Ready ✅
