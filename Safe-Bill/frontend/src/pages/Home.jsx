import {
  Shield,
  MapPin,
  Scale,
  User,
  Grid3X3,
  Headphones,
  Star,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Instagram,
} from "lucide-react"

export default function Component() {
  const professionals = [
    {
      id: 1,
      name: "Sarah Johnson",
      specialty: "Painter",
      rating: 5.0,
      reviews: 24,
      rate: 50,
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 2,
      name: "Michael Chen",
      specialty: "Constructor",
      rating: 4.9,
      reviews: 18,
      rate: 40,
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      specialty: "Electrician",
      rating: 4.8,
      reviews: 31,
      rate: 60,
      avatar: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 4,
      name: "David Kim",
      specialty: "Plumber",
      rating: 5.0,
      reviews: 12,
      rate: 120,
      avatar: "/placeholder.svg?height=80&width=80",
    },
  ]

  const features = [
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Your money is safe with our secure payment system and fraud protection for every transaction.",
    },
    {
      icon: MapPin,
      title: "Real-time Tracking",
      description: "Monitor project progress in real-time with our advanced tracking system and regular updates.",
    },
    {
      icon: Scale,
      title: "Mediation Included",
      description: "Professional dispute resolution and mediation services to ensure fair outcomes for all parties.",
    },
  ]

  const bottomFeatures = [
    {
      icon: User,
      title: "My Account",
      description: "Manage your profile, projects, and payments all in one secure dashboard.",
    },
    {
      icon: Grid3X3,
      title: "Service Categories",
      description: "Browse through hundreds of service categories to find exactly what you need.",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Get help anytime with our round-the-clock customer support team.",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="font-bold text-xl">Safe Bill</div>
              <nav className="hidden md:flex space-x-8">
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Find
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Directory
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  How it works
                </a>
              </nav>
            </div>
            <button className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors">
              Sign up
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Trusted platform for
            <br />
            your projects
          </h1>
          <p className="text-xl text-gray-600 mb-12">Secure payments, transparent tracking, mediation provided</p>

          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">What service do you need?</label>
                  <div className="relative">
                    <select className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>Select specialty...</option>
                      <option>Plumbing</option>
                      <option>Electrical</option>
                      <option>Construction</option>
                      <option>Painting</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="Enter city or zip code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button className="w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Find a professional near you
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trusted Professionals Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted professionals</h2>
            <p className="text-xl text-gray-600">Top-rated experts ready to help with your project needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {professionals.map((professional) => (
              <div
                key={professional.id}
                className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200"
              >
                <img
                  src={professional.avatar || "/placeholder.svg"}
                  alt={professional.name}
                  className="w-16 h-16 rounded-full mx-auto mb-4 bg-gray-200"
                />
                <h3 className="font-semibold text-gray-900 mb-1">{professional.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{professional.specialty}</p>
                <div className="flex items-center justify-center mb-2">
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
                <p className="text-gray-700 font-medium mb-2">Starting at ${professional.rate}/hour</p>
                <div className="flex items-center justify-center text-sm text-green-600 mb-4">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  KYC Verified
                </div>
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-1" />
                  Area Name, Area Name
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button className="bg-black text-white px-8 py-3 rounded hover:bg-gray-800 transition-colors">
              View All Professionals
            </button>
          </div>
        </div>
      </section>

      {/* Bottom Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {bottomFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="font-bold text-xl mb-4">Safe Bill</div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Connecting homeowners with trusted professionals for all your project needs.
              </p>
            </div>

            {/* For Clients */}
            <div>
              <h4 className="font-semibold mb-4">For Clients</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Find Professionals
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    How it Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Reviews
                  </a>
                </li>
              </ul>
            </div>

            {/* For Professionals */}
            <div>
              <h4 className="font-semibold mb-4">For Professionals</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Join as Pro
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Success Stories
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Resources
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Safety
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-6 mb-4 md:mb-0">
                <div className="flex items-center text-sm text-gray-400">
                  <Mail className="w-4 h-4 mr-2" />
                  support@safebill.com
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <Phone className="w-4 h-4 mr-2" />
                  1-800-SAFE-BILL
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Facebook className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
              </div>
            </div>
            <div className="text-center mt-6 text-sm text-gray-400">© 2024 Safe Bill. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
