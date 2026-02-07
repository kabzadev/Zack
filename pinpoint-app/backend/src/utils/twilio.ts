import twilio from 'twilio';

let client: any = null;

const getClient = () => {
  if (client) return client;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.error('Twilio credentials not found in environment.');
    return null;
  }

  client = twilio(accountSid, authToken);
  return client;
};

export const sendOTP = async (phoneNumber: string): Promise<boolean> => {
  const twilioClient = getClient();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!twilioClient || !verifyServiceSid) {
    console.error('Twilio not configured. Cannot send OTP.');
    return false;
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    await twilioClient.verify.v2.services(verifyServiceSid)
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
  const twilioClient = getClient();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!twilioClient || !verifyServiceSid) {
    console.error('Twilio not configured. Cannot verify OTP.');
    return false;
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    const verificationCheck = await twilioClient.verify.v2.services(verifyServiceSid)
      .verificationChecks
      .create({ to: normalizedPhone, code });
    
    return verificationCheck.status === 'approved';
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
};

export const normalizePhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (phone.startsWith('+')) return phone;
  return `+${cleaned}`;
};

export const formatPhoneDisplay = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(1?)(\d{3})(\d{3})(\d{4})$/);
  if (match) return `(${match[2]}) ${match[3]}-${match[4]}`;
  return phone;
};
