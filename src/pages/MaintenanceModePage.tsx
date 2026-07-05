import React from 'react';
import { Wrench } from 'lucide-react';

const MaintenanceModePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wrench className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold text-[#0B2D59] mb-3">Down for maintenance</h1>
        <p className="text-gray-500 text-lg">
          Collabov is undergoing scheduled maintenance. We'll be back shortly — thanks for your patience.
        </p>
      </div>
    </div>
  );
};

export default MaintenanceModePage;
