import { useState } from 'react';
import {
  Download,
  FileText,
  File,
  FileSpreadsheet,
  Presentation,
} from 'lucide-react';
import {
  useGetCategoriesQuery,
  useGetTrainingMaterialsQuery,
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

export default function TrainingMaterialView() {
  const [selectedCategory, setSelectedCategory] = useState('');

  // API hooks
  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: materialsData, isLoading } = useGetTrainingMaterialsQuery(selectedCategory);

  const categories = categoriesData?.data || [];
  const materials = materialsData?.data || [];

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Training Materials</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Browse and download training materials and documents
          </p>
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

                  {/* Download Button */}
                  <div className="ml-4">
                    <button
                      onClick={() => handleDownload(material)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
