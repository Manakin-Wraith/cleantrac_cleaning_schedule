# core/sms_utils.py
import re

def validate_e164(phone_number):
    """
    Validates if a phone number is in E.164 format.
    
    Args:
        phone_number (str): The phone number to validate.
        
    Returns:
        bool: True if the phone number is in E.164 format, False otherwise.
    """
    # Basic check, you might want more robust validation
    return bool(re.match(r'^\+[1-9]\d{1,14}$', phone_number))

def send_sms(to_phone_number, body):
    """
    Simulates sending an SMS by printing the details to the console.
    For local development and testing when SMS provider is removed.
    """
    print("\n--- SIMULATING SMS SEND --- (sms_utils.py)")
    print(f"To: {to_phone_number}")
    print(f"Body: {body}")
    print("--- END SIMULATING SMS SEND ---\n")

    # Simulate success
    return True, "SMS simulated successfully and printed to console."
