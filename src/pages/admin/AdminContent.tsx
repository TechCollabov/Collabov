import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, Globe, FileText } from 'lucide-react';

const CONTENT = [
  { id: '1', title: 'Homepage Hero Copy', type: 'Page Content', status: 'published', lastEdited: '2 days ago', section: 'Homepage' },
  { id: '2', title: 'How It Works Section', type: 'Page Content', status: 'published', lastEdited: '1 week ago', section: 'Homepage' },
  { id: '3', title: 'Vendor Verification FAQ', type: 'FAQ', status: 'published', lastEdited: '3 days ago', section: 'Help Centre' },
  { id: '4', title: 'IR35 Compliance Guide for Buyers', type: 'Resource', status: 'published', lastEdited: '2 weeks ago', section: 'Resources' },
  { id: '5', title: 'Outsourcing to Eastern Europe — Market Report', type: 'Blog Post', status: 'draft', lastEdited: '1 day ago', section: 'Blog' },
  { id: '6', title: 'Platform Terms of Service', type: 'Legal', status: 'published', lastEdited: '1 month ago', section: 'Legal' },
  { id: '7', title: 'Privacy Policy', type: 'Legal', status: 'published', lastEdited: '1 month ago', section: 'Legal' },
  { id: '8', title: '2026 UK IT Outsourcing Benchmark Report', type: 'Blog Post', status: 'draft', lastEdited: '3 days ago', section: 'Blog' },
];

const TYPES = ['All', 'Page Content', 'FAQ', 'Resource', 'Blog Post', 'Legal'];

const STATUS_COLOR: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-500',
};

const AdminContent: React.FC = () => {
  const [content, setContent] = useState(CONTENT);
  const [typeFilter, setTypeFilter] = useState('All');
  const [editing, setEditing] = useState<string | null>(null);

  const filtered = typeFilter === 'All' ? content : content.filter(c => c.type === typeFilter);

  const deleteItem = (id: string) => setContent(cs => cs.filter(c => c.id !== id));
  const toggleStatus = (id: string) => setContent(cs => cs.map(c => c.id === id ? { ...c, status: c.status === 'published' ? 'draft' : 'published' } : c));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Content Management</h1>
        <button className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0070F3] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> New Content
        </button>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {TYPES.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === t ? 'bg-[#0070F3] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Title</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Type</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Section</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Last Edited</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-4">
                  <div className="font-medium text-[#0B2D59]">{item.title}</div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs bg-blue-50 text-[#0070F3] px-2.5 py-1 rounded-full font-medium">{item.type}</span>
                </td>
                <td className="px-5 py-4 text-gray-500">{item.section}</td>
                <td className="px-5 py-4 text-gray-400">{item.lastEdited}</td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => toggleStatus(item.id)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[item.status]}`}
                  >
                    {item.status === 'published' ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-1.5">
                    <button className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100" title="Preview">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100" title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminContent;
