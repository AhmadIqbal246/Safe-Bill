import {
    BarChart3,
    FileText,
    FolderOpen,
    CheckCircle,
    User,
    FileIcon,
    HelpCircle,
    Bell,
    Clock,
    DollarSign,
    Menu,
  } from "lucide-react"
  
  export default function Component() {
    const sidebarItems = [
      { icon: BarChart3, label: "Dashboard", active: true },
      { icon: FileText, label: "My quotes", active: false },
      { icon: FolderOpen, label: "Current projects", active: false },
      { icon: CheckCircle, label: "Completed projects", active: false },
      { icon: User, label: "My profile", active: false },
      { icon: FileIcon, label: "Documents", active: false },
      { icon: HelpCircle, label: "Support", active: false },
    ]
  
    const stats = [
      {
        title: "Pending Quotes",
        value: "12",
        change: "+10%",
        positive: true,
      },
      {
        title: "Current Projects",
        value: "8",
        change: "+5%",
        positive: true,
      },
      {
        title: "Monthly Revenue",
        value: "$25,000",
        change: "+15%",
        positive: true,
      },
      {
        title: "Upcoming Deadlines",
        value: "3",
        change: "-2%",
        positive: false,
      },
    ]
  
    const projects = [
      {
        name: "Project Alpha",
        client: "Tech Solutions Inc.",
        status: "In Progress",
        amount: "$15,000",
        statusColor: "bg-blue-100 text-blue-800",
      },
      {
        name: "Project Beta",
        client: "Global Innovations Ltd.",
        status: "Completed",
        amount: "$20,000",
        statusColor: "bg-green-100 text-green-800",
      },
      {
        name: "Project Gamma",
        client: "Future Enterprises LLC",
        status: "Pending",
        amount: "$10,000",
        statusColor: "bg-yellow-100 text-yellow-800",
      },
      {
        name: "Project Delta",
        client: "Strategic Ventures Corp.",
        status: "In Progress",
        amount: "$18,000",
        statusColor: "bg-blue-100 text-blue-800",
      },
      {
        name: "Project Epsilon",
        client: "Premier Holdings Group",
        status: "Completed",
        amount: "$22,000",
        statusColor: "bg-green-100 text-green-800",
      },
    ]
  
    const notifications = [
      {
        icon: "plus",
        text: "New project 'Project Alpha' created",
        time: "2 hours ago",
      },
      {
        icon: "check",
        text: "Quote for 'Tech Solutions Inc.' approved",
        time: "4 hours ago",
      },
      {
        icon: "clock",
        text: "Deadline approaching for 'Project Beta'",
        time: "1 day ago",
      },
      {
        icon: "dollar",
        text: "Payment received for 'Project Gamma'",
        time: "3 days ago",
      },
    ]
  
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <div className="font-bold text-xl">Safe Bill</div>
                <nav className="hidden md:flex space-x-8">
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    Find Professionals
                  </a>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    How It Works
                  </a>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    For Professionals
                  </a>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <Bell className="w-5 h-5 text-gray-500" />
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </header>
  
        <div className="flex flex-1 flex-col lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 bg-white border-b lg:border-r lg:border-b-0 border-gray-200 lg:min-h-screen">
            {/* Mobile menu toggle (placeholder) */}
            <div className="lg:hidden flex items-center justify-between h-16 px-4">
              <div className="font-bold text-xl">Menu</div>
              <button className="p-2 rounded-md hover:bg-gray-100">
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            {/* Desktop sidebar navigation */}
            <nav className="mt-8 hidden lg:block">
              <div className="px-4 space-y-2">
                {sidebarItems.map((item, index) => {
                  const IconComponent = item.icon
                  return (
                    <a
                      key={index}
                      href="#"
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                        item.active ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <IconComponent className="w-5 h-5 mr-3" />
                      {item.label}
                    </a>
                  )
                })}
              </div>
            </nav>
          </aside>
  
          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start">
              {/* Left Content (Dashboard, Overview, Recent Projects) */}
              <div className="flex-1 w-full lg:mr-8">
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                </div>
  
                {/* Overview Section */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">Overview</h2>
                    <div className="flex space-x-3">
                      <button className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors">
                        New Project
                      </button>
                      <button className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors">
                        New Quote
                      </button>
                    </div>
                  </div>
  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                      <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">{stat.title}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                          <span className={`text-sm font-medium ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
  
                {/* Recent Projects */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Project Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {projects.map((project, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {project.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.client}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${project.statusColor}`}
                              >
                                {project.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.amount}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">View</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-200">
                    <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">View All Projects</button>
                  </div>
                </div>
              </div>
  
              {/* Notifications Section */}
              <div className="w-full lg:w-80 bg-white border border-gray-200 rounded-lg p-6 mt-8 lg:mt-0">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                </div>
  
                <div className="space-y-4 mb-6">
                  {notifications.map((notification, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {notification.icon === "plus" && (
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-sm font-bold">+</span>
                          </div>
                        )}
                        {notification.icon === "check" && (
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          </div>
                        )}
                        {notification.icon === "clock" && (
                          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                            <Clock className="w-3 h-3 text-orange-600" />
                          </div>
                        )}
                        {notification.icon === "dollar" && (
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <DollarSign className="w-3 h-3 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 leading-tight">{notification.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
  
                <div className="text-right">
                  <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">Mark All as Read</button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }
  