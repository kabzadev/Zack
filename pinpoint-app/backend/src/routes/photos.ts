import express, { Request, Response } from 'express';
import multer from 'multer';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  ContainerClient,
} from '@azure/storage-blob';

const router = express.Router();

// Azure Blob Storage configuration
// Set AZURE_STORAGE_CONNECTION_STRING in .env or environment
const CONTAINER_NAME = 'photos';

function getConnectionString(): string {
  const cs = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!cs) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
  }
  return cs;
}

function getContainerClient(): ContainerClient {
  const blobServiceClient = BlobServiceClient.fromConnectionString(getConnectionString());
  return blobServiceClient.getContainerClient(CONTAINER_NAME);
}

// Configure multer for memory storage (files stored in buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, HEIC) are allowed'));
    }
  },
});

/**
 * Generate a SAS URL for a blob (since public access is disabled on the account)
 */
function generateSasUrl(blobName: string): string {
  const cs = getConnectionString();
  // Parse account name and key from connection string
  const accountNameMatch = cs.match(/AccountName=([^;]+)/);
  const accountKeyMatch = cs.match(/AccountKey=([^;]+)/);

  if (!accountNameMatch || !accountKeyMatch) {
    // Fallback: return the direct blob URL
    return `https://pinpointpaintphotos.blob.core.windows.net/${CONTAINER_NAME}/${blobName}`;
  }

  const accountName = accountNameMatch[1];
  const accountKey = accountKeyMatch[1];
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: CONTAINER_NAME,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      startsOn: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago (clock skew)
      expiresOn: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
    sharedKeyCredential
  ).toString();

  return `https://${accountName}.blob.core.windows.net/${CONTAINER_NAME}/${blobName}?${sasToken}`;
}

/**
 * POST /upload
 * Upload a photo for a customer
 * Body (multipart/form-data): file, customerId, photoType
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { customerId, photoType } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    const validPhotoTypes = ['before', 'after', 'visualization', 'room'];
    const type = photoType && validPhotoTypes.includes(photoType) ? photoType : 'room';

    // Create blob name: {customerId}/{timestamp}-{photoType}.{ext}
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop() || 'jpg';
    const blobName = `${customerId}/${timestamp}-${type}.${extension}`;

    // Upload to Azure Blob Storage
    const containerClient = getContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
      },
    });

    // Generate SAS URL for access
    const url = generateSasUrl(blobName);

    res.json({
      success: true,
      url,
      filename: `${timestamp}-${type}.${extension}`,
      photoType: type,
      createdAt: new Date().toISOString(),
      blobName,
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

/**
 * GET /:customerId
 * List all photos for a customer
 */
router.get('/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    const photos: Array<{
      url: string;
      photoType: string;
      createdAt: string;
      filename: string;
    }> = [];

    // List blobs with the customer prefix
    const containerClient = getContainerClient();
    const prefix = `${customerId}/`;
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      // Parse photo type and timestamp from filename
      // Format: {timestamp}-{photoType}.{ext}
      const filename = blob.name.replace(prefix, '');
      const match = filename.match(/^(\d+)-(\w+)\./);

      const photoType = match ? match[2] : 'unknown';
      const timestamp = match ? parseInt(match[1], 10) : 0;
      const createdAt = timestamp
        ? new Date(timestamp).toISOString()
        : (blob.properties.createdOn?.toISOString() || new Date().toISOString());

      const url = generateSasUrl(blob.name);

      photos.push({
        url,
        photoType,
        createdAt,
        filename,
      });
    }

    // Sort by createdAt descending (newest first)
    photos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ photos, count: photos.length });
  } catch (error) {
    console.error('Photo list error:', error);
    res.status(500).json({ error: 'Failed to list photos' });
  }
});

/**
 * DELETE /:customerId/:filename
 * Delete a specific photo
 */
router.delete('/:customerId/:filename', async (req: Request, res: Response) => {
  try {
    const { customerId, filename } = req.params;

    if (!customerId || !filename) {
      return res.status(400).json({ error: 'customerId and filename are required' });
    }

    const blobName = `${customerId}/${filename}`;
    const containerClient = getContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const exists = await blockBlobClient.exists();
    if (!exists) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    await blockBlobClient.delete();

    res.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Photo delete error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;
