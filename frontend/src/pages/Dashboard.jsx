import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  IndianRupee,
  TrendingUp,
  Users,
  Package,
  ShoppingBag,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartRes, customersRes, productsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/dashboard/sales-chart?days=7`),
        axios.get(`${API}/dashboard/top-customers?limit=5`),
        axios.get(`${API}/dashboard/top-products?limit=5`)
      ]);
      
      setStats(statsRes.data);
      setChartData(chartRes.data);
      setTopCustomers(customersRes.data);
      setTopProducts(productsRes.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(stats?.today_revenue),
      icon: IndianRupee,
      color: "bg-blue-900",
      change: `${stats?.today_transactions || 0} transactions`
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats?.month_revenue),
      icon: TrendingUp,
      color: "bg-green-700",
      change: `${stats?.month_sales_count || 0} sales this month`
    },
    {
      title: "Outstanding Balance",
      value: formatCurrency(stats?.total_outstanding),
      icon: Clock,
      color: "bg-amber-600",
      change: "Total dues pending"
    },
    {
      title: "Active Customers",
      value: stats?.total_customers || 0,
      icon: Users,
      color: "bg-purple-700",
      change: "Registered customers"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard-page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Welcome back to Lata Dairy Management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="card-hover animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
            data-testid={`stat-card-${index}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-500">{stat.title}</p>
                  <p className="stat-card-value mt-2">{stat.value}</p>
                  <p className="text-xs text-stone-400 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="card-hover" data-testid="revenue-chart">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-stone-900">
              Last 7 Days Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fill: '#78716c', fontSize: 12 }}
                    axisLine={{ stroke: '#e7e5e4' }}
                  />
                  <YAxis 
                    tick={{ fill: '#78716c', fontSize: 12 }}
                    axisLine={{ stroke: '#e7e5e4' }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e7e5e4',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#1e3a8a" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Chart */}
        <Card className="card-hover" data-testid="transactions-chart">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-stone-900">
              Daily Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fill: '#78716c', fontSize: 12 }}
                    axisLine={{ stroke: '#e7e5e4' }}
                  />
                  <YAxis 
                    tick={{ fill: '#78716c', fontSize: 12 }}
                    axisLine={{ stroke: '#e7e5e4' }}
                  />
                  <Tooltip 
                    formatter={(value) => [value, 'Transactions']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e7e5e4',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="#15803d" 
                    strokeWidth={2}
                    dot={{ fill: '#15803d', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card className="card-hover" data-testid="top-customers">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-900" />
              Top Customers This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="text-stone-500 text-center py-8">No sales data yet</p>
            ) : (
              <div className="space-y-4">
                {topCustomers.map((customer, index) => (
                  <div 
                    key={customer.customer_id}
                    className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 text-sm font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-medium text-stone-900">{customer.customer_name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-stone-900">
                        {formatCurrency(customer.total_purchases)}
                      </p>
                      <p className="text-xs text-stone-500">
                        {customer.purchase_count} purchases
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="card-hover" data-testid="top-products">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-green-700" />
              Top Products This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-stone-500 text-center py-8">No sales data yet</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div 
                    key={product.product_id}
                    className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-800 text-sm font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-medium text-stone-900">{product.product_name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-stone-900">
                        {formatCurrency(product.total_revenue)}
                      </p>
                      <p className="text-xs text-stone-500">
                        {product.total_quantity} units sold
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
