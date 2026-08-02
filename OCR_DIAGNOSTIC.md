# OCR PRODUCTION BUG - DIAGNOSTIC REPORT

## CRITICAL ISSUE
User reports seeing hardcoded demo data:
- RAMESH KUMAR (fullName)
- 15/08/1990 (DOB)
- 5482 1111 2222 (Aadhaar)
- RAMESH PRASAD (Father Name)

These values should NEVER appear unless they're on the actual scanned document.

---

## ROOT CAUSE INVESTIGATION

### Step 1: Search Results
Searched entire codebase for "RAMESH KUMAR", "5482 1111 2222", "15/08/1990"

**Found in:**
- ✅ Documentation files only (API_SCHEMA.md, ROOT_CAUSE_ANALYSIS.md) - EXAMPLES ONLY
- ❌ NOT in any source code (.tsx, .ts files)
- ❌ NOT in mockData.ts
- ❌ NOT in hardcoded initial state

**Conclusion:** The demo data is NOT being injected by the code.

### Step 2: OCR Flow Analysis

**App.tsx handleFrontCaptureCompleted (line 123-153):**
```
1. Check if isSample === true && sampleData exists
   ➜ If true: Use sample data (but this shouldn't happen in normal flow)
2. Otherwise: Fetch from /api/ocr endpoint
3. Wait for response with extractedData
4. Set extractedData with response values
```

**Decision Point:**
- If Gemini API returns "RAMESH KUMAR" → It's coming from Gemini
- If fallback triggered → Should return empty fields only

### Step 3: Server OCR Endpoint (/api/ocr)

**Location:** server.ts line 759-915

**Flow:**
```
1. GET GEMINI CLIENT
   ➜ Returns null if GEMINI_API_KEY not set or is 'MY_GEMINI_API_KEY'
   ➜ Returns GoogleGenAI client if properly configured

2. IF GEMINI AVAILABLE
   ➜ Send image to Gemini with strict prompt
   ➜ Parse response (should be JSON with schema)
   ➜ Return extractedData as-is (no hallucination)

3. IF GEMINI NOT AVAILABLE (ai === null)
   ➜ Return fallback with ALL FIELDS EMPTY
   ➜ No default values added
```

**Critical Check:**
The prompt (lines 773-792) explicitly states:
```
"DO NOT invent, predict, or fabricate missing values"
"If a field is not printed or not detected, leave it as empty string"
```

---

## DEBUG LOGGING ADDED

**App.tsx (lines 124-151):**
- Logs when front capture completes
- Logs if sample data is being used
- Logs OCR API response
- Logs what data is being set

**server.ts (lines 762, 889):**
- Logs when OCR endpoint is called
- Logs if Gemini is configured
- Logs when fallback is triggered

---

## HOW TO DIAGNOSE

### Method 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Scan Aadhaar
4. Look for logs starting with `[v0]`
5. Check what OCR response says

### Method 2: Enable Dev OCR Panel
1. Open DevTools Console
2. Run: `localStorage.setItem('DEV_OCR_PANEL', 'true')`
3. Refresh page
4. Yellow ⚙️ DEV OCR PANEL button appears at bottom right
5. Shows raw OCR text and parsed fields

### Method 3: Check Network Tab
1. Open DevTools → Network tab
2. Scan document
3. Look for POST request to `/api/ocr`
4. Check request body (has imageBase64)
5. Check response:
   - If empty fields → Gemini not available
   - If RAMESH KUMAR → Gemini returned it

### Method 4: Set GEMINI_API_KEY environment variable
1. Ensure .env has: `GEMINI_API_KEY=your_actual_key`
2. Restart server
3. Check server console for `[v0] OCR endpoint called. Gemini API configured: true`

---

## POSSIBLE CAUSES

### Cause 1: GEMINI_API_KEY Not Set
**Symptom:** Should see empty fields with "Not Detected"
**Check:** Look for `[v0] CRITICAL: Using fallback OCR (Gemini not available)` in console

### Cause 2: GEMINI_API_KEY Set But Gemini Returning Demo Data
**Symptom:** Seeing RAMESH KUMAR (Gemini might have cached data or sample)
**Check:** Look for actual OCR response in network tab
**Fix:** Ensure image is being sent to Gemini correctly

### Cause 3: Cached/Stale Data
**Symptom:** Seeing old data even after restart
**Check:** Clear browser cache and localStorage
**Fix:** Run: `localStorage.clear()` in DevTools

### Cause 4: UI Displaying Default/Placeholder Values
**Symptom:** Empty OCR fields but UI shows RAMESH KUMAR
**Check:** Check if component has default prop values
**Fix:** All components must show "Not Detected" for empty fields

---

## VERIFICATION CHECKLIST

- [ ] No hardcoded RAMESH KUMAR values in source code
- [ ] OCR API returns empty fields when Gemini unavailable
- [ ] OCR API returns only detected values when Gemini available
- [ ] UI displays "Not Detected" for empty fields
- [ ] Debug logs show actual OCR flow
- [ ] Browser console shows [v0] logs
- [ ] Network tab shows correct API response
- [ ] Dev OCR Panel shows raw and parsed data

---

## NEXT STEPS

1. **Enable debug logging** - Check browser console for [v0] logs
2. **Open Network tab** - See actual API response
3. **Check GEMINI_API_KEY** - Verify it's set correctly
4. **Enable Dev Panel** - Inspect raw OCR output
5. **Test with known document** - Scan an actual ID

**Once you have this information, the real issue will be clear.**

