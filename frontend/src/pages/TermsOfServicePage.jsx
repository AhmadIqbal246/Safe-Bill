import React from 'react';
import { FileText, Scale, Users, Shield, AlertTriangle, Mail, Phone, MapPin } from 'lucide-react';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import { useTranslation } from 'react-i18next';

export default function TermsOfServicePage() {
  const { t } = useTranslation();

  return (
    <>
      <SafeBillHeader />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] rounded-full p-4 flex items-center justify-center shadow-lg">
                <FileText className="text-white w-8 h-8" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('terms_of_service.title')}</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('terms_of_service.subtitle')}
            </p>
            <p className="text-sm text-gray-500 mt-4">
              {t('terms_of_service.last_updated')} {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Scale className="w-6 h-6 mr-3 text-[#1e3a8a]" />
                {t('terms_of_service.introduction.title')}
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {t('terms_of_service.introduction.content1')}
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  {t('terms_of_service.introduction.content2')}
                </p>
              </div>
            </section>

            {/* Acceptance of Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-6 h-6 mr-3 text-[#1e3a8a]" />
                {t('terms_of_service.acceptance.title')}
              </h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  {t('terms_of_service.acceptance.content')}
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <p className="text-blue-800">
                    {t('terms_of_service.acceptance.agreement')}
                  </p>
                </div>
              </div>
            </section>

            {/* Consent Requirements */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-[#1e3a8a]" />
                {t('terms_of_service.consent_requirements.title')}
              </h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  {t('terms_of_service.consent_requirements.content')}
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-yellow-800">
                    {t('terms_of_service.consent_requirements.cookie_consent')}
                  </p>
                </div>
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="text-red-800">
                    {t('terms_of_service.consent_requirements.withdrawal')}
                  </p>
                </div>
              </div>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-[#1e3a8a]" />
                {t('terms_of_service.service_description.title')}
              </h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  {t('terms_of_service.service_description.content')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-medium text-green-900 mb-2">{t('terms_of_service.service_description.features.project_management')}</h3>
                    <p className="text-green-800 text-sm">{t('terms_of_service.service_description.features.project_management_desc')}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">{t('terms_of_service.service_description.features.milestone_tracking')}</h3>
                    <p className="text-blue-800 text-sm">{t('terms_of_service.service_description.features.milestone_tracking_desc')}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-medium text-purple-900 mb-2">{t('terms_of_service.service_description.features.secure_payments')}</h3>
                    <p className="text-purple-800 text-sm">{t('terms_of_service.service_description.features.secure_payments_desc')}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="font-medium text-orange-900 mb-2">{t('terms_of_service.service_description.features.communication')}</h3>
                    <p className="text-orange-800 text-sm">{t('terms_of_service.service_description.features.communication_desc')}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms_of_service.user_accounts.title')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">{t('terms_of_service.user_accounts.registration.title')}</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {t('terms_of_service.user_accounts.registration.items', { returnObjects: true }).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">{t('terms_of_service.user_accounts.responsibilities.title')}</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {t('terms_of_service.user_accounts.responsibilities.items', { returnObjects: true }).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Payment Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms_of_service.payment_terms.title')}</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  {t('terms_of_service.payment_terms.content')}
                </p>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">{t('terms_of_service.payment_terms.payment_processing.title')}</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {t('terms_of_service.payment_terms.payment_processing.items', { returnObjects: true }).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-yellow-800">
                    {t('terms_of_service.payment_terms.refund_policy')}
                  </p>
                </div>
              </div>
            </section>

            {/* Prohibited Uses */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-3 text-[#1e3a8a]" />
                {t('terms_of_service.prohibited_uses.title')}
              </h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  {t('terms_of_service.prohibited_uses.content')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="font-medium text-red-900 mb-2">{t('terms_of_service.prohibited_uses.illegal_activities.title')}</h3>
                    <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
                      {t('terms_of_service.prohibited_uses.illegal_activities.items', { returnObjects: true }).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="font-medium text-red-900 mb-2">{t('terms_of_service.prohibited_uses.platform_abuse.title')}</h3>
                    <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
                      {t('terms_of_service.prohibited_uses.platform_abuse.items', { returnObjects: true }).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms_of_service.intellectual_property.title')}</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">{t('terms_of_service.intellectual_property.safebill_content.title')}</h3>
                  <p className="text-blue-800">
                    {t('terms_of_service.intellectual_property.safebill_content.content')}
                  </p>
                </div>
                
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <h3 className="text-lg font-medium text-green-900 mb-2">{t('terms_of_service.intellectual_property.user_content.title')}</h3>
                  <p className="text-green-800">
                    {t('terms_of_service.intellectual_property.user_content.content')}
                  </p>
                </div>
              </div>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms_of_service.disclaimers.title')}</h2>
              <div className="space-y-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <h3 className="text-lg font-medium text-yellow-900 mb-2">{t('terms_of_service.disclaimers.service_availability.title')}</h3>
                  <p className="text-yellow-800">
                    {t('terms_of_service.disclaimers.service_availability.content')}
                  </p>
                </div>
                
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                  <h3 className="text-lg font-medium text-orange-900 mb-2">{t('terms_of_service.disclaimers.third_party_services.title')}</h3>
                  <p className="text-orange-800">
                    {t('terms_of_service.disclaimers.third_party_services.content')}
                  </p>
                </div>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms_of_service.limitation_liability.title')}</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  {t('terms_of_service.limitation_liability.content')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <span className="text-gray-700">{t('terms_of_service.limitation_liability.direct_damages')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <span className="text-gray-700">{t('terms_of_service.limitation_liability.indirect_damages')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <span className="text-gray-700">{t('terms_of_service.limitation_liability.consequential_damages')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <span className="text-gray-700">{t('terms_of_service.limitation_liability.lost_profits')}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms_of_service.termination.title')}</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  {t('terms_of_service.termination.content')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">{t('terms_of_service.termination.user_termination.title')}</h3>
                    <p className="text-blue-800 text-sm">{t('terms_of_service.termination.user_termination.content')}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="font-medium text-red-900 mb-2">{t('terms_of_service.termination.company_termination.title')}</h3>
                    <p className="text-red-800 text-sm">{t('terms_of_service.termination.company_termination.content')}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms_of_service.governing_law.title')}</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700">
                  {t('terms_of_service.governing_law.content')}
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="w-6 h-6 mr-3 text-[#1e3a8a]" />
                {t('terms_of_service.contact.title')}
              </h2>
              <div className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] rounded-lg p-6 text-white">
                <p className="mb-4">
                  {t('terms_of_service.contact.content')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5" />
                    <span>{t('terms_of_service.contact.email')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5" />
                    <span>{t('terms_of_service.contact.phone')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5" />
                    <span>{t('terms_of_service.contact.address')}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms_of_service.updates.title')}</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-yellow-800">
                  {t('terms_of_service.updates.content')}
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              {t('terms_of_service.copyright')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
