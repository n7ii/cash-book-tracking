import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { LoanDetail as LoanDetailType, fetchLoanDetail } from './Service/loanService';
import { formatToLaosTime, formatToLaosDateOnly } from '../utils/dateUtils.ts';

// Define the "props" or inputs that this component accepts
interface Props {
  loanId: string;
  onBack: () => void;
}

const LoanDetail: React.FC<Props> = ({ loanId, onBack }) => {
  // State for storing the loan data, loading status, and errors
  const [loan, setLoan] = useState<LoanDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect to fetch data from the API when the component first loads
  useEffect(() => {
    const loadLoan = async () => {
      try {
        const data = await fetchLoanDetail(loanId);
        setLoan(data);
      } catch (err) {
        setError('Failed to load loan details from the server.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLoan();
  }, [loanId]); // Re-run this effect if the loanId changes

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-lg">Loading Loan Details...</p>
      </div>
    );
  }

  if (error || !loan) {
    return <div className="text-center text-red-600 p-8">{error || 'Loan data could not be loaded.'}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold">Loan Details #{loan.LID}</h1>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          {/* Amount */}
          <div className="md:col-span-1">
            <p className="font-medium text-gray-500">Loan Amount</p>
            <p className="font-bold text-2xl text-red-600">LAK {loan.total.toLocaleString()}</p>
          </div>
          {/* Status */}
          <div className="md:col-span-1">
            <p className="font-medium text-gray-500">Status</p>
            <p className="text-base font-semibold">
              {loan.status === 1 ? (
                <span className="text-green-600">Active</span>
              ) : (
                <span className="text-gray-600">Inactive/Paid</span>
              )}
            </p>
          </div>
           {/* Market */}
           <div className="md:col-span-1">
            <p className="font-medium text-gray-500">Market</p>
            <p className="text-gray-800 text-base">{loan.market_name}</p>
          </div>
          {/* Customer */}
          <div className="md:col-span-1">
            <p className="font-medium text-gray-500">Customer</p>
            <p className="text-gray-800 text-base">{loan.customer_fname} {loan.customer_lname}</p>
          </div>
          {/* Start Date */}
          <div className="md:col-span-1">
            <p className="font-medium text-gray-500">Disbursement Date</p>
            <p className="text-gray-800 text-base">{formatToLaosTime(loan.start_date)}</p>
          </div>
          {/* End Date */}
          <div className="md:col-span-1">
            <p className="font-medium text-gray-500">End Date</p>
            <p className="text-gray-800 text-base">{formatToLaosDateOnly(loan.end_date)}</p>
          </div>
          <div className="md:col-span-full">
    <p className="font-medium text-gray-500">Notes</p>
    <p className="text-gray-800 whitespace-pre-wrap">{loan.notes || '-'}</p>
</div>

          {/* Created By */}
          <div className="md:col-span-full">
            <p className="font-medium text-gray-500">Created by Employee</p>
            <p className="text-gray-800 text-base">{loan.created_by_fname} {loan.created_by_lname}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDetail;