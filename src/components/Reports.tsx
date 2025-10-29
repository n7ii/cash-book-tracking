import React, { useState, useEffect } from 'react';
import { BarChart3, Download, PieChart, Loader2, AlertTriangle } from 'lucide-react';
import CategoryChart from './CategoryChart';
import MonthlyTrends from './MonthlyTrends';
import { useTranslation } from 'react-i18next';
// NEW: Import the function from our new service file
import { fetchBalanceSummary, ReportSummary } from './Service/reportService';

const Reports: React.FC = () => {
    const { t } = useTranslation();
    
    // State remains the same
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reportType, setReportType] = useState<'overview' | 'categories' | 'trends'>('overview');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // useEffect is now cleaner, using the new service function
    useEffect(() => {
        const fetchSummary = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const summaryData = await fetchBalanceSummary(dateRange.start, dateRange.end);
                setSummary(summaryData);
            } catch (err) {
                setError("Failed to load report summary.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (dateRange.start && dateRange.end) {
            fetchSummary();
        } else {
            setSummary(null);
            setIsLoading(false);
        }
    }, [dateRange]);

    const exportReport = () => {
        alert("Export functionality for this page will be connected next.");
    };
    
    return (
        <div className="space-y-6">
            {/* The entire JSX (visual part) remains exactly the same */}
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t("financialReports")}</h1>
                    <p className="text-gray-600">{t("analyzeTourFinancialPatternsAndTrends")}</p>
                </div>
                <button 
                    onClick={exportReport}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                >
                    <Download className="h-4 w-4 mr-2" />
                    {t("exportReport")}
                </button>
            </div>

            {/* Date Range and Report Type Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t("dateRange")}</label>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="px-4 py-2 border rounded-lg"/>
                            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="px-4 py-2 border rounded-lg"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t("reportType")}</label>
                        <select value={reportType} onChange={(e) => setReportType(e.target.value as 'overview' | 'categories' | 'trends')} className="w-full px-4 py-2 border rounded-lg">
                            <option value="overview">{t("financialOverview")}</option>
                            <option value="categories">{t("categoryBreakdown")}</option>
                            <option value="trends">{t("monthlyTrends")}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="text-center py-12"><Loader2 className="h-8 w-8 text-blue-500 mx-auto animate-spin" /></div>
            ) : error ? (
                <div className="text-center py-12 text-red-600"><AlertTriangle className="h-8 w-8 mx-auto mb-2" />{error}</div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <p className="text-sm font-medium text-gray-600">{t("totalIncome")}</p>
                            <p className="text-2xl font-bold text-green-600">{new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(summary?.totalIncome ?? 0)}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <p className="text-sm font-medium text-gray-600">{t("totalExpenses")}</p>
                            <p className="text-2xl font-bold text-red-600">{new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(summary?.totalExpenses ?? 0)}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <p className="text-sm font-medium text-gray-600">{t("netBanlance")}</p>
                            <p className={`text-2xl font-bold ${(summary?.netBalance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(summary?.netBalance ?? 0)}</p>
                        </div>
                    </div>

                    {/* Report Content */}
                    {reportType === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <CategoryChart dateRange={dateRange} />
                            <MonthlyTrends />
                        </div>
                    )}
                    {reportType === 'categories' && (
                        <CategoryChart dateRange={dateRange} />
                    )}
                    {reportType === 'trends' && (
                        <MonthlyTrends />
                    )}
                </>
            )}
        </div>
    );
};

export default Reports;