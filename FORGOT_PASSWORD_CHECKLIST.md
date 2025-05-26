# Task Checklist: Forgot Password via SMS Feature

This checklist outlines the steps to implement the 'Forgot Password via SMS' functionality.

## Phase 1: Backend (Django)
- [x] Create `PasswordResetToken` model (`core/models.py`).
- [x] Create and apply database migrations for `PasswordResetToken`.
- [x] Create placeholder SMS utility (`core/sms_utils.py`). <!-- Placeholder step, actual implementation follows -->
- [x] Create `PasswordResetRequestSerializer` and `PasswordResetConfirmSerializer` (`core/serializers.py`).
- [x] Create `PasswordResetRequestView` and `PasswordResetConfirmView` (`core/views.py`).
- [x] Add URL patterns for new views (`core/urls.py`).

## Phase 2: Frontend (React)
- [ ] **`frontend/src/services/authService.js` Updates:**
    - [ ] Add `requestPasswordReset(username)` function.
    - [ ] Add `confirmPasswordReset(username, token, newPassword)` function.
- [ ] **`frontend/src/pages/LoginPage.jsx` Modifications:**
    - [ ] Add "Forgot Password?" link/button.
    - [ ] Implement UI for password reset (e.g., a modal or a separate section/page):
        - [ ] **Step 1 (Request Token):** Form to enter username. On submit, call `requestPasswordReset`.
        - [ ] **Step 2 (Confirm Reset):** Form to enter token (received via SMS) and new password (with confirmation). On submit, call `confirmPasswordReset`.
    - [ ] Handle API responses: display success messages (e.g., "If an account with that username exists and has a phone number, an SMS has been sent.", "Password reset successfully.") and error messages.
- [ ] **(Optional) Create a new component for the password reset form if it becomes complex.**

## Phase 3: SMS Service Integration (User Task)
- [x] ~~Choose an SMS provider (e.g., Twilio, Vonage, AWS SNS). - User selected Twilio.~~
- [x] ~~Sign up for the service and obtain API credentials (API Key, Secret, Sender ID/Phone Number).~~
- [x] ~~Install the provider's Python SDK (e.g., `pip install twilio`).~~
- [x] ~~Securely configure API credentials in Django settings (e.g., using environment variables and `settings.py`).~~
    - ~~`TWILIO_ACCOUNT_SID = os.getenv('VITE_TWILIO_ACCOUNT_SID')` (or `VITE_TWILIO_ACCOUNT_SID` if using frontend .env)~~~
    - ~~`TWILIO_AUTH_TOKEN = os.getenv('VITE_TWILIO_AUTH_TOKEN')` (or `VITE_TWILIO_AUTH_TOKEN`)~~~
    - ~~`TWILIO_PHONE_NUMBER = os.getenv('VITE_TWILIO_PHONE_NUMBER')` (or `VITE_TWILIO_PHONE_NUMBER`)~~~
- [x] ~~Implement the actual SMS sending logic in `core/sms_utils.py` using the chosen provider's SDK (Twilio). *(Code complete, user has set up credentials in .env, settings.py updated to load them)*.~~
- [x] **UPDATE:** SMS provider integration (Twilio) has been removed. `core/sms_utils.py` now simulates SMS sending by printing to the console for local development.

## Phase 4: Testing
- [ ] **Backend API Testing (e.g., using Postman or `curl`):**
    - [ ] Test `/api/auth/password-reset/request/` with a valid username (with phone number).
    - [ ] Test with a valid username (without phone number).
    - [ ] Test with an invalid/non-existent username.
    - [ ] Test `/api/auth/password-reset/confirm/` with a valid token and new password.
    - [ ] Test with an expired token.
    - [ ] Test with an invalid token.
    - [ ] Test with mismatched username/token.
- [ ] **Frontend UI/UX Testing:**
    - [ ] Test the full flow: request token -> receive (simulated) SMS printed to console -> enter token and new password -> successful reset.
    - [ ] Test error handling for incorrect username format, weak password, incorrect token format.
    - [ ] Test UI responsiveness and clarity of messages.
- [ ] **End-to-End Testing (with simulated SMS):**
    - [ ] Verify console output for simulated SMS and the complete flow.
