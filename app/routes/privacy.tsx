import * as React from "react";
import { KimuLogo } from "../components/ui/KimuLogo";
import { Link } from "react-router";
import {
  ArrowLeft,
  FileText,
  Calendar,
} from "lucide-react";

export default function Privacy() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/10 sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <KimuLogo className="w-6 h-6 text-foreground" />
              <span className="font-medium text-foreground">Privacy Policy</span>
            </Link>
            <Link 
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </div>
      </header>

      {/* Document Container */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Document Header */}
        <div className="text-center mb-12 pb-8 border-b border-border/20">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="w-6 h-6 text-muted-foreground" />
            <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Legal Document</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Effective Date: {lastUpdated}</span>
            </div>
            <div className="w-1 h-1 bg-current rounded-full opacity-50"></div>
            <span>Version 2.0</span>
          </div>
        </div>

        {/* Document Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="space-y-8 text-foreground leading-relaxed">
            
            {/* Preamble */}
            <section className="bg-muted/5 border-l-4 border-blue-500 pl-6 py-4">
              <p className="text-base m-0">
                <strong>Kimu</strong> ("we," "our," or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our video editing application and related services.
              </p>
            </section>

            {/* 1. Information Collection */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                Information We Collect
              </h2>
              
              <div className="space-y-4 ml-11">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">1.1 Personal Information</h3>
                  <p className="text-muted-foreground mb-3">When you create an account, we collect:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>(a) Email address for account authentication;</li>
                    <li>(b) Profile information from OAuth providers (if applicable);</li>
                    <li>(c) Account preferences and settings.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">1.2 Video Content</h3>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Important:</strong> All video files and project data are processed 
                    locally on your device. We do not upload, store, or have access to your video content.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Data Processing */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                How We Process Your Data
              </h2>
              
              <div className="space-y-4 ml-11">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">2.1 Local Processing</h3>
                  <p className="text-muted-foreground">
                    All video editing, rendering, and processing occurs locally in your browser using 
                    WebAssembly technology. Your video data never leaves your device.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">2.2 Account Management</h3>
                  <p className="text-muted-foreground">
                    We use your email address solely for account authentication, password recovery, 
                    and important service notifications.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Data Storage */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                Data Storage and Security
              </h2>
              
              <div className="space-y-4 ml-11">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">3.1 Local Storage</h3>
                  <p className="text-muted-foreground">
                    Project files, video assets, and editing history are stored locally in your browser's 
                    IndexedDB. This data remains under your complete control.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">3.2 Security Measures</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>(a) All server communications use HTTPS encryption;</li>
                    <li>(b) Account data is stored with industry-standard security practices;</li>
                    <li>(c) Regular security audits and updates.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 4. Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                Third-Party Services
              </h2>
              
              <div className="space-y-4 ml-11">
                <p className="text-muted-foreground mb-4">We integrate with the following services:</p>
                
                <div className="space-y-3">
                  <div className="border border-border/20 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground">Google OAuth</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Purpose: Secure authentication<br/>
                      Data Shared: Email address and basic profile information
                    </p>
                  </div>
                  
                  <div className="border border-border/20 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground">Supabase</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Purpose: User authentication and account management<br/>
                      Data Shared: Email address and authentication tokens
                    </p>
                  </div>
                  
                  <div className="border border-border/20 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground">Vercel Analytics</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Purpose: Anonymous usage analytics<br/>
                      Data Shared: Page views and feature usage (no personal data)
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-cyan-500/10 text-cyan-500 rounded-full flex items-center justify-center text-sm font-bold">5</span>
                Your Privacy Rights
              </h2>
              
              <div className="space-y-4 ml-11">
                <p className="text-muted-foreground mb-4">You have the following rights regarding your data:</p>
                
                <div className="grid gap-3">
                  <div className="flex gap-3">
                    <span className="text-cyan-500 font-bold">5.1</span>
                    <div>
                      <strong className="text-foreground">Right of Access:</strong>
                      <span className="text-muted-foreground"> Request a copy of your personal data</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-cyan-500 font-bold">5.2</span>
                    <div>
                      <strong className="text-foreground">Right of Rectification:</strong>
                      <span className="text-muted-foreground"> Correct any inaccurate information</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-cyan-500 font-bold">5.3</span>
                    <div>
                      <strong className="text-foreground">Right of Erasure:</strong>
                      <span className="text-muted-foreground"> Request deletion of your account and data</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-cyan-500 font-bold">5.4</span>
                    <div>
                      <strong className="text-foreground">Right of Portability:</strong>
                      <span className="text-muted-foreground"> Export your data in a machine-readable format</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center text-sm font-bold">6</span>
                Contact Information
              </h2>
              
              <div className="space-y-4 ml-11">
                <p className="text-muted-foreground mb-4">
                  For questions regarding this Privacy Policy or to exercise your rights, contact us:
                </p>
                
                <div className="bg-muted/10 border border-border/20 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <div><strong className="text-foreground">Email:</strong> <a href="mailto:privacy@kimu.app" className="text-blue-500 hover:text-blue-600">privacy@kimu.app</a></div>
                    <div><strong className="text-foreground">Response Time:</strong> <span className="text-muted-foreground">Within 30 days</span></div>
                  </div>
                </div>
              </div>
            </section>

            {/* 7. Updates */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center text-sm font-bold">7</span>
                Policy Updates
              </h2>
              
              <div className="space-y-4 ml-11">
                <p className="text-muted-foreground">
                  We may update this Privacy Policy periodically. Material changes will be communicated 
                  via email notification. Continued use of our service after updates constitutes acceptance 
                  of the revised policy.
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Document Footer */}
        <div className="mt-16 pt-8 border-t border-border/20">
          <div className="bg-muted/5 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              This document was last updated on <strong className="text-foreground">{lastUpdated}</strong>
            </p>
            <Link 
              to="/"
              className="inline-block px-6 py-2 bg-foreground text-background hover:bg-foreground/90 rounded-md transition-colors text-sm"
            >
              Return to Kimu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 