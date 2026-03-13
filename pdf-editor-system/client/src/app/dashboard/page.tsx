'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';

interface Tournament {
  id: number;
  name: string;
  created_at: string;
  creator_email: string;
}

export default function Dashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTournamentName, setNewTournamentName] = useState('');
  const [error, setError] = useState('');

  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await api.get('/tournaments');
      setTournaments(response.data);
    } catch (err) {
      setError('Failed to fetch tournaments');
    } finally {
      setLoading(false);
    }
  };

  const createTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournamentName.trim()) return;

    try {
      const response = await api.post('/tournaments', {
        name: newTournamentName,
      });
      setTournaments([response.data, ...tournaments]);
      setNewTournamentName('');
    } catch (err: any) {
      console.error('Error creating tournament:', err?.response?.data || err.message);
      setError(err?.response?.data?.error || 'Failed to create tournament');
    }
  };

  const deleteTournament = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this tournament?')) return;

    try {
      await api.delete(`/tournaments/${id}`);
      setTournaments(tournaments.filter(t => t.id !== id));
    } catch (err) {
      setError('Failed to delete tournament');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.email} <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">{user?.role}</span>
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
          {/* Navigation */}
          <div className="mt-4 flex space-x-6 border-t border-gray-200 pt-3">
            <button
              className="text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 pb-2"
            >
              Tournaments
            </button>
            <button
              onClick={() => router.push('/templates')}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 pb-2"
            >
              Templates
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Create Tournament Form */}
        <div className="mb-8">
          <form onSubmit={createTournament} className="flex space-x-4">
            <input
              type="text"
              value={newTournamentName}
              onChange={(e) => setNewTournamentName(e.target.value)}
              placeholder="Enter tournament name..."
              className="flex-grow px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
            />
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              + Create Tournament
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 text-lg font-bold">×</button>
          </div>
        )}

        {/* Tournaments List */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => router.push(`/tournament/${tournament.id}`)}
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">
                    {tournament.name}
                  </h3>
                  <button
                    onClick={(e) => deleteTournament(tournament.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 text-sm"
                    title="Delete tournament"
                  >
                    ✕
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Created by {tournament.creator_email}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(tournament.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {tournaments.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No tournaments
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new tournament.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}