#!/bin/bash

# Storage Setup Script for Ramadhan Anti Mager Club
# This script configures MinIO bucket with proper structure and policies

echo "🚀 Setting up Ramadhan Storage Bucket..."

# Wait for MinIO to be ready
until curl -f http://localhost:9000/minio/health/live; do
  echo "⏳ Waiting for MinIO to start..."
  sleep 2
done

# Configure MinIO client
mc alias set ramadhan-minio http://localhost:9000 ramadhanadmin StrongPassword123!

# Create main bucket
mc mb --ignore-existing ramadhan-minio/ramadhan-app

# Create folder structure
echo "📁 Creating folder structure..."
mc mb --ignore-existing ramadhan-minio/ramadhan-app/avatars
mc mb --ignore-existing ramadhan-minio/ramadhan-app/achievements  
mc mb --ignore-existing ramadhan-minio/ramadhan-app/checklists
mc mb --ignore-existing ramadhan-minio/ramadhan-app/exports
mc mb --ignore-existing ramadhan-minio/ramadhan-app/backups
mc mb --ignore-existing ramadhan-minio/ramadhan-app/temp

# Set permissions
echo "🔐 Setting permissions..."
mc anonymous set download ramadhan-minio/ramadhan-app/achievements
mc anonymous set none ramadhan-minio/ramadhan-app/avatars
mc anonymous set none ramadhan-minio/ramadhan-app/checklists
mc anonymous set none ramadhan-minio/ramadhan-app/exports
mc anonymous set none ramadhan-minio/ramadhan-app/backups
mc anonymous set none ramadhan-minio/ramadhan-app/temp

# Enable versioning
echo "🔄 Enabling versioning..."
mc version enable ramadhan-minio/ramadhan-app

# Set lifecycle policies
echo "📅 Setting lifecycle policies..."
mc ilm add ramadhan-minio/ramadhan-app --prefix "temp/" --expiry-days 1
mc ilm add ramadhan-minio/ramadhan-app --prefix "backups/" --expiry-days 30

# Configure CORS
echo "🌐 Setting CORS configuration..."
mc admin config set ramadhan-minio/ api cors allow_origin="http://localhost:3000,https://*.github.io"

# Create test files for verification
echo "🧪 Creating test files..."
echo "Test achievement badge" > achievement-test.txt
mc cp achievement-test.txt ramadhan-minio/ramadhan-app/achievements/
rm achievement-test.txt

# Display bucket info
echo "✅ Storage setup completed!"
echo ""
echo "📊 Bucket Information:"
mc ls ramadhan-minio/ramadhan-app/
echo ""
echo "🔗 MinIO Console: http://localhost:9001"
echo "🔑 Username: ramadhanadmin"
echo "🔑 Password: StrongPassword123!"
echo ""
echo "🚀 Ready for file operations!"