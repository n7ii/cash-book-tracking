import React, { useState, useEffect } from 'react';
import { Scale, AlertTriangle, CheckCircle, Calculator, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast'; // <-- Step 1: Import toast
import { 
    fetchSystemBalance, 
    fetchLatestReconciliation, 
    saveReconciliation, 
    BalanceSummary 
} from './Service/reconciliationService';
import { formatToLaosTime } from '../utils/dateUtils.ts';

const Reconciliation: React.FC = () => {
    const { t } = useTranslation();
  
    const [summary, setSummary] = useState<BalanceSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bankBalance, setBankBalance] = useState('');
    const [statementDate, setStatementDate] = useState(new Date().toISOString().split('T')[0]);
    const [lastReconciled, setLastReconciled] = useState<string | null>(null);

    // Step 2: Remove the isReconciled state
    // const [isReconciled, setIsReconciled] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [balanceData, lastDateData] = await Promise.all([
                    fetchSystemBalance(),
                    fetchLatestReconciliation()
                ]);
                
                setSummary(balanceData);
                setLastReconciled(lastDateData.lastReconciledDate);
            } catch (err) {
                setError("Failed to load page data.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const systemBalance = summary?.netBalance ?? 0;
    const bankBalanceNum = parseFloat(bankBalance) || 0;
    const difference = systemBalance - bankBalanceNum;
    const tolerance = 0.01;

    // Step 3: Update the handleReconcile function
    const handleReconcile = async () => {
        if (Math.abs(difference) > tolerance) {
            // Replace alert with toast.error
            return toast.error("Balances do not match. Please adjust the bank statement balance.");
        }

        const reconciliationPromise = saveReconciliation( {
            statement_date: statementDate,
            system_balance: systemBalance,
            bank_balance: bankBalanceNum
        }).then(() => {
            // Update the last reconciled date on success
            setLastReconciled(new Date().toISOString()); 
        });

        // Wrap the promise with toast for automatic notifications
        toast.promise(reconciliationPromise, {
            loading: 'Saving reconciliation...',
            success: 'Reconciliation completed successfully!',
            error: (err) => err.response?.data || "An error occurred while saving."
        });
    };

    const getDiscrepancyStatus = () => {
        if (Math.abs(difference) <= tolerance) {
          return { status: 'balanced', message: t("accountsAreBalanced") };
        } else if (difference > 0) {
          return { status: 'surplus', message: t("systemShowsMorethanBankBalance") };
        } else {
          return { status: 'deficit', message: t("bankBalanceIsHigherThanSystem") };
        }
    };
    const discrepancy = getDiscrepancyStatus();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t("accountReconciliation")}</h1>
                    <p className="text-gray-600">{t("compareYourSystemBalanceWithBankStatements")}</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Scale className="h-4 w-4" />
                    <span>{t("lastReconciled")}: {formatToLaosTime(lastReconciled)}</span>
                </div>
            </div>

            {/* Reconciliation Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                {isLoading ? (
                    <div className="text-center py-20"><Loader2 className="h-8 w-8 text-blue-500 mx-auto animate-spin" /></div>
                ) : error ? (
                    <div className="text-center py-20 text-red-600"><AlertTriangle className="h-8 w-8 mx-auto mb-2" />{error}</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Input Section */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-2 bg-blue-100 rounded-lg"><Calculator className="h-6 w-6 text-blue-600" /></div>
                                <h3 className="text-xl font-semibold text-gray-900">{t("enterBankStatement")}</h3>
                            </div>
                            <div>
                                <label htmlFor="statementDate" className="block text-sm font-medium text-gray-700 mb-2">{t("statementDate")}</label>
                                <input type="date" id="statementDate" value={statementDate} onChange={(e) => setStatementDate(e.target.value)} className="w-full px-4 py-3 border rounded-lg"/>
                            </div>
                            <div>
                                <label htmlFor="bankBalance" className="block text-sm font-medium text-gray-700 mb-2">{t("bankStatementBanlance")}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">₭</span></div>
                                    <input type="number" id="bankBalance" step="0.01" value={bankBalance} onChange={(e) => setBankBalance(e.target.value)} placeholder="0.00" className="w-full pl-8 pr-4 py-3 border rounded-lg"/>
                                </div>
                            </div>
                            <button onClick={handleReconcile} disabled={!bankBalance} className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                <Scale className="h-4 w-4 mr-2" />
                                {t("reconcileAccount")}
                            </button>
                        </div>

                        {/* Comparison Section */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-gray-900">{t("balanceComparison")}</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">{t("systemBalance")}</span>
                                        <span className="text-lg font-bold text-blue-600">{new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(systemBalance)}</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">{t("bankBalance")}</span>
                                        <span className="text-lg font-bold text-gray-900">{bankBalance ? new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(bankBalanceNum) : t("enterAmount")}</span>
                                    </div>
                                </div>
                                {bankBalance && (
                                    <div className={`p-4 rounded-lg border-2 ${discrepancy.status === 'balanced' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                {discrepancy.status === 'balanced' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertTriangle className="h-5 w-5 text-red-600" />}
                                                <span className="text-sm font-medium text-gray-700">{t("difference")}</span>
                                            </div>
                                            <span className={`text-lg font-bold ${discrepancy.status === 'balanced' ? 'text-green-600' : 'text-red-600'}`}>{Math.abs(difference) <= tolerance ? '₭0.00' : new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' , signDisplay: 'always' }).format(difference)}</span>
                                        </div>
                                        <p className={`text-sm mt-2 ${discrepancy.status === 'balanced' ? 'text-green-600' : 'text-gray-600'}`}>{discrepancy.message}</p>
                                    </div>
                                )}
                            </div>
                            {/* Step 4: Remove the old success banner */}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reconciliation;