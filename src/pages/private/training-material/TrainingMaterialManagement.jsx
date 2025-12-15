import { useState } from 'react';
import {
  Upload,
  Trash2,
  Download,
  FileText,
  File,
  FileSpreadsheet,
  Presentation,
  Edit,
  X,
  Plus,
} from 'lucide-react';
import {
  useGetCategoriesQuery,
  useGetTrainingMaterialsQuery,
  useUploadTrainingMaterialMutation,
  useUpdateTrainingMaterialMutation,
  useDeleteTrainingMaterialMutation,
} from '../../../features/trainingMaterial/trainingMaterialApi';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getFileIcon = (fileType) => {
  switch (fileType) {
    case 'pdf':
      return <FileText className="w-5 h-5 text-red-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="w-5 h-5 text-blue-500" />;
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    case 'ppt':
    case 'pptx':
      return <Presentation className="w-5 h-5 text-orange-500" />;
    default:
      return <File className="w-5 h-5 text-gray-500" />;
  }
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

export default function TrainingMaterialManagement() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  // Form states
  const [newCategory, setNewCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);

  // API hooks
  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: materialsData, isLoading } = useGetTrainingMaterialsQuery(selectedCategory);
  const [uploadMaterial, { isLoading: isUploading }] = useUploadTrainingMaterialMutation();
  const [updateMaterial, { isLoading: isUpdating }] = useUpdateTrainingMaterialMutation();
  const [deleteMaterial] = useDeleteTrainingMaterialMutation();

  const categories = categoriesData?.data || [];
  const materials = materialsData?.data || [];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        alert('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, and TXT files are allowed.');
        return;
      }

      if (selectedFile.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    const categoryToUse = newCategory.trim() || selectedCategory;

    if (!categoryToUse || !title.trim() || !file) {
      alert('Please fill in all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('category', categoryToUse);
    formData.append('title', title.trim());
    if (description.trim()) formData.append('description', description.trim());
    formData.append('file', file);

    try {
      await uploadMaterial(formData).unwrap();
      alert('Training material uploaded successfully');
      resetUploadForm();
      setUploadModalOpen(false);
    } catch (error) {
      alert('Failed to upload training material: ' + (error?.data?.message || error?.message));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingMaterial || !title.trim()) {
      alert('Title is required');
      return;
    }

    const categoryToUse = newCategory.trim() || editingMaterial.category;

    try {
      await updateMaterial({
        id: editingMaterial._id,
        category: categoryToUse,
        title: title.trim(),
        description: description.trim() || null,
      }).unwrap();
      alert('Training material updated successfully');
      resetEditForm();
      setEditModalOpen(false);
    } catch (error) {
      alert('Failed to update training material: ' + (error?.data?.message || error?.message));
    }
  };

  const handleDelete = async (id, fileName) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      await deleteMaterial(id).unwrap();
      alert('Training material deleted successfully');
    } catch (error) {
      alert('Failed to delete training material: ' + (error?.data?.message || error?.message));
    }
  };

  const handleDownload = (material) => {
    // Direct download from Cloudinary URL
    const link = document.createElement('a');
    link.href = material.fileUrl;
    link.download = material.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openEditModal = (material) => {
    setEditingMaterial(material);
    setTitle(material.title);
    setDescription(material.description || '');
    setNewCategory('');
    setEditModalOpen(true);
  };

  const resetUploadForm = () => {
    setNewCategory('');
    setTitle('');
    setDescription('');
    setFile(null);
  };

  const resetEditForm = () => {
    setEditingMaterial(null);
    setTitle('');
    setDescription('');
    setNewCategory('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Training Materials</h1>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Upload Material
          </button>
        </div>

        {/* Category Filter */}
        <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter by Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Materials List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No training materials found
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {materials.map((material) => (
              <div
                key={material._id}
                className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">{getFileIcon(material.fileType)}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {material.title}
                      </h3>
                      {material.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {material.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-500">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                          {material.category}
                        </span>
                        <span>{material.fileName}</span>
                        <span>{formatFileSize(material.fileSize)}</span>
                        <span>
                          Uploaded by {material.uploadedByName} on{' '}
                          {format(new Date(material.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleDownload(material)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openEditModal(material)}
                      className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(material._id, material.fileName)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {uploadModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 max-w-lg w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Training Material</h2>
                <button
                  onClick={() => {
                    setUploadModalOpen(false);
                    resetUploadForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                {/* Category Selection or New Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 mb-2"
                  >
                    <option value="">Select existing category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or create new category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    File * (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT - Max 50MB)
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    required
                  />
                  {file && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Selected: {file.name} ({formatFileSize(file.size)})
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    'Uploading...'
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModalOpen && editingMaterial && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 max-w-lg w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Training Material</h2>
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    resetEditForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={editingMaterial.category}
                    onChange={(e) =>
                      setEditingMaterial({ ...editingMaterial, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 mb-2"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or create new category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Current File Info */}
                <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current file: {editingMaterial.fileName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Note: To change the file, please delete this material and upload a new one.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
