import React from 'react';
import { X, Building2, User, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function SignUpPopup({ isOpen, onClose }) {

  const registrationOptions = [
    {
      id: 'seller',
      title: 'Register as a Seller',
      description: 'Join as a service provider to offer your professional services',
      icon: <Building2 className="w-6 h-6" />,
      link: '/seller-register',
      color: 'bg-[#01257D] hover:bg-[#2346a0]',
      textColor: 'text-white'
    },
    {
      id: 'professional-buyer',
      title: 'Register as a Buyer (Business)',
      description: 'Register your business to source professional services',
      icon: <Users className="w-6 h-6" />,
      link: '/professional-buyer',
      color: 'bg-[#E6F0FA] hover:bg-[#c7e0fa]',
      textColor: 'text-[#01257D]'
    },
    {
      id: 'individual-buyer',
      title: 'Register as a Buyer (Individual)',
      description: 'Create an individual account to access services',
      icon: <User className="w-6 h-6" />,
      link: '/buyer-register',
      color: 'bg-[#E6F0FA] hover:bg-[#c7e0fa]',
      textColor: 'text-[#01257D]'
    }
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
                     <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <Dialog.Title as="h2" className="text-xl font-semibold text-gray-900">
                    Choose Your Registration Type
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <p className="text-gray-600 text-sm mb-6">
                    Select the type of account that best fits your needs
                  </p>

                  {registrationOptions.map((option) => (
                    <Link
                      key={option.id}
                      to={option.link}
                      onClick={onClose}
                      className={`block w-full p-4 rounded-lg border border-gray-200 hover:border-[#01257D] transition-all duration-200 ${option.color} ${option.textColor}`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base mb-1">
                            {option.title}
                          </h3>
                          <p className="text-sm opacity-90">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200">
                  <p className="text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link 
                      to="/login" 
                      onClick={onClose}
                      className="text-[#01257D] hover:underline font-medium"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 