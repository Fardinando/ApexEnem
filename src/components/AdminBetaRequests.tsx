import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface BetaRequest {
  id: string;
  name: string;
  email: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function AdminBetaRequests() {
  const [requests, setRequests] = useState<BetaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/beta-requests');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/beta-requests/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setRequests(prev =>
        prev.map(r => (r.id === id ? { ...r, status } : r))
      );
    } catch (err: any) {
      console.error('Update failed:', err);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-400 border border-green-700/50">
            <CheckCircle className="w-3 h-3" /> Aprovado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-900/40 text-red-400 border border-red-700/50">
            <XCircle className="w-3 h-3" /> Rejeitado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-900/40 text-amber-400 border border-amber-700/50">
            <Clock className="w-3 h-3" /> Pendente
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0814] text-[#f3effc] p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin — Beta Requests</h1>
              <p className="text-sm text-slate-400">{requests.length} pedidos registrados</p>
            </div>
          </div>
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-900/30 border border-red-700/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading && requests.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            Nenhum pedido de beta encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-700/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-left text-slate-400">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Motivo</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{req.name}</td>
                    <td className="px-4 py-3 text-slate-400">{req.email}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate" title={req.reason}>
                      {req.reason || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(req.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">{statusBadge(req.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.status !== 'approved' && (
                          <button
                            onClick={() => updateStatus(req.id, 'approved')}
                            className="px-3 py-1.5 rounded-lg bg-green-900/40 hover:bg-green-800/50 text-green-400 text-xs font-medium border border-green-700/50 transition-colors"
                          >
                            Aprovar
                          </button>
                        )}
                        {req.status !== 'rejected' && (
                          <button
                            onClick={() => updateStatus(req.id, 'rejected')}
                            className="px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/50 text-red-400 text-xs font-medium border border-red-700/50 transition-colors"
                          >
                            Rejeitar
                          </button>
                        )}
                        {req.status !== 'pending' && (
                          <button
                            onClick={() => updateStatus(req.id, 'pending')}
                            className="px-3 py-1.5 rounded-lg bg-amber-900/40 hover:bg-amber-800/50 text-amber-400 text-xs font-medium border border-amber-700/50 transition-colors"
                          >
                            Pendente
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
