import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
// NEW: Import from the new service file
import { fetchMonthlyTrends, MonthlyDataPoint } from './Service/monthlyTrendsService';

// Type for the processed data we'll display
interface ProcessedMonth {
    month: string;
    net: number;
    income: number;
    expenses: number;
}

const MonthlyTrends: React.FC = () => {
    const { t } = useTranslation();
    const [data, setData] = useState<MonthlyDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // useEffect is now cleaner
    useEffect(() => {
        const fetchMonthlyData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const trendData = await fetchMonthlyTrends(6); // Call the service function
                setData(trendData);
            } catch (err) {
                setError("Failed to load monthly trend data.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMonthlyData();
    }, []);

    const processedData = useMemo(() => {
        return data.map(item => {
            const income = parseFloat(item.totalIncome as any) || 0;
            const expenses = parseFloat(item.totalExpenses as any) || 0;
            return {
                month: item.month,
                net: income - expenses,
                income: income,    
                expenses: expenses,
            };
        }).sort((a, b) => a.month.localeCompare(b.month));
    }, [data]);

    const maxAbsValue = useMemo(() => {
        if (processedData.length === 0) return 1;
        const max = Math.max(...processedData.map(d => Math.abs(d.net)));
        return max > 0 ? max : 1;
    }, [processedData]);

    const formatMonth = (monthString: string) => {
        const date = new Date(monthString + '-02');
        return date.toLocaleString('default', { month: 'short' });
    };

    const renderContent = () => {
        if (isLoading) { /* ... loading JSX ... */ }
        if (error) { /* ... error JSX ... */ }
        if (processedData.length === 0) { /* ... no data JSX ... */ }

        return (
            <div className="flex justify-around items-start h-64 space-x-4 pt-8 pb-4 border-t border-b">
                {processedData.map((month) => {
                    const isProfit = month.net >= 0;
                    const barHeight = (Math.abs(month.net) / maxAbsValue) * 100;

                    return (
                        <div key={month.month} className="flex flex-col items-center flex-1 h-full relative text-center">
                            {/* Bar Area */}
                            <div className={`w-full flex ${isProfit ? 'items-end' : 'items-start'} h-1/2`}>
                                {isProfit && (
                                    <div
                                        className="w-1/2 mx-auto bg-green-200 hover:bg-green-300 rounded-t transition-colors relative"
                                        style={{ height: `${barHeight}%` }}
                                        title={`Profit: ${new Intl.NumberFormat('lo-LA').format(month.net)} ₭`}
                                    >
                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-xs font-semibold text-green-600">
                                            {new Intl.NumberFormat('lo-LA').format(month.net)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="w-full h-px bg-gray-300"></div> 
                            
                            <div className={`w-full flex ${!isProfit ? 'items-start' : 'items-end'} h-1/2`}>
                                {!isProfit && (
                                    <div
                                        className="w-1/2 mx-auto bg-red-200 hover:bg-red-300 rounded-b transition-colors relative"
                                        style={{ height: `${barHeight}%` }}
                                        title={`Loss: ${new Intl.NumberFormat('lo-LA').format(month.net)} ₭`}
                                    >
                                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-xs font-semibold text-red-600">
                                            {new Intl.NumberFormat('lo-LA').format(month.net)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Labels Section */}
                            <div className="mt-2">
                                <p className="text-sm font-semibold text-gray-700">{formatMonth(month.month)}</p>
                                <div className="text-xs text-gray-500">
                                    <span className="text-green-600">↑{new Intl.NumberFormat('lo-LA').format(month.income)}</span> / <span className="text-red-600">↓{new Intl.NumberFormat('lo-LA').format(month.expenses)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
                <TrendingUp className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">{t("monthlyNetChange")}</h3>
            </div>
            {renderContent()}
        </div>
    );
};

export default MonthlyTrends;