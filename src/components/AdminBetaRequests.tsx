import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle, XCircle, Clock, RefreshCw, X, Maximize2 } from 'lucide-react';

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
  const [selectedRequest, setSelectedRequest] = useState<BetaRequest | null>(null);

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
                  <tr key={req.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setSelectedRequest(req)}>
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
                        <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedRequest(null)}>
          <div className="bg-[#1e293b] rounded-3xl border border-slate-700 shadow-2xl max-w-lg w-full p-8 space-y-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {selectedRequest.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedRequest.name}</h2>
                  <p className="text-sm text-slate-400">{selectedRequest.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="p-2 rounded-xl hover:bg-slate-700 transition cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Data do pedido</p>
                <p className="text-sm text-slate-300">{new Date(selectedRequest.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status atual</p>
                <div>{statusBadge(selectedRequest.status)}</div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Motivo</p>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 min-h-[80px]">
                  {selectedRequest.reason || 'Nenhum motivo informado.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-700/50">
              {selectedRequest.status !== 'approved' && (
                <button
                  onClick={() => { updateStatus(selectedRequest.id, 'approved'); setSelectedRequest({ ...selectedRequest, status: 'approved' }); }}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition cursor-pointer"
                >
                  Aprovar
                </button>
              )}
              {selectedRequest.status !== 'rejected' && (
                <button
                  onClick={() => { updateStatus(selectedRequest.id, 'rejected'); setSelectedRequest({ ...selectedRequest, status: 'rejected' }); }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition cursor-pointer"
                >
                  Rejeitar
                </button>
              )}
              {selectedRequest.status !== 'pending' && (
                <button
                  onClick={() => { updateStatus(selectedRequest.id, 'pending'); setSelectedRequest({ ...selectedRequest, status: 'pending' }); }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-600 hover:bg-slate-500 text-white text-sm font-bold transition cursor-pointer"
                >
                  Voltar pra Pendente
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
