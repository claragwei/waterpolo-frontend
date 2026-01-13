import { Card } from './ui/card';
import { Button } from './ui/button';
import { FileText, Download, Calendar, User, Trophy } from 'lucide-react';

export default function ReportsPage() {
  const availableReports = [
    {
      id: 1,
      type: 'Match Report',
      title: 'Stanford vs UC Davis',
      date: 'Oct 24, 2025',
      status: 'Ready',
      icon: Trophy,
    },
    {
      id: 2,
      type: 'Player Report',
      title: 'Marcus Silva - Monthly Analysis',
      date: 'Oct 2025',
      status: 'Ready',
      icon: User,
    },
    {
      id: 3,
      type: 'Season Report',
      title: 'Season 2025 Overview',
      date: '2025',
      status: 'Ready',
      icon: Calendar,
    },
  ];

  const reportTemplates = [
    {
      id: 1,
      name: 'Match Performance Report',
      description: 'Comprehensive analysis of a single match including stats and player ratings',
      icon: Trophy,
    },
    {
      id: 2,
      name: 'Player Development Report',
      description: 'Individual player progress tracking over selected time period',
      icon: User,
    },
    {
      id: 3,
      name: 'Team Analytics Report',
      description: 'Team-wide statistics and performance metrics',
      icon: FileText,
    },
    {
      id: 4,
      name: 'Season Summary Report',
      description: 'Complete season overview with trends and highlights',
      icon: Calendar,
    },
  ];

  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen">
      <div className="mb-8">
        <h1 className="text-[#022851] mb-2">Reports</h1>
        <p className="text-gray-600">Generate and download comprehensive performance reports</p>
      </div>

      {/* Generate Report Section */}
      <Card className="p-8 bg-gradient-to-br from-[#022851] to-[#034580] text-white rounded-xl shadow-lg mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white mb-2">Generate New Report</h2>
            <p className="text-gray-300 mb-6">Create custom reports based on your analytics needs</p>
            <Button className="bg-[#FFBF00] hover:bg-[#E6AC00] text-[#022851]">
              <FileText className="mr-2" size={16} />
              Create Report
            </Button>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-[#FFBF00]/20 rounded-full flex items-center justify-center">
              <FileText className="text-[#FFBF00]" size={64} />
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Reports */}
      <div className="mb-8">
        <h2 className="text-[#022851] mb-4">Recent Reports</h2>
        <div className="grid gap-4">
          {availableReports.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#FFBF00]/10 rounded-lg flex items-center justify-center">
                      <Icon className="text-[#FFBF00]" size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-[#022851]">{report.title}</h3>
                        <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs">
                          {report.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{report.type} • {report.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" className="border-gray-300">
                      <FileText className="mr-2" size={16} />
                      View
                    </Button>
                    <Button className="bg-[#022851] hover:bg-[#034580] text-white">
                      <Download className="mr-2" size={16} />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-[#022851] mb-4">Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <Card key={template.id} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[#FFBF00] transition-all cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-[#FFBF00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="text-[#FFBF00]" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#022851] mb-2">{template.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                    <Button size="sm" className="bg-[#FFBF00] hover:bg-[#E6AC00] text-[#022851]">
                      Generate Report
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}