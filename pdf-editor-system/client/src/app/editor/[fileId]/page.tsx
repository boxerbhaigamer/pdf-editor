'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';

interface FileData {
  id: number;
  file_name: string;
  status: string;
  created_at: string;
  uploader_email: string;
  preview_url: string;
  edited_preview_url?: string;
}

interface Template {
  id: number;
  name: string;
  title: string;
  subtitle: string;
  venue: string;
  dates: string;
}

export default function PdfEditor() {
  const [file, setFile] = useState<FileData | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const fileId = params.fileId as string;

  useEffect(() => {
    if (fileId) {
      fetchFile();
      fetchTemplates();
    }
  }, [fileId]);

  const fetchFile = async () => {
    try {
      const response = await api.get(`/pdf/${fileId}`);
      setFile(response.data);
    } catch (err) {
      setError('Failed to fetch file details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data);
    } catch (err) {
      setError('Failed to fetch templates');
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    setApplying(true);
    setError('');
    setSuccessMessage('');

    try {
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template) {
        throw new Error('Template not found');
      }

      const response = await api.post('/pdf/apply-template', {
        fileId: parseInt(fileId),
        template,
      });

      // Refresh file data to get updated preview URL
      await fetchFile();
      setSuccessMessage('Template applied successfully!');
    } catch (err) {
      setError('Failed to apply template');
    } finally {
      setApplying(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError('');

    try {
      const response = await api.get(`/pdf/download/${fileId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file?.file_name || 'document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!file) return;
    const pdfUrl = file.edited_preview_url || file.preview_url;
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    }
  };

  // Get the best preview URL (edited takes priority)
  const getPreviewUrl = () => {
    if (!file) return null;
    return file.edited_preview_url || file.preview_url || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  const previewUrl = getPreviewUrl();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              PDF Editor
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {file?.file_name} — <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${file?.status === 'edited' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{file?.status}</span>
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 text-lg font-bold">×</button>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md flex justify-between items-center">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="text-green-500 hover:text-green-700 text-lg font-bold">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PDF Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700">
                  PDF Preview
                </h3>
              </div>
              <div className="p-0">
                {previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full border-0"
                    style={{ height: '75vh' }}
                    title="PDF Preview"
                  />
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-16 text-center m-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      PDF preview not available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Template Selector and Controls */}
          <div className="space-y-6">
            {/* Template Selector */}
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700">
                  Select Template
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="template"
                          checked={selectedTemplate === template.id}
                          onChange={() => setSelectedTemplate(template.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">
                            {template.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {template.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {templates.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        No templates available.{' '}
                        <button
                          onClick={() => router.push('/templates')}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Create one →
                        </button>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700">
                  Actions
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <button
                  onClick={handleApplyTemplate}
                  disabled={!selectedTemplate || applying}
                  className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
                    !selectedTemplate || applying
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  {applying ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Applying...
                    </span>
                  ) : 'Apply Template'}
                </button>

                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className={`w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                    downloading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {downloading ? 'Downloading...' : '⬇ Download PDF'}
                </button>

                <button
                  onClick={handlePrint}
                  className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  🖨 Print
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}