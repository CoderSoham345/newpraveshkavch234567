# CRITICAL OCR BUG FIX - ACTION PLAN

## SITUATION
User reports seeing hardcoded demo data (RAMESH KUMAR, 15/08/1990, 5482 1111 2222) when scanning their Aadhaar card.

## COMPLETED INVESTIGATION

### ✅ Step 1: Code Audit
Searched entire codebase for hardcoded demo values.
- FOUND: Only in documentation files (examples)
- NOT FOUND: In any source code (.tsx, .ts)
- NOT FOUND: In initial state or constants

**Conclusion:** Demo data is NOT being injected by the code itself.

### ✅ Step 2: OCR Flow Analysis
Traced complete OCR pipeline:
1. Camera captures image → Step2ScanFront
2. Image sent to /api/ocr endpoint
3. Server calls Gemini API
4. Gemini returns (or doesn't) structured data
5. Client receives response and sets state

**Conclusion:** Flow is correct, but something is returning wrong data.

### ✅ Step 3: Removed Hardcoded App State
- Removed hardcoded selectedResidentId: 'res-101'
- Removed hardcoded visitPurpose: 'Personal Visit'
- Removed hardcoded visitorPhone: '+91 98989 12345'

### ✅ Step 4: Added Debug Logging
- App.tsx: Logs OCR capture, API call, response, data set
- server.ts: Logs endpoint call, Gemini availability, fallback trigger

---

## IMMEDIATE ACTIONS REQUIRED (USER)

### Action 1: Enable Console Logging
```javascript
// In DevTools Console:
1. Press F12 to open DevTools
2. Go to Console tab
3. Scan an Aadhaar
4. Look for [v0] logs
5. Report what you see
```

### Action 2: Check Network Request
```
1. DevTools → Network tab
2. Scan Aadhaar
3. Look for POST /api/ocr request
4. Click it
5. Go to "Response" tab
6. Share what fullName value is returned
```

### Action 3: Verify GEMINI_API_KEY
```bash
# On server:
echo $GEMINI_API_KEY

# If not set or is 'MY_GEMINI_API_KEY', that's the issue!
# Should be real Google Gemini API key
```

### Action 4: Enable Dev OCR Panel
```javascript
// In DevTools Console:
localStorage.setItem('DEV_OCR_PANEL', 'true')
// Then refresh page
// Yellow ⚙️ button appears - shows raw OCR output
```

---

## POTENTIAL ROOT CAUSES

### Scenario A: Gemini API NOT Configured
```
GEMINI_API_KEY = not set or 'MY_GEMINI_API_KEY'
↓
Server returns empty fields
↓
UI shows "Not Detected"
↓
User should NOT see RAMESH KUMAR
✗ This doesn't match user's report
```

### Scenario B: Gemini API Configured But Returning Demo
```
GEMINI_API_KEY = actual key
↓
Gemini receives image
↓
Gemini returns RAMESH KUMAR in response
↓
Server passes it through
↓
Client displays it
↓
✓ This matches user's report!
```

### Scenario C: Browser Cache/LocalStorage
```
User's browser has cached old response
↓
New OCR request still shows old RAMESH KUMAR
↓
localStorage.clear() should fix it
↓
Check if issue persists after hard refresh
```

### Scenario D: Image Not Being Sent Correctly
```
Image preprocessing fails
↓
Blank/corrupted image sent to Gemini
↓
Gemini returns sample/test data
↓
User sees RAMESH KUMAR (Gemini's fallback)
```

---

## VERIFICATION TESTS

### Test 1: Check Fallback Path
```typescript
// In server.ts OCR endpoint:
// Temporarily disable Gemini:
if (true) {
  return res.json({
    success: true,
    extractedData: {
      fullName: '',
      dob: '',
      // ... all empty
    }
  });
}

// If user still sees RAMESH KUMAR after this:
// → Problem is in client-side caching
```

### Test 2: Check Image Preprocessing
```typescript
// Log image data before sending:
console.log('Image Base64 length:', imageBase64.length);
console.log('Image Base64 starts with:', imageBase64.substring(0, 50));

// Should start with valid base64 characters
// Should be reasonable length (>10KB for typical ID)
```

### Test 3: Verify Gemini Response
```typescript
// After Gemini response:
console.log('Gemini response:', responseText);
console.log('Parsed:', parsed);

// Should show actual extracted values
// Should NOT show mock/demo data unless on actual document
```

---

## HARDENING FIXES (Needed)

### Fix 1: Strengthen Input Validation
```typescript
// Ensure extractedData never contains:
// - null values (should be empty string)
// - undefined values (should be empty string)
// - placeholder text (should be empty string)
```

### Fix 2: Add Field Validation
```typescript
// For each extracted field:
if (!extractedData.fullName || extractedData.fullName === 'Not Detected') {
  extractedData.fullName = '';
}
```

### Fix 3: Explicitly Forbid Known Demo Values
```typescript
const FORBIDDEN_VALUES = [
  'RAMESH KUMAR',
  'RAMESH PRASAD',
  '5482 1111 2222',
  '15/08/1990'
];

if (FORBIDDEN_VALUES.includes(extractedData.fullName)) {
  throw new Error('OCR returned known demo values - API issue!');
}
```

### Fix 4: Add Integrity Check
```typescript
// Validate Aadhaar checksum:
if (documentNumber.length === 12) {
  const isValid = verifyAadhaarChecksum(documentNumber);
  if (!isValid) {
    console.warn('Invalid Aadhaar checksum');
  }
}
```

---

## REQUIRED INFORMATION FROM USER

Please provide:

1. **Console Logs**
   ```
   What [v0] logs appear when scanning?
   ```

2. **Network Response**
   ```
   What is returned in /api/ocr response?
   Full JSON body
   ```

3. **GEMINI_API_KEY Status**
   ```
   Is it configured?
   Is it a valid key?
   ```

4. **Browser Info**
   ```
   Browser type/version
   Any errors in console?
   ```

5. **Reproduction Steps**
   ```
   Exact steps to reproduce the issue
   Does it happen every time?
   Does it happen with specific document?
   ```

---

## TIMELINE

| Phase | Action | Status |
|-------|--------|--------|
| 1 | Audit code for hardcoded demo | ✅ DONE |
| 2 | Add debug logging | ✅ DONE |
| 3 | Remove hardcoded app state | ✅ DONE |
| 4 | Get user diagnostics | ⏳ PENDING |
| 5 | Identify root cause | ⏳ PENDING |
| 6 | Implement fix | ⏳ PENDING |
| 7 | Test verification | ⏳ PENDING |
| 8 | Deploy fix | ⏳ PENDING |

---

## NEXT STEP

**User must provide:**
1. Browser console logs (starting with [v0])
2. Network tab response from /api/ocr
3. GEMINI_API_KEY configuration status

**Then root cause will be immediately clear.**

