import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Pain Clinics",
  description:
    "Learn how Pain Clinics collects, uses, and protects your personal information when you use our pain management clinic directory.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "December 18, 2025";

  return (
    <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto prose prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary">
        <h1>Privacy Policy</h1>
        <p className="text-foreground/70">Last updated: {lastUpdated}</p>

        <p>
          Pain Clinics (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the Pain Clinics website
          (the &ldquo;Service&rdquo;). This page informs you of our policies regarding the collection, use, and
          disclosure of personal information when you use our Service.
        </p>

        <h2>Information We Collect</h2>
        <p>We collect several types of information for various purposes to provide and improve our Service to you:</p>

        <h3>Information You Provide</h3>
        <ul>
          <li>
            <strong>Contact Information:</strong> When you contact us or submit a clinic listing, you may provide your
            name, email address, phone number, or other contact details.
          </li>
          <li>
            <strong>Account Information:</strong> If you create an account, we collect your email address and any
            profile information you choose to provide.
          </li>
          <li>
            <strong>Communications:</strong> We retain records of any correspondence if you contact us.
          </li>
        </ul>

        <h3>Information Collected Automatically</h3>
        <ul>
          <li>
            <strong>Usage Data:</strong> We may collect information on how the Service is accessed and used, including
            your browser type, pages visited, time spent on pages, and other diagnostic data.
          </li>
          <li>
            <strong>Device Information:</strong> We may collect information about the device you use to access our
            Service, including device type, operating system, and unique device identifiers.
          </li>
          <li>
            <strong>Location Data:</strong> We may use and store information about your general location (such as city
            or state) based on your IP address to provide location-relevant content.
          </li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use the collected information for various purposes:</p>
        <ul>
          <li>To provide and maintain our Service</li>
          <li>To notify you about changes to our Service</li>
          <li>To provide customer support</li>
          <li>To gather analysis or valuable information so that we can improve our Service</li>
          <li>To monitor the usage of our Service</li>
          <li>To detect, prevent, and address technical issues</li>
          <li>To fulfill any other purpose for which you provide information</li>
        </ul>

        <h2>Information Sharing</h2>
        <p>We may share your information in the following situations:</p>
        <ul>
          <li>
            <strong>Service Providers:</strong> We may share your information with third-party service providers who
            assist us in operating our Service, conducting our business, or serving our users.
          </li>
          <li>
            <strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in
            response to valid requests by public authorities.
          </li>
          <li>
            <strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or asset sale, your
            personal information may be transferred.
          </li>
          <li>
            <strong>With Your Consent:</strong> We may disclose your personal information for any other purpose with
            your consent.
          </li>
        </ul>

        <h2>Cookies and Tracking Technologies</h2>
        <p>
          We use cookies and similar tracking technologies to track activity on our Service and store certain
          information. Cookies are files with a small amount of data that are sent to your browser from a website and
          stored on your device.
        </p>
        <p>You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.</p>
        <p>
          For more information about the cookies we use, please see our{" "}
          <a href="/cookies">Cookie Policy</a>.
        </p>

        <h2>Data Security</h2>
        <p>
          The security of your data is important to us, but remember that no method of transmission over the Internet
          or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to
          protect your personal information, we cannot guarantee its absolute security.
        </p>

        <h2>Your Rights</h2>
        <p>Depending on your location, you may have certain rights regarding your personal information:</p>
        <ul>
          <li>
            <strong>Access:</strong> You may request access to the personal information we hold about you.
          </li>
          <li>
            <strong>Correction:</strong> You may request that we correct any inaccurate personal information.
          </li>
          <li>
            <strong>Deletion:</strong> You may request that we delete your personal information, subject to certain
            exceptions.
          </li>
          <li>
            <strong>Opt-Out:</strong> You may opt out of receiving promotional communications from us by following the
            unsubscribe instructions in those communications.
          </li>
        </ul>

        <h2>Third-Party Links</h2>
        <p>
          Our Service may contain links to other websites that are not operated by us. If you click on a third-party
          link, you will be directed to that third party&apos;s site. We strongly advise you to review the Privacy
          Policy of every site you visit.
        </p>

        <h2>Children&apos;s Privacy</h2>
        <p>
          Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable
          information from anyone under the age of 13. If you are a parent or guardian and you are aware that your
          child has provided us with personal information, please contact us.
        </p>

        <h2>Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
          Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date at the top of this Privacy Policy.
        </p>
        <p>
          You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy
          are effective when they are posted on this page.
        </p>

        <h2>Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us:</p>
        <ul>
          <li>
            By visiting our <a href="/contact">Contact Page</a>
          </li>
          <li>By email: privacy@painclinics.com</li>
        </ul>
      </div>
    </main>
  );
}
