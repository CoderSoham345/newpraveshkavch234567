# OCR.Space Integration Setup Guide

## Quick Start (5 minutes)

### Step 1: Get OCR.Space API Key

1. Visit https://ocr.space/
2. Click "API Key" or "Account"
3. Get your free API key (limited to 25,000 requests/day)
4. For production: Upgrade to paid plan

### Step 2: Set Environment Variable

```bash
# In your .env or deployment environment
OCR_SPACE_API_KEY=your_api_key_here
```

### Step 3: Test the Endpoint

```bash
curl -X POST http://localhost:3000/api/ocr \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "side": "front"
  }'
```

### Step 4: Verify Response

You should receive a response with:
- `documentClassification` (auto-detected document type)
- `extractedData` (all fields)
- `validation` (confidence scores)
- `processingMetrics` (timing information)

## Integration in React Components

### Example: Scanning Aadhaar Front

```typescript
import { useState } from 'react';

export function AadhaarScanner() {
  const [extractedData, setExtractedData] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleCapture = async (imageBase64: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          side: 'front'
        })
      });

      const result = await response.json();

      if (result.success) {
        setExtractedData(result.extractedData);
        setConfidence(result.extractedData.confidenceScore);

        // Highlight fields with < 85% confidence
        result.validation.lowConfidenceFields.forEach(field => {
          console.log(`⚠️ Low confidence on ${field}: ${result.extractedData[field].confidence}%`);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <p>Processing OCR...</p>}
      {extractedData && (
        <div>
          <p>Name: {extractedData.name}</p>
          <p>Aadhaar: {extractedData.documentNumber}</p>
          <p>DOB: {extractedData.dateOfBirth}</p>
          <p>Confidence: {confidence}%</p>
        </div>
      )}
    </div>
  );
}
```

## Troubleshooting

### API Key Issues

**Error: "OCR service not configured"**
- Check that `OCR_SPACE_API_KEY` is set in environment
- Verify the key is valid (not expired or revoked)

**Error: 401 Unauthorized**
- Your API key is invalid or inactive
- Get a new key from https://ocr.space/

### Image Quality Issues

**Low confidence on extracted fields**
- Ensure good lighting
- Keep document straight and flat
- Avoid glare or reflections
- Use high-resolution camera (2MP+)

**Document not detected**
- Ensure entire document is in frame
- Try with different angle or lighting
- Check that document is supported (see list above)

### Rate Limiting

**Error: 429 Too Many Requests**
- Free plan: 25,000 requests/day
- Upgrade to paid plan for higher limits
- Implement request queuing/throttling

## Production Checklist

- [ ] OCR_SPACE_API_KEY configured in production environment
- [ ] API key has sufficient quota
- [ ] Error handling implemented for all failure scenarios
- [ ] Low confidence fields highlighted in UI
- [ ] Manual verification workflow for < 85% confidence
- [ ] OCR metrics logged and monitored
- [ ] User feedback mechanism for incorrect extractions
- [ ] Rate limiting implemented on frontend

## Performance Optimization

### Recommended Image Compression

```typescript
// Compress before sending to OCR
const compressImage = (base64: string): string => {
  const canvas = document.createElement('canvas');
  const img = new Image();
  img.src = base64;
  
  // Resize to 1280x1024
  canvas.width = 1280;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, 0, 0, 1280, 1024);
  
  // Compress to 90% quality
  return canvas.toDataURL('image/jpeg', 0.9);
};
```

### Caching Document Classifications

```typescript
// Cache document types to avoid re-classification
const documentTypeCache = new Map<string, string>();

const getCachedDocumentType = (imageHash: string): string | null => {
  return documentTypeCache.get(imageHash) || null;
};

const cacheDocumentType = (imageHash: string, docType: string) => {
  documentTypeCache.set(imageHash, docType);
};
```

## Monitoring and Analytics

### Key Metrics to Track

```typescript
// Log these metrics for analytics
{
  timestamp: new Date().toISOString(),
  documentType: 'AADHAAR_FRONT',
  confidence: 95,
  processingTime: 2340, // ms
  ocrTime: 1800, // ms
  extractedFields: 6,
  lowConfidenceFields: [],
  validationStatus: 'VALID',
  userCorrections: [] // Track manual corrections
}
```

### Dashboard Suggestions

- OCR success rate by document type
- Average confidence scores
- Processing time trends
- Common extraction errors
- User manual correction patterns

## Support & Resources

- **OCR.Space Docs**: https://ocr.space/ocrapi
- **GitHub Issues**: Report issues with extractions
- **Email Support**: support@ocr.space (paid plans)

## Cost Estimation

### Free Plan
- 25,000 requests/day
- Perfect for development/testing

### Paid Plans
- Starter: $10/month - 100,000 requests
- Pro: $25/month - 500,000 requests
- Enterprise: Custom pricing

For PraveshKavach:
- Average 5-10 OCR requests per visitor registration
- 100 visitors/day ≈ 500-1000 requests/day
- Free plan sufficient, or Starter plan for production
