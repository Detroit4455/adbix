# My Images Feature Testing Guide

## Overview
This document outlines how to test the new "My Images" feature that has been added to the Web-as-a-Service platform.

## Features Implemented

### 1. **My Images Section** 
- **Location**: `/web_on_s3` page → "My Images" tab
- **Storage**: Images stored in S3 under `sites/{mobileNumber}/my-images/`
- **UI**: Modern card-based grid layout with purple/blue gradient theme

### 2. **Image Upload**
- **Methods**: Click to upload or drag & drop
- **Supported formats**: PNG, JPG, JPEG, GIF, WebP
- **File size limit**: 10MB per image
- **Validation**: File type and size validation
- **Limit**: Configurable max images per user (default: 50)

### 3. **Image Management**
- **View**: Grid of image cards with hover effects
- **Full View**: Click any image to open full-size modal
- **Copy URL**: One-click copy public S3 URL to clipboard
- **Delete**: Individual image deletion with confirmation
- **Auto-refresh**: List updates after upload/delete operations

### 4. **Admin Controls**
- **Location**: `/admin/config` → "Server Settings" tab
- **Setting**: Maximum Images Per User (1-1000 range)
- **Storage**: MongoDB `ServerSettings` collection
- **RBAC**: Admin-only access to configuration

## API Endpoints

### User Endpoints
- `POST /api/my-images/upload` - Upload image
- `GET /api/my-images/list` - List user's images  
- `DELETE /api/my-images/delete` - Delete specific image

### Admin Endpoints
- `GET /api/admin/server-settings` - Get server configuration
- `PUT /api/admin/server-settings` - Update server configuration

## Testing Steps

### 1. **User Flow Testing**

1. **Login** as a regular user
2. **Navigate** to `/web_on_s3`
3. **Click** on "My Images" tab
4. **Upload images** using:
   - Click upload button
   - Drag and drop functionality
5. **Verify** images appear in grid layout
6. **Click** on any image to open full view modal
7. **Copy URL** and verify it works in new tab
8. **Delete** an image and confirm removal

### 2. **Admin Configuration Testing**

1. **Login** as admin user
2. **Navigate** to `/admin` → "System Configuration"
3. **Go** to "Server Settings" tab
4. **Change** max images per user setting
5. **Save** and verify settings persist
6. **Test** upload limit enforcement on user account

### 3. **Limit Enforcement Testing**

1. **Set** max images to a low number (e.g., 3) as admin
2. **Login** as user and try uploading beyond limit
3. **Verify** error message appears
4. **Check** that upload is blocked

### 4. **File Validation Testing**

1. **Try uploading** unsupported file types
2. **Try uploading** files larger than 10MB
3. **Verify** appropriate error messages
4. **Test** with various image formats

## Database Models

### ServerSettings Collection
```javascript
{
  maxImagesPerUser: Number (1-1000),
  createdAt: Date,
  updatedAt: Date
}
```

### RBAC Integration
- Added 'my-images' resource to RBAC matrix
- Default permissions: All roles can access

## S3 Storage Structure
```
sites/
  {mobileNumber}/
    my-images/
      {timestamp}_{random}.{ext}
      ...
```

## Security Features

1. **Authentication**: JWT token validation
2. **Authorization**: Mobile number isolation
3. **File validation**: Type and size checks
4. **Rate limiting**: Max images per user
5. **Public URLs**: Secure S3 public read access

## UI/UX Features

1. **Modern Design**: Purple/blue gradient theme
2. **Responsive**: Works on mobile and desktop
3. **Drag & Drop**: Visual feedback on drag operations
4. **Loading States**: Spinners during uploads
5. **Error Handling**: User-friendly error messages
6. **Success Feedback**: Confirmation messages
7. **Modal View**: Full-screen image preview
8. **Copy Feedback**: URL copied confirmation

## Expected Behavior

✅ **Should Work:**
- Upload supported image formats under 10MB
- View images in responsive grid
- Copy public URLs to clipboard
- Delete images with confirmation
- Admin can configure max limit
- Limit enforcement works properly

❌ **Should Fail:**
- Upload non-image files
- Upload files over 10MB
- Upload beyond configured limit
- Access without authentication
- Admin features for non-admin users

## Troubleshooting

1. **Images not loading**: Check S3 permissions and AWS credentials
2. **Upload failures**: Verify file size and format
3. **Limit not enforced**: Check ServerSettings in database
4. **Admin access denied**: Verify user role in session
5. **CORS issues**: Ensure S3 bucket CORS configuration

## Performance Considerations

1. **Image optimization**: Consider adding image compression
2. **Lazy loading**: Implemented for large image lists  
3. **Caching**: Browser caching for uploaded images
4. **Database indexing**: Consider indexing mobile numbers
5. **S3 costs**: Monitor storage usage and requests 