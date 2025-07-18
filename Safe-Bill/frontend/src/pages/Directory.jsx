import { Star, MapPin, X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

export default function Component() {
  const professionals = [
    {
      id: 1,
      name: "John Smith",
      title: "Plumber",
      rating: 4.9,
      reviews: 152,
      specializations: ["Pipe Installation & Repair", "Leakage Repair"],
      serviceArea: "Manhattan, Brooklyn, Queens",
      rate: 85,
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      title: "Contractor",
      rating: 4.7,
      reviews: 89,
      specializations: ["Plumbing Services", "Gas"],
      serviceArea: "Bronx, Westchester County",
      rate: 95,
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      id: 3,
      name: "Mike Rodriguez",
      title: "Specialist",
      rating: 5.0,
      reviews: 203,
      specializations: ["Gas Mix", "Vapour Install", "Piping"],
      serviceArea: "All 5 Boroughs",
      rate: 110,
      avatar: "/placeholder.svg?height=60&width=60",
    },
  ]

  const activeFilters = ["Available Today", "Licensed & Insured", "Emergency Service"]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="font-semibold text-lg">Safe Bill</div>
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
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search for professionals..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Location</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Service Type</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Rating</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              <button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
                Search
              </button>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {activeFilters.map((filter, index) => (
              <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                <span>{filter}</span>
                <X className="w-4 h-4 ml-2 text-gray-500 cursor-pointer hover:text-gray-700" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">147 professionals found</p>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Sort by:</span>
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-300 rounded px-3 py-1 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Best Match</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Professional Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {professionals.map((professional) => (
            <div key={professional.id} className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Profile Header */}
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={professional.avatar || "/placeholder.svg"}
                  alt={professional.name}
                  className="w-12 h-12 rounded-full bg-gray-200"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{professional.name}</h3>
                  <p className="text-sm text-gray-600">{professional.title}</p>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(professional.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {professional.rating} ({professional.reviews} reviews)
                    </span>
                  </div>
                </div>
              </div>

              {/* Specializations */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Specializes in:</p>
                <div className="flex flex-wrap gap-1">
                  {professional.specializations.map((spec, index) => (
                    <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Service Area */}
              <div className="mb-4">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>Service Area</span>
                </div>
                <p className="text-sm text-gray-900 mt-1">{professional.serviceArea}</p>
              </div>

              {/* Image Gallery Placeholder */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded"></div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">${professional.rate}/hour</span>
                <button className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 transition-colors">
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2">
          <button className="p-2 rounded hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 bg-black text-white rounded text-sm">1</button>
          <button className="w-8 h-8 hover:bg-gray-100 rounded text-sm">2</button>
          <button className="w-8 h-8 hover:bg-gray-100 rounded text-sm">3</button>
          <button className="p-2 rounded hover:bg-gray-100">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
