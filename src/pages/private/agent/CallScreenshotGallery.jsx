import React, { useMemo, useState, useCallback } from 'react';
import { 
  Search, Filter, Download, Trash2, Eye, X, Calendar, User, Phone 
} from 'lucide-react';
import { 
  useGetAllScreenshotsQuery, 
  useDeleteScreenshotMutation 
} from '../../../features/screenshot/screenshotApi';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import ConfirmDialog from '../../../components/ConfirmDialog';

const IMG_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/call-screenshots`;

// Helper to get image URL (Cloudinary or fallback to local)
const getImageUrl = (screenshot) => {
  return screenshot.imageUrl || `${IMG_BASE_URL}/${screenshot.imagePath}`;
};

export default function CallScreenshotGallery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [page, setPage] = useState(1);
  const [petitionFilter, setPetitionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const limit = 20;

  const { data: screenshotsData, isLoading, refetch } = useGetAllScreenshotsQuery({ 
    page, 
    limit 
  });
  const [deleteScreenshot, { isLoading: isDeleting }] = useDeleteScreenshotMutation();

  const screenshots = screenshotsData?.data || [];
  const pagination = screenshotsData?.pagination || {};
  
  const getCapturedByName = useCallback((screenshot) => {
    return (
      screenshot?.capturedBy?.name ||
      screenshot?.metadata?.agentName ||
      (Array.isArray(screenshot?.participants)
        ? (screenshot.participants.find(p => ['Agent','QA','TL'].includes(p?.role))?.name || screenshot.participants.find(p => p?.name)?.name)
        : null) ||
      'Agent'
    );
  }, []);
  const filteredScreenshots = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    return screenshots.filter(screenshot => {
      // Text search: customer, agent (metadata), capturedBy name, subject, petitionId, participants names
      const textMatch = !query || (
        screenshot.metadata?.customerName?.toLowerCase().includes(query) ||
        screenshot.metadata?.agentName?.toLowerCase().includes(query) ||
        screenshot.metadata?.querySubject?.toLowerCase().includes(query) ||
        screenshot.petitionId?.toLowerCase().includes(query) ||
        screenshot.capturedBy?.name?.toLowerCase().includes(query) ||
        (Array.isArray(screenshot.participants) && screenshot.participants.some(p => p?.name?.toLowerCase().includes(query)))
      );

      // Petition filter (exact or partial)
      const petitionMatch = !petitionFilter.trim() || (screenshot.petitionId || '').toLowerCase().includes(petitionFilter.trim().toLowerCase());

      // Date range filter
      const created = new Date(screenshot.createdAt);
      const fromOk = !from || created >= from;
      const toOk = !to || created <= to;

      return textMatch && petitionMatch && fromOk && toOk;
    });
  }, [searchQuery, petitionFilter, fromDate, toDate, screenshots]);

  const handleDelete = (id, e) => {
    e?.stopPropagation();
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteScreenshot(pendingDeleteId).unwrap();
      toast.success('Screenshot deleted');
      setConfirmOpen(false);
      setPendingDeleteId(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete screenshot');
    }
  };

  const handleDownload = (screenshot, e) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = getImageUrl(screenshot);
    link.download = `call-screenshot-${screenshot.petitionId || screenshot.roomId}-${format(new Date(screenshot.createdAt), 'yyyy-MM-dd-HHmmss')}.png`;
    link.target = '_blank'; // For Cloudinary URLs
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Screenshot downloaded');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading screenshots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-1 sm:p-2">
      {/* Header */}
      <div className="mb-2">
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-1 sm:p-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Screenshots Gallery
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0">
                {pagination.total || 0} total screenshots
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Refresh
            </button>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by who captured, of whom, subject, or petition ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Petition ID"
                value={petitionFilter}
                onChange={(e) => setPetitionFilter(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-1/2 px-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-1/2 px-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="">
        {filteredScreenshots.length === 0 ? (
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-12 text-center">
            <Phone size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No screenshots found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery 
                ? 'Try adjusting your search criteria' 
                : 'Screenshots taken during video calls will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
            {filteredScreenshots.map(screenshot => (
              <div
                key={screenshot._id}
                className="bg-white dark:bg-gray-950 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
                onClick={() => setSelectedImage(screenshot)}
              >
                {/* Image */}
                <div className="relative aspect-video bg-gray-200 dark:bg-gray-950">
                  <img
                    src={getImageUrl(screenshot)}
                    alt={`Screenshot from ${screenshot.metadata?.customerName || 'call'}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(screenshot);
                      }}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="View"
                    >
                      <Eye size={18} className="text-gray-700" />
                    </button>
                    <button
                      onClick={(e) => handleDownload(screenshot, e)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="Download"
                    >
                      <Download size={18} className="text-gray-700" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(screenshot._id, e)}
                      className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <Calendar size={14} />
                    <span>{format(new Date(screenshot.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  {screenshot.petitionId && (
                    <p className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      Query: {screenshot.petitionId}
                    </p>
                  )}
                  {screenshot.metadata?.querySubject && (
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 mb-2">
                      {screenshot.metadata.querySubject}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <User size={12} />
                      <span className="line-clamp-1">{screenshot.metadata?.customerName || (screenshot.participants?.[0]?.name) || 'Customer'}</span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-500">by {getCapturedByName(screenshot)}</span>
                  </div>
                  {Array.isArray(screenshot.participants) && screenshot.participants.length > 1 && (
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                      With: {screenshot.participants.map(p => p?.name).filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            >
              Previous
            </button>
            <span className="text-gray-700 dark:text-gray-300">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Full Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-2"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-2 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} className="text-gray-700" />
          </button>
          
          <div className="max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-950 rounded-lg shadow-2xl w-full h-full flex flex-col overflow-hidden">
              {/* Sticky toolbar */}
              <div className="flex items-center justify-between gap-2 p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white/90 dark:bg-gray-950/90 backdrop-blur z-10">
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {selectedImage.petitionId ? (
                    <span className="font-mono">Query: {selectedImage.petitionId}</span>
                  ) : (
                    <span>{format(new Date(selectedImage.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDownload(selectedImage, e)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                  >
                    <Download size={16} /> Download
                  </button>
                  <button
                    onClick={(e) => {
                      handleDelete(selectedImage._id, e);
                      setSelectedImage(null);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="w-full flex items-center justify-center bg-gray-100 dark:bg-gray-950 rounded-lg">
                  <img
                    src={getImageUrl(selectedImage)}
                    alt={`Screenshot from ${selectedImage.metadata?.customerName || 'call'}`}
                    className="max-h-[65vh] w-auto h-auto object-contain rounded-md"
                  />
                </div>

                {/* Image Details */}
                <div className="bg-white dark:bg-gray-950 rounded-lg p-2 mt-4 border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {format(new Date(selectedImage.createdAt), 'MMMM dd, yyyy HH:mm:ss')}
                      </p>
                    </div>
                    {selectedImage.petitionId && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Query ID</p>
                        <p className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {selectedImage.petitionId}
                        </p>
                      </div>
                    )}
                    {selectedImage.metadata?.querySubject && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Subject</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {selectedImage.metadata.querySubject}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedImage.metadata?.customerName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Captured By</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {getCapturedByName(selectedImage)} ({selectedImage.capturedBy?.role || 'Agent'})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete screenshot?"
        message="This action cannot be undone. The screenshot will be permanently deleted."
        confirmText="Delete"
        cancelText="Cancel"
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (isDeleting) return;
          setConfirmOpen(false);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
