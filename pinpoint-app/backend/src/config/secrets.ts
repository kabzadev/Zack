import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

const vaultName = 'pinpointpaint-vault';
const url = `https://${vaultName}.vault.azure.net`;

const credential = new DefaultAzureCredential();
const client = new SecretClient(url, credential);

export const secrets: Record<string, string> = {};

export async function initSecrets() {
  if (process.env.NODE_ENV !== 'production' && !process.env.USE_KEYVAULT) {
    console.log('Skipping Key Vault init (local dev)');
    return;
  }

  console.log('Initializing secrets from Key Vault...');
  
  const secretNames = [
    'TWILIO-ACCOUNT-SID',
    'TWILIO-AUTH-TOKEN',
    'TWILIO-VERIFY-SERVICE-SID',
    'ELEVENLABS-API-KEY',
    'GEMINI-API-KEY',
    'AZURE-PG-PASSWORD'
  ];

  try {
    for (const name of secretNames) {
      const secret = await client.getSecret(name);
      secrets[name] = secret.value || '';
      // Map to process.env for compatibility with existing code
      process.env[name.replace(/-/g, '_')] = secret.value;
    }
    console.log('All secrets loaded from Key Vault successfully');
  } catch (error: any) {
    console.error('Failed to load secrets from Key Vault:', error.message);
    // In dev, let it fall back to .env
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}
