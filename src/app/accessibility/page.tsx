import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility Statement | Pain Clinics",
  description:
    "Pain Clinics is committed to ensuring digital accessibility for people with disabilities. Learn about our accessibility features and how to contact us with feedback.",
};

export default function AccessibilityPage() {
  const lastUpdated = "December 18, 2025";

  return (
    <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto prose prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary">
        <h1>Accessibility Statement</h1>
        <p className="text-foreground/70">Last updated: {lastUpdated}</p>

        <h2>Our Commitment</h2>
        <p>
          Pain Clinics is committed to ensuring digital accessibility for people with disabilities. We are continually
          improving the user experience for everyone and applying the relevant accessibility standards to ensure we
          provide equal access to all of our users.
        </p>
        <p>
          We believe that every person should have equal access to information about pain management resources and
          healthcare providers, regardless of their abilities or the assistive technologies they use.
        </p>

        <h2>Conformance Status</h2>
        <p>
          The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve
          accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and
          Level AAA.
        </p>
        <p>
          Pain Clinics strives to conform to <strong>WCAG 2.1 Level AA</strong>. We are working toward achieving this
          standard and are committed to maintaining and improving accessibility across our website.
        </p>

        <h2>Accessibility Features</h2>
        <p>
          We have implemented the following accessibility features on our website to make it easier for all users to
          navigate and interact with our content:
        </p>

        <h3>Navigation and Structure</h3>
        <ul>
          <li>
            <strong>Semantic HTML:</strong> We use proper HTML elements (headings, lists, landmarks) to provide a
            logical document structure
          </li>
          <li>
            <strong>Skip Navigation:</strong> A &ldquo;Skip to main content&rdquo; link is provided to bypass repetitive
            navigation
          </li>
          <li>
            <strong>Consistent Navigation:</strong> Navigation menus are consistent across all pages
          </li>
          <li>
            <strong>Breadcrumbs:</strong> Breadcrumb navigation helps users understand their location within the site
          </li>
        </ul>

        <h3>Visual Design</h3>
        <ul>
          <li>
            <strong>Color Contrast:</strong> Text and interactive elements meet WCAG 2.1 Level AA contrast requirements
          </li>
          <li>
            <strong>Dark Mode:</strong> A dark color scheme is available for users who prefer reduced light
          </li>
          <li>
            <strong>Responsive Design:</strong> Our website adapts to different screen sizes and orientations
          </li>
          <li>
            <strong>Resizable Text:</strong> Text can be resized up to 200% without loss of content or functionality
          </li>
        </ul>

        <h3>Keyboard Accessibility</h3>
        <ul>
          <li>
            <strong>Full Keyboard Navigation:</strong> All interactive elements can be accessed using a keyboard
          </li>
          <li>
            <strong>Visible Focus Indicators:</strong> Focus states are clearly visible when navigating with a keyboard
          </li>
          <li>
            <strong>Logical Tab Order:</strong> Tab order follows a logical sequence through the page
          </li>
        </ul>

        <h3>Images and Media</h3>
        <ul>
          <li>
            <strong>Alternative Text:</strong> All meaningful images include descriptive alternative text
          </li>
          <li>
            <strong>Decorative Images:</strong> Decorative images are marked appropriately to be ignored by screen
            readers
          </li>
        </ul>

        <h3>Forms and Interactive Elements</h3>
        <ul>
          <li>
            <strong>Form Labels:</strong> All form fields have associated labels
          </li>
          <li>
            <strong>Error Identification:</strong> Form errors are clearly identified and described to the user
          </li>
          <li>
            <strong>Input Assistance:</strong> Instructions and cues are provided where needed
          </li>
        </ul>

        <h2>Assistive Technology Compatibility</h2>
        <p>Our website is designed to be compatible with the following assistive technologies:</p>
        <ul>
          <li>Screen readers (NVDA, JAWS, VoiceOver, TalkBack)</li>
          <li>Screen magnification software</li>
          <li>Speech recognition software</li>
          <li>Keyboard-only navigation</li>
        </ul>

        <h2>Known Limitations</h2>
        <p>
          While we strive to ensure accessibility of our website, some content may have limitations:
        </p>
        <ul>
          <li>
            <strong>Third-Party Content:</strong> Some content provided by third parties (such as embedded maps or social
            media widgets) may not be fully accessible
          </li>
          <li>
            <strong>Legacy Content:</strong> Some older content may not yet meet all accessibility standards and is being
            updated
          </li>
          <li>
            <strong>PDF Documents:</strong> Some PDF documents may not be fully accessible; we are working to provide
            accessible alternatives
          </li>
        </ul>

        <h2>Feedback and Contact</h2>
        <p>
          We welcome your feedback on the accessibility of Pain Clinics. If you encounter accessibility barriers or have
          suggestions for improvement, please let us know:
        </p>
        <ul>
          <li>
            <strong>Email:</strong> accessibility@painclinics.com
          </li>
          <li>
            <strong>Contact Form:</strong> <a href="/contact">Contact Us Page</a>
          </li>
        </ul>
        <p>
          When contacting us about accessibility issues, please include:
        </p>
        <ul>
          <li>The web page URL where you encountered the issue</li>
          <li>A description of the accessibility problem</li>
          <li>The assistive technology you were using (if applicable)</li>
          <li>Your contact information so we can follow up</li>
        </ul>
        <p>
          We aim to respond to accessibility feedback within 5 business days and will work to address any issues as
          quickly as possible.
        </p>

        <h2>Continuous Improvement</h2>
        <p>
          Accessibility is an ongoing effort. We are committed to:
        </p>
        <ul>
          <li>Regular accessibility audits and testing</li>
          <li>Training our team on accessibility best practices</li>
          <li>Incorporating accessibility into our design and development processes</li>
          <li>Addressing accessibility issues promptly</li>
        </ul>

        <h2>Additional Resources</h2>
        <p>For more information about web accessibility, please visit:</p>
        <ul>
          <li>
            <a href="https://www.w3.org/WAI/" target="_blank" rel="noopener noreferrer">
              W3C Web Accessibility Initiative (WAI)
            </a>
          </li>
          <li>
            <a href="https://www.ada.gov/" target="_blank" rel="noopener noreferrer">
              ADA.gov - Americans with Disabilities Act
            </a>
          </li>
        </ul>
      </div>
    </main>
  );
}
