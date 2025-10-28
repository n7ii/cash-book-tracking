import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'indigo' | 'teal';
  format: 'currency' | 'number';
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  badge?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  format,
  trend = 'neutral',
  subtitle,
  badge,
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-100',
    green: 'bg-green-500 text-green-100',
    red: 'bg-red-500 text-red-100',
    purple: 'bg-purple-500 text-purple-100',
    orange: 'bg-orange-500 text-orange-100',
    indigo: 'bg-indigo-500 text-indigo-100',
    teal: 'bg-teal-500 text-teal-100',
  };

  const badgeColors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    teal: 'bg-teal-100 text-teal-700',
  };

  const trendClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  const formatValue = (val: number) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('lo-LA', {
        style: 'currency',
        currency: 'LAK',
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val.toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {badge && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColors[color]}`}>
                {badge}
              </span>
            )}
          </div>
          <p className={`text-2xl font-bold mt-1 ${trendClasses[trend]}`}>
            {formatValue(value)}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]} flex-shrink-0`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
