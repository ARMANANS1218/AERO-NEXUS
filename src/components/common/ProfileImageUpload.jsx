import React, { useState, useRef, useMemo } from 'react';
import { toast } from 'react-toastify';
import { IMG_PROFILE_URL } from '../../config/api';

/**
 * Reusable Profile Image Upload Component
 * Features:
 * - Drag and drop support
 * - Click to upload
 * - File validation (type, size)
 * - Live preview
 * - Remove image capability
 */
const ProfileImageUpload = ({
  currentImage,
  userName = '',
  onFileSelect,
  isLoading = false,
}) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const avatarSrc = useMemo(() => {
    if (previewUrl) return previewUrl;
    if (!currentImage) return '';
    // Handle both full URLs and relative paths
    if (currentImage?.startsWith('http')) return currentImage;
    return `${IMG_PROFILE_URL}/${currentImage}`;
  }, [currentImage, previewUrl]);

  const validateFile = (fileToValidate) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(fileToValidate.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return false;
    }

    if (fileToValidate.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return false;
    }

    return true;
  };

  const handleFileSelect = (selectedFile) => {
    if (!validateFile(selectedFile)) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(selectedFile);

    // Call parent callback
    if (onFileSelect) {
      onFileSelect(selectedFile);
    }
  };

  const handleInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const removeImage = () => {
    setFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Picture</h2>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Avatar Display */}
        <div className="flex-shrink-0">
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-700 flex items-center justify-center border-4 border-gray-300 dark:border-slate-600 shadow-lg">
            {avatarSrc ? (
              <img src={avatarSrc} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-semibold text-gray-500 dark:text-gray-400">
                {userName?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
            {previewUrl && (
              <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                <span className="text-white font-semibold text-sm bg-green-500 px-2 py-1 rounded">
                  New
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <div className="flex-1 space-y-3">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
              disabled={isLoading}
            />

            <div className="space-y-2">
              <div className="text-4xl text-gray-400">
                {isDragOver ? '📁' : '📸'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isDragOver ? 'Drop your image here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PNG, JPG, GIF, WebP up to 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Choose File
            </button>
            {file && (
              <button
                type="button"
                onClick={removeImage}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove
              </button>
            )}
          </div>

          {/* File Info */}
          {file && (
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
              <p>
                <span className="font-semibold">Selected:</span> {file.name}
              </p>
              <p>
                <span className="font-semibold">Size:</span> {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileImageUpload;
