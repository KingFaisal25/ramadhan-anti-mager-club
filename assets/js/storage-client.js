// Storage Client for Ramadhan Anti Mager Club
// Supports MinIO (local) and AWS S3 (production)

class StorageClient {
  constructor() {
    this.isConfigured = false;
    this.bucketName = 'ramadhan-app';
    this.init();
  }

  async init() {
    try {
      // Check if we're in development (MinIO) or production (S3)
      this.isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
      
      if (this.isDevelopment) {
        await this.setupMinIOClient();
      } else {
        await this.setupS3Client();
      }
      
      this.isConfigured = true;
      // console.log('✅ Storage client initialized successfully');
    } catch (error) {
      console.error('❌ Storage client initialization failed:', error);
      this.isConfigured = false;
    }
  }

  async setupMinIOClient() {
    // MinIO configuration for local development
    this.endpoint = 'http://localhost:9000';
    this.accessKey = 'ramadhanadmin';
    this.secretKey = 'StrongPassword123!';
    
    // Use MinIO's browser SDK
    this.minioClient = new MinIO.Client({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: this.accessKey,
      secretKey: this.secretKey
    });
  }

  async setupS3Client() {
    // AWS S3 configuration for production
    // These should be set as environment variables
    this.region = 'us-east-1';
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    
    // Use AWS SDK
    this.s3Client = new AWS.S3({
      region: this.region,
      credentials: new AWS.Credentials({
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey
      })
    });
  }

  // File upload with progress tracking
  async uploadFile(file, folder = 'temp/', metadata = {}) {
    if (!this.isConfigured) {
      throw new Error('Storage client not configured');
    }

    try {
      const fileName = `${folder}${Date.now()}_${this.sanitizeFileName(file.name)}`;
      const fileType = file.type;
      
      // Validate file type and size
      this.validateFile(file, folder);
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: file,
        ContentType: fileType,
        Metadata: {
          'original-filename': file.name,
          'uploaded-by': 'ramadhan-app',
          'upload-timestamp': Date.now().toString(),
          ...metadata
        }
      };

      let result;
      if (this.isDevelopment) {
        result = await this.minioClient.putObject(uploadParams);
      } else {
        result = await this.s3Client.upload(uploadParams).promise();
      }

      this.logOperation('upload', fileName, true);
      return {
        success: true,
        fileUrl: this.getFileUrl(fileName),
        fileName: fileName,
        etag: result.ETag
      };

    } catch (error) {
      this.logOperation('upload', file.name, false, error);
      throw this.handleError(error, 'upload');
    }
  }

  // File download
  async downloadFile(fileName) {
    if (!this.isConfigured) {
      throw new Error('Storage client not configured');
    }

    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileName
      };

      let data;
      if (this.isDevelopment) {
        data = await this.minioClient.getObject(params);
      } else {
        data = await this.s3Client.getObject(params).promise();
      }

      this.logOperation('download', fileName, true);
      return data.Body;

    } catch (error) {
      this.logOperation('download', fileName, false, error);
      throw this.handleError(error, 'download');
    }
  }

  // Delete file
  async deleteFile(fileName) {
    if (!this.isConfigured) {
      throw new Error('Storage client not configured');
    }

    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileName
      };

      if (this.isDevelopment) {
        await this.minioClient.removeObject(params);
      } else {
        await this.s3Client.deleteObject(params).promise();
      }

      this.logOperation('delete', fileName, true);
      return { success: true };

    } catch (error) {
      this.logOperation('delete', fileName, false, error);
      throw this.handleError(error, 'delete');
    }
  }

  // List files in a folder
  async listFiles(folder = '', limit = 100) {
    if (!this.isConfigured) {
      throw new Error('Storage client not configured');
    }

    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: folder,
        MaxKeys: limit
      };

      let objects;
      if (this.isDevelopment) {
        objects = await this.minioClient.listObjects(params);
      } else {
        const data = await this.s3Client.listObjectsV2(params).promise();
        objects = data.Contents;
      }

      this.logOperation('list', folder, true);
      return objects.map(obj => ({
        name: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        etag: obj.ETag
      }));

    } catch (error) {
      this.logOperation('list', folder, false, error);
      throw this.handleError(error, 'list');
    }
  }

  // Generate pre-signed URL for temporary access
  async getPresignedUrl(fileName, expiresIn = 3600) {
    if (!this.isConfigured) {
      throw new Error('Storage client not configured');
    }

    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileName,
        Expires: expiresIn
      };

      let url;
      if (this.isDevelopment) {
        url = await this.minioClient.presignedGetObject(params);
      } else {
        url = await this.s3Client.getSignedUrlPromise('getObject', params);
      }

      this.logOperation('presigned-url', fileName, true);
      return url;

    } catch (error) {
      this.logOperation('presigned-url', fileName, false, error);
      throw this.handleError(error, 'presigned-url');
    }
  }

  // Utility methods
  getFileUrl(fileName) {
    if (this.isDevelopment) {
      return `${this.endpoint}/${this.bucketName}/${fileName}`;
    } else {
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
    }
  }

  sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
  }

  validateFile(file, folder) {
    const config = this.getFolderConfig(folder);
    
    // Check file size
    if (config.max_size && file.size > this.parseSize(config.max_size)) {
      throw new Error(`File size exceeds limit: ${config.max_size}`);
    }
    
    // Check file type
    if (config.allowed_types && !config.allowed_types.includes(file.type)) {
      throw new Error(`File type not allowed: ${file.type}`);
    }
  }

  getFolderConfig(folder) {
    const folderConfigs = {
      'avatars/': { max_size: '5MB', allowed_types: ['image/jpeg', 'image/png', 'image/webp'] },
      'achievements/': { max_size: '2MB', allowed_types: ['image/svg+xml', 'image/png', 'image/webp'] },
      'checklists/': { max_size: '10MB', allowed_types: ['text/plain', 'application/pdf', 'image/*'] },
      'exports/': { max_size: '50MB', allowed_types: ['application/json', 'text/csv', 'application/pdf'] },
      'temp/': { max_size: '20MB', allowed_types: null }
    };
    
    return folderConfigs[folder] || { max_size: '10MB', allowed_types: null };
  }

  parseSize(sizeStr) {
    const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    const match = sizeStr.match(/^(\d+)([A-Z]+)$/i);
    return match ? parseInt(match[1]) * units[match[2].toUpperCase()] : 10 * 1024 * 1024;
  }

  // Error handling
  handleError(error, operation) {
    console.error(`Storage ${operation} error:`, error);
    
    if (error.code === 'NoSuchKey') {
      return new Error('File not found');
    } else if (error.code === 'AccessDenied') {
      return new Error('Access denied - check permissions');
    } else if (error.code === 'NetworkError') {
      return new Error('Network error - check connection');
    }
    
    return new Error(`Storage operation failed: ${error.message}`);
  }

  // Logging
  logOperation(operation, fileName, success, error = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      fileName,
      success,
      error: error ? error.message : null
    };
    
    // Store in localStorage for debugging
    const logs = JSON.parse(localStorage.getItem('storage_logs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('storage_logs', logs.slice(-100)); // Keep last 100 logs
    
    // console.log(`📦 Storage ${operation}: ${fileName} - ${success ? '✅' : '❌'}`);
  }

  // Get operation logs
  getLogs(limit = 50) {
    return JSON.parse(localStorage.getItem('storage_logs') || '[]').slice(-limit);
  }

  // Clear logs
  clearLogs() {
    localStorage.removeItem('storage_logs');
  }
}

// Global instance
window.storageClient = new StorageClient();

// Example usage:
/*
// Upload file
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  try {
    const result = await storageClient.uploadFile(file, 'avatars/');
    console.log('File uploaded:', result.fileUrl);
  } catch (error) {
    console.error('Upload failed:', error);
  }
});

// Download file
try {
  const fileData = await storageClient.downloadFile('avatars/profile.jpg');
  // Process file data
} catch (error) {
  console.error('Download failed:', error);
}

// Get presigned URL
try {
  const url = await storageClient.getPresignedUrl('achievements/badge.png', 3600);
  console.log('Temporary URL:', url);
} catch (error) {
  console.error('URL generation failed:', error);
}
*/