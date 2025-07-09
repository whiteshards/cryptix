
'use client';

export default function Footer() {
  const navigationLinks = [
    { name: 'About', href: '#' },
    { name: 'Documentation', href: '#' },
    { name: 'Pricing', href: '#' },
    { name: 'Status', href: '#' },
  ];

  const legalLinks = [
    { name: 'Terms of Service', href: '#' },
    { name: 'Privacy policy', href: '#' },
    { name: 'Cookies policy', href: '#' },
    { name: 'Report Abuse', href: '#' },
  ];

  const companyLinks = [
    { name: 'About us', href: '#' },
    { name: 'Contact us', href: '#' },
  ];

  return (
    <footer className="relative bg-[#0f1015] py-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo and description */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-[#6366f1] rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">C</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Cryptix</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              We are not affiliated or endorsed by linkvertise or work.ink.
            </p>
          </div>

          {/* About section */}
          <div>
            <h4 className="text-white font-medium mb-4">About</h4>
            <ul className="space-y-3">
              {navigationLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal section */}
          <div>
            <h4 className="text-white font-medium mb-4">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company section */}
          <div>
            <h4 className="text-white font-medium mb-4">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <p className="text-gray-400 text-sm">mail@cryptix.com</p>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="pt-8 border-t border-white/10">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Copyright © 2025 All Rights Reserved by Cryptix.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
