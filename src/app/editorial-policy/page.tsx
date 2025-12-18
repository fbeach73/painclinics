import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editorial Policy | Pain Clinics",
  description:
    "Learn about Pain Clinics' editorial standards, information sources, verification process, and commitment to providing accurate pain management clinic information.",
};

export default function EditorialPolicyPage() {
  const lastUpdated = "December 18, 2025";

  return (
    <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto prose prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary">
        <h1>Editorial Policy</h1>
        <p className="lead text-foreground/70">Last updated: {lastUpdated}</p>

        <p>
          At Pain Clinics, we are committed to providing accurate, reliable, and
          up-to-date information about pain management clinics across the United
          States. This editorial policy outlines our standards and processes for
          maintaining the quality of our directory and content.
        </p>

        <h2>Our Standards</h2>
        <p>
          We hold ourselves to high standards of accuracy and integrity in all
          the information we publish:
        </p>
        <ul>
          <li>
            <strong>Accuracy:</strong> We strive to ensure all clinic
            information is accurate and current. This includes contact details,
            services offered, and operational information.
          </li>
          <li>
            <strong>Objectivity:</strong> We do not endorse or recommend
            specific clinics. Our goal is to provide comprehensive information
            that empowers users to make informed decisions.
          </li>
          <li>
            <strong>Transparency:</strong> We clearly distinguish between
            informational content and advertising. Sponsored listings and
            advertisements are always labeled as such.
          </li>
          <li>
            <strong>User Privacy:</strong> We respect user privacy and handle
            all personal information in accordance with our Privacy Policy.
          </li>
        </ul>

        <h2>Information Sources</h2>
        <p>
          Our clinic information is gathered from multiple reliable sources to
          ensure comprehensiveness and accuracy:
        </p>
        <ul>
          <li>
            <strong>Public Healthcare Databases:</strong> We reference official
            healthcare provider databases and registries maintained by
            government agencies and professional organizations.
          </li>
          <li>
            <strong>Clinic Websites:</strong> We review official clinic websites
            for services, contact information, and operational details.
          </li>
          <li>
            <strong>Direct Submissions:</strong> Clinics can submit their
            information directly through our submission process, which includes
            verification steps.
          </li>
          <li>
            <strong>Medical Directories:</strong> We cross-reference information
            with established medical and healthcare directories.
          </li>
          <li>
            <strong>User Feedback:</strong> Community members can report
            inaccuracies or outdated information, which we investigate and
            update as needed.
          </li>
        </ul>

        <h2>Verification Process</h2>
        <p>
          We employ a multi-step verification process to maintain information
          quality:
        </p>
        <ol>
          <li>
            <strong>Initial Review:</strong> All new clinic submissions undergo
            an initial review to verify basic information such as name, address,
            and contact details.
          </li>
          <li>
            <strong>Cross-Reference Check:</strong> Information is
            cross-referenced with multiple sources to confirm accuracy.
          </li>
          <li>
            <strong>Periodic Audits:</strong> We conduct regular audits of
            existing listings to identify and update outdated information.
          </li>
          <li>
            <strong>User Report Investigation:</strong> Reports of inaccurate
            information are investigated promptly, and corrections are made as
            necessary.
          </li>
        </ol>

        <h2>Updates and Corrections</h2>
        <p>We are committed to maintaining current and accurate information:</p>
        <ul>
          <li>
            <strong>Regular Updates:</strong> Our database is updated regularly
            to reflect changes in clinic information, including new clinics,
            closures, and operational changes.
          </li>
          <li>
            <strong>Correction Policy:</strong> When errors are identified, we
            prioritize making corrections promptly. Significant corrections are
            noted when appropriate.
          </li>
          <li>
            <strong>User Contributions:</strong> We encourage users to report
            inaccuracies through our <a href="/contact">Contact page</a>. All
            reports are reviewed and verified before changes are made.
          </li>
        </ul>

        <h2>Editorial Independence</h2>
        <p>
          Our editorial content and clinic listings are maintained
          independently:
        </p>
        <ul>
          <li>
            <strong>No Pay-for-Placement:</strong> Clinic placement in search
            results is based on relevance and user location, not payment.
            Enhanced listings are clearly marked but do not affect organic
            ranking.
          </li>
          <li>
            <strong>Separation of Advertising:</strong> Advertising and
            sponsored content are clearly distinguished from editorial content
            and clinic information.
          </li>
          <li>
            <strong>Unbiased Information:</strong> We do not allow advertisers
            or partners to influence our editorial content or the accuracy of
            clinic information.
          </li>
        </ul>

        <h2>Medical Content Disclaimer</h2>
        <p>
          While we strive to provide helpful information about pain management,
          it&apos;s important to note:
        </p>
        <ul>
          <li>
            Our content is for informational purposes only and does not
            constitute medical advice.
          </li>
          <li>
            We do not have access to your medical history and cannot provide
            personalized recommendations.
          </li>
          <li>
            Always consult with a qualified healthcare professional for medical
            advice and treatment decisions.
          </li>
          <li>
            Please review our full <a href="/medical-disclaimer">Medical Disclaimer</a> for more
            information.
          </li>
        </ul>

        <h2>Contact Us</h2>
        <p>
          If you have questions about our editorial policy, want to report
          inaccurate information, or have suggestions for improvement, please{" "}
          <a href="/contact">contact us</a>. We value feedback from our users
          and are committed to continuous improvement.
        </p>
      </div>
    </main>
  );
}
