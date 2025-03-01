"use client";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-orange-500/20">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          
          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">1. Information We Collect</h2>
              <p className="mb-4">We collect the following information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Discord account information (username, ID, email)</li>
                <li>Minecraft username and UUID</li>
                <li>IP addresses for security purposes</li>
                <li>Transaction history and listing data</li>
                <li>Communication records with our support team</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">Your information is used to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain our service</li>
                <li>Process transactions and listings</li>
                <li>Verify user identity and prevent fraud</li>
                <li>Communicate important updates</li>
                <li>Improve our platform and user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">3. Data Storage and Security</h2>
              <p className="mb-4">
                We use industry-standard security measures to protect your data. All information is stored 
                securely using Appwrite's cloud infrastructure with encryption at rest and in transit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">4. Discord Integration</h2>
              <p className="mb-4">
                Our service uses Discord for authentication. When you log in, we receive basic profile 
                information from Discord according to their OAuth2 scope. We do not access your Discord 
                messages or server data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">5. Data Sharing</h2>
              <p className="mb-4">We share data only in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>With other users (your public profile and listings)</li>
                <li>To process transactions</li>
                <li>When required by law</li>
                <li>To protect our rights and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">6. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data</li>
                <li>Request data correction or deletion</li>
                <li>Object to data processing</li>
                <li>Export your data</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">7. Cookies and Tracking</h2>
              <p className="mb-4">
                We use essential cookies for authentication and security. No third-party tracking 
                cookies are used on our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">8. Children's Privacy</h2>
              <p className="mb-4">
                Our service is not intended for users under 13 years of age. We do not knowingly 
                collect data from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">9. Changes to Privacy Policy</h2>
              <p className="mb-4">
                We may update this policy periodically. Users will be notified of significant changes 
                via email or platform notifications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">10. Contact Us</h2>
              <p className="mb-4">
                For privacy-related questions or concerns, contact us at{" "}
                <a href="mailto:privacy@minecraft-real-estate.com" className="text-orange-500 hover:text-orange-400">
                  privacy@minecraft-real-estate.com
                </a>
              </p>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700 text-gray-400 text-sm">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 