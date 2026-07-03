import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Filter, Calendar, FileText, X,
  Upload, Edit, Eye, AlertCircle, CheckCircle,
  ChevronDown, Plus, Send, Download, DollarSign,
  AlertTriangle, ArrowRight, Loader2
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { formatGBP } from '../../../lib/workflows';

/** Live engagements for this vendor — incoming SOWs to sign and active work. */
function LiveEngagements() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: engs } = await supabase
        .from('engagements')
        .select('id, project_title, status, engagement_type, total_value, payment_model, contract_id, created_at')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });
      const contractIds = (engs ?? []).map(e => e.contract_id).filter(Boolean);
      const { data: cons } = contractIds.length
        ? await supabase.from('contracts').select('id, signed_by_customer, signed_by_vendor, contract_number').in('id', contractIds)
        : { data: [] as any[] };
      const conMap = new Map((cons ?? []).map((c: any) => [c.id, c]));
      setRows((engs ?? []).map(e => ({ ...e, contract: e.contract_id ? conMap.get(e.contract_id) : null })));
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 text-blue-500 animate-spin" /></div>;
  if (rows.length === 0) return null;

  const STATUS_CLS: Record<string, string> = {
    pending_signature: 'bg-amber-100 text-amber-700',
    pending_ir35: 'bg-amber-100 text-amber-700',
    active: 'bg-green-100 text-green-700',
    closing: 'bg-purple-100 text-purple-700',
    terminated: 'bg-red-100 text-red-600',
    closed: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold mb-1">Engagements</h2>
      <p className="text-xs text-gray-400 mb-4">Incoming SOWs to sign and live delivery — open the workspace to submit evidence, respond to flags and manage disputes.</p>
      <div className="space-y-2">
        {rows.map(e => {
          const needsSignature = e.contract && !e.contract.signed_by_vendor;
          return (
            <Link key={e.id} to={`/engagement/${e.id}`}
              className="flex flex-wrap items-center justify-between gap-2 border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/40 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">{e.project_title ?? 'Engagement'}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[e.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {e.status?.replace(/_/g, ' ')}
                  </span>
                  {needsSignature && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">Sign now</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {e.contract?.contract_number ?? 'No contract'} · {e.payment_model} · {e.total_value != null ? formatGBP(e.total_value) : '—'}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

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
  status: 'active' | 'pending' | 'cancelled' | 'notice_served';
  noticeEndDate?: string;
  contractType?: 'MSP' | 'IT Agency' | 'Staff Aug';
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
  const [terminationStep, setTerminationStep] = useState(1);
  const [terminationReason, setTerminationReason] = useState('');
  const [terminationNotice, setTerminationNotice] = useState('');
  const [terminationAcknowledged, setTerminationAcknowledged] = useState(false);
  const [terminationSuccess, setTerminationSuccess] = useState(false);

  const getNoticePeriodDays = (contractType?: string) => {
    if (contractType === 'IT Agency') return 14;
    if (contractType === 'Staff Aug') return 28;
    return 30; // MSP default
  };

  const getNoticeEndDate = (contractType?: string) => {
    const days = getNoticePeriodDays(contractType);
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getDaysRemaining = (noticeEndDate?: string) => {
    if (!noticeEndDate) return 0;
    const end = new Date(noticeEndDate);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  /* No hardcoded contracts — data will be loaded from the database */
  const contracts: Contract[] = [];

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

      <LiveEngagements />

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
                  <React.Fragment key={contract.id}>
                  {contract.status === 'notice_served' && (
                    <tr>
                      <td colSpan={5} className="px-6 pt-3 pb-0">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                          <p className="text-sm text-amber-800">
                            Termination notice served — contract active until {contract.noticeEndDate || 'N/A'}. {getDaysRemaining(contract.noticeEndDate)} days remaining in notice period.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
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
                  </React.Fragment>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Serve Termination Notice</h3>
              <button onClick={() => { setShowCancelModal(false); setTerminationStep(1); setTerminationReason(''); setTerminationNotice(''); setTerminationAcknowledged(false); setTerminationSuccess(false); }} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {terminationSuccess ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-base font-semibold text-gray-900 mb-1">Termination notice served.</p>
                <p className="text-sm text-gray-600">Contract active until {getNoticeEndDate(selectedContract.contractType)}.</p>
                <button
                  className="mt-5 px-5 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200"
                  onClick={() => { setShowCancelModal(false); setTerminationStep(1); setTerminationReason(''); setTerminationNotice(''); setTerminationAcknowledged(false); setTerminationSuccess(false); }}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {/* Step 1: Reason + notice period info */}
                {terminationStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason for termination</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                        value={terminationReason}
                        onChange={e => setTerminationReason(e.target.value)}
                      >
                        <option value="">Select a reason…</option>
                        <option value="project_complete">Project completed early</option>
                        <option value="budget">Budget constraints</option>
                        <option value="performance">Performance issues</option>
                        <option value="scope_change">Scope change / restructure</option>
                        <option value="mutual">Mutual agreement</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1">Notice period for this contract type</p>
                      <ul className="text-xs text-amber-700 space-y-0.5">
                        <li>• MSP contracts: 30 days</li>
                        <li>• IT Agency contracts: 14 days</li>
                        <li>• Staff Augmentation: 28 days</li>
                      </ul>
                      <p className="text-xs font-semibold text-amber-800 mt-2">
                        Notice period from today: <span className="font-bold">{getNoticeEndDate(selectedContract.contractType)}</span>
                        {' '}({getNoticePeriodDays(selectedContract.contractType)} days)
                      </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800" onClick={() => setShowCancelModal(false)}>Cancel</button>
                      <button
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                        disabled={!terminationReason}
                        onClick={() => setTerminationStep(2)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Written notice + acknowledgement */}
                {terminationStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Written notice <span className="text-gray-400 font-normal">(minimum 50 characters)</span></label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                        rows={4}
                        placeholder="Provide formal notice of your intent to terminate this contract…"
                        value={terminationNotice}
                        onChange={e => setTerminationNotice(e.target.value)}
                      />
                      <p className={`text-xs mt-1 ${terminationNotice.length < 50 ? 'text-gray-400' : 'text-green-600'}`}>{terminationNotice.length}/50 characters minimum</p>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={terminationAcknowledged}
                        onChange={e => setTerminationAcknowledged(e.target.checked)}
                      />
                      <span className="text-xs text-gray-700">
                        I acknowledge the notice period and understand the contract remains active until <strong>{getNoticeEndDate(selectedContract.contractType)}</strong>.
                      </span>
                    </label>

                    <div className="flex justify-between gap-3 pt-2">
                      <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800" onClick={() => setTerminationStep(1)}>← Back</button>
                      <button
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                        disabled={terminationNotice.length < 50 || !terminationAcknowledged}
                        onClick={() => { handleCancelContract(); setTerminationSuccess(true); }}
                      >
                        Serve Termination Notice
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
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