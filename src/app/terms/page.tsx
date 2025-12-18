import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Pain Clinics",
  description:
    "Read the terms and conditions that govern your use of the Pain Clinics pain management clinic directory website.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "December 18, 2025";

  return (
    <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto prose prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary">
        <h1>Terms of Service</h1>
        <p className="text-foreground/70">Last updated: {lastUpdated}</p>

        <p>
          Please read these Terms of Service (&ldquo;Terms&rdquo;, &ldquo;Terms of Service&rdquo;) carefully before
          using the Pain Clinics website (the &ldquo;Service&rdquo;) operated by Pain Clinics (&ldquo;us&rdquo;,
          &ldquo;we&rdquo;, or &ldquo;our&rdquo;).
        </p>

        <h2>Acceptance of Terms</h2>
        <p>
          By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of
          the terms, then you may not access the Service.
        </p>

        <h2>Description of Service</h2>
        <p>
          Pain Clinics is a directory service that provides information about pain management clinics across the
          United States. Our Service is intended to help users find pain management healthcare providers in their
          area.
        </p>
        <p>
          <strong>Important:</strong> Our Service is for informational purposes only and does not constitute medical
          advice. Please see our <a href="/medical-disclaimer">Medical Disclaimer</a> for more information.
        </p>

        <h2>Use of Service</h2>
        <p>By using our Service, you agree to:</p>
        <ul>
          <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
          <li>Not use the Service in any way that violates any applicable federal, state, local, or international law</li>
          <li>Not attempt to gain unauthorized access to any portion of the Service or any systems or networks connected to the Service</li>
          <li>Not use any automated means to access the Service or collect any information from the Service</li>
          <li>Not interfere with or disrupt the Service or servers or networks connected to the Service</li>
        </ul>

        <h2>User Accounts</h2>
        <p>
          When you create an account with us, you must provide information that is accurate, complete, and current at
          all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of
          your account on our Service.
        </p>
        <p>
          You are responsible for safeguarding the password that you use to access the Service and for any activities
          or actions under your password. You agree not to disclose your password to any third party. You must notify
          us immediately upon becoming aware of any breach of security or unauthorized use of your account.
        </p>

        <h2>User Conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Post or transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
          <li>Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with a person or entity</li>
          <li>Post or transmit any unsolicited or unauthorized advertising, promotional materials, or spam</li>
          <li>Collect or store personal data about other users without their consent</li>
          <li>Submit false or misleading information about pain clinics or healthcare providers</li>
        </ul>

        <h2>Intellectual Property</h2>
        <p>
          The Service and its original content (excluding content provided by users), features, and functionality are
          and will remain the exclusive property of Pain Clinics and its licensors. The Service is protected by
          copyright, trademark, and other laws of both the United States and foreign countries.
        </p>
        <p>
          Our trademarks and trade dress may not be used in connection with any product or service without the prior
          written consent of Pain Clinics.
        </p>

        <h2>User Content</h2>
        <p>
          Our Service may allow you to submit, post, or display content such as clinic reviews or comments. You retain
          ownership of any intellectual property rights that you hold in that content.
        </p>
        <p>
          By submitting content to our Service, you grant us a worldwide, non-exclusive, royalty-free license to use,
          reproduce, modify, publish, and distribute such content in connection with the Service.
        </p>

        <h2>Third-Party Links</h2>
        <p>
          Our Service may contain links to third-party websites or services that are not owned or controlled by Pain
          Clinics. We have no control over, and assume no responsibility for, the content, privacy policies, or
          practices of any third-party websites or services.
        </p>
        <p>
          You acknowledge and agree that Pain Clinics shall not be responsible or liable, directly or indirectly, for
          any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any
          such content, goods, or services available on or through any such websites or services.
        </p>

        <h2>Disclaimer of Warranties</h2>
        <p>
          THE SERVICE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS, WITHOUT WARRANTIES
          OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
        </p>
        <p>
          Pain Clinics does not warrant that (a) the Service will function uninterrupted, secure, or available at any
          particular time or location; (b) any errors or defects will be corrected; (c) the Service is free of viruses
          or other harmful components; or (d) the results of using the Service will meet your requirements.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          IN NO EVENT SHALL PAIN CLINICS, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE
          LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT
          LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
        </p>
        <ul>
          <li>Your access to or use of or inability to access or use the Service</li>
          <li>Any conduct or content of any third party on the Service</li>
          <li>Any content obtained from the Service</li>
          <li>Unauthorized access, use, or alteration of your transmissions or content</li>
        </ul>

        <h2>Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless Pain Clinics and its licensees, licensors, employees,
          contractors, agents, officers, and directors from and against any and all claims, damages, obligations,
          losses, liabilities, costs, or debt, and expenses arising from your use of and access to the Service or your
          violation of any term of these Terms.
        </p>

        <h2>Termination</h2>
        <p>
          We may terminate or suspend your account and access to the Service immediately, without prior notice or
          liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </p>
        <p>
          Upon termination, your right to use the Service will immediately cease. If you wish to terminate your
          account, you may simply discontinue using the Service.
        </p>

        <h2>Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of the United States, without regard
          to its conflict of law provisions.
        </p>
        <p>
          Our failure to enforce any right or provision of these Terms will not be considered a waiver of those
          rights.
        </p>

        <h2>Changes to Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is
          material, we will try to provide at least 30 days&apos; notice prior to any new terms taking effect. What
          constitutes a material change will be determined at our sole discretion.
        </p>
        <p>
          By continuing to access or use our Service after those revisions become effective, you agree to be bound by
          the revised terms.
        </p>

        <h2>Contact Us</h2>
        <p>If you have any questions about these Terms, please contact us:</p>
        <ul>
          <li>
            By visiting our <a href="/contact">Contact Page</a>
          </li>
          <li>By email: legal@painclinics.com</li>
        </ul>
      </div>
    </main>
  );
}
