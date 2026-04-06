import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { 
  ArrowLeft, Loader2, UserPlus, Users, Wallet, Trophy, 
  Download, Calendar, AlertCircle, Trash2, Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { AddMemberModal } from './modals/AddMemberModal';
import { RecordPaymentModal } from './modals/RecordPaymentModal';
import { AnnounceWinnerModal } from './modals/AnnounceWinnerModal';
import { EditBishiModal } from './modals/EditBishiModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Settings } from 'lucide-react';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const BishiDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isEditSchemeOpen, setIsEditSchemeOpen] = useState(false);
  const [paymentModalData, setPaymentModalData] = useState<any>(null);
  const [winnerModalData, setWinnerModalData] = useState<any>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<number | null>(null);

  // Fetch Bishi Info
  const { data: bishiRes, isLoading: isLoadingBishi } = useQuery({
    queryKey: ['bishi', id],
    queryFn: async () => {
      const res = await api.get(`/bishi/${id}`);
      return res.data;
    }
  });

  const bishi = bishiRes?.data;

  // Set initial month when data arrives
  useEffect(() => {
    if (bishi?.currentMonthNumber) {
      setSelectedMonth(bishi.currentMonthNumber);
    }
  }, [bishi?.currentMonthNumber]);

  // Fetch Payments for selected month
  const { data: paymentsRes, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['bishi-payments', id, selectedMonth],
    queryFn: async () => {
      const res = await api.get(`/bishi/${id}/payments/${selectedMonth}`);
      return res.data;
    },
    enabled: !!id,
  });

  const deleteBishiMutation = useMutation({
    mutationFn: async () => api.delete(`/bishi/${id}`),
    onSuccess: () => {
      toast.success('Bishi deleted successfully');
      navigate('/bishi');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete Bishi');
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (mid: number) => api.delete(`/bishi/${id}/members/${mid}`),
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['bishi', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  });

  const exportExcel = async () => {
    try {
      const response = await api.get(`/bishi/${id}/export/${selectedMonth}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bishi-${bishi?.name}-Month${selectedMonth}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const paymentData = paymentsRes?.data;
  const records = paymentData?.records || [];
  const summary = paymentData?.summary;

  if (isLoadingBishi) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-[#B8860B] mb-4" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Bishi Details...</p>
      </div>
    );
  }

  if (!bishi) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <AlertCircle size={48} className="text-red-300 mb-4" />
      <h2 className="text-xl font-bold text-gray-800">Bishi Not Found</h2>
      <button onClick={() => navigate('/bishi')} className="mt-4 text-[#B8860B] font-bold underline italic">Back to list</button>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/bishi')} className="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-[#B8860B] transition-all shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1A1209] dark:text-[#F5F5F0]">{bishi.name}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${
                bishi.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>{bishi.status}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 font-medium uppercase tracking-widest">
              ₹{formatCurrency(Number(bishi.monthlyAmount))} / month • {bishi.durationMonths} Months
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsEditSchemeOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white text-[#1A1209] border border-gray-100 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <Settings size={16} className="text-[#B8860B]" />
            Edit Scheme
          </button>
          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white text-[#1A1209] border border-gray-100 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <UserPlus size={16} className="text-[#B8860B]" />
            Add Member
          </button>
          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="p-2 text-red-400 bg-white border border-gray-100 hover:border-red-100 hover:bg-red-50 rounded-xl transition-all shadow-sm"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 rounded-xl shadow-sm border-t-2 border-[#1A1209]">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Members</p>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[#B8860B]" />
            <span className="text-xl font-bold text-[#1A1209] dark:text-[#F5F5F0]">{bishi.members?.length || 0}</span>
          </div>
        </div>
        <div className="card p-4 rounded-xl shadow-sm border-t-2 border-green-500">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Collected (All)</p>
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-green-500" />
            <span className="text-xl font-bold text-green-600">{formatCurrency(bishi.totalCollectedAllTime || 0)}</span>
          </div>
        </div>
        <div className="card p-4 rounded-xl shadow-sm border-t-2 border-amber-500">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pending (Month)</p>
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-500" />
            <span className="text-xl font-bold text-amber-600">{formatCurrency(summary?.totalOutstanding || 0)}</span>
          </div>
        </div>
        <div className="card p-4 rounded-xl shadow-sm border-t-2 border-blue-500">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Progress</p>
          <div className="flex items-center gap-2">
            <Hash size={18} className="text-blue-500" />
            <span className="text-xl font-bold text-blue-600">M-{selectedMonth} / {bishi.durationMonths}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Sidebar Members */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-6 rounded-2xl shadow-lg border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex justify-between items-center">
              Members List
              <span className="bg-gray-100 px-2 py-0.5 rounded-full">{bishi.members?.length || 0}</span>
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 text-[#1A1209] dark:text-[#F5F5F0] overflow-x-hidden">
              {[...(bishi.members || [])].sort((a, b) => {
                // Winners first, then by month
                if (a.status === 'WON' && b.status !== 'WON') return -1;
                if (a.status !== 'WON' && b.status === 'WON') return 1;
                if (a.status === 'WON' && b.status === 'WON') {
                  return (a.wonMonthNumber || 0) - (b.wonMonthNumber || 0);
                }
                return (a.memberNumber || 0) - (b.memberNumber || 0);
              }).map((m: any) => (
                <div key={m.id} className="p-4 rounded-xl border border-gray-100 bg-white/50 dark:bg-dark-800/50 shadow-sm flex flex-col gap-2 relative overflow-hidden transition-all hover:border-[#B8860B]/30">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold leading-tight">
                        {m.memberNumber}. {m.customer.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {m.status === 'WON' ? (
                          <span className="text-[8px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ring-1 ring-amber-500/20">
                            Winner M-{m.wonMonthNumber}
                          </span>
                        ) : (
                          <span className="text-[8px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ring-1 ring-gray-200">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {m.status === 'WON' && <Trophy size={16} className="text-amber-500 drop-shadow-sm" />}
                      {m.status === 'ACTIVE' && bishi.status === 'ACTIVE' && (
                        <button 
                          onClick={() => setMemberToRemove(m.id)}
                          className="p-1 px-2 text-[10px] items-center justify-center font-bold text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          REMOVE
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Winner History Mini Panel */}
          <div className="card p-6 rounded-2xl shadow-lg border-gray-100 bg-[#1A1209] text-white overflow-hidden relative min-h-[150px]">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={60} /></div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-4">
              Winner History
            </h3>
            <div className="space-y-3 relative z-10 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
              {bishi.winners?.length > 0 ? bishi.winners.map((w: any) => (
                <div key={w.id} className="flex items-center gap-3 border-b border-white/10 pb-3 last:border-0">
                  <span className="text-[10px] font-bold text-amber-500 bg-white/10 w-7 h-7 flex items-center justify-center rounded-xl border border-white/5">{w.monthNumber}</span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-xs font-bold truncate text-[#F5F5F0]">{w.bishiMember.customer.name}</span>
                    <span className="text-[9px] uppercase tracking-widest text-amber-500/60 font-medium">{w.monthLabel}</span>
                  </div>
                  <Trophy size={14} className="text-white/20" />
                </div>
)) : (
                <p className="text-[10px] text-[#6B5E4A] italic uppercase py-4 text-center">No winners announced yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Payments and Month Navigation */}
        {/* Right: Payments and Month Navigation */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card rounded-2xl shadow-xl border-gray-100 overflow-hidden bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800">
            {/* Header / Month Nav */}
            <div className="p-6 border-b border-gray-50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-gray-50/30">
              <div className="flex bg-gray-100 p-1.5 rounded-xl overflow-x-auto max-w-full custom-scrollbar">
                {Array.from({ length: Math.min(bishi.durationMonths, 12) }, (_, i) => i + 1).map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`px-4 py-2 text-[10px] h-8 flex items-center justify-center font-bold uppercase tracking-widest rounded-lg transition-all flex-shrink-0 ${
                      selectedMonth === m 
                        ? 'bg-[#1A1209] text-white shadow-md' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Month {m}
                  </button>
                ))}
                {bishi.durationMonths > 12 && (
                  <select 
                    value={selectedMonth > 12 ? selectedMonth : ""}
                    onChange={(e) => e.target.value && setSelectedMonth(parseInt(e.target.value))}
                    className="bg-transparent border-0 text-[10px] h-8 font-bold uppercase tracking-widest text-gray-400 focus:ring-0 cursor-pointer px-2"
                  >
                    <option value="">Month 13+...</option>
                    {Array.from({ length: bishi.durationMonths - 12 }, (_, i) => i + 13).map(m => (
                      <option key={m} value={m}>Month {m}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-3 w-full xl:w-auto">
                <button
                  onClick={exportExcel}
                  className="flex-1 xl:flex-none flex items-center justify-center gap-2 h-10 px-6 border-2 border-gray-100 hover:border-[#1A1209] text-[#1A1209] text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  <Download size={16} />
                  Excel
                </button>
                {bishi.status === 'ACTIVE' && (
                  <button 
                    disabled={selectedMonth < (bishi.currentMonthNumber || 1)}
                    onClick={() => setWinnerModalData({
                      monthNumber: selectedMonth,
                      monthLabel: paymentData?.monthLabel,
                      eligibleMembers: bishi.members,
                      winnersPerMonth: bishi.winnersPerMonth
                    })}
                    className="flex-1 xl:flex-none flex items-center justify-center gap-2 h-10 px-6 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap"
                  >
                    <Trophy size={16} />
                    {selectedMonth < (bishi.currentMonthNumber || 1) ? 'Locked' : 'Announce Winner'}
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF8E7] flex items-center justify-center">
                    <Calendar className="text-[#B8860B]" size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1209] dark:text-[#F5F5F0]">
                      Month {selectedMonth}: {paymentData?.monthLabel || 'Loading...'}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">
                      Installment Records
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-gray-50 dark:bg-dark-800 p-2 px-4 rounded-xl">
                  <div className="flex items-center gap-2 border-r border-gray-200 dark:border-dark-700 pr-4">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Paid: {summary?.paidCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Pending: {(summary?.dueCount || 0) + (summary?.partialCount || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative border border-gray-50 dark:border-dark-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="max-h-[750px] overflow-y-auto custom-scrollbar">
                  {isLoadingPayments ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 size={32} className="animate-spin text-[#B8860B]" />
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="sticky top-0 bg-white dark:bg-dark-900 shadow-sm z-20">
                        <tr className="bg-gray-50/80 backdrop-blur-md">
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">#</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Member</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Inst.</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Prev. Due</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Total Payable</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Paid</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Outstanding</th>
                          <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                          <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-dark-800 font-medium">
                        {records.length > 0 ? records.map((r: any) => {
                          const isWinner = bishi.winners?.some((w: any) => w.bishiMemberId === r.bishiMemberId && w.monthNumber === selectedMonth);
                          return (
                            <tr key={r.id} className={`hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors group ${isWinner ? 'bg-amber-50/30' : ''}`}>
                              <td className="px-6 py-5 text-[10px] font-mono text-gray-400">{r.member?.memberNumber}</td>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-[#1A1209] dark:text-[#F5F5F0] group-hover:text-[#B8860B] transition-colors truncate max-w-[150px]">
                                    {r.member?.customer.name}
                                  </span>
                                  {isWinner && <Trophy size={14} className="text-amber-500 animate-pulse" />}
                                </div>
                              </td>
                              <td className="px-6 py-5 text-right">₹{Number(r.amountDue).toLocaleString()}</td>
                              <td className="px-6 py-5 text-right text-red-400">₹{Number(r.dueCarriedForward).toLocaleString()}</td>
                              <td className="px-6 py-5 text-right font-bold">₹{Number(r.totalPayable).toLocaleString()}</td>
                              <td className="px-6 py-5 text-right font-bold text-green-600">₹{Number(r.amountPaid).toLocaleString()}</td>
                              <td className="px-6 py-5 text-right">
                                <span className={`font-bold ${Number(r.totalOutstanding) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                  {Number(r.totalOutstanding) > 0 ? `₹${Number(r.totalOutstanding).toLocaleString()}` : 'CLEAR'}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                                  r.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                  r.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                                  r.status === 'EXEMPT' ? 'bg-gray-100 text-gray-500' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <button 
                                  disabled={r.status === 'EXEMPT' || bishi.status !== 'ACTIVE'}
                                  onClick={() => setPaymentModalData({
                                    bishiId: Number(id),
                                    bishiMemberId: r.bishiMemberId,
                                    monthNumber: selectedMonth,
                                    monthLabel: paymentData.monthLabel,
                                    memberName: r.member?.customer.name,
                                    amountDue: Number(r.amountDue),
                                    dueCarriedForward: Number(r.dueCarriedForward),
                                    totalPayable: Number(r.totalPayable),
                                    currentAmountPaid: Number(r.amountPaid),
                                    currentPaymentDate: r.paymentDate,
                                    currentPaymentMode: r.paymentMode,
                                    currentNotes: r.notes
                                  })}
                                  className="p-2.5 hover:bg-[#1A1209] hover:text-white rounded-xl transition-all text-[#B8860B] disabled:opacity-30 border border-transparent hover:border-[#1A1209]"
                                >
                                  <Wallet size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={9} className="px-6 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                              No member records found for this month. 
                              <br/>
                              <span className="text-[10px] font-medium normal-case mt-2 block">
                                (Members must be added before payments can be tracked)
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isAddMemberOpen && (
        <AddMemberModal 
          isOpen={isAddMemberOpen} 
          onClose={() => setIsAddMemberOpen(false)} 
          bishiId={Number(id)}
          existingMemberIds={bishi.members?.map((m: any) => m.customerId) || []}
        />
      )}

      {paymentModalData && (
        <RecordPaymentModal
          isOpen={!!paymentModalData}
          onClose={() => setPaymentModalData(null)}
          data={paymentModalData}
        />
      )}

      {winnerModalData && (
        <AnnounceWinnerModal
          isOpen={!!winnerModalData}
          onClose={() => setWinnerModalData(null)}
          bishiId={Number(id)}
          data={winnerModalData}
        />
      )}

      {isEditSchemeOpen && (
        <EditBishiModal
          isOpen={isEditSchemeOpen}
          onClose={() => setIsEditSchemeOpen(false)}
          bishi={bishi}
        />
      )}

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => deleteBishiMutation.mutate()}
        title="Delete Bishi Scheme"
        message="Are you sure you want to delete this script? All member and payment records will be permanently removed. This action cannot be undone."
        confirmText="Yes, Delete"
        isDestructive={true}
      />

      <ConfirmDialog
        isOpen={memberToRemove !== null}
        onClose={() => setMemberToRemove(null)}
        onConfirm={() => {
          if (memberToRemove) removeMemberMutation.mutate(memberToRemove);
        }}
        title="Remove Member"
        message="Remove this member from the scheme? This only works if the member has no recorded payments."
        confirmText="Yes, Remove"
        isDestructive={true}
      />
    </div>
  );
};
