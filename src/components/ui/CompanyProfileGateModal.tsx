import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

interface Props {
  action: string;
  onClose: () => void;
}

/** Hard gate shown when a buyer tries to spend before their company profile is complete. */
const CompanyProfileGateModal: React.FC<Props> = ({ action, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center">
      <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
      <h2 className="text-lg font-bold text-gray-900 mb-1">Complete your company profile first</h2>
      <p className="text-sm text-gray-500 mb-5">
        You can't {action} until your company name and country are filled in. This keeps every
        engagement identifiable for tax and contract purposes.
      </p>
      <div className="flex gap-3 justify-center">
        <Link to="/customer/settings" className="px-5 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg">
          Complete Profile
        </Link>
        <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg">
          Not now
        </button>
      </div>
    </div>
  </div>
);

export default CompanyProfileGateModal;
