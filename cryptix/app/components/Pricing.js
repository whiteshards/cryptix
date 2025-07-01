
'use client';

import { useState, useEffect, useRef } from 'react';
import AuthModal from './AuthModal';

export default function Pricing() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const CheckIcon = () => (
    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const CrossIcon = () => (
    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started with script monetization",
      isPopular: true,
      buttonText: "Get Invite",
      buttonStyle: "bg-green-500 hover:bg-green-600 text-white",
      disabled: false,
      features: [
        { text: "Ad Keysystem Access For 5 Scripts", included: true },
        { text: "2000 Key Capacity", included: true },
        { text: "Script Loader For 5 Scripts", included: true },
        { text: "Paid Scripts Whitelisting Service", included: true },
        { text: "Multiple Ad Link Providers Support (more being added every week)", included: true },
        { text: "Anti Bypass For Ad-Links", included: true },
        { text: "Script Encryption System Access (In Beta)", included: true },
        { text: "One Extra Checkpoint Will Be Added", included: false }
      ]
    },
    {
      name: "Pro",
      price: "$19",
      period: "per month",
      description: "Advanced features for professional scripters",
      isPopular: false,
      buttonText: "No Need To Pay!",
      buttonStyle: "bg-gray-600 cursor-not-allowed text-gray-400",
      disabled: true,
      noPayMessage: true
    },
    {
      name: "Custom",
      price: "Custom",
      period: "pricing",
      description: "Tailored solutions for enterprise needs",
      isPopular: false,
      buttonText: "No Need To Pay!",
      buttonStyle: "bg-gray-600 cursor-not-allowed text-gray-400",
      disabled: true,
      noPayMessage: true
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative py-20 bg-slate-900 overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-40 left-10 w-40 h-40 bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-green-400/10 rounded-lg transform rotate-45"></div>
        <div className="absolute top-20 right-1/4 w-24 h-24 bg-green-300/15 rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="mb-4">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
              PRICING PLANS
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Choose Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600"> Perfect Plan</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-300">
            Start for free and scale as you grow. All plans include our core security features and reliable infrastructure.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative transition-all duration-1000 ease-out ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${200 + index * 200}ms` }}
            >
              {/* Popular badge */}
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className={`relative h-full p-8 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 flex flex-col ${
                plan.isPopular 
                  ? 'bg-slate-800/80 border-green-500/50 shadow-lg shadow-green-500/20' 
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-green-500/30'
              }`}>
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-400 ml-2">/{plan.period}</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>

                {/* Features List or No Pay Message */}
                {plan.noPayMessage ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎉</div>
                      <h3 className="text-2xl font-bold text-green-400 mb-2">No Need To Pay!</h3>
                      <p className="text-gray-400 text-sm">This plan is currently not required</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {feature.included ? <CheckIcon /> : <CrossIcon />}
                        </div>
                        <span className={`text-sm ${feature.included ? 'text-gray-300' : 'text-gray-500'}`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA Button */}
                <div className="mt-auto pt-6 pb-2">
                  <button 
                    onClick={() => !plan.disabled && setIsAuthModalOpen(true)}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${plan.buttonStyle} ${
                      !plan.disabled ? 'transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25' : ''
                    }`}
                    disabled={plan.disabled}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className={`text-center mt-16 transition-all duration-1000 ease-out delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-gray-400 mb-4">
            Need More Specs For Free Plan?
          </p>
          <button className="text-green-400 hover:text-green-300 font-medium transition-colors duration-200 flex items-center justify-center mx-auto">
            Join Our Discord
            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </section>
  );
}
