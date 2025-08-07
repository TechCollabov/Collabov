import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Send, Paperclip, X, Check, 
  AlertCircle, Download, User
} from 'lucide-react';

interface Message {
  id: string;
  username: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: {
    name: string;
    size: string;
    type: string;
  }[];
}

interface MessageRequest {
  id: string;
  username: string;
  subject: string;
  timestamp: string;
}

const Inbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'messages' | 'requests'>('messages');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [showSendMessage, setShowSendMessage] = useState(false);

  // Mock data
  const messages: Message[] = [
    {
      id: '1',
      username: 'john_doe',
      subject: 'Project Discussion',
      content: 'Hi, I would like to discuss the project requirements in detail.',
      timestamp: '2024-03-15T10:30:00',
      isRead: false,
      attachments: [
        { name: 'requirements.pdf', size: '2.5MB', type: 'application/pdf' }
      ]
    },
    {
      id: '2',
      username: 'sarah_smith',
      subject: 'Contract Review',
      content: 'Please review the attached contract and let me know your thoughts.',
      timestamp: '2024-03-14T15:45:00',
      isRead: true,
      attachments: [
        { name: 'contract_v2.docx', size: '1.8MB', type: 'application/docx' }
      ]
    }
  ];

  const messageRequests: MessageRequest[] = [
    {
      id: '1',
      username: 'tech_company',
      subject: 'New Project Opportunity',
      timestamp: '2024-03-15T09:00:00'
    },
    {
      id: '2',
      username: 'startup_founder',
      subject: 'Collaboration Interest',
      timestamp: '2024-03-14T16:20:00'
    }
  ];

  const handleSendMessage = () => {
    // Handle sending message logic here
    setReplyContent('');
    setSelectedMessage(null);
  };

  const handleMessageRequest = (requestId: string, approved: boolean) => {
    // Handle message request approval/denial logic here
    console.log(`Message request ${requestId} ${approved ? 'approved' : 'denied'}`);
  };

  const filteredMessages = messages.filter(message =>
    message.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={() => setShowSendMessage(true)}
        >
          <Send className="h-4 w-4" />
          <span>New Message</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'messages'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('messages')}
        >
          Messages
          {messages.filter(m => !m.isRead).length > 0 && (
            <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
              {messages.filter(m => !m.isRead).length}
            </span>
          )}
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'requests'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('requests')}
        >
          Message Requests
          {messageRequests.length > 0 && (
            <span className="ml-2 bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs">
              {messageRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Messages List */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  !message.isRead ? 'bg-primary-50' : ''
                }`}
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {message.username}
                      </h3>
                      <p className="text-sm text-gray-600">{message.subject}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(message.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {messageRequests.map((request) => (
              <div key={request.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {request.username}
                      </h3>
                      <p className="text-sm text-gray-600">{request.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                      onClick={() => handleMessageRequest(request.id, true)}
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      onClick={() => handleMessageRequest(request.id, false)}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message View Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{selectedMessage.subject}</h3>
                  <p className="text-gray-600">From: {selectedMessage.username}</p>
                </div>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setSelectedMessage(null)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="border-t border-b border-gray-200 py-4 mb-4">
                <p className="text-gray-800">{selectedMessage.content}</p>
              </div>

              {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments:</h4>
                  <div className="space-y-2">
                    {selectedMessage.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{attachment.name}</span>
                          <span className="text-xs text-gray-500">({attachment.size})</span>
                        </div>
                        <button className="text-primary-600 hover:text-primary-700">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  placeholder="Type your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                ></textarea>
                
                <div className="flex justify-between items-center">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-700">
                    <Paperclip className="h-5 w-5" />
                    <span>Attach File</span>
                  </button>
                  <button
                    className="btn-primary flex items-center space-x-2"
                    onClick={handleSendMessage}
                  >
                    <Send className="h-4 w-4" />
                    <span>Send Reply</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Message Modal */}
      {showSendMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">New Message</h3>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setShowSendMessage(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To:
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject:
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message:
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={6}
                    placeholder="Type your message..."
                  ></textarea>
                </div>
                
                <div className="flex justify-between items-center">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-700">
                    <Paperclip className="h-5 w-5" />
                    <span>Attach File</span>
                  </button>
                  <button
                    className="btn-primary flex items-center space-x-2"
                    onClick={() => setShowSendMessage(false)}
                  >
                    <Send className="h-4 w-4" />
                    <span>Send Message</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbox;