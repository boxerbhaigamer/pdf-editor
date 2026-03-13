'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';

interface Template {
  id: number;
  name: string;
  title: string;
  subtitle: string;
  venue: string;
  dates: string;
  left_logo_url: string | null;
  right_logo_url: string | null;
  created_at: string;
}

interface TemplateForm {
  name: string;
  title: string;
  subtitle: string;
  venue: string;
  dates: string;
  leftLogoBase64: string;
  rightLogoBase64: string;
  left_logo_url: string | null;
  right_logo_url: string | null;
}

const emptyForm: TemplateForm = {
  name: '',
  title: '',
  subtitle: '',
  venue: '',
  dates: '',
  leftLogoBase64: '',
  rightLogoBase64: '',
  left_logo_url: null,
  right_logo_url: null,
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<TemplateForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Preview state for logo images
  const [leftLogoPreview, setLeftLogoPreview] = useState<string | null>(null);
  const [rightLogoPreview, setRightLogoPreview] = useState<string | null>(null);

  const leftLogoRef = useRef<HTMLInputElement>(null);
  const rightLogoRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data);
    } catch (err) {
      setError('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (side === 'left') {
        setFormData({ ...formData, leftLogoBase64: base64 });
        setLeftLogoPreview(base64);
      } else {
        setFormData({ ...formData, rightLogoBase64: base64 });
        setRightLogoPreview(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.title.trim()) {
      setError('Template name and title are required');
      return;
    }

    try {
      const response = await api.post('/templates', formData);
      setTemplates([response.data, ...templates]);
      resetForm();
      setSuccessMessage('Template created successfully');
    } catch (err) {
      setError('Failed to create template');
    }
  };

  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const response = await api.put(`/templates/${editingId}`, formData);
      setTemplates(templates.map(t => t.id === editingId ? response.data : t));
      resetForm();
      setSuccessMessage('Template updated successfully');
    } catch (err) {
      setError('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await api.delete(`/templates/${id}`);
      setTemplates(templates.filter(t => t.id !== id));
      setSuccessMessage('Template deleted');
    } catch (err) {
      setError('Failed to delete template');
    }
  };

  const startEditing = (template: Template) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      title: template.title,
      subtitle: template.subtitle || '',
      venue: template.venue || '',
      dates: template.dates || '',
      leftLogoBase64: '',
      rightLogoBase64: '',
      left_logo_url: template.left_logo_url,
      right_logo_url: template.right_logo_url,
    });
    setLeftLogoPreview(template.left_logo_url ? `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '')}${template.left_logo_url}` : null);
    setRightLogoPreview(template.right_logo_url ? `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '')}${template.right_logo_url}` : null);
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({ ...emptyForm });
    setLeftLogoPreview(null);
    setRightLogoPreview(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Tournament PDF System</h1>
          </div>
          {/* Navigation */}
          <div className="mt-4 flex space-x-6 border-t border-gray-200 pt-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 pb-2"
            >
              Tournaments
            </button>
            <button
              className="text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 pb-2"
            >
              Templates
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Create button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {showForm && !editingId ? 'Cancel' : '+ Create Template'}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-bold">×</button>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm flex justify-between items-center">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="text-green-500 hover:text-green-700 font-bold">×</button>
          </div>
        )}

        {/* Template Form */}
        {showForm && (
          <div className="mb-8 bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">
                {editingId ? 'Edit Template' : 'Create New Template'}
              </h3>
            </div>
            <form onSubmit={editingId ? handleUpdateTemplate : handleCreateTemplate}>
              <div className="p-6">
                {/* Header Preview */}
                <div className="mb-6 border rounded-lg p-4 bg-gray-50">
                  <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Header Preview</p>
                  <div className="bg-white border rounded-lg p-4 flex items-center justify-between" style={{ minHeight: '100px' }}>
                    <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center">
                      {leftLogoPreview ? (
                        <img src={leftLogoPreview} alt="Left Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="w-14 h-14 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-400">Logo</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow text-center px-4">
                      <div className="text-lg font-bold text-gray-900">{formData.title || 'Tournament Title'}</div>
                      {formData.subtitle && <div className="text-sm text-gray-600">{formData.subtitle}</div>}
                      {formData.venue && <div className="text-xs text-gray-500">{formData.venue}</div>}
                      {formData.dates && <div className="text-xs text-gray-500">{formData.dates}</div>}
                    </div>
                    <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center">
                      {rightLogoPreview ? (
                        <img src={rightLogoPreview} alt="Right Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="w-14 h-14 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-400">Logo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-5">
                  {/* Template Name */}
                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Template Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
                      placeholder="e.g. Score Sheet"
                    />
                  </div>

                  {/* Title */}
                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Tournament Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
                      placeholder="e.g. Boxing Championship 2026"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="col-span-6">
                    <label className="block text-sm font-medium text-gray-700">Subtitle</label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
                      placeholder="e.g. Score Sheet Template"
                    />
                  </div>

                  {/* Venue */}
                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Venue</label>
                    <input
                      type="text"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
                      placeholder="e.g. Sports Arena"
                    />
                  </div>

                  {/* Dates */}
                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Dates</label>
                    <input
                      type="text"
                      value={formData.dates}
                      onChange={(e) => setFormData({ ...formData, dates: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
                      placeholder="e.g. March 15-17, 2026"
                    />
                  </div>

                  {/* Left Logo */}
                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Left Logo</label>
                    <div className="flex items-center space-x-3">
                      {leftLogoPreview && (
                        <img src={leftLogoPreview} alt="Left Logo" className="h-12 w-12 object-contain border rounded" />
                      )}
                      <button
                        type="button"
                        onClick={() => leftLogoRef.current?.click()}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        {leftLogoPreview ? 'Change' : 'Upload'}
                      </button>
                      {leftLogoPreview && (
                        <button
                          type="button"
                          onClick={() => { setLeftLogoPreview(null); setFormData({ ...formData, leftLogoBase64: '', left_logo_url: null }); }}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                      <input ref={leftLogoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'left')} />
                    </div>
                  </div>

                  {/* Right Logo */}
                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Right Logo</label>
                    <div className="flex items-center space-x-3">
                      {rightLogoPreview && (
                        <img src={rightLogoPreview} alt="Right Logo" className="h-12 w-12 object-contain border rounded" />
                      )}
                      <button
                        type="button"
                        onClick={() => rightLogoRef.current?.click()}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        {rightLogoPreview ? 'Change' : 'Upload'}
                      </button>
                      {rightLogoPreview && (
                        <button
                          type="button"
                          onClick={() => { setRightLogoPreview(null); setFormData({ ...formData, rightLogoBase64: '', right_logo_url: null }); }}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                      <input ref={rightLogoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'right')} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {editingId ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Templates List */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div key={template.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              {/* Mini header preview */}
              <div className="px-3 py-3 bg-gray-50 border-b flex items-center justify-between" style={{ minHeight: '60px' }}>
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  {template.left_logo_url ? (
                    <img src={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '')}${template.left_logo_url}`} alt="" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="w-7 h-7 border border-dashed border-gray-300 rounded flex items-center justify-center">
                      <span className="text-[8px] text-gray-400">L</span>
                    </div>
                  )}
                </div>
                <div className="text-center px-2 flex-grow">
                  <div className="text-xs font-bold text-gray-800 truncate">{template.title}</div>
                  {template.subtitle && <div className="text-[10px] text-gray-500 truncate">{template.subtitle}</div>}
                </div>
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  {template.right_logo_url ? (
                    <img src={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '')}${template.right_logo_url}`} alt="" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="w-7 h-7 border border-dashed border-gray-300 rounded flex items-center justify-center">
                      <span className="text-[8px] text-gray-400">R</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-medium text-gray-900">{template.name}</h3>
                  <div className="flex space-x-2">
                    <button onClick={() => startEditing(template)} className="text-sm text-indigo-600 hover:text-indigo-900">Edit</button>
                    <button onClick={() => handleDeleteTemplate(template.id)} className="text-sm text-red-600 hover:text-red-900">Delete</button>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  {template.venue && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Venue</span>
                      <span className="text-gray-900">{template.venue}</span>
                    </div>
                  )}
                  {template.dates && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dates</span>
                      <span className="text-gray-900">{template.dates}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && !showForm && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
            <p className="mt-1 text-sm text-gray-500">Create a template to start editing PDF headers.</p>
            <div className="mt-4">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                + Create Template
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}