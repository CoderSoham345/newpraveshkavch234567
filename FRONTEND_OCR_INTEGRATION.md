# Frontend OCR Integration Guide - PraveshKavach™

## Quick Start

### 1. Import OCR Hook

```typescript
import { useOCR } from '@/hooks/useOCR';

export function DocumentScanner() {
  const { processImage, loading, result, error } = useOCR();
  
  const handleCapture = async (imageBase64: string) => {
    const ocrResult = await processImage(imageBase64, 'front');
    
    if (ocrResult.success) {
      // Document auto-detected
      console.log('Document Type:', ocrResult.documentClassification.documentType);
      
      // Extract data available
      console.log('Extracted Data:', ocrResult.extractedData);
      
      // Check confidence
      if (ocrResult.extractedData.confidenceScore > 85) {
        // Auto-fill form
        populateForm(ocrResult.extractedData);
      } else {
        // Show manual verification required
        showManualVerificationUI();
      }
    }
  };
  
  return (
    <div>
      {loading && <p>Processing...</p>}
      {error && <p>Error: {error}</p>}
      {result && displayResult(result)}
    </div>
  );
}
```

### 2. Create useOCR Hook

Create `/src/hooks/useOCR.ts`:

```typescript
import { useState } from 'react';

interface OCRResult {
  success: boolean;
  documentClassification: {
    documentType: string;
    confidence: number;
    side: string;
  };
  extractedData: Record<string, any>;
  validation: {
    status: string;
    needsReview: boolean;
    lowConfidenceFields: string[];
  };
  processingMetrics: {
    totalTime: number;
    preprocessingTime: number;
    ocrTime: number;
  };
}

export function useOCR() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processImage = async (
    imageBase64: string,
    side: 'front' | 'back' = 'front'
  ): Promise<OCRResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          side,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'OCR processing failed';
      setError(errorMsg);
      console.error('[v0] OCR Error:', errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    processImage,
    loading,
    result,
    error,
  };
}
```

### 3. Handle Different Document Types

```typescript
function renderDocumentForm(documentType: string, extractedData: any) {
  switch (documentType) {
    case 'AADHAAR_FRONT':
      return <AadhaarFrontForm data={extractedData} />;
    case 'AADHAAR_BACK':
      return <AadhaarBackForm data={extractedData} />;
    case 'PAN_CARD':
      return <PANForm data={extractedData} />;
    case 'PASSPORT':
      return <PassportForm data={extractedData} />;
    case 'DRIVING_LICENCE':
      return <DrivingLicenceForm data={extractedData} />;
    case 'VOTER_ID':
      return <VoterIDForm data={extractedData} />;
    case 'RC_BOOK':
      return <RCBookForm data={extractedData} />;
    default:
      return <ManualEntryForm />;
  }
}
```

### 4. Highlight Confidence Levels

```typescript
function ConfidenceIndicator({ confidence }: { confidence: number }) {
  let bgColor = 'bg-red-500'; // < 50%
  let textColor = 'text-red-600';
  let label = 'Manual Entry Required';

  if (confidence >= 85) {
    bgColor = 'bg-green-500';
    textColor = 'text-green-600';
    label = 'High Confidence';
  } else if (confidence >= 50) {
    bgColor = 'bg-yellow-500';
    textColor = 'text-yellow-600';
    label = 'Verify Required';
  }

  return (
    <div className={`${bgColor} px-3 py-1 rounded`}>
      <span className={textColor}>{label}: {confidence}%</span>
    </div>
  );
}
```

### 5. Handle Low Confidence Fields

```typescript
function DocumentForm({ data, lowConfidenceFields }: any) {
  return (
    <form>
      {Object.entries(data).map(([key, value]: [string, any]) => {
        const isLowConfidence = lowConfidenceFields.includes(key);
        
        return (
          <div key={key} className={isLowConfidence ? 'border-yellow-500 border' : ''}>
            <label>{formatLabel(key)}</label>
            <input
              type="text"
              defaultValue={value}
              required={!isLowConfidence}
              className={isLowConfidence ? 'bg-yellow-50' : ''}
            />
            {isLowConfidence && (
              <span className="text-yellow-600 text-sm">
                ⚠️ Please verify this value
              </span>
            )}
          </div>
        );
      })}
    </form>
  );
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "documentClassification": {
    "documentType": "AADHAAR_FRONT",
    "confidence": 95,
    "side": "front"
  },
  "extractedData": {
    "documentNumber": "735653806992",
    "name": "John Doe",
    "dateOfBirth": "15/07/2006",
    "gender": "Male",
    "pinCode": "400706",
    "confidenceScore": 95,
    "lowConfidenceFields": []
  },
  "validation": {
    "status": "VALID",
    "needsReview": false
  },
  "processingMetrics": {
    "totalTime": 2340,
    "preprocessingTime": 150,
    "ocrTime": 1800
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "OCR processing failed",
  "message": "OCR.Space API error: 429"
}
```

## Best Practices

### 1. Image Compression
```typescript
const compressImage = (imageBase64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageBase64;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Resize to 1280x1024
      canvas.width = 1280;
      canvas.height = 1024;
      ctx?.drawImage(img, 0, 0, 1280, 1024);
      
      // Compress to 90% quality
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
  });
};
```

### 2. Error Handling
```typescript
try {
  const result = await processImage(imageBase64, 'front');
  
  if (!result.success) {
    if (result.message.includes('429')) {
      showError('Rate limit exceeded. Please wait a moment.');
    } else if (result.message.includes('401')) {
      showError('OCR service configuration error.');
    } else {
      showError('Failed to process image. Please try again.');
    }
  }
} catch (err) {
  showError('Network error. Please check your connection.');
}
```

### 3. Performance Optimization
```typescript
// Cache document type for quick access
const documentTypeCache = new Map<string, string>();

const getCachedType = (imageHash: string) => {
  return documentTypeCache.get(imageHash);
};

const cacheType = (imageHash: string, docType: string) => {
  documentTypeCache.set(imageHash, docType);
};
```

### 4. User Feedback
```typescript
function displayProcessingMetrics(metrics: any) {
  console.log(`Processing took ${metrics.totalTime}ms`);
  console.log(`  - Image prep: ${metrics.preprocessingTime}ms`);
  console.log(`  - OCR: ${metrics.ocrTime}ms`);
}
```

## Common Issues

### Low Confidence Results
- Ensure good lighting
- Keep document flat and straight
- Avoid glare or reflections
- Use high-resolution camera

### Document Not Detected
- Ensure entire document is visible
- Try different angle/lighting
- Check document is supported

### Slow Processing
- Compress image before sending
- Check internet connection
- Monitor OCR quota usage

## Environment Variables

Your OCR.Space API key is already configured:
- `OCR_SPACE_API_KEY` - Set in backend environment

No additional setup needed for frontend!

## Testing

Test with these document types:
1. Aadhaar Card (front & back)
2. PAN Card
3. Passport
4. Driving Licence
5. Voter ID
6. RC Book

Each should return auto-detected document type with extracted fields.

## Next Steps

1. Create form components for each document type
2. Implement confidence-based highlighting
3. Add manual verification workflow
4. Set up analytics tracking
5. Monitor OCR metrics

Happy integrating! 🚀
