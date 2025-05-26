**The Core Principle: No Verified Thermometer, No Temperature Logging.**

This significantly impacts the user flow for temperature checks. Here's a revised brainstorm incorporating this prerequisite:

**Revised UI/UX Flow and Components:**

**1. Application Start / Dashboard:**

*   **Prominent Status Indicator for Thermometers:**
    *   A section on the dashboard clearly showing:
        *   "Available Verified Thermometers: [Number]"
        *   "Thermometers Requiring Verification: [Number]" (with a link to the verification screen).
*   **Gating "Temperature Logs" Access:**
    *   If no thermometers are currently verified, the "Log Temperatures" button/link could be:
        *   **Disabled:** With a tooltip saying "No verified thermometers available. Please complete verification first."
        *   **Redirects:** Clicking it takes the user directly to the "Thermometer Verification" screen with a message like "You must verify a thermometer before logging temperatures."

**2. Thermometer Verification Screen (Unchanged from before but its priority is higher):**

*   This screen remains the primary way to get a thermometer into a "Verified" state.
*   **Key Fields:** Date, Calibrated Instrument No., Thermometer Serial No. (dropdown/autocomplete of existing, or add new), Thermometer Reading After Verification, Calibrated By.
*   **Outcome:** Successfully submitting this form should update the status of the selected `Thermometer` in the database to "Verified" and record the `verification_date`.
*   **(Optional but Recommended) Verification Expiry:**
    *   The system could automatically set an expiry date for the verification (e.g., 1 month, 3 months, based on policy).
    *   This would allow for proactive notifications for re-verification.

**3. Starting Temperature Logs - THE CRITICAL JUNCTION:**

*   **Scenario 1: User has a verified thermometer.**
    *   When the user navigates to "Temperature Logs":
        *   **Step 1: Select Active Thermometer.**
            *   A modal dialog or an initial section appears.
            *   **"Select Thermometer for this Session:"**
            *   A `Select` dropdown listing *only* thermometers that are currently "Verified" and not past their (optional) expiry date.
            *   The dropdown should display essential info: `Serial No. (e.g., 110681-1) - Verified on: [Date]`
            *   User selects a thermometer. This thermometer is now "active" for the subsequent temperature entries.
        *   **Step 2: Proceed to Temperature Logging.**
            *   The main temperature logging interface (list of areas/units as cards) appears.
            *   **Clear Indication:** A persistent display at the top of the screen: "Using Thermometer: [Selected Serial No.]".
            *   Each temperature log entry will be associated with this selected thermometer.

*   **Scenario 2: No verified thermometers are available.**
    *   When the user navigates to "Temperature Logs":
        *   A clear message is displayed: "No Verified Thermometers Found. Temperature logging requires a recently verified thermometer."
        *   **Action Button:** "Go to Thermometer Verification" (links directly to the verification form).
        *   The temperature logging interface (area cards) is NOT shown or is disabled.

**4. Temperature Logs Screen (Data Entry - after selecting a verified thermometer):**

*   Largely the same as before (cards for each area, AM/PM fields, corrective action, photo).
*   **Crucial Backend Link:** When saving a temperature log, it **must** be associated with the `Thermometer` (and ideally the specific `ThermometerVerification` record) that was selected at the start of the session.

**Visual Cues & User Experience:**

*   **Thermometer Status Colors:**
    *   In any list or dropdown where thermometers are shown (e.g., in the selection step, or in a future "Manage Thermometers" screen):
        *   **Green icon/text:** Verified
        *   **Amber icon/text:** Verification due soon (if expiry is implemented)
        *   **Red icon/text:** Verification overdue / Not Verified
*   **Clear Error/Guidance Messages:** If a user tries to bypass the verification step, the system should gently but firmly guide them.

**Data Model Implications (Refined):**

*   **`Thermometer` Model:**
    *   `serial_number` (CharField, unique)
    *   `model_identifier` (CharField, e.g., "110681-1", "Zonde")
    *   `status` (CharField, choices: 'Verified', 'Needs Verification', 'Out of Service')
    *   `last_verification_date` (DateField, nullable)
    *   `verification_expiry_date` (DateField, nullable)
*   **`ThermometerVerificationRecord` Model:**
    *   `thermometer` (ForeignKey to `Thermometer`)
    *   `date_verified` (DateField)
    *   `calibrated_instrument_no` (CharField)
    *   `reading_after_verification` (DecimalField)
    *   `calibrated_by` (ForeignKey to User, or CharField)
    *   `manager_signature` (ImageField or TextField)
    *   `corrective_action` (TextField, nullable)
    *   `photo_evidence` (ImageField, nullable)
*   **`TemperatureLog` Model:**
    *   `area_unit` (ForeignKey to `AreaUnit`)
    *   `log_datetime` (DateTimeField - or separate DateField and AM/PM indicator)
    *   `temperature_reading` (DecimalField)
    *   `time_period` (CharField, choices: 'AM', 'PM')
    *   `corrective_action` (TextField, nullable)
    *   `photo` (ImageField, nullable)
    *   `logged_by` (ForeignKey to User)
    *   `thermometer_used` (ForeignKey to `Thermometer`)
    *   `verification_record_at_time_of_log` (ForeignKey to `ThermometerVerificationRecord` - captures the *specific* verification that was active for this reading)

**Prototyping Order Adjusted:**

1.  **Thermometer Model & Verification Form/Screen:** This is now foundational. Get this working first, including updating the thermometer's status.
2.  **Temperature Log - Thermometer Selection Step:** Implement the logic to only show verified thermometers.
3.  **Temperature Log - Data Entry Screen:** Link entries to the selected thermometer.
4.  **Camera Component:** Integrate for both verification and temperature logs.
5.  **Dashboard:** Add status indicators.

This revised flow ensures that the critical prerequisite of thermometer verification is met *before* any temperature checks can be logged, directly reflecting the process outlined in your forms. This makes the system more robust and compliant.