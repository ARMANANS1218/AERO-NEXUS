import React, { useState, useContext } from 'react';
import { 
  BookOpen, Plus, Edit, Trash2, Save, X, Search, 
  MessageSquare, HelpCircle 
} from 'lucide-react';
import { 
  useGetFaqsQuery, 
  useCreateFaqMutation, 
  useUpdateFaqMutation, 
  useDeleteFaqMutation 
} from '../../../features/faq/faqApi';
import { toast } from 'react-toastify';
import ColorModeContext from '../../../context/ColorModeContext';

export default function FaqManagement() {
  const colorMode = useContext(ColorModeContext);
  const isDark = colorMode?.mode === 'dark';

  const [activeSection, setActiveSection] = useState('common'); // 'common' or 'faqs'
  const [faqSearch, setFaqSearch] = useState('');
  const [commonSearch, setCommonSearch] = useState('');
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [isAddingCommon, setIsAddingCommon] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [editingCommonId, setEditingCommonId] = useState(null);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [newCommonReply, setNewCommonReply] = useState('');

  const { data: faqsData, isLoading } = useGetFaqsQuery();
  const [createFaq] = useCreateFaqMutation();
  const [updateFaq] = useUpdateFaqMutation();
  const [deleteFaq] = useDeleteFaqMutation();

  const faqs = faqsData?.data?.filter(f => f.type === 'faq') || [];
  const commonReplies = faqsData?.data?.filter(f => f.type === 'common') || [];

  const filteredFaqs = faqs.filter(faq =>
    faq.question?.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.answer?.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const filteredCommonReplies = commonReplies.filter(reply =>
    reply.text?.toLowerCase().includes(commonSearch.toLowerCase())
  );

  // Add FAQ
  const handleAddFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }

    try {
      await createFaq({
        type: 'faq',
        question: newFaq.question,
        answer: newFaq.answer
      }).unwrap();
      toast.success('FAQ added successfully');
      setNewFaq({ question: '', answer: '' });
      setIsAddingFaq(false);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to add FAQ');
    }
  };

  // Update FAQ
  const handleUpdateFaq = async (id, question, answer) => {
    if (!question.trim() || !answer.trim()) {
      toast.error('Question and answer cannot be empty');
      return;
    }

    try {
      await updateFaq({
        id,
        question,
        answer
      }).unwrap();
      toast.success('FAQ updated successfully');
      setEditingFaqId(null);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update FAQ');
    }
  };

  // Delete FAQ
  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      await deleteFaq(id).unwrap();
      toast.success('FAQ deleted successfully');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete FAQ');
    }
  };

  // Add Common Reply
  const handleAddCommonReply = async () => {
    if (!newCommonReply.trim()) {
      toast.error('Reply text is required');
      return;
    }

    try {
      await createFaq({
        type: 'common',
        text: newCommonReply
      }).unwrap();
      toast.success('Common reply added successfully');
      setNewCommonReply('');
      setIsAddingCommon(false);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to add common reply');
    }
  };

  // Update Common Reply
  const handleUpdateCommonReply = async (id, text) => {
    if (!text.trim()) {
      toast.error('Reply text cannot be empty');
      return;
    }

    try {
      await updateFaq({
        id,
        text
      }).unwrap();
      toast.success('Common reply updated successfully');
      setEditingCommonId(null);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update common reply');
    }
  };

  // Delete Common Reply
  const handleDeleteCommonReply = async (id) => {
    if (!window.confirm('Are you sure you want to delete this common reply?')) return;

    try {
      await deleteFaq(id).unwrap();
      toast.success('Common reply deleted successfully');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete common reply');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            FAQ & Common Replies Management
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage FAQs and common replies for your support team (Agent, TL, QA)
          </p>
        </div>

        {/* Section Tabs */}
        <div className={`flex gap-2 mb-6 p-1 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveSection('common')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeSection === 'common'
                ? 'bg-blue-600 text-white shadow-md'
                : isDark
                ? 'text-gray-400 hover:bg-gray-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MessageSquare size={20} />
            Common Replies ({commonReplies.length})
          </button>
          <button
            onClick={() => setActiveSection('faqs')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeSection === 'faqs'
                ? 'bg-blue-600 text-white shadow-md'
                : isDark
                ? 'text-gray-400 hover:bg-gray-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <HelpCircle size={20} />
            FAQs ({faqs.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
              size={20}
            />
            <input
              type="text"
              placeholder={`Search ${activeSection === 'common' ? 'common replies' : 'FAQs'}...`}
              value={activeSection === 'common' ? commonSearch : faqSearch}
              onChange={(e) => activeSection === 'common' ? setCommonSearch(e.target.value) : setFaqSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDark
                  ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
        </div>

        {/* Add New Button */}
        {((activeSection === 'common' && !isAddingCommon) || (activeSection === 'faqs' && !isAddingFaq)) && (
          <div className="mb-4">
            <button
              onClick={() => activeSection === 'common' ? setIsAddingCommon(true) : setIsAddingFaq(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-md"
            >
              <Plus size={20} />
              {activeSection === 'common' ? 'Add New Common Reply' : 'Add New FAQ'}
            </button>
          </div>
        )}

        {/* Add Common Reply Form */}
        {isAddingCommon && activeSection === 'common' && (
          <div className={`mb-4 p-4 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-md`}>
            <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>New Common Reply</h3>
            <textarea
              placeholder="Enter reply text..."
              value={newCommonReply}
              onChange={(e) => setNewCommonReply(e.target.value)}
              rows={4}
              className={`w-full mb-3 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                isDark ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCommonReply}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save size={18} />
                Save Reply
              </button>
              <button
                onClick={() => {
                  setIsAddingCommon(false);
                  setNewCommonReply('');
                }}
                className={`flex-1 px-4 py-2.5 border rounded-lg transition-colors ${
                  isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Add FAQ Form */}
        {isAddingFaq && activeSection === 'faqs' && (
          <div className={`mb-4 p-4 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-md`}>
            <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>New FAQ</h3>
            <input
              type="text"
              placeholder="Question..."
              value={newFaq.question}
              onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
              className={`w-full mb-3 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDark ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <textarea
              placeholder="Answer..."
              value={newFaq.answer}
              onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
              rows={4}
              className={`w-full mb-3 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                isDark ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddFaq}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save size={18} />
                Save FAQ
              </button>
              <button
                onClick={() => {
                  setIsAddingFaq(false);
                  setNewFaq({ question: '', answer: '' });
                }}
                className={`flex-1 px-4 py-2.5 border rounded-lg transition-colors ${
                  isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Content List */}
        <div className="space-y-3">
          {activeSection === 'common' ? (
            // Common Replies List
            filteredCommonReplies.length === 0 ? (
              <div className={`flex flex-col items-center justify-center p-12 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <BookOpen size={64} className={isDark ? 'text-gray-700' : 'text-gray-300'} />
                <p className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {commonSearch ? 'No common replies found' : 'No common replies yet. Add your first one!'}
                </p>
              </div>
            ) : (
              filteredCommonReplies.map((reply) => (
                <div
                  key={reply._id}
                  className={`p-4 rounded-lg border ${
                    isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                  } hover:shadow-md transition-shadow`}
                >
                  {editingCommonId === reply._id ? (
                    <div>
                      <textarea
                        defaultValue={reply.text}
                        id={`cr-${reply._id}`}
                        rows={4}
                        className={`w-full mb-3 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                          isDark ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const text = document.getElementById(`cr-${reply._id}`).value;
                            handleUpdateCommonReply(reply._id, text);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <Save size={16} />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCommonId(null)}
                          className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                            isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className={`text-sm whitespace-pre-wrap flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {reply.text}
                        </p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingCommonId(reply._id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                            }`}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCommonReply(reply._id)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {/* <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Added by: {reply.createdByName || 'Unknown'}
                      </div> */}
                    </div>
                  )}
                </div>
              ))
            )
          ) : (
            // FAQs List
            filteredFaqs.length === 0 ? (
              <div className={`flex flex-col items-center justify-center p-12 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <HelpCircle size={64} className={isDark ? 'text-gray-700' : 'text-gray-300'} />
                <p className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {faqSearch ? 'No FAQs found' : 'No FAQs yet. Add your first one!'}
                </p>
              </div>
            ) : (
              filteredFaqs.map((faq) => (
                <div
                  key={faq._id}
                  className={`p-4 rounded-lg border ${
                    isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                  } hover:shadow-md transition-shadow`}
                >
                  {editingFaqId === faq._id ? (
                    <div>
                      <input
                        type="text"
                        defaultValue={faq.question}
                        id={`fq-${faq._id}`}
                        className={`w-full mb-3 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDark ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <textarea
                        defaultValue={faq.answer}
                        id={`fa-${faq._id}`}
                        rows={4}
                        className={`w-full mb-3 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                          isDark ? 'bg-gray-950 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const question = document.getElementById(`fq-${faq._id}`).value;
                            const answer = document.getElementById(`fa-${faq._id}`).value;
                            handleUpdateFaq(faq._id, question, answer);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <Save size={16} />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingFaqId(null)}
                          className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                            isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Q: {faq.question}
                          </h4>
                          <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            A: {faq.answer}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingFaqId(faq._id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                            }`}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteFaq(faq._id)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {/* <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Added by: {faq.createdByName || 'Unknown'}
                      </div> */}
                    </div>
                  )}
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
