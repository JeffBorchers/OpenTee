# Multi-Platform Booking Architecture

## Overview

OpenTee is designed to support multiple booking platforms through a unified adapter interface. This document describes the architecture for adding and managing platform integrations.

## Platform Adapters

```
Platform Adapters:
├── USchedule (PGA Tour Superstores) — BUILT
├── GolfNow — TODO
├── TeeOff.com — TODO
├── Course-specific systems — TODO
└── Voice booking (Twilio) — ROADMAP
```

## Adapter Interface Specification

Every platform adapter must implement the following interface:

```typescript
interface BookingAdapter {
  // Metadata
  readonly name: string;                    // e.g., "uschedule", "golfnow"
  readonly displayName: string;             // e.g., "USchedule (PGA Tour Superstore)"
  readonly supportedFeatures: AdapterFeature[];
  
  // Core Methods
  checkAvailability(
    date: Date,
    preferences: BookingPreferences
  ): Promise<AvailableSlot[]>;
  
  bookSlot(
    slot: Slot,
    credentials: StoredCredentials
  ): Promise<BookingResult>;
  
  getDropSchedule(): Promise<DropSchedule>;
  
  authenticate(
    credentials: RawCredentials
  ): Promise<AuthResult>;
  
  // Optional Methods
  cancelBooking?(
    bookingId: string,
    credentials: StoredCredentials
  ): Promise<CancellationResult>;
  
  healthCheck?(): Promise<HealthStatus>;
}

interface BookingPreferences {
  timeRange?: { start: string; end: string };  // "09:00" to "12:00"
  daysOfWeek?: number[];                         // 0=Sun, 6=Sat
  maxPrice?: number;
  minDuration?: number;                          // minutes
  preferredLocations?: string[];
}

interface AvailableSlot {
  id: string;
  platform: string;
  locationId: string;
  locationName: string;
  date: Date;
  time: string;
  duration: number;           // minutes
  price?: number;
  available: boolean;
  bookingUrl?: string;
  metadata?: Record<string, any>;
}

interface DropSchedule {
  advanceDays: number;        // How many days ahead slots release
  dropTime: string;           // "03:00" in local time
  dropTimezone: string;       // "America/New_York"
  dropDayOfWeek?: number;     // If drops only happen on certain days
}
```

## Adding a New Platform

### Step 1: Create Adapter File

Create `src/adapters/{platform-name}.ts`:

```typescript
import { BookingAdapter, BookingPreferences, AvailableSlot, Slot, StoredCredentials, RawCredentials, AuthResult, BookingResult, DropSchedule } from './types';

export class GolfNowAdapter implements BookingAdapter {
  readonly name = 'golfnow';
  readonly displayName = 'GolfNow';
  readonly supportedFeatures = ['availability', 'booking', 'cancellation'];
  
  async checkAvailability(
    date: Date,
    preferences: BookingPreferences
  ): Promise<AvailableSlot[]> {
    // 1. Build API request based on platform specifics
    // 2. Handle authentication for the request
    // 3. Parse response into normalized AvailableSlot[]
    // 4. Handle rate limiting and errors
  }
  
  async bookSlot(slot: Slot, credentials: StoredCredentials): Promise<BookingResult> {
    // 1. Decrypt credentials
    // 2. Build booking request
    // 3. Submit booking
    // 4. Return confirmation or error
  }
  
  async getDropSchedule(): Promise<DropSchedule> {
    // Return platform-specific drop schedule
    // May need to be per-course for some platforms
  }
  
  async authenticate(credentials: RawCredentials): Promise<AuthResult> {
    // 1. Validate credentials with platform
    // 2. Return tokens or session data for encryption/storage
  }
}
```

### Step 2: Register Adapter

Add to `src/adapters/index.ts`:

```typescript
import { GolfNowAdapter } from './golfnow';

export const adapters: Record<string, BookingAdapter> = {
  uschedule: new UScheduleAdapter(),
  golfnow: new GolfNowAdapter(),  // Add here
  // ... other adapters
};
```

### Step 3: Add Platform Configuration

Add platform-specific settings to `config/platforms.json`:

```json
{
  "golfnow": {
    "baseUrl": "https://api.golfnow.com/v1",
    "rateLimit": {
      "requestsPerMinute": 60,
      "burstLimit": 10
    },
    "timeouts": {
      "connect": 5000,
      "request": 30000
    },
    "retryPolicy": {
      "maxRetries": 3,
      "backoffMs": [1000, 2000, 4000]
    }
  }
}
```

### Step 4: Add Tests

Create `tests/adapters/{platform-name}.test.ts`:

```typescript
describe('GolfNowAdapter', () => {
  test('checkAvailability returns normalized slots', async () => {
    // Mock API response
    // Verify normalization
  });
  
  test('handles rate limiting gracefully', async () => {
    // Test retry behavior
  });
});
```

## Credential Storage

### Security Requirements

- **Encryption:** AES-256-GCM for all stored credentials
- **Key Management:** Encryption keys derived from user-provided master password (PBKDF2 with 100,000 iterations)
- **Storage Location:** Local filesystem only for self-hosted; encrypted database for hosted version
- **Memory:** Credentials decrypted only when needed, never logged

### Storage Schema

```typescript
interface StoredCredentials {
  platform: string;
  userId: string;
  encryptedData: string;        // AES-256-GCM ciphertext (base64)
  iv: string;                   // Initialization vector (base64)
  authTag: string;              // GCM auth tag (base64)
  createdAt: Date;
  lastUsed?: Date;
  expiresAt?: Date;
}

interface DecryptedCredentials {
  username?: string;
  password?: string;
  apiKey?: string;
  sessionToken?: string;
  refreshToken?: string;
  cookies?: Record<string, string>;
}
```

### Credential Flow

```
1. User enters credentials in UI
2. Frontend sends credentials over HTTPS
3. Backend validates with platform (authenticate())
4. Valid credentials encrypted with user's key
5. Encrypted blob stored in database/filesystem
6. Original credentials purged from memory
7. On booking: decrypt -> use -> purge
```

## Rate Limiting Strategy

### Per-Platform Limits

| Platform     | Requests/Min | Burst | Notes                              |
|--------------|--------------|-------|------------------------------------|
| USchedule    | 30           | 5     | Conservative; unknown limits       |
| GolfNow      | 60           | 10    | Documented API limits              |
| TeeOff       | 45           | 8     | Estimated; test carefully          |
| Voice/Twilio | 10           | 3     | Expensive; minimize calls          |

### Rate Limiter Implementation

```typescript
class PlatformRateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  async waitForSlot(platform: string): Promise<void> {
    const config = PLATFORM_CONFIGS[platform];
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    // Get recent requests
    const recent = (this.requests.get(platform) || [])
      .filter(t => t > windowStart);
    
    // Check if we're at limit
    if (recent.length >= config.rateLimit.requestsPerMinute) {
      const oldest = Math.min(...recent);
      const waitMs = oldest + 60000 - now + 100; // +100ms buffer
      await sleep(waitMs);
    }
    
    // Record this request
    recent.push(now);
    this.requests.set(platform, recent);
  }
}
```

## Error Handling and Retry Logic

### Error Categories

```typescript
enum BookingErrorType {
  NETWORK_ERROR,          // Connection failed
  RATE_LIMITED,           // 429 response
  AUTH_FAILED,            // 401/403 - credentials invalid
  SLOT_UNAVAILABLE,       // Slot taken before we could book
  PLATFORM_ERROR,         // 500 from platform
  VALIDATION_ERROR,       // Invalid request data
  TIMEOUT,                // Request timed out
}
```

### Retry Policy

```typescript
interface RetryPolicy {
  maxRetries: number;
  backoffMs: number[];     // Exponential backoff values
  retryableErrors: BookingErrorType[];
}

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  backoffMs: [1000, 2000, 4000],
  retryableErrors: [
    BookingErrorType.NETWORK_ERROR,
    BookingErrorType.RATE_LIMITED,
    BookingErrorType.PLATFORM_ERROR,
    BookingErrorType.TIMEOUT,
  ],
};

async function withRetry<T>(
  operation: () => Promise<T>,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (!policy.retryableErrors.includes(error.type)) {
        throw error; // Non-retryable
      }
      
      if (attempt < policy.maxRetries) {
        await sleep(policy.backoffMs[attempt]);
      }
    }
  }
  
  throw lastError;
}
```

### Booking-Specific Error Handling

```typescript
async function bookWithConflictRetry(
  slot: Slot,
  credentials: StoredCredentials
): Promise<BookingResult> {
  try {
    return await adapter.bookSlot(slot, credentials);
  } catch (error) {
    if (error.type === BookingErrorType.SLOT_UNAVAILABLE) {
      // Check for similar available slots
      const alternatives = await adapter.checkAvailability(
        slot.date,
        { timeRange: { start: slot.time, end: addHours(slot.time, 2) } }
      );
      
      if (alternatives.length > 0) {
        // Notify user of alternatives
        await notifyAlternatives(slot, alternatives);
      }
    }
    throw error;
  }
}
```

## Monitoring and Health Checks

### Per-Platform Health Status

```typescript
interface PlatformHealth {
  platform: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  responseTimeMs: number;
  errorRate: number;          // 0-1
  recentErrors: ErrorEvent[];
}
```

### Health Check Implementation

```typescript
async function checkPlatformHealth(adapter: BookingAdapter): Promise<PlatformHealth> {
  const start = Date.now();
  
  try {
    // Try a minimal availability check
    await adapter.checkAvailability(new Date(), {});
    
    return {
      platform: adapter.name,
      status: 'healthy',
      lastCheck: new Date(),
      responseTimeMs: Date.now() - start,
      errorRate: getRecentErrorRate(adapter.name),
      recentErrors: getRecentErrors(adapter.name),
    };
  } catch (error) {
    return {
      platform: adapter.name,
      status: 'down',
      lastCheck: new Date(),
      responseTimeMs: Date.now() - start,
      errorRate: 1,
      recentErrors: [{ error, timestamp: new Date() }],
    };
  }
}
```

## Voice Booking Architecture (Roadmap)

### Twilio Integration

```typescript
interface VoiceBookingAdapter extends BookingAdapter {
  callToBook(
    slot: Slot,
    phoneNumber: string,
    script: BookingScript
  ): Promise<VoiceCallResult>;
}

interface BookingScript {
  greeting: string;
  requestTeeTime: string;
  confirmDetails: string;
  handleRejection: string;
  alternatives?: string[];
}
```

### AI-Powered Conversation

```typescript
// Uses OpenAI or similar for natural conversation
async function handleVoiceCall(
  call: TwilioCall,
  context: BookingContext
): Promise<VoiceResponse> {
  // 1. Transcribe user speech
  const transcript = await transcribe(call.audio);
  
  // 2. Generate response based on booking context
  const response = await generateResponse(transcript, context);
  
  // 3. Convert to speech and return
  return synthesize(response);
}
```

## Testing Strategy

### Unit Tests

- Each adapter method tested in isolation
- Mock HTTP responses for platform APIs
- Verify error handling and retry logic

### Integration Tests

- Test against platform sandboxes (when available)
- Verify end-to-end booking flow
- Test credential encryption/decryption

### Load Tests

- Simulate high-frequency availability checks
- Verify rate limiter behavior
- Test concurrent booking attempts

## Security Considerations

1. **Never log credentials** - Mask all sensitive fields in logs
2. **Rotate keys** - Support key rotation for long-running instances
3. **Audit trail** - Log all booking attempts (success/failure) with timestamps
4. **IP rotation** - For high-volume monitoring, rotate source IPs to avoid blocks
5. **Terms of Service** - Review each platform's ToS before integration
