import { Star, ChevronDown, Shield, CheckCircle, Award, Users } from "lucide-react"

export default function PlumbingProfile() {
  const services = [
    "Leak Detection",
    "Pipe Repair",
    "Drain Cleaning",
    "Water Heater Installation",
    "Fixture Replacement",
    "Sewer Line Services",
    "Gas Line Services",
    "Backflow Prevention",
    "Emergency Plumbing",
    "Plumbing Inspections",
  ]

  const guarantees = [
    {
      icon: CheckCircle,
      title: "KYC Validated",
      description: "Identity verified",
    },
    {
      icon: Shield,
      title: "Insured",
      description: "Fully covered",
    },
    {
      icon: Award,
      title: "Professional Liability",
      description: "Protected service",
    },
    {
      icon: Users,
      title: "Trusted by ProConnect",
      description: "Verified partner",
    },
  ]

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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Section */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-green-700 rounded-full mx-auto mb-6 flex items-center justify-center">
            <div className="w-8 h-8 text-white">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reliable Plumbing Solutions</h1>

          <p className="text-gray-600 mb-2">Plumbing Services</p>

          <p className="text-gray-500 mb-4">Serving the Greater Bay Area</p>

          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < 4 ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
              ))}
            </div>
            <span className="ml-2 text-gray-600">4.9 (150 reviews)</span>
          </div>

          <button className="bg-green-700 hover:bg-green-800 text-white px-8 py-2 rounded-md transition-colors">
            Request Quote
          </button>
        </div>

        {/* About Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Reliable Plumbing Solutions</h2>
          <p className="text-gray-700 leading-relaxed">
            Reliable Plumbing Solutions is a leading plumbing service provider specializing in delivering top-notch
            plumbing solutions for residential and commercial clients. With a team of skilled plumbers, we are dedicated
            to providing reliable and efficient services that meet our clients' needs.
          </p>
        </section>

        {/* Skills & Services */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills & Services</h2>
          <div className="flex flex-wrap gap-3">
            {services.map((service, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
              >
                {service}
              </span>
            ))}
          </div>
        </section>

        {/* Service Area */}
        <section className="mb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Service Area</h2>
            <ChevronDown className="w-5 h-5 text-gray-500" />
          </div>
        </section>

        {/* Guarantees */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Guarantees</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {guarantees.map((guarantee, index) => {
              const IconComponent = guarantee.icon
              return (
                <div key={index} className="flex items-center space-x-3">
                  <IconComponent className="w-6 h-6 text-green-700" />
                  <div>
                    <div className="font-semibold text-gray-900">{guarantee.title}</div>
                    <div className="text-sm text-gray-500">{guarantee.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
