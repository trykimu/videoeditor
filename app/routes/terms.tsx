import * as React from "react";
import { Calendar } from "lucide-react";
import { KimuLogo } from "~/components/ui/KimuLogo";
import { GlowingEffect } from "~/components/ui/glowing-effect";

export default function Terms() {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-foreground pt-20">
      {/* Hero / Masthead */}
      <div className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 right-1/4 w-[40rem] h-[40rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.22),transparent_60%)] blur-3xl" />
          <div className="absolute -bottom-32 left-1/4 w-[40rem] h-[40rem] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.18),transparent_60%)] blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto px-6 pt-10 pb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/30 text-xs text-muted-foreground mb-4">
            Terms of Service
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Kimu Terms of Service
          </h1>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Effective {lastUpdated}
            </span>
            <span className="w-1 h-1 rounded-full bg-current/60" />
            <span>Version 1.0</span>
          </div>
        </div>
      </div>

      {/* Document Container */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="relative rounded-2xl border border-border/30 bg-background/80 shadow-2xl p-6 md:p-10">
          <GlowingEffect
            disabled={false}
            spread={44}
            proximity={72}
            glow
            borderWidth={1}
            hoverBorderWidth={3}
          />

          {/* Document Header Preamble */}
          <div className="text-left mb-8 pb-6 border-b border-border/20">
            <div className="flex items-center justify-center gap-3 mb-3">
              <KimuLogo className="w-6 h-6 text-foreground" />
              <span className="text-sm font-semibold tracking-tight">Kimu</span>
            </div>
            <div className="mx-auto max-w-3xl rounded-lg border border-border/30 bg-muted/5 px-4 py-3 text-xs font-mono text-muted-foreground">
              These Terms of Service ("Terms") govern your access to and use of Kimu — a web‑based video editor with AI features and optional cloud storage and collaboration. By creating an account or using Kimu, you agree to these Terms.
            </div>
          </div>

          {/* Document Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="space-y-8 text-foreground leading-relaxed">
              {/* 1. Acceptance */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">1. Acceptance of Terms</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <p>By accessing or using Kimu, you accept these Terms and our Privacy Policy. If you don’t agree, do not use Kimu.</p>
                  <p>Where required by law, additional terms may apply (e.g., consumer rights). If there is a conflict, the more protective mandatory terms prevail.</p>
                </div>
              </section>

              {/* 2. Eligibility & Accounts */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">2. Eligibility & Accounts</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <ul className="list-disc ml-6 space-y-1">
                    <li>You must be at least 13 years old (or the minimum age in your country) to use Kimu.</li>
                    <li>You are responsible for your account credentials and for all activity under your account.</li>
                    <li>We may require identity checks for abuse prevention, fraud, or legal compliance.</li>
                  </ul>
                </div>
              </section>

              {/* 3. Service Description */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">3. Service Description</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <p>Kimu provides a browser‑based non‑linear video editor, AI‑assisted features (e.g., cuts, captions, titles, effects, transitions), and optional cloud projects for storage and collaboration. Features may vary by plan and region, and may evolve over time.</p>
                  <p>AI features may rely on third‑party model providers. Outputs can be inaccurate or unsafe if misused. You are responsible for reviewing AI outputs before use or publication.</p>
                </div>
              </section>

              {/* 4. Your Content & Ownership */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">4. Your Content & Ownership</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <p>You retain ownership of the videos, audio, images, text, and other content you upload or create in Kimu ("User Content").</p>
                  <p>To operate Kimu, you grant us a limited, worldwide, non‑exclusive license to host, cache, process, transmit, render, and display your User Content solely to provide and improve the service, including generating previews, thumbnails, and AI outputs requested by you.</p>
                  <p>You represent that you have all necessary rights to your User Content and that it does not violate applicable law or third‑party rights (including publicity, privacy, copyright, or trademark).</p>
                </div>
              </section>

              {/* 5. License to Kimu; Feedback */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">5. License to Kimu; Feedback</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <p>We may reproduce and use de‑identified, aggregated metrics for analytics, performance, and reliability purposes. If you provide suggestions or feedback, you grant Kimu a perpetual, irrevocable, royalty‑free license to use it without restriction.</p>
                </div>
              </section>

              {/* 6. AI Features & Model Providers */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">6. AI Features & Model Providers</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Some features send prompts and/or snippets of User Content to third‑party AI providers to fulfill your request.</li>
                    <li>Outputs are provided “as is” and may contain errors. Review AI outputs before use. Do not rely on AI for safety‑critical or legal decisions.</li>
                    <li>You must comply with any additional usage rules required by model providers. We may throttle or disable AI features to protect service quality.</li>
                  </ul>
                </div>
              </section>

              {/* 7. Cloud Projects & Storage */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">7. Cloud Projects & Storage</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Cloud projects are stored on secure infrastructure with access controls. Storage limits, rates, and performance may apply.</li>
                    <li>Project sharing grants access to invited collaborators according to permissions you choose. You are responsible for whom you invite.</li>
                    <li>Deleted projects may be temporarily recoverable from backups. We may permanently delete data after a retention window or upon account closure.</li>
                  </ul>
                </div>
              </section>

              {/* 8. Acceptable Use */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">8. Acceptable Use</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <ul className="list-disc ml-6 space-y-1">
                    <li>No illegal content or activity, including IP infringement, harassment, exploitation, or privacy violations.</li>
                    <li>No malware, bots that harm service integrity, excessive load, scraping that circumvents rate limits, or attempts to reverse engineer the service.</li>
                    <li>No uploading of content that is sexually exploitative, hateful, violent, or otherwise violates these Terms or applicable laws.</li>
                  </ul>
                </div>
              </section>

              {/* 9. Payments & Plans */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">9. Payments & Plans</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <p>Some features may require a paid plan. Prices, features, and billing periods will be presented at checkout. Unless stated otherwise, subscriptions renew automatically until canceled. Taxes may apply.</p>
                </div>
              </section>

              {/* 10. Termination & Suspension */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">10. Termination & Suspension</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <ul className="list-disc ml-6 space-y-1">
                    <li>We may suspend or terminate your access to the hosted service at any time, with or without cause, including for violations of these Terms, risk, abuse, or legal compliance.</li>
                    <li>Upon termination, your license to access the hosted service ends. We may provide a reasonable window to export projects where feasible.</li>
                    <li>Self‑hosted or open‑source use (if available) is governed by the applicable open‑source licenses and is separate from hosted access.</li>
                  </ul>
                </div>
              </section>

              {/* 11. Availability; Changes; Beta */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">11. Availability, Changes & Beta Features</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <p>We may modify, suspend, or discontinue any feature at any time. Beta or experimental features are provided “as is,” may be throttled, and can be removed without notice.</p>
                </div>
              </section>

              {/* 12. Intellectual Property */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">12. Intellectual Property</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <p>Kimu, including its UI, code, and design elements, is owned by us or our licensors and is protected by intellectual property laws. Except for rights expressly granted, no rights are transferred to you.</p>
                </div>
              </section>

              {/* 13. Third‑Party Services */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">13. Third‑Party Services</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <p>Kimu may integrate or link to third‑party services (e.g., storage, hosting, analytics, AI providers). Your use of those services is subject to their terms and privacy policies. We are not responsible for third‑party services.</p>
                </div>
              </section>

              {/* 14. Disclaimers */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">14. Disclaimers</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <p>Kimu is provided on an “as is” and “as available” basis without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non‑infringement. We do not guarantee uninterrupted or error‑free operation, or that defects will be corrected.</p>
                </div>
              </section>

              {/* 15. Limitation of Liability */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">15. Limitation of Liability</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <p>To the maximum extent permitted by law, Kimu and its affiliates will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, data, or goodwill. Our total liability for any claim relating to the service will not exceed the amounts you paid to us for the service in the 12 months before the claim (or $50 if you did not pay).</p>
                </div>
              </section>

              {/* 16. Indemnification */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">16. Indemnification</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <p>You agree to indemnify and hold Kimu harmless from any claims, damages, liabilities, and expenses (including reasonable attorney fees) arising from your use of Kimu, your User Content, or your violation of these Terms or applicable law.</p>
                </div>
              </section>

              {/* 17. Governing Law & Disputes */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">17. Governing Law & Dispute Resolution</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <p>These Terms are governed by the laws applicable in the place where Kimu is organized and operates, without regard to conflict‑of‑laws rules. Where required, mandatory consumer protection laws in your country of residence remain unaffected. Courts in that jurisdiction will have exclusive jurisdiction, unless applicable law provides otherwise.</p>
                </div>
              </section>

              {/* 18. Changes to Terms */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">18. Changes to These Terms</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <p>We may update these Terms from time to time. When we do, we will post an updated version and effective date. Your continued use of Kimu after changes become effective constitutes acceptance.</p>
                </div>
              </section>

              {/* 19. Contact */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">19. Contact</h2>
                <div className="space-y-2 ml-8 text-sm text-muted-foreground">
                  <p>Questions? Contact us at <a href="mailto:hello@trykimu.com" className="underline">hello@trykimu.com</a> or via Discord.</p>
                </div>
              </section>
            </div>
          </div>

          {/* Document Footer */}
          <div className="mt-16 pt-6 border-t border-border/20 flex items-center justify-between text-xs md:text-sm">
            <div>
              <span className="uppercase tracking-wider text-muted-foreground">Last updated</span>{" "}
              <span className="font-medium">{lastUpdated}</span>
            </div>
            <a href="/" className="inline-flex items-center gap-2 hover:underline font-medium" title="Back to Kimu">
              <KimuLogo className="w-4 h-4" /> Return to Kimu
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}