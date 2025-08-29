import * as React from "react";
import {
  FileText,
  Calendar,
  ShieldCheck,
  Lock,
  Server,
  Database,
  Cloud,
  KeyRound,
  BarChart3,
  Users,
  Download,
  Trash2,
  Github,
} from "lucide-react";
import { KimuLogo } from "~/components/ui/KimuLogo";
import { GlowingEffect } from "~/components/ui/glowing-effect";

export default function Privacy() {
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
            <FileText className="w-3.5 h-3.5" /> Privacy & Data Transparency
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Your data. Your rules.
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Crystal-clear privacy with open-source transparency and explicit
            data boundaries.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Updated {lastUpdated}
            </span>
            <span className="w-1 h-1 rounded-full bg-current/60" />
            <span>Version 2.0</span>
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

          {/* Document Header */}
          <div className="text-center mb-10 pb-6 border-b border-border/20">
            <div className="flex items-center justify-center gap-3 mb-2">
              <KimuLogo className="w-6 h-6 text-foreground" />
              <span className="text-sm font-semibold tracking-tight">
                Kimu Privacy Policy
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              How we handle your data
            </h2>
            <div className="mt-4 mx-auto max-w-3xl rounded-lg border border-border/30 bg-muted/5 px-4 py-3 text-xs font-mono text-muted-foreground text-left">
              Kimu ("we," "our," or "us") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our video
              editing application and related services.
            </div>
          </div>

          {/* Document Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="space-y-8 text-foreground leading-relaxed">
              {/* 1. Applicability */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">
                  1. Applicability & Consent
                </h2>
                <div className="space-y-2 ml-8">
                  <p className="text-sm text-muted-foreground">
                    This Privacy Policy applies to our online services and is
                    valid for visitors and users of our website and web editor
                    with regards to information that they share with and/or
                    collect in Kimu. This policy does not apply to information
                    collected offline or via channels other than this website
                    and app.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    By using our website or editor, you hereby consent to this
                    Privacy Policy and agree to its terms. If you have
                    additional questions or require more information, contact
                    us.
                  </p>
                </div>
              </section>

              {/* 2. Information Collection */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">
                  2. Information We Collect
                </h2>
                <div className="space-y-6 ml-11">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      2.1 Personal Information
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      We collect the minimum required, and it will be clear at
                      the point of collection:
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-6 list-disc">
                      <li>Email address (for account access)</li>
                      <li>Profile info from Google OAuth</li>
                      <li>Preferences and settings stored in Supabase</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      2.2 Video Content
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Projects can be <strong>local</strong> or{" "}
                      <strong>cloud</strong>:
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-6 list-disc">
                      <li>
                        Local projects keep media on your device (IndexedDB /
                        disk).
                      </li>
                      <li>
                        Cloud projects store media securely on our Hetzner VPS
                        for collaboration and access.
                      </li>
                      <li>
                        Project metadata (names, timelines, settings) is stored
                        in Supabase.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      2.3 Additional Details You May Provide
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      If you contact us directly, we may receive your name,
                      email, phone number, and message contents. During account
                      registration or billing, we may request optional details
                      like company name or address.
                    </p>
                  </div>
                </div>
              </section>

              {/* 3. Data Processing */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">
                  3. How We Process Your Data
                </h2>
                <div className="space-y-6 ml-11">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      3.1 Local Processing
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Editing and preview are real-time in your browser. For
                      local projects, media never leaves your device.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      3.2 Account Management
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      We use your email address solely for account
                      authentication, password recovery, and important service
                      notifications.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      3.3 Cloud Collaboration
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Cloud projects are required for multiplayer. Assets are
                      stored securely and only accessible to members granted
                      access.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      3.4 How We Use Information
                    </h3>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-6 list-disc">
                      <li>Provide, operate, and maintain the service</li>
                      <li>Improve and expand features</li>
                      <li>Understand and analyze aggregated usage</li>
                      <li>Develop new functionality</li>
                      <li>Send account-related emails</li>
                      <li>Prevent fraud and abuse</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* 4. Data Storage */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">
                  4. Data Storage and Security
                </h2>
                <div className="space-y-6 ml-11">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      4.1 Local Storage
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Project files, video assets, and editing history are
                      stored locally in your browser's IndexedDB. This data
                      remains under your control.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      4.2 Security Measures
                    </h3>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-6 list-disc">
                      <li>All server communications use HTTPS</li>
                      <li>Account data stored with industry best practices</li>
                      <li>Regular security audits and updates</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      4.3 Enforcement & Safety
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Uploads are private and secure. Assets violating Terms of
                      Service may be removed and accounts suspended.
                    </p>
                  </div>
                </div>
              </section>

              {/* 5. Third-Party Services */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">
                  5. Third-Party Services
                </h2>
                <div className="grid md:grid-cols-4 gap-3 mb-10 ml-6">
                  <div className="relative rounded-lg border border-border/30 bg-muted/5 p-4">
                    <GlowingEffect
                      disabled={false}
                      spread={28}
                      proximity={48}
                      glow
                      borderWidth={1}
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <Server className="w-4 h-4 text-foreground/80" />
                      <span className="text-sm font-semibold">Hetzner VPS</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Secure hosting for services and media storage.
                    </p>
                  </div>
                  <div className="relative rounded-lg border border-border/30 bg-muted/5 p-4">
                    <GlowingEffect
                      disabled={false}
                      spread={28}
                      proximity={48}
                      glow
                      borderWidth={1}
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <KeyRound className="w-4 h-4 text-foreground/80" />
                      <span className="text-sm font-semibold">
                        Google OAuth
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sign-in only. We receive your email and profile if you
                      consent.
                    </p>
                  </div>
                  <div className="relative rounded-lg border border-border/30 bg-muted/5 p-4">
                    <GlowingEffect
                      disabled={false}
                      spread={28}
                      proximity={48}
                      glow
                      borderWidth={1}
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="w-4 h-4 text-foreground/80" />
                      <span className="text-sm font-semibold">Supabase</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Stores account preferences and project metadata.
                    </p>
                  </div>
                  <div className="relative rounded-lg border border-border/30 bg-muted/5 p-4">
                    <GlowingEffect
                      disabled={false}
                      spread={28}
                      proximity={48}
                      glow
                      borderWidth={1}
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="w-4 h-4 text-foreground/80" />
                      <span className="text-sm font-semibold">
                        Umami Analytics
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cookie-less, privacy-friendly usage analytics.
                    </p>
                  </div>
                </div>
              </section>

              {/* 6. Your Rights */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">
                  6. Your Privacy Rights
                </h2>
                <div className="space-y-4 ml-8 text-sm text-muted-foreground">
                  <p>You have complete control over your data. You can:</p>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>
                      <strong className="text-foreground">
                        Delete your account
                      </strong>
                      : remove your account and all associated data anytime.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Export your data
                      </strong>
                      : download your projects in a portable format.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Clear local storage
                      </strong>
                      : remove all locally saved projects.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Talk to a human
                      </strong>
                      : contact us anytime with privacy concerns.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Open Source */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">
                  7. Open-Source Transparency
                </h2>
                <div className="space-y-4 ml-11">
                  <p className="text-muted-foreground">
                    Kimu is open-source. Inspect how data flows, audit changes,
                    or contribute. We practice transparent engineering:
                  </p>
                  <ul className="list-disc ml-6 text-muted-foreground space-y-1">
                    <li>Public repo, issues, and pull requests</li>
                    <li>Changelogs and release notes</li>
                    <li>Incident reports for privacy/security events</li>
                  </ul>
                  <a
                    href="https://github.com/trykimu/videoeditor"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md border border-border/40 hover:bg-muted/10"
                  >
                    <Github className="w-4 h-4" />
                    <span className="font-medium">View source on GitHub</span>
                  </a>
                </div>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">8. Contact</h2>
                <div className="space-y-3 ml-11">
                  <p className="text-sm text-muted-foreground">
                    Have questions or requests? Create a ticket in our Discord
                    or email us.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="https://discord.com/invite/GSknuxubZK"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs px-3 py-1.5 rounded-md border border-border/30 hover:bg-muted/20"
                    >
                      Open Discord
                    </a>
                    <a
                      href="mailto:privacy@trykimu.com"
                      className="text-xs px-3 py-1.5 rounded-md border border-border/30 hover:bg-muted/20"
                    >
                      privacy@trykimu.com
                    </a>
                  </div>
                </div>
              </section>

              {/* Updates */}
              <section>
                <h2 className="text-2xl font-bold mb-4 pl-2">
                  9. Privacy Policy Changes
                </h2>

                <div className="space-y-4 ml-11">
                  <p className="text-sm text-muted-foreground">
                    We may update this Privacy Policy from time to time. When we
                    do, we will publish an updated version and effective date at
                    the top of this page, unless another type of notice is
                    legally required. Your continued use of Kimu after any
                    change in this Privacy Policy will constitute your
                    acceptance of such change.
                  </p>
                </div>
              </section>
            </div>
          </div>

          {/* Document Footer */}
          <div className="mt-16 pt-6 border-t border-border/20 flex items-center justify-between text-xs md:text-sm">
            <div>
              <span className="uppercase tracking-wider text-muted-foreground">
                Last updated
              </span>{" "}
              <span className="font-medium">{lastUpdated}</span>
            </div>
            <a
              href="/"
              className="inline-flex items-center gap-2 hover:underline font-medium"
              title="Back to Kimu"
            >
              <KimuLogo className="w-4 h-4" /> Return to Kimu
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
