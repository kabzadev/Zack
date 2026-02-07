# Pinpoint Painting App - Architecture & Infrastructure

## Overview
A premium, mobile-first PWA for painting contractors to manage customers, generate voice-driven estimates, and visualize colors using AI.

## Infrastructure (Azure)
- **Resource Group**: `Zach` (eastus2)
- **Frontend**: Azure Container App (`pinpoint-app`)
- **Backend**: Azure Container App (`pinpoint-backend`)
- **Database**: Azure Database for PostgreSQL Flexible Server (`pinpoint-db.postgres.database.azure.com`)
- **Storage**: Azure Blob Storage (`pinpointpaintphotos`) for customer/estimate photos.
- **Secrets Management**: Azure Key Vault (`pinpointpaint-vault`)
  - Managed via System-Assigned Managed Identity on the backend.
- **Observability**: Azure Application Insights (`pinpoint-insights`)

## Security Policy
- **Authentication**: SMS-based OTP via Twilio Verify.
- **Session Policy**: 7-day inactivity expiration.
- **Secrets**: Zero secrets in source code. All keys fetched from Key Vault at runtime.
- **Database**: SQLite for local dev, PostgreSQL for production.

## External Integrations
- **Twilio**: SMS OTP Verification.
- **ElevenLabs**: Voice AI Agents (Estimator & Assistant).
- **Gemini (Google)**: AI Image Visualization (Gemini 3 Pro).

## Deployment Flow
1. `az acr build` - Build cross-platform image.
2. `az containerapp update` - Deploy new revision.
3. Database migrations run on startup.
