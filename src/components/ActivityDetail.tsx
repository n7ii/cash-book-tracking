import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { 
  CollectionDetail, 
  CollectionSummary, 
  fetchCollectionSummary, 
} from './Service/collectionService';
import { formatToLaosTime } from '../utils/dateUtils.ts';
import {
  fetchIncomeSubDetails,
  IncomeSubDetail // Import the correct type for sub-details
} from './Service/transactionDetailService';  

// Define the "props" or inputs that this component accepts
interface Props {
  txId: string;
  onBack: () => void;
}

const ActivityDetail: React.FC<Props> = ({ txId, onBack }) => {
  // Create "state" (memory) for our two lists, loading status, and errors
  const [summary, setSummary] = useState<CollectionSummary | null>(null);
  const [subDetails, setSubDetails] = useState<IncomeSubDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use useEffect to fetch data from the API when the component first loads
  useEffect(() => {
    const loadAllDetails = async () => {
      setIsLoading(true);
      setError(null);
      console.log(`ActivityDetail: Starting fetch for ID ${txId}`); // Log start
      try {
        // Fetch both the summary and the unpaid list at the same time
        const [summaryData, allDetailsData] = await Promise.all([
          fetchCollectionSummary(txId),
          fetchIncomeSubDetails(txId)   
        ]);
        console.log("ActivityDetail: Fetched data successfully"); // Log success
        setSummary(summaryData);
        setSubDetails(allDetailsData as IncomeSubDetail[]);
      } catch (err) {
        // --- DETAILED ERROR LOGGING ---
        console.error("!!! ERROR inside ActivityDetail useEffect !!!", err);
        if (err instanceof Error) {
            console.error("Error name:", err.name);
            console.error("Error message:", err.message);
            if ((err as any).response) { // Check if it's an Axios error
                console.error("API Error Status:", (err as any).response.status);
                console.error("API Error Data:", (err as any).response.data);
            }
        }
        setError('Failed to load details from the server.');
        // --- END ERROR LOGGING ---
      } finally {
        setIsLoading(false);
      }
    };

    loadAllDetails();
  }, [txId]); // This effect will re-run if the txId changes

  // Helper function for currency formatting
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('lo-LA', {
      style: 'currency',
      currency: 'LAK',
    }).format(amount);
  };

  // Show a loading message while fetching data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-lg">Loading details...</p>
      </div>
    );
  }

  // Show an error message if the fetch failed
  if (error) {
    return <div className="text-center text-red-600 p-8">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold">ລາຍລະອຽດການເກັບເງິນ #{txId}</h1>
      </div>

      {summary && (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Collection Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            {/* Total */}
            <div className="md:col-span-1">
                <p className="font-medium text-gray-500">Total Collected</p>
                <p className="font-bold text-2xl text-green-600">{formatCurrency(summary.total)}</p>
            </div>
            {/* Employee */}
            <div className="md:col-span-1">
                <p className="font-medium text-gray-500">Created by Employee</p>
                <p className="text-gray-800 text-base">{summary.employee_fname} {summary.employee_lname}</p>
            </div>
            {/* Date */}
            <div className="md:col-span-1">
                <p className="font-medium text-gray-500">Collection Date</p>
                <p className="text-gray-800 text-base">{formatToLaosTime(summary.created_at)}</p>
            </div>
            {/* Collector */}
            <div className="md:col-span-1">
                <p className="font-medium text-gray-500">Collector / Source</p>
                <p className="text-gray-800 text-base">{summary.collector_fname} {summary.collector_lname}</p>
            </div>
            {/* Market */}
            <div className="md:col-span-2">
                <p className="font-medium text-gray-500">Market</p>
                <p className="text-gray-800 text-base">{summary.market_name || '-'}</p>
            </div>
            {/* Notes */}
            <div className="col-span-full">
                <p className="font-medium text-gray-500">Notes</p>
                <p className="text-gray-800 whitespace-pre-wrap">{summary.notes || '-'}</p>
            </div>
        </div>
        {/* Attached Photo */}
        {summary.photo_url && (
            <div>
                <p className="font-medium text-gray-500 mb-2">Attached Photo</p>
                <img src={summary.photo_url} alt="Collection" className="max-w-xs rounded-lg border" />
            </div>
        )}
    </div>
)}

      {/* Unpaid Customers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="p-4 text-lg font-semibold border-b text-red-700">ລາຍຊື່ລູກຄ້າທີ່ຄ້າງຈ່າຍ ({subDetails.length})</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-700">
              <th className="px-3 py-2">ຊື່ ແລະ ນາມສະກຸນ</th>
              <th className="px-3 py-2 text-right">ຈຳນວນເງິນ</th>
              <th className="px-3 py-2">ສະຖານະ</th>
              <th className="px-3 py-2">ໝາຍເຫດ</th>
            </tr>
          </thead>
          <tbody>
            {subDetails.length > 0 ? subDetails.map((detail) => (
                  <tr key={detail.member_id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">{detail.Fname} {detail.Lname}</td>
                    <td className="px-3 py-2 text-right font-medium">
                        {/* Ensure 'amount' exists on IncomeSubDetail type */}
                        {formatCurrency(detail.amount)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`${detail.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs font-medium me-2 px-2.5 py-0.5 rounded`}>
                        {detail.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">{detail.notes || '-'}</td>
                  </tr>
            )) : (
              <tr><td colSpan={2} className="p-6 text-center text-gray-500">ບໍ່ມີລູກຄ້າທີ່ຄ້າງຈ່າຍ</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityDetail;