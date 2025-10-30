import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNotifications } from '../contexts/NotificationContext';
import { useTransactions } from '../contexts/TransactionContext';
import {
  Loader2,
  ArrowLeft,
  Trash2,
  Wallet,
  Hash,
  Calendar,
  User,
  Building,
  FileText,
  CheckCircle,
  MapPin,
} from 'lucide-react';
import {
  fetchIncomeDetail,
  fetchIncomeSubDetails,
  fetchExpenseDetail,
  fetchLoanDetail,
  updateLoanStatus,
  deleteTransaction,
  IncomeDetail,
  IncomeSubDetail,
  ExpenseDetail,
  LoanDetail as LoanDetailType,
} from './Service/transactionDetailService';
import { formatToLaosTime, formatToLaosDateOnly } from '../utils/dateUtils.ts';

interface LoanDetailWithPayments extends LoanDetailType {
  paid_total: number;
}

interface Props {
  transactionId: number;
  transactionType: string;
  onBack: () => void;
}

const InfoItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value: any;
}> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4">
    <Icon className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-base font-medium text-gray-800 break-words">
        {value || '-'}
      </p>
    </div>
  </div>
);

const TransactionDetail: React.FC<Props> = ({
  transactionId,
  transactionType,
  onBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<
    IncomeDetail | ExpenseDetail | LoanDetailWithPayments | null
  >(null);
  const [subDetails, setSubDetails] = useState<IncomeSubDetail[]>([]);

  const { showConfirm } = useNotifications();
  const { refreshTransactions } = useTransactions();

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('lo-LA', {
      style: 'currency',
      currency: 'LAK',
    }).format(amount);
  };

  const loadDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      if (transactionType === 'income') {
        const [mainDetail, subDetailList] = await Promise.all([
          fetchIncomeDetail(transactionId),
          fetchIncomeSubDetails(transactionId),
        ]);
        setDetail(mainDetail);
        setSubDetails(subDetailList);
      } else if (transactionType === 'expense') {
        const expenseData = await fetchExpenseDetail(transactionId);
        setDetail(expenseData);
      } else if (transactionType === 'loan') {
        const loanData = await fetchLoanDetail(transactionId);
        setDetail(loanData as LoanDetailWithPayments);
      }
    } catch (err) {
      setError('Failed to load transaction details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [transactionId, transactionType]);

  // ===== Image preview state/handlers (วางไว้ก่อน render* functions) =====
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const openPreview = (url?: string | null) => (url ? setPreviewUrl(url) : null);
  const closePreview = () => setPreviewUrl(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closePreview();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // =====================================================================

  const handleUpdateStatus = () => {
    const currentLoan = detail as LoanDetailWithPayments;
    if (!currentLoan || transactionType !== 'loan') return;

    const onConfirmAction = () => {
      const updatePromise = updateLoanStatus(currentLoan.LID, currentLoan).then(
        () => {
          refreshTransactions();
          loadDetails();
        }
      );

      toast.promise(updatePromise, {
        loading: 'Updating loan status...',
        success: 'Loan marked as completed!',
        error: (err) => err?.response?.data || 'Failed to update status.',
      });
    };

    showConfirm(
      `Are you sure you want to mark this loan as completed? This action should only be done if all principal and interest have been paid.`,
      onConfirmAction
    );
  };

  const handleDelete = () => {
    if (!detail) return;

    const onConfirmAction = (reason?: string) => {
      if (!reason || reason.trim() === '') {
        toast.error('Deletion cancelled. A reason is required.');
        return;
      }

      const apiId =
        transactionType === 'loan'
          ? (detail as LoanDetailWithPayments).LID
          : transactionId;

      const deletePromise = deleteTransaction(transactionType, apiId, reason).then(
        () => {
          refreshTransactions();
          onBack();
        }
      );

      toast.promise(deletePromise, {
        loading: 'Deleting transaction...',
        success: 'Transaction deleted successfully!',
        error: (err) => err?.response?.data || 'Failed to delete transaction.',
      });
    };

    showConfirm(
      `Are you sure you want to delete this ${transactionType}? This action cannot be undone.`,
      onConfirmAction,
      {
        label: 'Reason for Deletion',
        placeholder: 'e.g., Mistake entry',
        isRequired: true,
      }
    );
  };

  if (loading) {
    return (
      <div className="text-center p-12">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center p-12 text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  const renderIncomeDetails = (d: IncomeDetail) => (
    <>
      <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
        <p className="text-sm font-medium text-green-800">Total Collected</p>
        <p className="text-4xl font-bold text-green-600 mt-1">
          {(d.total || 0).toLocaleString('lo-LA')} ₭
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
        <InfoItem icon={Hash} label="Income ID" value={d.IID} />
        <InfoItem icon={Calendar} label="Date" value={formatToLaosTime(d.created_at)} />
        <InfoItem
          icon={User}
          label="Employee"
          value={`${d.employee_fname} ${d.employee_lname} (ID: ${d.user_id})`}
        />
        <InfoItem
          icon={User}
          label="Agent"
          value={`${d.collector_fname || ''} ${d.collector_lname || ''} (ID: ${d.member_id})`}
        />
        <InfoItem
          icon={Building}
          label="Market"
          value={`${d.market_name || ''} (ID: ${d.market_id})`}
        />
        <InfoItem icon={Wallet} label="Payment Method" value={d.payment_method} />
      </div>

      <div className="border-t pt-6">
        <InfoItem icon={FileText} label="Notes" value={d.notes} />
        {d.photo_url && (
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-500 mb-2">Attached Photo</p>
            <button
              type="button"
              onClick={() => openPreview(d.photo_url!)}
              className="inline-block rounded-lg border hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Click to preview"
            >
              <img src={d.photo_url} alt="Income" className="rounded-lg max-w-sm" />
            </button>
          </div>
        )}
      </div>
    </>
  );

  const renderExpenseDetails = (d: ExpenseDetail) => (
    <>
      <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
        <p className="text-sm font-medium text-red-800">Expense Amount</p>
        <p className="text-4xl font-bold text-red-600 mt-1">
          {(d.amount || 0).toLocaleString('lo-LA')} ₭
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
        <InfoItem icon={Hash} label="Expense ID" value={d.EID} />
        <InfoItem icon={Calendar} label="Date" value={formatToLaosTime(d.created_at)} />
        <InfoItem icon={FileText} label="Expense Type" value={d.expense_type} />
        <InfoItem icon={FileText} label="Category" value={d.category} />
        <InfoItem
          icon={User}
          label="Created By"
          value={`${d.employee_fname} ${d.employee_lname}`}
        />
        <InfoItem icon={MapPin} label="Market" value={d.market_name} />
        <InfoItem icon={Wallet} label="Payment Method" value={d.payment_method} />
      </div>

      <div className="border-t pt-6">
        <InfoItem icon={FileText} label="Notes" value={d.notes} />
        {d.photo_url && (
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-500 mb-2">Attached Photo</p>
            <button
              type="button"
              onClick={() => openPreview(d.photo_url!)}
              className="inline-block rounded-lg border hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Click to preview"
            >
              <img src={d.photo_url} alt="Expense" className="rounded-lg max-w-sm" />
            </button>
          </div>
        )}
      </div>
    </>
  );

  const renderLoanDetails = (d: LoanDetailWithPayments) => {
    const outstandingBalance = (d.total || 0) - (d.paid_total || 0);
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex-1 text-center p-6 bg-red-50 rounded-xl border border-red-200">
            <p className="text-sm font-medium text-red-800">Loan Principal</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {(d.total || 0).toLocaleString('lo-LA')} ₭
            </p>
          </div>
          <div className="flex-1 text-center p-6 bg-green-50 rounded-xl border border-green-200">
            <p className="text-sm font-medium text-green-800">Amount Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {(d.paid_total || 0).toLocaleString('lo-LA')} ₭
            </p>
          </div>
          <div className="flex-1 text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm font-medium text-blue-800">Outstanding Balance</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {outstandingBalance.toLocaleString('lo-LA')} ₭
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
          <InfoItem icon={Hash} label="Loan ID" value={d.LID} />
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <span
              className={`inline-flex items-center text-sm font-semibold px-3 py-1 rounded-full ${
                d.status === 1
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {d.status === 1 ? 'Active' : 'Completed'}
            </span>
          </div>
          <InfoItem icon={User} label="Customer" value={`${d.customer_fname} ${d.customer_lname}`} />
          <InfoItem icon={MapPin} label="Market" value={d.market_name} />
          <InfoItem icon={User} label="Disbursed By" value={`${d.created_by_fname} ${d.created_by_lname}`} />
          <InfoItem icon={Calendar} label="Disbursement Date" value={formatToLaosTime(d.start_date)} />
          <InfoItem icon={Calendar} label="Due Date" value={formatToLaosDateOnly(d.end_date)} />
        </div>

        <div className="border-t pt-6">
          <InfoItem icon={FileText} label="Notes" value={d.notes} />
        </div>
      </>
    );
  };

  const currentLoan = detail as LoanDetailWithPayments;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold capitalize">
            {transactionType} Detail #{transactionId}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {transactionType === 'loan' && currentLoan?.status === 1 && (
            <button
              onClick={handleUpdateStatus}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              Mark as Completed
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            disabled={loading || !detail}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {detail && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-8">
          {transactionType === 'income' && renderIncomeDetails(detail as IncomeDetail)}
          {transactionType === 'expense' && renderExpenseDetails(detail as ExpenseDetail)}
          {transactionType === 'loan' && renderLoanDetails(detail as LoanDetailWithPayments)}
        </div>
      )}

      {subDetails.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Collection Sub-Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b">
                <tr>
                  <th className="px-3 py-2 text-left">Customer</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {subDetails.length > 0 ? (
                  subDetails.map((sub) => (
                    <tr key={sub.member_id} className="border-b">
                      <td className="px-3 py-2">
                        {sub.Fname} {sub.Lname}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(sub.amount)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`${
                            sub.status === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          } text-xs font-medium me-2 px-2.5 py-0.5 rounded`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">
                        {sub.notes || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500">
                      No sub-details found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-5xl w-[92%] md:w-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-[80vh] rounded-lg shadow-lg"
            />
            <button
              type="button"
              onClick={closePreview}
              className="absolute -top-3 -right-3 bg-white text-gray-700 rounded-full p-2 shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close preview"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDetail;
