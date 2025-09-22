import React, { useState } from 'react';
import { Scale, AlertTriangle, CheckCircle, Calculator } from 'lucide-react';
import { useTransactions } from '../contexts/TransactionContext';
import { useTranslation } from 'react-i18next';

const Reconciliation: React.FC = () => {
  const { t } = useTranslation();
  const { getTransactionSummary, transactions } = useTransactions();
  const [bankBalance, setBankBalance] = useState('');
  const [reconciliationDate, setReconciliationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isReconciled, setIsReconciled] = useState(false);

  const systemSummary = getTransactionSummary();
  const systemBalance = systemSummary.netBalance;
  const bankBalanceNum = parseFloat(bankBalance) || 0;
  const difference = systemBalance - bankBalanceNum;
  const tolerance = 0.01; // $0.01 tolerance for rounding

  const handleReconcile = () => {
    if (Math.abs(difference) <= tolerance) {
      setIsReconciled(true);
      // In a real app, this would save the reconciliation to the database
      setTimeout(() => setIsReconciled(false), 3000);
    }
  };

  const getDiscrepancyStatus = () => {
    if (Math.abs(difference) <= tolerance) {
      return { status: 'balanced', message: t("accountsAreBalanced"), color: 'green' };
    } else if (difference > 0) {
      return { 
        status: 'surplus', 
        message: t("systemShowsMorethanBankBalance"), 
        color: 'yellow' 
      };
    } else {
      return { 
        status: 'deficit', 
        message: t("bankBalanceIsHigherThanSystem"), 
        color: 'red' 
      };
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
          <span>{t("lastReconciled")}: {t("today")}</span>
        </div>
      </div>

      {/* Reconciliation Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{t("enterBankStatement")}</h3>
            </div>

            <div>
              <label htmlFor="reconciliationDate" className="block text-sm font-medium text-gray-700 mb-2">
              {t("statementDate")}
              </label>
              <input
                type="date"
                id="reconciliationDate"
                value={reconciliationDate}
                onChange={(e) => setReconciliationDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="bankBalance" className="block text-sm font-medium text-gray-700 mb-2">
              {t("bankStatementBanlance")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₭</span>
                </div>
                <input
                  type="number"
                  id="bankBalance"
                  step="0.01"
                  value={bankBalance}
                  onChange={(e) => setBankBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleReconcile}
              disabled={!bankBalance}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
                  <span className="text-lg font-bold text-blue-600">
                    {new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(systemBalance)}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{t("bankBalance")}</span>
                  <span className="text-lg font-bold text-gray-900">
                    {bankBalance ? 
                      new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(bankBalanceNum) : 
                      t("enterAmount")
                    }
                  </span>
                </div>
              </div>

              {bankBalance && (
                <div className={`p-4 rounded-lg border-2 ${
                  discrepancy.status === 'balanced' 
                    ? 'bg-green-50 border-green-200' 
                    : discrepancy.status === 'surplus'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {discrepancy.status === 'balanced' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700">{t("difference")}</span>
                    </div>
                    <span className={`text-lg font-bold ${
                      discrepancy.status === 'balanced' 
                        ? 'text-green-600' 
                        : discrepancy.status === 'surplus'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {Math.abs(difference) <= tolerance ? '$0.00' : 
                        new Intl.NumberFormat('lo-LA', { 
                          style: 'currency', 
                          currency: 'LAK',
                          signDisplay: 'always'
                        }).format(difference)
                      }
                    </span>
                  </div>
                  <p className={`text-sm mt-2 ${
                    discrepancy.status === 'balanced' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {discrepancy.message}
                  </p>
                </div>
              )}
            </div>

            {isReconciled && (
              <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                  {t("reconciliationCompletedSuccessfully")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reconciliation Tips */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("reconculiationTips")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">{t("ifThereIsADiscrepancy")}:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{t("checkForMissingTransactionsInYourRecords")}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{t("verigyTransactionAmountsAndDates")}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{t("lookForPendingTransactions")}</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">{t("bestPractices")}:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{t("reconcileWeeklyOrMonthly")}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{t("keepReceiptsForVerification")}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{t("enterTransactionsPromptly")}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reconciliation;