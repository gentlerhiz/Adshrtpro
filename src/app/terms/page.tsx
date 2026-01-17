import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdDisplay } from "@/components/ad-display";

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-3xl">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using AdShrtPro, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              AdShrtPro provides URL shortening, link management, and analytics services. 
              We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.
            </p>

            <h2>3. User Accounts</h2>
            <p>
              To access certain features, you must create an account. You are responsible for:
            </p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us of any unauthorized use of your account</li>
            </ul>

            <h2>4. Acceptable Use</h2>
            <p>You agree not to use AdShrtPro to:</p>
            <ul>
              <li>Share illegal, harmful, or malicious content</li>
              <li>Distribute spam, malware, or phishing attempts</li>
              <li>Infringe on intellectual property rights</li>
              <li>Harass, abuse, or harm others</li>
              <li>Attempt to circumvent security measures or rate limits</li>
              <li>Use automated systems to create links excessively</li>
            </ul>

            <h2>5. Rate Limits</h2>
            <p>
              Free users are limited to 250 link creations per IP address per month. 
              Exceeding these limits may result in temporary or permanent restrictions.
            </p>

            <h2>6. Link Management</h2>
            <p>
              We reserve the right to disable or remove any link that violates our terms or poses a security risk. 
              Links may be disabled without prior notice in cases of abuse.
            </p>

            <h2>7. Analytics and Advertising</h2>
            <p>
              Access to detailed analytics requires viewing rewarded advertisements. 
              By using this feature, you agree to view advertisements as part of the unlock process.
            </p>

            <h2>8. Intellectual Property</h2>
            <p>
              The AdShrtPro service, including its design, features, and content, is protected by intellectual property laws. 
              You retain ownership of the URLs you shorten through our service.
            </p>

            <h2>9. Disclaimer of Warranties</h2>
            <p>
              AdShrtPro is provided "as is" without warranties of any kind. 
              We do not guarantee uninterrupted or error-free service.
            </p>

            <h2>10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, AdShrtPro shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages arising from your use of the service.
            </p>

            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless AdShrtPro and its operators from any claims, 
              damages, or expenses arising from your use of the service or violation of these terms.
            </p>

            <h2>12. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the service after changes 
              constitutes acceptance of the modified terms.
            </p>

            <h2>13. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with applicable laws.
            </p>

            <h2>14. Contact</h2>
            <p>
              For questions about these terms, please contact us through our contact page.
            </p>
          </CardContent>
        </Card>

        <AdDisplay placement="footer" className="mt-8" />
      </div>
    </div>
  );
}
