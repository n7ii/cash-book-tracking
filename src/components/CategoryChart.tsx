import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
// NEW: Import functions and types from our new service file
import { fetchCategorySummary, CategoryDataPoint } from './Service/categoryChartService';

interface CategoryChartProps {
  dateRange: { start: string; end: string };
}

const CategoryChart: React.FC<CategoryChartProps> = ({ dateRange }) => {
  const { t } = useTranslation();
  
  const [data, setData] = useState<CategoryDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect is now cleaner, using the new service function
  useEffect(() => {
    const fetchCategoryData = async () => {
        if (!dateRange.start || !dateRange.end) return;

        setIsLoading(true);
        setError(null);
        try {
            // Call the new service function
            const categoryData = await fetchCategorySummary(dateRange.start, dateRange.end);
            setData(categoryData);
        } catch (err) {
            setError("Failed to load category data.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    fetchCategoryData();
  }, [dateRange]);

  // This data processing logic remains the same
  const processedData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + parseFloat(item.total as any), 0);
    
    return data.map(item => {
        const itemTotal = parseFloat(item.total as any);
        return {
            ...item,
            percentage: total > 0 ? (itemTotal / total) * 100 : 0,
        }
    });
  }, [data]);

  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500',
  ];

  const renderContent = () => {
    if (isLoading) {
        return <div className="text-center py-12"><Loader2 className="h-8 w-8 text-blue-500 mx-auto animate-spin" /></div>;
    }
    if (error) {
        return <div className="text-center py-12 text-red-600"><AlertTriangle className="h-8 w-8 mx-auto mb-2" />{error}</div>;
    }
    if (processedData.length === 0) {
        return (
            <div className="text-center py-12">
                <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t("noExpenseDataAvailableForThisPeriod")}</p>
            </div>
        );
    }
    return (
        <div className="space-y-4">
          {processedData.map((item, index) => (
            <div key={item.category} className="flex items-center space-x-4">
              <div className={`w-4 h-4 rounded-full flex-shrink-0 ${colors[index % colors.length]}`}></div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-900">{item.category}</span>
                  <span className="text-sm font-medium text-red-600">
                    {new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(parseFloat(item.total as any))}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${colors[index % colors.length]}`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <PieChart className="h-5 w-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">{t("expensesCategories")}</h3>
      </div>
      {renderContent()}
    </div>
  );
};

export default CategoryChart;