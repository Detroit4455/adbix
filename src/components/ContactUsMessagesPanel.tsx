'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  EnvelopeIcon,
  UserIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  EnvelopeOpenIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { EnvelopeIcon as EnvelopeIconSolid } from '@heroicons/react/24/solid';

interface ContactMessage {
  _id: string;
  userId: string;
  widgetId: string;
  formData: Record<string, string>;
  submissionTime: string;
  userAgent?: string;
  isRead: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalMessages: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ContactUsMessagesPanelProps {
  className?: string;
}

export default function ContactUsMessagesPanel({ className = '' }: ContactUsMessagesPanelProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const fetchMessages = async (page = 1, search = '') => {
    if (!session?.user?.mobileNumber) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId: session.user.mobileNumber,
        page: page.toString(),
        limit: '8',
        ...(search && { search })
      });

      const response = await fetch(`/api/contact-us-widget/messages?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch messages');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(currentPage, searchTerm);
  }, [session, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMessages(1, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
    
    // Mark message as read when viewed
    if (!message.isRead) {
      await markMessageAsRead(message._id, true);
    }
  };

  const markMessageAsRead = async (messageId: string, isRead: boolean) => {
    if (!session?.user?.mobileNumber) return;

    try {
      const response = await fetch(`/api/contact-us-widget/messages/mark-read?messageId=${messageId}&userId=${session.user.mobileNumber}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead }),
      });

      if (response.ok) {
        // Update local state
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id === messageId ? { ...msg, isRead } : msg
          )
        );
        
        // Update selected message if it's the same one
        if (selectedMessage?._id === messageId) {
          setSelectedMessage(prev => prev ? { ...prev, isRead } : null);
        }
      }
    } catch (error) {
      console.error('Error updating message read status:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!session?.user?.mobileNumber || !confirm('Are you sure you want to delete this message?')) return;

    setDeleteLoading(messageId);
    try {
      const response = await fetch(`/api/contact-us-widget/messages?messageId=${messageId}&userId=${session.user.mobileNumber}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Refresh messages
        fetchMessages(currentPage, searchTerm);
      } else {
        alert('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFieldIcon = (fieldName: string) => {
    const name = fieldName.toLowerCase();
    if (name.includes('email')) return EnvelopeIcon;
    if (name.includes('phone') || name.includes('mobile')) return PhoneIcon;
    if (name.includes('name')) return UserIcon;
    return ChatBubbleLeftRightIcon;
  };

  if (loading && messages.length === 0) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col ${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Contact-Us Widget Messages</h3>
              <p className="text-sm text-gray-600 mt-1">
                {pagination ? `${pagination.totalMessages} total messages` : 'Manage your contact form submissions'}
              </p>
            </div>
            
            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search messages..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-48 sm:w-64"
                />
              </div>
              <button
                type="submit"
                className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Messages List */}
        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No messages found</h4>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'Messages from your contact form will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto">
              {messages.map((message) => {
                const formDataEntries = Object.entries(message.formData);
                const mainField = formDataEntries.find(([key]) => 
                  key.toLowerCase().includes('message') || key.toLowerCase().includes('subject')
                ) || formDataEntries[0];
                
                return (
                  <div key={message._id} className={`border rounded-lg p-3 transition-colors ${
                    message.isRead 
                      ? 'border-gray-200 bg-white hover:bg-gray-50' 
                      : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            {message.isRead ? (
                              <EnvelopeOpenIcon className="h-4 w-4 text-gray-400" title="Read" />
                            ) : (
                              <EnvelopeIconSolid className="h-4 w-4 text-blue-600" title="Unread" />
                            )}
                            <div className="flex items-center text-sm text-gray-600">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {formatDate(message.submissionTime)}
                            </div>
                            {!message.isRead && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          {/* Show sender info (name/email) */}
                          <div className="flex items-center gap-3 text-sm">
                            {formDataEntries.find(([key]) => key.toLowerCase().includes('name')) && (
                              <div className="flex items-center">
                                <UserIcon className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                                <span className="text-gray-900 font-medium">
                                  {formDataEntries.find(([key]) => key.toLowerCase().includes('name'))?.[1]}
                                </span>
                              </div>
                            )}
                            {formDataEntries.find(([key]) => key.toLowerCase().includes('email')) && (
                              <div className="flex items-center">
                                <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                                <span className="text-gray-600">
                                  {formDataEntries.find(([key]) => key.toLowerCase().includes('email'))?.[1]}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Show one line of message content */}
                          <div className="flex items-start">
                            <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-600 line-clamp-1 flex-1">
                              {mainField?.[1] || 'No message content'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleViewMessage(message)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View message"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => markMessageAsRead(message._id, !message.isRead)}
                          className={`p-2 rounded-lg transition-colors ${
                            message.isRead 
                              ? 'text-gray-600 hover:bg-gray-50' 
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                          title={message.isRead ? 'Mark as unread' : 'Mark as read'}
                        >
                          {message.isRead ? (
                            <EnvelopeIconSolid className="h-4 w-4" />
                          ) : (
                            <CheckCircleIcon className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message._id)}
                          disabled={deleteLoading === message._id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete message"
                        >
                          {deleteLoading === message._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 flex-shrink-0">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalMessages)} of {pagination.totalMessages} messages
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                
                <span className="px-3 py-1 text-sm font-medium">
                  {pagination.page} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Detail Modal */}
      {isModalOpen && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Message Details</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Submitted on {formatDate(selectedMessage.submissionTime)}
                </div>
                
                {Object.entries(selectedMessage.formData).map(([key, value]) => {
                  const Icon = getFieldIcon(key);
                  return (
                    <div key={key} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Icon className="h-5 w-5 text-gray-400 mr-2" />
                        <label className="font-medium text-gray-700 capitalize">{key}</label>
                      </div>
                      <div className="text-gray-900 whitespace-pre-wrap">{value}</div>
                    </div>
                  );
                })}
                
                {selectedMessage.userAgent && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <label className="font-medium text-gray-700 mb-2 block">User Agent</label>
                    <div className="text-sm text-gray-600">{selectedMessage.userAgent}</div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDeleteMessage(selectedMessage._id);
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 