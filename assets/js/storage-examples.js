// Contoh Implementasi Storage untuk Ramadhan Anti Mager Club

class StorageExamples {
  constructor() {
    this.initEventListeners();
  }

  initEventListeners() {
    // Avatar upload
    document.getElementById('avatarUpload')?.addEventListener('change', (e) => {
      this.handleAvatarUpload(e.target.files[0]);
    });

    // Achievement upload
    document.getElementById('achievementUpload')?.addEventListener('change', (e) => {
      this.handleAchievementUpload(e.target.files[0]);
    });

    // Export data
    document.getElementById('exportBtn')?.addEventListener('click', () => {
      this.exportUserData();
    });

    // Load achievements
    document.getElementById('loadAchievementsBtn')?.addEventListener('click', () => {
      this.loadAchievementBadges();
    });
  }

  // 1. Upload Avatar User
  async handleAvatarUpload(file) {
    if (!file) return;

    try {
      // Validasi file
      if (!file.type.startsWith('image/')) {
        throw new Error('Hanya file gambar yang diperbolehkan');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        throw new Error('Ukuran file maksimal 5MB');
      }

      // Tampilkan loading state
      this.showLoading('Mengupload avatar...');

      // Upload ke storage
      const result = await storageClient.uploadFile(file, 'avatars/', {
        'user-id': this.getCurrentUserId(),
        'upload-type': 'profile-avatar',
        'original-filename': file.name
      });

      // Update UI
      this.updateUserAvatar(result.fileUrl);
      this.showSuccess('Avatar berhasil diupload!');

      // Simpan reference ke user data
      this.saveAvatarReference(result.fileName);

    } catch (error) {
      console.error('Avatar upload error:', error);
      this.showError(`Upload gagal: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  // 2. Upload Achievement Badge
  async handleAchievementUpload(file) {
    if (!file) return;

    try {
      // Validasi file
      const allowedTypes = ['image/svg+xml', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Hanya file SVG, PNG, atau WebP yang diperbolehkan');
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB
        throw new Error('Ukuran file maksimal 2MB');
      }

      this.showLoading('Mengupload achievement badge...');

      const result = await storageClient.uploadFile(file, 'achievements/', {
        'uploaded-by': this.getCurrentUserId(),
        'category': 'ramadhan-achievement',
        'timestamp': new Date().toISOString()
      });

      this.showSuccess('Badge achievement berhasil diupload!');
      this.addAchievementToGrid(result.fileUrl, file.name);

    } catch (error) {
      console.error('Achievement upload error:', error);
      this.showError(`Upload badge gagal: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  // 3. Export User Data
  async exportUserData() {
    try {
      this.showLoading('Mengekspor data...');

      // Dapatkan data user
      const userData = this.getUserDataForExport();
      
      // Buat blob
      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: 'application/json'
      });

      const file = new File([blob], `ramadhan-export-${Date.now()}.json`, {
        type: 'application/json'
      });

      // Upload ke exports folder
      const result = await storageClient.uploadFile(file, 'exports/', {
        'export-type': 'user-data-backup',
        'user-id': this.getCurrentUserId(),
        'export-date': new Date().toISOString(),
        'data-version': '1.0'
      });

      this.showSuccess('Data berhasil diekspor!');
      
      // Berikan link download
      this.provideDownloadLink(result.fileUrl, `ramadhan-export-${this.getCurrentUserId()}.json`);

    } catch (error) {
      console.error('Export error:', error);
      this.showError(`Ekspor data gagal: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  // 4. Load Achievement Badges
  async loadAchievementBadges() {
    try {
      this.showLoading('Memuat achievement badges...');

      const achievements = await storageClient.listFiles('achievements/');
      
      const container = document.getElementById('achievementsGrid');
      if (!container) return;

      container.innerHTML = '';

      if (achievements.length === 0) {
        container.innerHTML = '<p class="text-muted">Belum ada achievement badges</p>';
        return;
      }

      for (const achievement of achievements) {
        try {
          const url = await storageClient.getPresignedUrl(achievement.name, 3600);
          
          const card = this.createAchievementCard({
            name: achievement.name.replace('achievements/', '').replace(/\.[^/.]+$/, ''),
            url: url,
            uploaded: achievement.lastModified
          });
          
          container.appendChild(card);
        } catch (error) {
          console.warn(`Failed to load achievement ${achievement.name}:`, error);
        }
      }

      this.showSuccess(`Loaded ${achievements.length} achievement badges`);

    } catch (error) {
      console.error('Load achievements error:', error);
      this.showError('Gagal memuat achievement badges');
    } finally {
      this.hideLoading();
    }
  }

  // 5. Backup System (Automatic)
  async autoBackup() {
    if (!this.shouldBackup()) return;

    try {
      console.log('Starting automatic backup...');
      
      const backupData = {
        timestamp: new Date().toISOString(),
        user: this.getCurrentUser(),
        achievements: this.getUserAchievements(),
        checklists: this.getUserChecklists(),
        stats: this.getUserStats()
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });

      const file = new File([blob], `auto-backup-${Date.now()}.json`, {
        type: 'application/json'
      });

      await storageClient.uploadFile(file, 'backups/', {
        'backup-type': 'auto-daily',
        'user-id': this.getCurrentUserId(),
        'backup-timestamp': new Date().toISOString()
      });

      console.log('Automatic backup completed');
      this.setLastBackupTime();

    } catch (error) {
      console.error('Auto backup failed:', error);
    }
  }

  // Utility Methods
  createAchievementCard(achievement) {
    const card = document.createElement('div');
    card.className = 'achievement-card';
    card.innerHTML = `
      <img src="${achievement.url}" alt="${achievement.name}" loading="lazy">
      <div class="achievement-info">
        <h4>${achievement.name}</h4>
        <small>Uploaded: ${new Date(achievement.uploaded).toLocaleDateString()}</small>
      </div>
    `;
    return card;
  }

  provideDownloadLink(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.textContent = 'Download Export';
    link.className = 'download-link';
    
    const container = document.getElementById('downloadContainer');
    if (container) {
      container.innerHTML = '';
      container.appendChild(link);
    }
  }

  updateUserAvatar(avatarUrl) {
    const avatarImg = document.getElementById('userAvatar');
    if (avatarImg) {
      avatarImg.src = avatarUrl;
      avatarImg.classList.add('avatar-updated');
    }
  }

  addAchievementToGrid(imageUrl, achievementName) {
    const grid = document.getElementById('achievementsGrid');
    if (grid) {
      const card = this.createAchievementCard({
        name: achievementName,
        url: imageUrl,
        uploaded: new Date()
      });
      grid.appendChild(card);
    }
  }

  // UI Feedback Methods
  showLoading(message) {
    // Implement loading state
    console.log('Loading:', message);
  }

  hideLoading() {
    // Hide loading state
    console.log('Loading completed');
  }

  showSuccess(message) {
    // Show success message
    console.log('Success:', message);
  }

  showError(message) {
    // Show error message
    console.error('Error:', message);
  }

  // Mock methods (harus diimplementasi sesuai aplikasi)
  getCurrentUserId() {
    return 'user-123'; // Contoh
  }

  getCurrentUser() {
    return { id: 'user-123', name: 'User Example' };
  }

  getUserDataForExport() {
    return {
      user: this.getCurrentUser(),
      achievements: [],
      checklists: [],
      exportDate: new Date().toISOString()
    };
  }

  saveAvatarReference(fileName) {
    // Simpan reference ke local storage atau database
    localStorage.setItem('userAvatar', fileName);
  }

  getUserAchievements() {
    return [];
  }

  getUserChecklists() {
    return [];
  }

  getUserStats() {
    return {};
  }

  shouldBackup() {
    // Backup sekali sehari
    const lastBackup = localStorage.getItem('lastBackup');
    return !lastBackup || (Date.now() - new Date(lastBackup).getTime()) > 24 * 60 * 60 * 1000;
  }

  setLastBackupTime() {
    localStorage.setItem('lastBackup', new Date().toISOString());
  }
}

// Auto-backup setiap 24 jam
setInterval(() => {
  new StorageExamples().autoBackup();
}, 24 * 60 * 60 * 1000);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.storageExamples = new StorageExamples();
  
  // Jalankan auto-backup jika diperlukan
  setTimeout(() => {
    storageExamples.autoBackup();
  }, 5000); // Delay 5 detik setelah page load
});

// Contoh penggunaan langsung
/*
// Upload file dari event
const uploadBtn = document.getElementById('uploadBtn');
uploadBtn.addEventListener('click', async () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const result = await storageClient.uploadFile(file, 'avatars/');
        console.log('File uploaded:', result);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };
  
  fileInput.click();
});

// Download file
async function downloadUserAvatar() {
  try {
    const avatarName = localStorage.getItem('userAvatar');
    if (avatarName) {
      const fileData = await storageClient.downloadFile(avatarName);
      // Process file data
    }
  } catch (error) {
    console.error('Download failed:', error);
  }
}
*/