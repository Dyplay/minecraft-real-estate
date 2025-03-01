"use client";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-orange-500/20">
          <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
          
          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">1. Agreement to Terms</h2>
              <p className="mb-4">
                By accessing and using Minecraft Real Estate, you agree to be bound by these Terms of Service. 
                If you disagree with any part of these terms, you may not access our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">2. Description of Service</h2>
              <p className="mb-4">
                Minecraft Real Estate provides a platform for users to list, browse, and purchase virtual 
                properties within Minecraft servers. Our service includes property listings, user profiles, 
                and transaction facilitation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">3. User Accounts</h2>
              <p className="mb-4">
                To use our service, you must have a valid Discord account and agree to authenticate through Discord's OAuth system.
                You are responsible for maintaining the security of your account and any activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">4. Property Listings</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Users must have legitimate ownership of listed properties</li>
                <li>Listings must accurately represent the virtual property</li>
                <li>Prices must be listed in the specified currency</li>
                <li>Images must be appropriate and relevant to the listing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">5. Prohibited Activities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fraudulent listings or transactions</li>
                <li>Harassment of other users</li>
                <li>Manipulation of the platform's systems</li>
                <li>Distribution of malware or harmful content</li>
                <li>Impersonation of other users or staff</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">6. Transaction Rules</h2>
              <p className="mb-4">
                All transactions must be completed through our platform's official payment system. 
                Off-platform transactions are not protected by our services and may result in account suspension.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">7. Content Rights</h2>
              <p className="mb-4">
                Users retain rights to their content but grant us license to display and promote listings. 
                We reserve the right to remove any content that violates our terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">8. Termination</h2>
              <p className="mb-4">
                We reserve the right to terminate or suspend accounts for violations of these terms, 
                inappropriate behavior, or at our discretion without prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">9. Changes to Terms</h2>
              <p className="mb-4">
                We may modify these terms at any time. Continued use of the platform after changes 
                constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-orange-500 mb-4">10. Contact</h2>
              <p className="mb-4">
                For questions about these terms, please contact us at{" "}
                <a href="mailto:support@minecraft-real-estate.com" className="text-orange-500 hover:text-orange-400">
                  support@minecraft-real-estate.com
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