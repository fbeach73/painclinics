import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | Pain Clinics",
  description:
    "Learn about how Pain Clinics uses cookies and similar tracking technologies on our website to improve your browsing experience.",
};

export default function CookiePolicyPage() {
  const lastUpdated = "December 18, 2025";

  return (
    <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto prose prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary">
        <h1>Cookie Policy</h1>
        <p className="text-foreground/70">Last updated: {lastUpdated}</p>

        <p>
          This Cookie Policy explains how Pain Clinics (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) uses
          cookies and similar technologies to recognize you when you visit our website. It explains what these
          technologies are and why we use them, as well as your rights to control our use of them.
        </p>

        <h2>What Are Cookies?</h2>
        <p>
          Cookies are small data files that are placed on your computer or mobile device when you visit a website.
          Cookies are widely used by website owners to make their websites work, or to work more efficiently, as well as
          to provide reporting information.
        </p>
        <p>
          Cookies set by the website owner (in this case, Pain Clinics) are called &ldquo;first-party cookies.&rdquo;
          Cookies set by parties other than the website owner are called &ldquo;third-party cookies.&rdquo; Third-party
          cookies enable third-party features or functionality to be provided on or through the website (e.g., analytics,
          interactive content, and advertising).
        </p>

        <h2>How We Use Cookies</h2>
        <p>
          We use cookies for several reasons. Some cookies are required for technical reasons in order for our website
          to operate, and we refer to these as &ldquo;essential&rdquo; or &ldquo;strictly necessary&rdquo; cookies. Other
          cookies enable us to track and target the interests of our users to enhance the experience on our website.
          Third parties serve cookies through our website for analytics and other purposes.
        </p>

        <h2>Types of Cookies We Use</h2>
        <p>The specific types of cookies served through our website include:</p>

        <h3>Essential Cookies</h3>
        <p>
          These cookies are strictly necessary to provide you with services available through our website and to use
          some of its features, such as access to secure areas. Because these cookies are essential for the website to
          function, you cannot opt out of them.
        </p>
        <ul>
          <li>
            <strong>Session cookies:</strong> Used to maintain your session state across page requests
          </li>
          <li>
            <strong>Authentication cookies:</strong> Used to identify you when you log in to our website
          </li>
          <li>
            <strong>Security cookies:</strong> Used to support security features and detect malicious activity
          </li>
        </ul>

        <h3>Analytics and Performance Cookies</h3>
        <p>
          These cookies allow us to count visits and traffic sources so we can measure and improve the performance of
          our website. They help us to know which pages are the most and least popular and see how visitors move around
          the site. All information these cookies collect is aggregated and therefore anonymous.
        </p>
        <ul>
          <li>
            <strong>Google Analytics:</strong> Used to collect information about how visitors use our website, including
            number of visitors, pages visited, and time spent on each page
          </li>
        </ul>

        <h3>Functional Cookies</h3>
        <p>
          These cookies enable the website to provide enhanced functionality and personalization. They may be set by us
          or by third-party providers whose services we have added to our pages.
        </p>
        <ul>
          <li>
            <strong>Preference cookies:</strong> Used to remember your preferences, such as your preferred language or
            theme (light/dark mode)
          </li>
          <li>
            <strong>Location cookies:</strong> Used to remember your location preferences for finding nearby clinics
          </li>
        </ul>

        <h3>Targeting and Advertising Cookies</h3>
        <p>
          These cookies may be set through our site by our advertising partners. They may be used by those companies to
          build a profile of your interests and show you relevant advertisements on other sites.
        </p>

        <h2>Third-Party Cookies</h2>
        <p>
          In addition to our own cookies, we may also use various third-party cookies to report usage statistics of our
          website and deliver content, including:
        </p>
        <ul>
          <li>
            <strong>Google Analytics:</strong> For website usage analytics
          </li>
          <li>
            <strong>Google Maps:</strong> To display interactive maps of clinic locations
          </li>
          <li>
            <strong>Social media platforms:</strong> If you share content from our website on social media
          </li>
        </ul>

        <h2>Managing Cookies</h2>
        <p>
          Most web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your
          browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could
          affect certain features or services of our website.
        </p>

        <h3>Browser Controls</h3>
        <p>
          You can set or amend your web browser controls to accept or refuse cookies. How you do this will depend on the
          browser you use. Please consult your browser&apos;s help documentation for more information:
        </p>
        <ul>
          <li>
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
              Google Chrome
            </a>
          </li>
          <li>
            <a
              href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">
              Apple Safari
            </a>
          </li>
          <li>
            <a
              href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd"
              target="_blank"
              rel="noopener noreferrer"
            >
              Microsoft Edge
            </a>
          </li>
        </ul>

        <h3>Opt-Out Links</h3>
        <p>You can also opt out of certain third-party cookies directly:</p>
        <ul>
          <li>
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
              Google Analytics Opt-Out Browser Add-on
            </a>
          </li>
        </ul>

        <h2>Do Not Track</h2>
        <p>
          Some browsers include a &ldquo;Do Not Track&rdquo; (DNT) feature that signals to websites you visit that you
          do not want to be tracked. Our website does not currently respond to DNT signals because there is no industry
          standard for compliance. We will continue to monitor developments in this area.
        </p>

        <h2>Updates to This Policy</h2>
        <p>
          We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we
          use or for other operational, legal, or regulatory reasons. Please therefore revisit this Cookie Policy
          regularly to stay informed about our use of cookies and related technologies.
        </p>
        <p>The date at the top of this Cookie Policy indicates when it was last updated.</p>

        <h2>Contact Us</h2>
        <p>If you have any questions about our use of cookies or this Cookie Policy, please contact us:</p>
        <ul>
          <li>
            By visiting our <a href="/contact">Contact Page</a>
          </li>
          <li>By email: privacy@painclinics.com</li>
        </ul>

        <p>
          For more information about your privacy rights, please see our{" "}
          <a href="/privacy">Privacy Policy</a>.
        </p>
      </div>
    </main>
  );
}
