import React from 'react';
import { Shield, Lock, Eye, Database, Users, Mail, MapPin } from 'lucide-react';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import { useTranslation } from 'react-i18next';

export default function PrivacyPolicyPage() {
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
                <Shield className="text-white w-8 h-8" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('privacy_policy.title')}</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('privacy_policy.subtitle')}
            </p>
            <p className="text-sm text-gray-500 mt-4">
              {t('privacy_policy.last_updated')} {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="w-6 h-6 mr-3 text-[#1e3a8a]" />
                {t('privacy_policy.introduction.title')}
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {t('privacy_policy.introduction.content1')}
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  {t('privacy_policy.introduction.content2')}
                </p>
                <div className="bg-blue-50 rounded-lg p-6 mt-6 border-l-4 border-blue-400">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">{t('privacy_policy.introduction.company_info.name')}</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li><strong>{t('privacy_policy.introduction.company_info.legal_form')}</strong></li>
                    <li><strong>{t('privacy_policy.introduction.company_info.capital')}</strong></li>
                    <li><strong>{t('privacy_policy.introduction.company_info.address')}</strong></li>
                    <li><strong>{t('privacy_policy.introduction.company_info.email')}</strong></li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Information Collection */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Database className="w-6 h-6 mr-3 text-[#1e3a8a]" />
                {t('privacy_policy.information_collection.title')}
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">{t('privacy_policy.information_collection.personal_info.title')}</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {t('privacy_policy.information_collection.personal_info.items', { returnObjects: true }).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">{t('privacy_policy.information_collection.project_info.title')}</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {t('privacy_policy.information_collection.project_info.items', { returnObjects: true }).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">{t('privacy_policy.information_collection.technical_info.title')}</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {t('privacy_policy.information_collection.technical_info.items', { returnObjects: true }).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Cookie Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-[#1e3a8a]" />
                {t('privacy_policy.cookie_policy.title')}
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">
                  {t('privacy_policy.cookie_policy.subtitle')}
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">{t('privacy_policy.cookie_policy.essential_cookies.title')}</h3>
                    <p className="text-gray-700 leading-relaxed mb-3">{t('privacy_policy.cookie_policy.essential_cookies.description')}</p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {t('privacy_policy.cookie_policy.essential_cookies.examples', { returnObjects: true }).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">{t('privacy_policy.cookie_policy.analytics_cookies.title')}</h3>
                    <p className="text-gray-700 leading-relaxed mb-3">{t('privacy_policy.cookie_policy.analytics_cookies.description')}</p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {t('privacy_policy.cookie_policy.analytics_cookies.examples', { returnObjects: true }).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">{t('privacy_policy.cookie_policy.marketing_cookies.title')}</h3>
                    <p className="text-gray-700 leading-relaxed mb-3">{t('privacy_policy.cookie_policy.marketing_cookies.description')}</p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {t('privacy_policy.cookie_policy.marketing_cookies.examples', { returnObjects: true }).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">{t('privacy_policy.cookie_policy.consent_management.title')}</h3>
                    <p className="text-gray-700 leading-relaxed mb-3">{t('privacy_policy.cookie_policy.consent_management.description')}</p>
                    <p className="text-gray-700 leading-relaxed">{t('privacy_policy.cookie_policy.consent_management.withdrawal')}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="w-6 h-6 mr-3 text-[#1e3a8a]" />
                {t('privacy_policy.how_we_use.title')}
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">{t('privacy_policy.how_we_use.service_provision.title')}</h3>
                  <p className="text-blue-800">
                    {t('privacy_policy.how_we_use.service_provision.content')}
                  </p>
                </div>
                
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <h3 className="text-lg font-medium text-green-900 mb-2">{t('privacy_policy.how_we_use.communication.title')}</h3>
                  <p className="text-green-800">
                    {t('privacy_policy.how_we_use.communication.content')}
                  </p>
                </div>
                
                <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
                  <h3 className="text-lg font-medium text-purple-900 mb-2">{t('privacy_policy.how_we_use.security_compliance.title')}</h3>
                  <p className="text-purple-800">
                    {t('privacy_policy.how_we_use.security_compliance.content')}
                  </p>
                </div>
                
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                  <h3 className="text-lg font-medium text-orange-900 mb-2">{t('privacy_policy.how_we_use.analytics_improvement.title')}</h3>
                  <p className="text-orange-800">
                    {t('privacy_policy.how_we_use.analytics_improvement.content')}
                  </p>
                </div>
              </div>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-6 h-6 mr-3 text-[#1e3a8a]" />
                {t('privacy_policy.information_sharing.title')}
              </h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  {t('privacy_policy.information_sharing.content')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>{t('privacy_policy.information_sharing.service_providers')}</strong></li>
                  <li><strong>{t('privacy_policy.information_sharing.legal_requirements')}</strong></li>
                  <li><strong>{t('privacy_policy.information_sharing.business_transfers')}</strong></li>
                  <li><strong>{t('privacy_policy.information_sharing.consent')}</strong></li>
                </ul>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-[#1e3a8a]" />
                {t('privacy_policy.data_security.title')}
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  {t('privacy_policy.data_security.content')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span className="text-gray-700">{t('privacy_policy.data_security.ssl_encryption')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span className="text-gray-700">{t('privacy_policy.data_security.secure_storage')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span className="text-gray-700">{t('privacy_policy.data_security.security_audits')}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span className="text-gray-700">{t('privacy_policy.data_security.access_controls')}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('privacy_policy.your_rights.title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">{t('privacy_policy.your_rights.access_portability.title')}</h3>
                  <p className="text-blue-800 text-sm">{t('privacy_policy.your_rights.access_portability.content')}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">{t('privacy_policy.your_rights.correction.title')}</h3>
                  <p className="text-green-800 text-sm">{t('privacy_policy.your_rights.correction.content')}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-medium text-purple-900 mb-2">{t('privacy_policy.your_rights.deletion.title')}</h3>
                  <p className="text-purple-800 text-sm">{t('privacy_policy.your_rights.deletion.content')}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="font-medium text-orange-900 mb-2">{t('privacy_policy.your_rights.objection.title')}</h3>
                  <p className="text-orange-800 text-sm">{t('privacy_policy.your_rights.objection.content')}</p>
                </div>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('privacy_policy.cookies.title')}</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  {t('privacy_policy.cookies.content')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>{t('privacy_policy.cookies.essential_cookies')}</strong></li>
                  <li><strong>{t('privacy_policy.cookies.analytics_cookies')}</strong></li>
                  <li><strong>{t('privacy_policy.cookies.preference_cookies')}</strong></li>
                </ul>
                <p className="text-gray-700 mt-4">
                  {t('privacy_policy.cookies.browser_control')}
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="w-6 h-6 mr-3 text-[#1e3a8a]" />
                {t('privacy_policy.contact.title')}
              </h2>
              <div className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] rounded-lg p-6 text-white">
                <p className="mb-4">
                  {t('privacy_policy.contact.content')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5" />
                    <span>{t('privacy_policy.contact.email')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5" />
                    <span>{t('privacy_policy.contact.address')}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('privacy_policy.updates.title')}</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-yellow-800">
                  {t('privacy_policy.updates.content')}
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              {t('privacy_policy.copyright')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
