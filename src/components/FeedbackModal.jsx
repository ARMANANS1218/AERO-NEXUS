import React, { useState } from 'react';
import { X, Star, Send, ThumbsUp, MessageSquare } from 'lucide-react';
import { useSubmitFeedbackMutation } from '../features/query/queryApi';
import { toast } from 'react-toastify';

export default function FeedbackModal({ isOpen, onClose, petitionId, querySubject }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [submitFeedback, { isLoading }] = useSubmitFeedbackMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      await submitFeedback({
        petitionId,
        rating,
        comment: comment.trim() || undefined,
      }).unwrap();

      setIsSubmitted(true);
      toast.success('Thank you for your feedback!');

      // Auto close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to submit feedback');
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setIsSubmitted(false);
    onClose();
  };

  const getRatingText = (stars) => {
    const texts = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent',
    };
    return texts[stars] || 'Select Rating';
  };

  const getRatingColor = (stars) => {
    const colors = {
      1: 'text-red-500',
      2: 'text-orange-500',
      3: 'text-yellow-500',
      4: 'text-blue-500',
      5: 'text-green-500',
    };
    return colors[stars] || 'text-gray-400';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-2">
      <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
        {/* Success State */}
        {isSubmitted ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <ThumbsUp size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Thank You!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Your feedback has been submitted successfully.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              We appreciate your time and input!
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClose}
                className="absolute top-2 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Rate Your Experience
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  How was your support experience?
                </p>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6">
              {/* Query Info */}
              <div className="mb-6 p-2 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 font-mono">
                    {petitionId}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium line-clamp-1">
                  {querySubject}
                </p>
              </div>

              {/* Star Rating */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
                  Your Rating
                </label>
                
                <div className="flex justify-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transform transition-all hover:scale-110 focus:outline-none"
                    >
                      <Star
                        size={48}
                        className={`transition-all ${
                          star <= (hoveredRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>

                {/* Rating Text */}
                <div className="text-center">
                  <p
                    className={`text-xl font-bold transition-colors ${
                      rating > 0 ? getRatingColor(rating) : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {getRatingText(rating)}
                  </p>
                </div>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Additional Comments
                  <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">(Optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Share what went well or what could be improved
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {comment.length}/500
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rating === 0 || isLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>

              {/* Rating Guide */}
              <div className="mt-6 p-2 bg-gray-50 dark:bg-gray-950 rounded-lg">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Rating Guide:
                </p>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div>
                    <Star size={16} className="mx-auto mb-1 text-red-500" fill="currentColor" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Poor</p>
                  </div>
                  <div>
                    <Star size={16} className="mx-auto mb-1 text-orange-500" fill="currentColor" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Fair</p>
                  </div>
                  <div>
                    <Star size={16} className="mx-auto mb-1 text-yellow-500" fill="currentColor" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Good</p>
                  </div>
                  <div>
                    <Star size={16} className="mx-auto mb-1 text-blue-500" fill="currentColor" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Very Good</p>
                  </div>
                  <div>
                    <Star size={16} className="mx-auto mb-1 text-green-500" fill="currentColor" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Excellent</p>
                  </div>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
