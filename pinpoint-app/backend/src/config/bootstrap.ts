import * as appInsights from 'applicationinsights';
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// ─── Constants ───
const vaultName = 'pinpointpaint-vault';
const vaultUrl = `https://${vaultName}.vault.azure.net`;

// ─── State ───
export let dbPool: Pool;
export let telemetryClient: appInsights.TelemetryClient;

/**
 * The Master Bootstrap Sequence
 * Ensures resources are loaded in the correct order.
 */
export async function bootstrap() {
  console.log('🚀 Starting Pinpoint Backend Bootstrap...');

  try {
    // 1. Load Secrets from Key Vault
    if (process.env.NODE_ENV === 'production' || process.env.USE_KEYVAULT) {
      console.log('🔑 Connecting to Azure Key Vault...');
      const credential = new DefaultAzureCredential();
      const client = new SecretClient(vaultUrl, credential);
      
      const secretNames = [
        'TWILIO-ACCOUNT-SID',
        'TWILIO-AUTH-TOKEN',
        'TWILIO-VERIFY-SERVICE-SID',
        'ELEVENLABS-API-KEY',
        'GEMINI-API-KEY',
        'AZURE-PG-PASSWORD'
      ];

      for (const name of secretNames) {
        const secret = await client.getSecret(name);
        process.env[name.replace(/-/g, '_')] = secret.value;
      }
      console.log('✅ Secrets loaded successfully.');
    }

    // 2. Initialize Telemetry (Application Insights)
    // Using the Connection String I provisioned earlier
    const appInsightsKey = '5292e921-149e-4334-af41-3acce88de317'; // Instrumentation Key
    appInsights.setup(appInsightsKey)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(true)
      .start();
    
    telemetryClient = appInsights.defaultClient;
    console.log('📊 Telemetry (Application Insights) initialized.');

    // 3. Initialize Database Pool
    console.log('🐘 Connecting to PostgreSQL...');
    dbPool = new Pool({
      host: process.env.AZURE_PG_HOST,
      port: 5432,
      database: process.env.AZURE_PG_DATABASE || 'pinpoint_db',
      user: process.env.AZURE_PG_USER,
      password: process.env.AZURE_PG_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 20
    });

    // Test connection
    const client = await dbPool.connect();
    console.log('✅ PostgreSQL connection established.');
    client.release();

    console.log('⭐ Bootstrap Complete.');
  } catch (error: any) {
    console.error('❌ Bootstrap Failed:', error.message);
    if (telemetryClient) {
      telemetryClient.trackException({ exception: error });
    }
    // Fail-fast in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}
