
---

## 📁 Project Structure

```
src/
├── domain/                      # Business Logic Layer (Pure TypeScript)
│   ├── models/
│   │   ├── rate.ts             # Core domain: RateRequest, RateQuote, Parcel
│   │   ├── config.ts           # Environment configuration types
│   │   └── common.ts           # Shared types (PaginationMeta, etc.)
│   │
│   ├── schemas/
│   │   └── rateSchema.ts       # Zod validation schemas
│   │
│   └── errors/
│       └── appError.ts         # Custom error hierarchy (CarrierError, NetworkError, etc.)
│
├── application/                 # Use Cases / Business Rules
│   └── services/
│       └── rateService.ts      # Orchestrates rate shopping logic
│
├── providers/                   # Abstract Interfaces
│   └── carrierProvider.ts      # RateProvider interface (ISP from SOLID)
│
├── repositories/                # Data Access Layer
│   └── carrierRepository.ts    # Aggregates multiple carrier providers
│
├── infrastructure/              # External Dependencies
│   ├── config/
│   │   └── env.ts              # Environment variable loading & validation
│   │
│   ├── http/
│   │   ├── httpClient.ts       # HTTP client interface
│   │   └── fetchHttpClient.ts  # Fetch-based implementation with timeout
│   │
│   ├── auth/
│   │   └── oauthManager.ts     # Generic OAuth 2.0 token manager (UPS/FedEx)
│   │
│   └── carriers/
│       ├── ups/
│       │   ├── upsProvider.ts  # UPS API integration
│       │   └── upsTypes.ts     # UPS-specific API types
│       │
│       └── fedex/
│           ├── fedexProvider.ts # FedEx API integration
│           └── fedexTypes.ts    # FedEx-specific API types
│
├── controllers/                 # HTTP Request Handlers
│   └── rateController.ts       # Handles POST /api/v1/rates
│
├── routes/                      # API Route Definitions
│   ├── index.ts                # Main router
│   └── v1/
│       ├── index.ts            # v1 API routes
│       └── rateRoutes.ts       # Rate shopping endpoints
│
├── middleware/                  # Express Middleware
│   ├── asyncHandler.ts         # Async error wrapper
│   └── errorHandler.ts         # Global error handler
│
├── utils/                       # Helper Functions
│   ├── responseFormatter.ts    # Standardized API responses
│   └── errorHandlerUtil.ts     # Controller error handling
│
├── tests/                       # Integration Tests
│   └── ups.test.ts             # UPS provider tests (stubbed)
│
└── index.ts                     # Application entry point
```

## 🎯 Design Decisions

### **Layer Separation**
```
HTTP Request
    ↓
Controller (handle HTTP)
    ↓
Service (business rules)
    ↓
Repository (data aggregation)
    ↓
Provider (carrier integration)
    ↓
External API (UPS/FedEx)
```

**What it means:**
- **Domain layer** (`domain/`) = Pure business logic. No Express, no HTTP, no carrier APIs.
- **Application layer** (`application/`) = Use cases. "Get cheapest rate" logic lives here.
- **Infrastructure layer** (`infrastructure/`) = External stuff. UPS API, HTTP client, OAuth.
- **Interface layer** (`controllers/`, `routes/`) = HTTP handling only.

## 🚀 How to Run

### **Installation**
```bash
git clone <repo-url>
cd cybership-test
npm install
```

### **Environment Setup**
Create `.env` file with your carrier credentials:
```env
PORT=3000

# UPS API Credentials (get from UPS Developer Portal)
UPS_URL=https://wwwcie.ups.com
UPS_CLIENT_ID=your_ups_client_id
UPS_CLIENT_SECRET=your_ups_secret

# FedEx API Credentials (get from FedEx Developer Portal)
FEDEX_URL=https://apis-sandbox.fedex.com
FEDEX_CLIENT_ID=your_fedex_client_id
FEDEX_CLIENT_SECRET=your_fedex_secret
FEDEX_ACCOUNT_NUMBER=your_fedex_account
```

**Note:** Real API credentials required. For testing without credentials, use stubbed integration tests (`npm test`).

### **Development**
```bash
npm run dev        # Start with hot reload
```

### **Testing**
```bash
npm test           # Run integration tests (stubbed, no API calls)
npm run test:watch # Watch mode
```

---

## 📡 API Usage

### **Get Shipping Rates**
```bash
POST http://localhost:3000/api/v1/rates
Content-Type: application/json

{
  "origin": {
    "country": "US",
    "postalCode": "10001",
    "city": "New York"
  },
  "destination": {
    "country": "US",
    "postalCode": "90001",
    "city": "Los Angeles"
  },
  "parcels": [
    {
      "weight": 5,
      "length": 10,
      "width": 8,
      "height": 6
    }
  ]
}

```

---

## 🔧 Future Improvements

1. **Caching** - Redis for 5-min rate quotes
2. **Retry Logic** - Exponential backoff for transient failures
3. **Rate Limiting** - Respect carrier limits (100 req/min)
4. **Circuit Breaker** - Skip failing carriers temporarily
5. **Observability** - Structured logs + metrics
6. **Database** - Store rate history for analytics

---
