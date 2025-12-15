# Profile Verification Tests

## Test Files Created

### 1. `verificationCode.test.js`
Tests for the VerificationCode model.

**Coverage:**
- ✅ Code generation (6-digit validation)
- ✅ Code creation with expiration
- ✅ Code validation and retrieval
- ✅ Code usage marking
- ✅ Old code cleanup
- ✅ Pending code invalidation

**Total: 13 test cases**

### 2. `profile.test.js`
Integration tests for profile controllers.

**Coverage:**
- ✅ Profile update request (`requestProfileUpdate`)
  - Field validation
  - Email format validation
  - Password hashing
  - Error handling
- ✅ Profile update confirmation (`confirmProfileUpdate`)
  - Code validation
  - Field encryption
  - Database updates
  - JWT refresh on email change
- ✅ Account deletion request (`requestAccountDeletion`)
  - Email sending
  - Code generation
- ✅ Account deletion confirmation (`confirmAccountDeletion`)
  - Code validation
  - Account deletion
  - Cookie clearing

**Total: 20+ test cases**

## Running the Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test verificationCode.test.js
npm test profile.test.js
```

### Run with Coverage
```bash
npm run test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

## Test Structure

All tests follow the existing pattern:
- Uses Vitest as the test runner
- Mocks external dependencies (database, email service, etc.)
- Tests both success and error scenarios
- Validates input/output contracts

## Expected Results

When running tests, you should see:
```
 ✓ verificationCode.test.js (13 tests)
   ✓ generateCode() (2 tests)
   ✓ createVerificationCode() (3 tests)
   ✓ findValidCode() (4 tests)
   ✓ markCodeAsUsed() (2 tests)
   ✓ cleanupOldCodes() (2 tests)
   ✓ invalidatePendingCodes() (2 tests)

 ✓ profile.test.js (20+ tests)
   ✓ POST /profile/request-update (6 tests)
   ✓ POST /profile/confirm-update (7 tests)
   ✓ POST /account/request-deletion (3 tests)
   ✓ POST /account/confirm-deletion (6 tests)

Test Files  2 passed (2)
     Tests  33 passed (33)
```

## Notes

- All database calls are mocked - no real database required for testing
- Email sending is mocked - no actual emails sent during tests
- Tests validate the business logic and data flow
- Edge cases and error scenarios are thoroughly tested

## Adding More Tests

To add more tests, follow the existing pattern:

1. Import necessary mocks at the top
2. Use `describe()` to group related tests
3. Use `beforeEach()` to set up test data
4. Use `it()` for individual test cases
5. Use `expect()` for assertions
6. Clean up with `afterEach()` if needed
