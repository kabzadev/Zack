import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

if (!accountSid || !authToken) {
  console.warn('Twilio credentials not configured. SMS will not work.');
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export const sendOTP = async (phoneNumber: string): Promise<boolean> => {
  if (!client || !verifyServiceSid) {
    console.error('Twilio not configured. Cannot send OTP.');
    return false;
  }

  try {
    // Normalize phone number to E.164 format
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    await client.verify.v2.services(verifyServiceSid)
      .verifications
      .create({ to: normalizedPhone, channel: 'sms' });
    
    console.log(`OTP sent to ${normalizedPhone}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
};

export const verifyOTP = async (phoneNumber: string, code: string): Promise<boolean> => {
  if (!client || !verifyServiceSid) {
    console.error('Twilio not configured. Cannot verify OTP.');
    return false;
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    const verificationCheck = await client.verify.v2.services(verifyServiceSid)
      .verificationChecks
      .create({ to: normalizedPhone, code });
    
    return verificationCheck.status === 'approved';
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
};

export const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 1 and has 11 digits, it's already E.164 (US)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // If it has 10 digits, add +1 (US)
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If it already has a +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  return `+${cleaned}`;
};

export const formatPhoneDisplay = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(1?)(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[2]}) ${match[3]}-${match[4]}`;
  }
  return phone;
};