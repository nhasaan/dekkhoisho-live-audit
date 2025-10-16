import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface RuleStats {
  rule_id: string;
  rule_name: string;
  count: number;
  last_seen: string;
}

interface RuleStatsChartProps {
  apiUrl: string;
}

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];

export default function RuleStatsChart({ apiUrl }: RuleStatsChartProps) {
  const [data, setData] = useState<Array<{ name: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuleStats = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${apiUrl}/events/stats/rules?window=15m`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      const rules: RuleStats[] = result.data?.rules || [];
      
      const chartData = rules.map((rule) => ({
        name: rule.rule_name,
        count: rule.count
      }));

      setData(chartData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch rule stats:', err);
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuleStats();
    const interval = setInterval(fetchRuleStats, 5000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="text-gray-500 dark:text-gray-400">Loading chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="text-red-500 dark:text-red-400">{error}</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="text-gray-500 dark:text-gray-400">No data available</div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={100}
          interval={0}
          tick={{ fontSize: 12, fill: '#6b7280' }}
        />
        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px'
          }}
          labelStyle={{ color: '#111827', fontWeight: 'bold' }}
        />
        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

