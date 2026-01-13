import { Card } from './ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, Target, Activity } from 'lucide-react';

export default function Dashboard() {
  // Mock data for charts - Water Polo specific
  const performanceData = [
    { match: 'Match 1', goals: 12, saves: 8, steals: 5 },
    { match: 'Match 2', goals: 14, saves: 6, steals: 7 },
    { match: 'Match 3', goals: 10, saves: 10, steals: 4 },
    { match: 'Match 4', goals: 15, saves: 7, steals: 6 },
    { match: 'Match 5', goals: 11, saves: 9, steals: 8 },
    { match: 'Match 6', goals: 16, saves: 11, steals: 9 },
  ];

  const possessionData = [
    { name: 'UC Davis', value: 54 },
    { name: 'Opponent', value: 46 },
  ];

  const shotDistribution = [
    { name: 'Mon', shots: 18, onTarget: 12 },
    { name: 'Tue', shots: 22, onTarget: 15 },
    { name: 'Wed', shots: 16, onTarget: 10 },
    { name: 'Thu', shots: 24, onTarget: 18 },
    { name: 'Fri', shots: 20, onTarget: 14 },
    { name: 'Sat', shots: 26, onTarget: 19 },
  ];

  const COLORS = ['#FFBF00', '#022851'];

  const stats = [
    {
      title: 'Avg Goals/Game',
      value: '13.0',
      change: '+2.5',
      trend: 'up',
      icon: Activity,
      color: 'bg-yellow-500',
    },
    {
      title: 'Total Saves',
      value: '51',
      change: '+8',
      trend: 'up',
      icon: Target,
      color: 'bg-blue-700',
    },
    {
      title: 'Shot Accuracy',
      value: '67%',
      change: '+4.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      title: 'Active Players',
      value: '18',
      change: '0',
      trend: 'up',
      icon: Users,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen">
      <div className="mb-8">
        <h1 className="text-[#022851] mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's the UC Davis Men's Water Polo team overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <Card key={index} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="text-white" size={24} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendIcon size={16} />
                  <span>{stat.change}</span>
                </div>
              </div>
              <h3 className="text-3xl text-[#022851] mb-1">{stat.value}</h3>
              <p className="text-gray-600 text-sm">{stat.title}</p>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Trend */}
        <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-[#022851] mb-6">Performance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="match" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="goals" stroke="#FFBF00" strokeWidth={2} />
              <Line type="monotone" dataKey="saves" stroke="#022851" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Possession Distribution */}
        <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-[#022851] mb-6">Average Possession</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={possessionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {possessionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Shots Analysis */}
      <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
        <h3 className="text-[#022851] mb-6">Weekly Shot Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={shotDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="shots" fill="#022851" radius={[8, 8, 0, 0]} />
            <Bar dataKey="onTarget" fill="#FFBF00" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-[#022851] mb-6">Recent Matches</h3>
        <div className="space-y-4">
          {[
            { opponent: 'Stanford', result: 'W 15-12', date: 'Nov 28, 2025', possession: '56%' },
            { opponent: 'UCLA', result: 'L 11-13', date: 'Nov 22, 2025', possession: '48%' },
            { opponent: 'Cal Berkeley', result: 'W 14-10', date: 'Nov 15, 2025', possession: '58%' },
          ].map((match, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-12 rounded-full ${
                  match.result.startsWith('W') ? 'bg-yellow-500' : match.result.startsWith('D') ? 'bg-blue-500' : 'bg-red-500'
                }`}></div>
                <div>
                  <p className="text-[#022851]">vs {match.opponent}</p>
                  <p className="text-gray-500 text-sm">{match.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[#022851]">{match.result}</p>
                <p className="text-gray-500 text-sm">{match.possession} possession</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}