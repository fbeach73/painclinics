import { AlertTriangle } from "lucide-react";
import { Metadata } from "next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Medical Disclaimer | Pain Clinics",
  description:
    "Important medical disclaimer for Pain Clinics. Our directory provides informational resources only and does not constitute medical advice.",
};

export default function MedicalDisclaimerPage() {
  const lastUpdated = "December 18, 2025";

  return (
    <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Medical Disclaimer</h1>
          <p className="text-foreground/70">Last updated: {lastUpdated}</p>
        </div>

        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Important Notice</AlertTitle>
          <AlertDescription>
            <p className="mt-2">
              The information provided on Pain Clinics is for general informational purposes only and is not intended
              to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of
              your physician or other qualified health provider with any questions you may have regarding a medical
              condition.
            </p>
          </AlertDescription>
        </Alert>

        <div className="prose prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary">
          <h2>Not Medical Advice</h2>
          <p>
            Pain Clinics is a directory service designed to help users locate pain management clinics and healthcare
            providers. The content on this website, including text, graphics, images, and other material, is for
            informational purposes only.
          </p>
          <p>
            <strong>The information on this site should not be used to:</strong>
          </p>
          <ul>
            <li>Diagnose or treat any health problem or disease</li>
            <li>Prescribe any medication or other treatment</li>
            <li>Replace the advice of a qualified healthcare professional</li>
            <li>Make decisions about your health without consulting a medical professional</li>
          </ul>

          <h2>Consult Healthcare Professionals</h2>
          <p>
            Never disregard professional medical advice or delay in seeking it because of something you have read on
            this website. If you think you may have a medical emergency, call your doctor, go to the emergency
            department, or call 911 immediately.
          </p>
          <p>
            Pain management is a complex medical field that requires proper evaluation and treatment by qualified
            healthcare professionals. Treatment plans should be individualized based on your specific condition,
            medical history, and needs.
          </p>

          <h2>No Doctor-Patient Relationship</h2>
          <p>
            The use of this website does not create a doctor-patient relationship between you and Pain Clinics or any
            of the clinics listed in our directory. The information provided on this site is not a substitute for the
            relationship you have with your physician or other healthcare provider.
          </p>
          <p>
            We do not recommend or endorse any specific clinics, physicians, tests, products, procedures, opinions, or
            other information that may be mentioned on this website. Reliance on any information provided by Pain
            Clinics is solely at your own risk.
          </p>

          <h2>Information Accuracy</h2>
          <p>
            While we strive to provide accurate and up-to-date information about pain management clinics, we make no
            representations or warranties of any kind, express or implied, about the completeness, accuracy,
            reliability, suitability, or availability of the information, products, services, or related graphics
            contained on this website.
          </p>
          <p>Clinic information may change without notice. We recommend:</p>
          <ul>
            <li>Verifying clinic hours, locations, and services directly with the provider</li>
            <li>Confirming insurance acceptance and payment options before scheduling</li>
            <li>Checking provider credentials and certifications independently</li>
            <li>Reading reviews from multiple sources</li>
          </ul>

          <h2>Emergency Situations</h2>
          <Alert variant="destructive" className="my-6 not-prose">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-semibold">Medical Emergency Warning</AlertTitle>
            <AlertDescription>
              <p className="mt-2">
                If you are experiencing a medical emergency, chest pain, difficulty breathing, severe pain, or any
                condition that you believe requires immediate medical attention, please call <strong>911</strong> or go
                to your nearest emergency room immediately.
              </p>
              <p className="mt-2">
                Do not use this website to seek emergency medical care.
              </p>
            </AlertDescription>
          </Alert>

          <h2>Third-Party Information</h2>
          <p>
            This website may contain links to external websites and references to third-party content. These links and
            references are provided for convenience and informational purposes only. We do not endorse, guarantee, or
            assume responsibility for the accuracy or reliability of any information offered by third-party websites.
          </p>

          <h2>Professional Opinions</h2>
          <p>
            Any professional opinions expressed on this website are the views of the individual authors and do not
            necessarily represent the opinions of Pain Clinics. We do not endorse any specific treatments, medications,
            or procedures mentioned on this site.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            In no event will Pain Clinics be liable for any loss or damage including without limitation, indirect or
            consequential loss or damage, or any loss or damage whatsoever arising from the use of, or reliance on,
            information obtained through this website.
          </p>

          <h2>Your Responsibility</h2>
          <p>By using this website, you acknowledge and agree that:</p>
          <ul>
            <li>You are responsible for your own health care decisions</li>
            <li>You will consult with qualified healthcare professionals before making medical decisions</li>
            <li>You will verify any clinic information before relying on it</li>
            <li>You understand this website is not a substitute for professional medical care</li>
          </ul>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Medical Disclaimer, please contact us through our{" "}
            <a href="/contact">Contact Page</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
