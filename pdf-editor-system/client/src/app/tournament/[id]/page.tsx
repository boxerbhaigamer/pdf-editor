'use client';

import { useState, useEffect, useRef, DragEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';

interface Tournament {
  id: number;
  name: string;
  created_at: string;
  creator_email: string;
}

interface FileRecord {
  id: number;
  file_name: string;
  status: string;
  created_at: string;
  uploader_email: string;
}

interface Template {
  id: number;
  name: string;
  title: string;
  subtitle: string;
  venue: string;
  dates: string;
}

export default function TournamentDetail() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Batch apply modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [batchApplying, setBatchApplying] = useState(false);

  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tournamentId = params.id as string;

  useEffect(() => {
    if (tournamentId) {
      fetchTournament();
      fetchFiles();
    }
  }, [tournamentId]);

  const fetchTournament = async () => {
    try {
      const response = await api.get(`/tournaments/${tournamentId}`);
      setTournament(response.data);
    } catch (err) {
      setError('Failed to fetch tournament');
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await api.get(`/tournaments/${tournamentId}/files`);
      setFiles(response.data);
    } catch (err) {
      setError('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const uploadFilesFromList = async (fileList: globalThis.FileList | globalThis.File[]) => {
    const pdfFiles = Array.from(fileList).filter(f => f.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      setError('Please select PDF files only');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('tournamentId', tournamentId);

      for (const file of pdfFiles) {
        formData.append('files', file);
      }

      await api.post('/pdf/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccessMessage(`${pdfFiles.length} file(s) uploaded successfully`);
      fetchFiles();
    } catch (err) {
      setError('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = e.target.files;
    if (!inputFiles || inputFiles.length === 0) return;
    await uploadFilesFromList(inputFiles);
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      await uploadFilesFromList(droppedFiles);
    }
  };

  const handleFileSelect = (fileId: number) => {
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    } else {
      setSelectedFiles([...selectedFiles, fileId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(f => f.id));
    }
  };

  const handleDownload = async (fileId: number, fileName: string) => {
    try {
      const response = await api.get(`/pdf/download/${fileId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download file');
    }
  };

  const handleDeleteFile = async (fileId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await api.delete(`/pdf/${fileId}`);
      setFiles(files.filter(f => f.id !== fileId));
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
      setSuccessMessage('File deleted successfully');
    } catch (err) {
      setError('Failed to delete file');
    }
  };

  // Batch apply
  const openBatchModal = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }
    try {
      const response = await api.get('/templates');
      setTemplates(response.data);
      setShowBatchModal(true);
    } catch (err) {
      setError('Failed to fetch templates');
    }
  };

  const handleBatchApply = async () => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    setBatchApplying(true);
    setError('');

    try {
      const template = templates.find(t => t.id === selectedTemplate);
      const response = await api.post('/pdf/batch-apply-template', {
        fileIds: selectedFiles,
        template,
      });

      setSuccessMessage(response.data.message);
      setShowBatchModal(false);
      setSelectedFiles([]);
      setSelectedTemplate(null);
      fetchFiles();
    } catch (err) {
      setError('Failed to batch apply template');
    } finally {
      setBatchApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tournament...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {tournament?.name || 'Tournament'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{files.length} file(s)</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push('/templates')}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Templates
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Upload Section with Drag & Drop */}
        <div className="mb-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center">
              <svg className="h-10 w-10 text-gray-400 mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                  <span>Click to upload PDFs</span>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    multiple
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">PDF files only, up to 10MB each</p>
              {uploading && (
                <div className="mt-3 flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                  <span className="text-sm text-gray-500">Uploading...</span>
                </div>
              )}
            </div>
          </div>
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

        {/* Batch Actions */}
        {files.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSelectAll}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {selectedFiles.length === files.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedFiles.length > 0 && (
                <span className="text-sm text-gray-500">
                  {selectedFiles.length} selected
                </span>
              )}
            </div>
            {selectedFiles.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={openBatchModal}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Apply Template to Selected
                </button>
                <button
                  onClick={() => setSelectedFiles([])}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {/* Files List */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <ul className="divide-y divide-gray-200">
            {files.map((file) => (
              <li key={file.id}>
                <div className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => handleFileSelect(file.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                    />
                    <div className="flex-shrink-0 h-6 w-6 text-gray-400 mr-3">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{file.file_name}</div>
                      <div className="text-xs text-gray-500">
                        by {file.uploader_email} · {new Date(file.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      file.status === 'edited' ? 'bg-green-100 text-green-800' : 
                      file.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {file.status}
                    </span>
                    <button
                      onClick={() => router.push(`/editor/${file.id}`)}
                      className="inline-flex items-center px-2.5 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDownload(file.id, file.file_name)}
                      className="inline-flex items-center px-2.5 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      ⬇
                    </button>
                    <button
                      onClick={(e) => handleDeleteFile(file.id, e)}
                      className="inline-flex items-center px-2.5 py-1 border border-red-200 text-xs font-medium rounded text-red-600 bg-white hover:bg-red-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {files.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
              <p className="mt-1 text-sm text-gray-500">Upload PDF files using the area above.</p>
            </div>
          )}
        </div>
      </div>

      {/* Batch Apply Template Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" onClick={() => setShowBatchModal(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-10">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Apply Template to {selectedFiles.length} File(s)
              </h3>
              
              <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        checked={selectedTemplate === template.id}
                        onChange={() => setSelectedTemplate(template.id)}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{template.name}</div>
                        <div className="text-xs text-gray-500">{template.title}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No templates available. <button onClick={() => router.push('/templates')} className="text-indigo-600 hover:text-indigo-800">Create one</button>
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleBatchApply}
                  disabled={!selectedTemplate || batchApplying}
                  className={`flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white ${
                    !selectedTemplate || batchApplying ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {batchApplying ? 'Processing...' : 'Apply'}
                </button>
                <button
                  onClick={() => { setShowBatchModal(false); setSelectedTemplate(null); }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}