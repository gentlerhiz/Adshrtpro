import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdDisplay } from "@/components/ad-display";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-3xl">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <h2>1. Information We Collect</h2>
            <p>
              When you use AdShrtPro, we collect certain information to provide and improve our services:
            </p>
            <ul>
              <li><strong>Account Information:</strong> Email address and password when you create an account.</li>
              <li><strong>Link Data:</strong> URLs you shorten and associated metadata.</li>
              <li><strong>Analytics Data:</strong> Click statistics including country, device type, browser, and referrer information.</li>
              <li><strong>IP Addresses:</strong> Used for rate limiting and security purposes.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul>
              <li>Provide URL shortening and analytics services</li>
              <li>Maintain account security and prevent abuse</li>
              <li>Improve our services and user experience</li>
              <li>Communicate important updates about our service</li>
            </ul>

            <h2>3. Data Storage and Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. 
              Passwords are securely hashed and never stored in plain text. 
              We use secure connections (HTTPS) for all data transmission.
            </p>

            <h2>4. Third-Party Services</h2>
            <p>
              We may use third-party services for analytics and advertising. 
              These services may collect anonymous usage data in accordance with their own privacy policies.
            </p>

            <h2>5. Cookies</h2>
            <p>
              We use cookies to maintain your session and preferences. 
              You can control cookie settings through your browser preferences.
            </p>

            <h2>6. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide services. 
              You can request account deletion by contacting us.
            </p>

            <h2>7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
            </ul>

            <h2>8. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. 
              We will notify you of significant changes via email or through our service.
            </p>

            <h2>9. Contact Us</h2>
            <p>
              If you have questions about this privacy policy, please contact us through our contact page.
            </p>
          </CardContent>
        </Card>

        <AdDisplay placement="footer" className="mt-8" />
      </div>
    </div>
  );
}
