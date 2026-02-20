# 🗄️ Storage System - Ramadhan Anti Mager Club

Sistem penyimpanan file yang komprehensif untuk aplikasi Ramadhan Anti Mager Club. Mendukung MinIO untuk development lokal dan AWS S3 untuk production.

## 📋 Daftar Isi
- [Setup Development](#-setup-development)
- [Struktur Bucket](#-struktur-bucket)
- [API Reference](#-api-reference)
- [Contoh Penggunaan](#-contoh-penggunaan)
- [Error Handling](#-error-handling)
- [Deployment Production](#-deployment-production)
- [Monitoring & Logging](#-monitoring--logging)

## 🚀 Setup Development

### 1. Start MinIO Server
```bash
# Jalankan dengan Docker Compose
docker-compose up -d

# Atau jalankan manual
mkdir -p minio-data
docker run -p 9000:9000 -p 9001:9001 \
  -v $(pwd)/minio-data:/data \
  -e "MINIO_ROOT_USER=ramadhanadmin" \
  -e "MINIO_ROOT_PASSWORD=StrongPassword123!" \
  minio/minio server /data --console-address ":9001"
```

### 2. Konfigurasi Bucket
```bash
# Jalankan setup script
chmod +x setup-storage.sh
./setup-storage.sh

# Atau konfigurasi manual
mc alias set ramadhan-minio http://localhost:9000 ramadhanadmin StrongPassword123!
mc mb ramadhan-minio/ramadhan-app
```

### 3. Akses Console
- **MinIO Console**: http://localhost:9001
- **Username**: ramadhanadmin
- **Password**: StrongPassword123!

## 📁 Struktur Bucket

### Folder Organization
```
ramadhan-app/
├── avatars/          # Profile pictures users (private)
├── achievements/     # Badges dan icons achievements (public)
├── checklists/       # Attachments checklist (private)
├── exports/          # Laporan dan data export (private)
├── backups/          # Backup otomatis (private, 30 hari retention)
└── temp/             # File temporary (private, 1 hari retention)
```

### Permission Settings
| Folder | Permission | Max Size | Allowed Types |
|--------|------------|----------|---------------|
| avatars/ | Private | 5MB | JPEG, PNG, WebP |
| achievements/ | Public Read | 2MB | SVG, PNG, WebP |
| checklists/ | Private | 10MB | Text, PDF, Images |
| exports/ | Private | 50MB | JSON, CSV, PDF |
| temp/ | Private | 20MB | All types |
| backups/ | Private | 100MB | All types |

## 🔧 API Reference

### Initialization
```javascript
// Storage client otomatis terinisialisasi
window.storageClient // Instance global

// Cek status
if (storageClient.isConfigured) {
  console.log('Storage ready');
}
```

### Upload File
```javascript
// Basic upload
const result = await storageClient.uploadFile(file, 'avatars/');

// Dengan metadata custom
const result = await storageClient.uploadFile(file, 'achievements/', {
  'user-id': '123',
  'category': 'spiritual'
});

// Response structure
{
  success: true,
  fileUrl: 'http://localhost:9000/ramadhan-app/avatars/12345_profile.jpg',
  fileName: 'avatars/12345_profile.jpg',
  etag: '"a1b2c3d4e5f6g7h8"'
}
```

### Download File
```javascript
// Download sebagai blob
const fileData = await storageClient.downloadFile('avatars/profile.jpg');

// Convert ke URL object
const url = URL.createObjectURL(fileData);
imgElement.src = url;
```

### Delete File
```javascript
await storageClient.deleteFile('avatars/old_profile.jpg');
// Returns: { success: true }
```

### List Files
```javascript
const files = await storageClient.listFiles('achievements/', 50);
// Returns array of file objects
```

### Presigned URL
```javascript
// Generate URL untuk akses temporary (1 jam)
const url = await storageClient.getPresignedUrl('achievements/badge.png', 3600);
// Returns: 'http://localhost:9000/ramadhan-app/achievements/badge.png?X-Amz-Algorithm=...'
```

## 🎯 Contoh Penggunaan

### 1. Upload Avatar User
```javascript
const avatarInput = document.getElementById('avatarInput');
avatarInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  
  try {
    const result = await storageClient.uploadFile(file, 'avatars/', {
      'user-id': currentUser.id,
      'upload-type': 'profile-avatar'
    });
    
    // Update UI
    userAvatar.src = result.fileUrl;
    showToast('Avatar updated successfully!', 'success');
    
  } catch (error) {
    showToast(`Upload failed: ${error.message}`, 'error');
  }
});
```

### 2. Load Achievement Badges
```javascript
async function loadAchievementBadges() {
  try {
    const badges = await storageClient.listFiles('achievements/');
    
    const container = document.getElementById('badges-container');
    container.innerHTML = '';
    
    for (const badge of badges) {
      const url = await storageClient.getPresignedUrl(badge.name, 3600);
      const img = document.createElement('img');
      img.src = url;
      img.alt = badge.name;
      img.className = 'achievement-badge';
      container.appendChild(img);
    }
    
  } catch (error) {
    console.error('Failed to load badges:', error);
  }
}
```

### 3. Backup Data
```javascript
async function backupUserData(userData) {
  const blob = new Blob([JSON.stringify(userData, null, 2)], {
    type: 'application/json'
  });
  
  const file = new File([blob], `backup-${Date.now()}.json`, {
    type: 'application/json'
  });
  
  try {
    await storageClient.uploadFile(file, 'backups/', {
      'backup-type': 'user-data',
      'user-id': userData.id,
      'timestamp': new Date().toISOString()
    });
    
    console.log('Backup completed successfully');
    
  } catch (error) {
    console.error('Backup failed:', error);
  }
}
```

## 🚨 Error Handling

### Common Errors
```javascript
try {
  await storageClient.uploadFile(file, 'avatars/');
} catch (error) {
  if (error.message.includes('File size exceeds')) {
    showToast('File terlalu besar. Maksimal 5MB untuk avatar.', 'error');
  } else if (error.message.includes('File type not allowed')) {
    showToast('Format file tidak didukung. Gunakan JPEG, PNG, atau WebP.', 'error');
  } else if (error.message.includes('Access denied')) {
    showToast('Akses ditolak. Silakan login kembali.', 'error');
  } else {
    showToast('Upload gagal. Silakan coba lagi.', 'error');
  }
}
```

### Error Codes
| Error Message | Description | Solution |
|---------------|-------------|----------|
| `File size exceeds limit` | File melebihi ukuran maksimal | Kompres file atau pilih file lebih kecil |
| `File type not allowed` | Format file tidak didukung | Gunakan format yang sesuai |
| `Access denied` | Permission tidak cukup | Periksa konfigurasi bucket |
| `File not found` | File tidak ditemukan | Periksa path file |
| `Network error` | Koneksi terputus | Periksa koneksi internet |

## 🚀 Deployment Production

### 1. Setup AWS S3
```bash
# Buat S3 bucket
aws s3 mb s3://ramadhan-app-production

# Enable versioning
aws s3api put-bucket-versioning --bucket ramadhan-app-production \
  --versioning-configuration Status=Enabled

# Configure CORS
aws s3api put-bucket-cors --bucket ramadhan-app-production \
  --cors-configuration file://cors-config.json
```

### 2. Environment Variables
```bash
# .env file
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=ramadhan-app-production
```

### 3. CORS Configuration
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourdomain.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

## 📊 Monitoring & Logging

### View Logs
```javascript
// Get storage operation logs
const logs = storageClient.getLogs(20);
console.table(logs);

// Example log entry
{
  timestamp: "2024-03-15T10:30:00.000Z",
  operation: "upload",
  fileName: "avatars/profile123.jpg",
  success: true,
  error: null
}
```

### Clear Logs
```javascript
// Clear semua logs
storageClient.clearLogs();
```

### Performance Monitoring
```javascript
// Track upload performance
const startTime = performance.now();
const result = await storageClient.uploadFile(largeFile, 'exports/');
const duration = performance.now() - startTime;

console.log(`Upload completed in ${duration.toFixed(2)}ms`);
```

## 🔒 Security Best Practices

### 1. Input Validation
```javascript
// Validasi file sebelum upload
function validateFileBeforeUpload(file, allowedTypes, maxSize) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
  // Anti-virus scan simulation
  if (file.name.includes('.exe')) {
    throw new Error('Executable files not allowed');
  }
}
```

### 2. Secure Metadata
```javascript
// Jangan simpan sensitive data di metadata
await storageClient.uploadFile(file, 'avatars/', {
  'user-id': '123', // ✅ OK
  'user-email': 'user@example.com' // ❌ Avoid
});
```

### 3. Regular Audits
```bash
# Audit bucket permissions
mc admin policy list ramadhan-minio

# Review access logs
mc admin trace ramadhan-minio
```

## 🛠️ Troubleshooting

### Common Issues

1. **MinIO tidak bisa diakses**
   ```bash
   # Check service status
   docker ps
   docker logs ramadhan-minio
   
   # Restart service
   docker-compose restart
   ```

2. **Permission denied**
   ```bash
   # Reset permissions
   mc anonymous set download ramadhan-minio/ramadhan-app/achievements
   ```

3. **CORS errors**
   ```bash
   # Update CORS config
   mc admin config set ramadhan-minio/ api cors allow_origin="http://localhost:3000"
   ```

4. **File not found**
   ```javascript
   // Check if file exists
   const files = await storageClient.listFiles('');
   console.log('Available files:', files);
   ```

### Support

Untuk bantuan teknis, silakan refer ke:
- [MinIO Documentation](https://min.io/docs)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3)
- [Storage Client Source](./assets/js/storage-client.js)

---

**Last Updated**: March 15, 2024  
**Version**: 1.0.0  
**Status**: Production Ready 🚀