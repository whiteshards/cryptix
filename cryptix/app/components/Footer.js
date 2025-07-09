
'use client';

export default function Footer() {
  return (
    <footer className="bg-[#0f1015] border-t border-white/10 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-[#6366f1] rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="text-xl font-semibold text-white">Cryptix</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              We are not affiliated or endorsed by linkvertise or work.ink.
            </p>
          </div>

          {/* About Section */}
          <div>
            <h3 className="text-white font-medium mb-4">About</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  Status
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="text-white font-medium mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  Privacy policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  Cookies policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  Report Abuse
                </a>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="text-white font-medium mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  About us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                  Contact us
                </a>
              </li>
              <li>
                <span className="text-gray-400 text-sm">
                  mail@cryptix.com
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 mt-12 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            Copyright © 2025 All Rights Reserved by Cryptix.
          </p>
        </div>
      </div>
    </footer>
  );
}
