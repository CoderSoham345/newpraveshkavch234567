# STRICT AADHAAR OCR IMPLEMENTATION - PraveshKavach™

## Overview

The OCR extraction system now follows a **strict, deterministic pipeline** that NEVER hallucina values, guesses, or fabricates information. Only text that is visibly printed on the document is extracted.

## Architecture

### Three-Layer System

```
Layer 1: Gemini Vision API
  └─> Extracts raw OCR text from document image
  └─> Returns ONLY visible printed text (no AI inference)
  
Layer 2: Strict Regex Parsers (strictAadhaarOCR.ts)
  └─> Deterministic extraction using validated patterns
  └─> Front side: Name, Aadhaar#, DOB, Gender, Father Name
  └─> Back side: Address, PIN Code
  
Layer 3: Response Processor (ocrResponseProcessor.ts)
  └─> Validates extracted fields
  └─> Calculates confidence scores
  └─> Returns structured JSON with quality metrics
```

## Key Extraction Functions

### Front Side Extraction

#### 1. Aadhaar Number
```typescript
extractAadhaarNumber(rawText: string)
// Regex: (\d{4})\s*(\d{4})\s*(\d{4})
// Accepts: "7356 5380 6992" or "735653806992"
// Returns: Empty string if not exactly 12 digits
// Confidence: 92% if found
```

#### 2. Full Name
```typescript
extractFullName(rawText: string)
// Extracts exactly as printed - NO modifications
// NO capitalization changes
// NO reordering
// Returns: Empty if not clearly detected
// Confidence: 85% if found
```

#### 3. Father's/Guardian Name
```typescript
extractFatherName(rawText: string)
// Looks for: S/O, D/O, C/O, W/O prefixes
// Example: "S/O Sandip Gonbhare" → "Sandip Gonbhare"
// Returns: Empty if prefix not found
// Confidence: 88% if found
```

#### 4. Date of Birth
```typescript
extractDOB(rawText: string)
// Accepts: DD/MM/YYYY or DD-MM-YYYY
// Validates: Day (1-31), Month (1-12), Year (1900-present)
// Returns: Exactly as printed (NO conversion)
// Confidence: 95% if valid format found
```

#### 5. Gender
```typescript
extractGender(rawText: string)
// Extracts ONLY if clearly printed
// Accepts: "Male", "Female", "Other"
// Returns: Empty if not explicitly found
// Confidence: 90% if found
```

#### 6. Age (Calculated)
```typescript
calculateAge(dob: string)
// Input: DOB string in DD/MM/YYYY format
// Calculates: Current date - DOB
// Auto-updates every year
// Confidence: 99% (mathematically derived)
// Returns: "X Years" format
```

### Back Side Extraction

#### 1. Address
```typescript
extractAddress(rawText: string)
// Extracts lines after "Address:" label
// Returns: EXACTLY as OCR detected it
// NO rewriting, NO reformatting, NO merging lines
// Confidence: 80% if found
```

#### 2. PIN Code
```typescript
extractPINCode(rawText: string)
// Regex: (\d{6})
// Validates: Exactly 6 digits
// Returns: Empty if not valid
// Confidence: 95% if found and valid
```

#### 3. State
```typescript
extractState(rawText: string, address: string)
// Validates against official Indian states list
// Returns: Official state name if found
// Confidence: 90% if matched
```

#### 4. City/District
```typescript
extractCity(address: string)
// Attempts to extract from address lines
// Confidence: 85% if common city matched
// Confidence: 60% if generic city extracted
```

## Confidence Scoring

### Color Coding System

| Confidence | Color | Meaning |
|------------|-------|---------|
| ≥ 80% | 🟢 Green | High confidence - field clearly detected |
| 60-79% | 🟡 Yellow | Medium confidence - field partially clear |
| 50-59% | 🟠 Orange | Low confidence - field unclear |
| < 50% | Leave blank | Not Detected - Please Verify Manually |

### Overall Confidence Calculation

```
Overall % = (Detected Required Fields / Total Required Fields) × 100

Front Side Required: fullName, aadhaarNumber, dob, gender
Back Side Required: address, pinCode
```

## NO Hallucination Rules

### ❌ NEVER

- Generate fake names
- Invent Aadhaar numbers
- Make up addresses
- Guess father names
- Fabricate dates
- Infer missing values
- Use AI inference for missing fields
- Auto-capitalize or reformat names
- Reorder address lines
- Merge address lines incorrectly

### ✅ ALWAYS

- Return empty string if field not detected
- Keep values exactly as printed
- Show "Not Detected – Please Verify Manually" for missing required fields
- Validate against known patterns (dates, PINs, states)
- Include raw OCR text for manual verification
- Track confidence for every field
- Mark low-confidence fields for manual review

## Response Format

### Success Response (Front Side)
```json
{
  "success": true,
  "extractedData": {
    "fullName": "Soham Sandip Gonbhare",
    "aadhaarNumber": "735653806992",
    "dob": "15/07/2006",
    "gender": "Male",
    "fatherName": "Sandip Gonbhare",
    "age": "20 Years",
    "address": "",
    "pinCode": "",
    "documentType": "Aadhaar Card",
    "confidenceScore": 95,
    "lowConfidenceFields": []
  },
  "rawOCRText": "[Complete OCR text dump from Gemini]",
  "source": "STRICT_GEMINI_EXTRACTION",
  "side": "front"
}
```

### Success Response (Back Side)
```json
{
  "success": true,
  "extractedData": {
    "address": "Flat 302, Apex Heights, Sector 15, Nerul, Navi Mumbai, Thane",
    "pinCode": "400706",
    "state": "MAHARASHTRA",
    "city": "Navi Mumbai",
    "confidenceScore": 90,
    "lowConfidenceFields": []
  },
  "rawOCRText": "[Complete address OCR text]",
  "source": "STRICT_GEMINI_EXTRACTION",
  "side": "back"
}
```

### Fallback Response (No API Available)
```json
{
  "success": true,
  "extractedData": {
    "fullName": "",
    "aadhaarNumber": "",
    "dob": "",
    "gender": "",
    "confidenceScore": 0,
    "lowConfidenceFields": ["fullName", "aadhaarNumber", "dob", "gender"]
  },
  "rawOCRText": "[OCR not available - please enter details manually]",
  "source": "FALLBACK_NO_HALLUCINATION"
}
```

## Telegram Message Format

After successful OCR with high confidence, the system sends to Telegram:

```
✅ VISITOR APPROVAL REQUEST

👤 Visitor Name: Soham Sandip Gonbhare
👨 Father Name: Sandip Gonbhare  
🆔 Aadhaar Number: 7356-5380-6992
📅 Date of Birth: 15/07/2006
📊 Age: 20 Years
⚧ Gender: Male
📍 Address: Flat 302, Apex Heights, Sector 15, Nerul, Navi Mumbai, Thane, 400706

🏢 Building: [From Form]
🚪 Wing: [From Form]
🏠 Flat: [From Form]
🔐 Gate: [From Form]

⏰ Date & Time: [Timestamp]
👮 Security Guard: [Name]

🔐 Confidence Score: 95%
📸 [Visitor Face Photo]
🆎 [Aadhaar Front Photo]
🔙 [Aadhaar Back Photo]

[APPROVE] [REJECT]
```

### Never Send Invalid Data to Telegram

If ANY field has:
- Confidence < 50%
- Invalid format (bad PIN, bad DOB)
- Missing required data

The message shows:
```
⚠️ INCOMPLETE DATA
Field "Father Name" could not be detected. Please verify manually.
```

## Database Storage

After approval, store:

```sql
visitors:
  - visitor_id (UUID)
  - face_photo (bytes)
  - aadhaar_front (bytes)
  - aadhaar_back (bytes)
  - raw_ocr_text_front (text)
  - raw_ocr_text_back (text)
  - parsed_fields (JSON)
  - confidence_metrics (JSON)
  - verification_status (PENDING/APPROVED/REJECTED)
  - created_at (timestamp)
  - approved_at (timestamp)
  - telegram_message_id (string)
  - audit_logs (JSON array)
```

## Testing Scenarios

### ✅ Good Scan
- Clear, well-lit image
- All text readable
- Proper document alignment
- No blur or glare
- **Result**: High confidence, all fields extracted

### ⚠️ Partial Scan
- Some fields unclear
- Lighting issues
- Slight blur
- **Result**: Medium confidence, fields marked for manual review

### ❌ Bad Scan
- Blurry image
- Poor lighting
- Partially visible
- Multiple unreadable fields
- **Result**: Low confidence, most fields empty, manual entry required

## Debugging

Enable debug mode to see:
1. Raw Gemini OCR text (before parsing)
2. Each regex extraction step
3. Confidence calculation for each field
4. Validation results
5. Final confidence score

Set in environment:
```
VITE_DEV_MODE=true
DEV_OCR_DEBUG=true
```

## Files Modified

1. **server.ts** - Updated `/api/ocr` endpoint
2. **strictAadhaarOCR.ts** (NEW) - Extraction functions
3. **ocrResponseProcessor.ts** (NEW) - Response formatting
4. **DevOCRPanel.tsx** - Already supports debug mode

## Future Improvements

1. Add ML Kit Text Recognition as fallback when Gemini unavailable
2. Implement perspective correction for skewed images
3. Add edge detection to validate document presence
4. OpenCV preprocessing for better OCR accuracy
5. Multi-language support (if needed)
6. CameraX integration for mobile (Android)

## Success Criteria

✅ Aadhaar Number extracted correctly  
✅ Full Name extracted exactly as printed  
✅ Father's Name detected correctly  
✅ DOB in correct format (DD/MM/YYYY)  
✅ Gender clearly identified  
✅ Address from back side extracted completely  
✅ PIN Code validated (6 digits)  
✅ State and City validated  
✅ Confidence scores accurate  
✅ Raw OCR text preserved for audit  
✅ NO hallucinated or fabricated data  
✅ Manual verification clear for low-confidence fields
