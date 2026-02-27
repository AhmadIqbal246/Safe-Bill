import React from 'react';
import { Shield, Cookie, AlertCircle, Mail, MapPin } from 'lucide-react';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';
import { useTranslation } from 'react-i18next';

export default function CookiePreferencesPage() {
  const { t } = useTranslation();

  const renderSection = (sectionKey, sectionData) => {
    return (
      <section key={sectionKey} className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Cookie className="w-6 h-6 mr-3 text-[#1e3a8a]" />
          {sectionData.title}
        </h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {sectionData.content}
          </p>
        </div>
      </section>
    );
  };

  const renderSection4 = () => {
    const section4 = t('cookie_policy_page.section4', { returnObjects: true });
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <Cookie className="w-6 h-6 mr-3 text-[#1e3a8a]" />
          {section4.title}
        </h2>
        <div className="space-y-6">
          {[1, 2, 3, 4].map((num) => {
            const subsection = section4[`subsection4_${num}`];
            return (
              <div key={num} className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  {subsection.title}
                </h3>
                <p className="text-blue-800 leading-relaxed whitespace-pre-line">
                  {subsection.content}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderSection6 = () => {
    const section6 = t('cookie_policy_page.section6', { returnObjects: true });
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
          <AlertCircle className="w-6 h-6 mr-3 text-[#1e3a8a]" />
          {section6.title}
        </h2>
        <div className="space-y-6">
          {[1, 2, 3].map((num) => {
            const subsection = section6[`subsection6_${num}`];
            return (
              <div key={num} className="bg-green-50 border-l-4 border-green-400 p-6 rounded">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                  {subsection.title}
                </h3>
                <p className="text-green-800 leading-relaxed whitespace-pre-line">
                  {subsection.content}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <>
      <SafeBillHeader />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] rounded-full p-4 flex items-center justify-center shadow-lg">
                <Cookie className="text-white w-8 h-8" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('cookie_policy_page.title')}
            </h1>
            <p className="text-sm text-gray-500 mt-4">
              {t('cookie_policy_page.last_updated')} {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            {/* Section 1 */}
            {renderSection('section1', t('cookie_policy_page.section1', { returnObjects: true }))}

            {/* Section 2 */}
            {renderSection('section2', t('cookie_policy_page.section2', { returnObjects: true }))}

            {/* Section 3 */}
            {renderSection('section3', t('cookie_policy_page.section3', { returnObjects: true }))}

            {/* Section 4 */}
            {renderSection4()}

            {/* Section 5 */}
            {renderSection('section5', t('cookie_policy_page.section5', { returnObjects: true }))}

            {/* Section 6 */}
            {renderSection6()}

            {/* Section 7 */}
            {renderSection('section7', t('cookie_policy_page.section7', { returnObjects: true }))}

            {/* Section 8 */}
            {renderSection('section8', t('cookie_policy_page.section8', { returnObjects: true }))}

            {/* Section 9 - Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="w-6 h-6 mr-3 text-[#1e3a8a]" />
                {t('cookie_policy_page.section9.title')}
              </h2>
              <div className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] rounded-lg p-6 text-white">
                <p className="mb-4 leading-relaxed whitespace-pre-line">
                  {t('cookie_policy_page.section9.content')}
                </p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              {t('cookie_policy_page.copyright')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
