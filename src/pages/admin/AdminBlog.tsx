import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';

const AdminBlog: React.FC = () => {
  const [posts] = useState([
    {
      id: 1,
      title: 'In-House vs Outsourced Teams – Complete Cost Breakdown for 2025',
      excerpt: 'Explore the true costs of building an in-house team versus outsourcing, including hidden expenses and long-term considerations for different business sizes.',
      author: 'John Smith',
      category: 'Cost Analysis',
      status: 'Published',
      publishDate: '2025-05-15'
    },
    {
      id: 2,
      title: 'Legal Tips for Outsourcing Projects in the UK and EU',
      excerpt: 'Navigate the complex regulatory landscape of outsourcing in the UK and EU with these essential legal considerations and best practices.',
      author: 'Sarah Johnson',
      category: 'Legal',
      status: 'Draft',
      publishDate: '2025-05-10'
    },
    {
      id: 3,
      title: 'Top 5 Mistakes to Avoid When Hiring Overseas Development Teams',
      excerpt: 'Learn from common pitfalls and discover proven strategies for successful collaboration with international development partners.',
      author: 'Michael Chen',
      category: 'Best Practices',
      status: 'Published',
      publishDate: '2025-05-05'
    }
  ]);

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Blog Posts</h1>
        <button className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Create Post
        </button>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Publish Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {post.title}
                    </div>
                    <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {post.excerpt}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{post.author}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      post.status === 'Published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{post.publishDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900 mr-3">
                      <Eye className="h-5 w-5" />
                    </button>
                    <button className="text-primary-600 hover:text-primary-900 mr-3">
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBlog;