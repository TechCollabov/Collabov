import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Calendar, FileText, X, 
  Upload, Edit, Eye, AlertCircle, CheckCircle,
  ChevronDown, Plus, Send, Download, DollarSign
} from 'lucide-react';

interface Service {
  name: string;
  description: string;
  price: number;
}

interface Contract {
  id: string;
  clientName: string;
  projectName: string;
  startDate: string;
  endDate: string;
  value: string;
  status: 'active' | 'pending' | 'cancelled';
  services: Service[];
  contractNumber?: string;
  clientAddress?: string;
  vendorAddress?: string;
  paymentTerms?: string;
  deliverables?: string[];
  terms?: string[];
}

const ContractTemplate: React.FC<{ contract: Contract }> = ({ contract }) => {
  return (
    <div className="p-8 max-h-[80vh] overflow-y-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">SERVICE AGREEMENT</h2>
        <p className="text-gray-600">Contract Number: {contract.contractNumber || 'CT-2024-001'}</p>
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-2">Client:</h3>
            <p>{contract.clientName}</p>
            <p className="text-gray-600">{contract.clientAddress || '123 Client Street\nCity, Country'}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Vendor:</h3>
            <p>Your Company Name</p>
            <p className="text-gray-600">{contract.vendorAddress || '456 Vendor Avenue\nCity, Country'}</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold mb-4">1. Project Details</h3>
        <div className="space-y-2">
          <p><strong>Project Name:</strong> {contract.projectName}</p>
          <p><strong>Start Date:</strong> {new Date(contract.startDate).toLocaleDateString()}</p>
          <p><strong>End Date:</strong> {new Date(contract.endDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold mb-4">2. Services and Pricing</h3>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Service</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contract.services.map((service, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">{service.name}</td>
                  <td className="px-4 py-2">{service.description}</td>
                  <td className="px-4 py-2 text-right">${service.price}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={2} className="px-4 py-2 font-semibold">Total Value</td>
                <td className="px-4 py-2 text-right font-semibold">{contract.value}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold mb-4">3. Deliverables</h3>
        <ul className="list-disc list-inside space-y-2">
          {(contract.deliverables || [
            'Complete project documentation',
            'Source code and assets',
            'Regular progress reports',
            'Final deployment and handover'
          ]).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold mb-4">4. Payment Terms</h3>
        <p>{contract.paymentTerms || 'Payment shall be made according to the following schedule:\n- 30% upon contract signing\n- 40% at project midpoint\n- 30% upon completion'}</p>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold mb-4">5. Terms and Conditions</h3>
        <ul className="list-decimal list-inside space-y-2">
          {(contract.terms || [
            'Confidentiality of all project-related information',
            'Intellectual property rights transfer upon final payment',
            'Change requests must be approved in writing',
            'Regular status meetings and reporting'
          ]).map((term, index) => (
            <li key={index}>{term}</li>
          ))}
        </ul>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-8">
        <div>
          <p className="font-semibold mb-4">Client Signature:</p>
          <div className="h-20 border-b border-gray-300"></div>
          <p className="mt-2">Date: _________________</p>
        </div>
        <div>
          <p className="font-semibold mb-4">Vendor Signature:</p>
          <div className="h-20 border-b border-gray-300"></div>
          <p className="mt-2">Date: _________________</p>
        </div>
      </div>
    </div>
  );
};

const ManageContracts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'pending' | 'upload'>('current');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [cancelReason, setCancelReason] = useState('');
  const [newService, setNewService] = useState({ name: '', price: '', description: '' });

  // Mock data
  const contracts: Contract[] = [
    {
      id: '1',
      clientName: 'Tech Solutions Inc.',
      projectName: 'E-commerce Platform Development',
      startDate: '2024-02-01',
      endDate: '2024-08-01',
      value: '$50,000',
      status: 'active',
      services: [
        { name: 'Frontend Development', description: 'React-based user interface', price: 2000 },
        { name: 'Backend Development', description: 'Node.js API development', price: 2500 }
      ]
    },
    {
      id: '2',
      clientName: 'Digital Innovations Ltd',
      projectName: 'Mobile App Development',
      startDate: '2024-03-01',
      endDate: '2024-06-01',
      value: '$35,000',
      status: 'pending',
      services: [
        { name: 'React Native Development', description: 'Cross-platform mobile app', price: 3000 }
      ]
    }
  ];

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = (activeTab === 'current' && contract.status === 'active') ||
                         (activeTab === 'pending' && contract.status === 'pending');
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    }
    return a.clientName.localeCompare(b.clientName);
  });

  const handleCancelContract = () => {
    setShowCancelModal(false);
    setSelectedContract(null);
  };

  const handleAddService = () => {
    if (!selectedContract || !newService.name || !newService.price) return;
    
    selectedContract.services.push({
      name: newService.name,
      description: newService.description,
      price: parseFloat(newService.price)
    });

    setNewService({ name: '', price: '', description: '' });
    setShowAddServiceModal(false);
  };

  const handleModifyProposal = () => {
    setShowModifyModal(false);
    setSelectedContract(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Manage Contracts</h1>

      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'current'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('current')}
        >
          Current Contracts
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'pending'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Contracts
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'upload'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('upload')}
        >
          Upload New Proposal
        </button>
      </div>

      {activeTab !== 'upload' && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by client or project name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                </select>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'upload' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client/Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {contract.clientName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contract.projectName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(contract.startDate).toLocaleDateString()} -
                        {new Date(contract.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{contract.value}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        contract.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {contract.status === 'active' ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedContract(contract);
                          setShowContractModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <Eye className="h-5 w-5 inline" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedContract(contract);
                          contract.status === 'active'
                            ? setShowCancelModal(true)
                            : setShowModifyModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        {contract.status === 'active' ? 'Cancel' : 'Modify'}
                      </button>
                      {contract.status === 'active' && (
                        <button
                          onClick={() => {
                            setSelectedContract(contract);
                            setShowAddServiceModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Add Service
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Email or Username
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter client email or username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Proposal Document
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Drag and drop your proposal document here, or{' '}
                  <button className="text-primary-600 hover:text-primary-700">
                    browse
                  </button>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  PDF, DOC, or DOCX up to 10MB
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary flex items-center space-x-2"
              >
                <Send className="h-5 w-5" />
                <span>Send Proposal</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {showContractModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Contract Details</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {/* Add download logic */}}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  title="Download PDF"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowContractModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <ContractTemplate contract={selectedContract} />
          </div>
        </div>
      )}

      {showCancelModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Cancel Contract</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel the contract with {selectedContract.clientName}?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              ></textarea>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-700"
                onClick={() => setShowCancelModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleCancelContract}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddServiceModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Service</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name
                </label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter service name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Enter service description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Price (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  className="px-4 py-2 text-gray-600 hover:text-gray-700"
                  onClick={() => setShowAddServiceModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleAddService}
                >
                  Add Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModifyModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Modify Proposal</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Updated Terms
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
                placeholder="Enter updated terms"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-700"
                onClick={() => setShowModifyModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleModifyProposal}
              >
                Send Modified Proposal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageContracts;