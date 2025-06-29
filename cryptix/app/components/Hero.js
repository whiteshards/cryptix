
export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-500/10 rounded-lg transform rotate-45"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 bg-green-400/20 rounded-full"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-green-300/15 rounded-lg transform rotate-12"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-green-500/20 rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="mb-8">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            THE FUTURE IS NOW
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Revolutionizing the
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
            future ⚡ of crypto
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-3xl mx-auto text-lg sm:text-xl text-gray-300 mb-12 leading-relaxed">
          A premium experience embedded with the latest technologies to enhance your
          <br className="hidden sm:block" />
          cryptocurrency trading experience to the next level.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25">
            Start Trading
          </button>
          <button className="w-full sm:w-auto group flex items-center justify-center text-gray-300 hover:text-white px-8 py-4 text-lg font-medium transition-colors duration-200">
            Learn more
            <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Stats or additional info */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">$2.4B+</div>
            <div className="text-gray-400">Trading Volume</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">500K+</div>
            <div className="text-gray-400">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">99.9%</div>
            <div className="text-gray-400">Uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
}
