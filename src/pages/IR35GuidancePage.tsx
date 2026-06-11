import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

const IR35GuidancePage: React.FC = () => (
  <div className="min-h-screen bg-gray-50 py-16">
    <div className="container mx-auto px-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#0B2D59] rounded-xl flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">IR35 Guidance</span>
        </div>
        <h1 className="text-3xl font-bold text-[#0B2D59] mb-3">Understanding IR35 on Collabov</h1>
        <p className="text-gray-600 text-lg leading-relaxed">A plain-English guide to IR35 and what it means when you hire through Collabov.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800"><strong>This is guidance, not legal advice.</strong> IR35 determinations depend on the specific facts of each engagement. Always consult a qualified tax adviser or employment lawyer for determinations relevant to your situation.</p>
      </div>

      <div className="space-y-8 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-[#0B2D59] mb-3">What is IR35?</h2>
          <p>IR35 is UK tax legislation designed to identify workers who provide services through an intermediary (such as a limited company) but who would otherwise be considered employees of the end client. If a worker is "inside IR35", income tax and National Insurance Contributions must be deducted at source.</p>
          <p className="mt-3">The rules apply primarily to <strong>staff augmentation engagements</strong> — where an individual or team is placed to work alongside your employees. They do not generally apply to MSP or IT agency engagements where the vendor delivers a defined service or project outcome.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0B2D59] mb-3">Who is responsible?</h2>
          <p>Since April 2021, medium and large private-sector businesses (end clients) are responsible for determining IR35 status. This applies to all Collabov customers hiring through a staff augmentation engagement.</p>
          <p className="mt-3">Collabov's platform includes an IR35 Status Determination Statement (SDS) as part of every staff augmentation contract. The SDS is reviewed and stamped by a Collabov administrator before the engagement activates.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0B2D59] mb-3">The key IR35 tests</h2>
          <div className="space-y-3">
            {[
              { title: 'Personal service', desc: 'Can the worker send a substitute? If there is no right to substitute, this points inside IR35.' },
              { title: 'Control', desc: 'Does the end client control how, when, and where the work is done (not just what)? Control points inside IR35.' },
              { title: 'Mutuality of obligation', desc: 'Does the client guarantee work and is the worker obliged to accept it? MOO points inside IR35.' },
              { title: 'Financial risk', desc: 'Does the worker bear financial risk — for example, fixing defects at their own cost? Risk points outside IR35.' },
              { title: 'Integration', desc: 'Is the worker integrated into the client\'s organisation (company email, permanent desk, line management)? Integration points inside IR35.' },
            ].map(item => (
              <div key={item.title} className="flex gap-3 bg-white rounded-xl p-4 border border-gray-100">
                <HelpCircle className="h-5 w-5 text-[#0070F3] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#0B2D59]">{item.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0B2D59] mb-3">How Collabov handles IR35</h2>
          <div className="space-y-2">
            {[
              'Every staff augmentation contract includes an IR35 SDS (Schedule 2).',
              'The SDS captures answers to 6 key IR35 indicator questions from the buyer.',
              'A Collabov administrator reviews the answers and stamps the SDS before the engagement goes live.',
              'The determination is the responsibility of the end client (buyer) — Collabov facilitates the process but does not make the determination.',
              'Equipment provision (buyer vs vendor) is recorded in the SOW — vendor-provided equipment supports an outside-IR35 position.',
              'Working location (remote, on-site UK, hybrid) is recorded — on-site UK engagements trigger additional right-to-work obligations.',
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <CheckCircle className="h-5 w-5 text-[#0E7C6A] flex-shrink-0 mt-0.5" />
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#0B2D59] mb-3">MSP and IT Agency engagements</h2>
          <p>IR35 does not apply to MSP (managed service) or IT agency (project-based) engagements on Collabov. These vendors deliver a defined service or outcome — they are not placed as individuals within the client's organisation. No SDS is required for these engagement types.</p>
        </section>

        <div className="bg-[#0B2D59] text-white rounded-2xl p-8 mt-8">
          <h2 className="text-xl font-bold mb-3">Still unsure about IR35 for your engagement?</h2>
          <p className="text-blue-200 mb-5">Our support team can connect you with an IR35 specialist. We also recommend HMRC's Check Employment Status for Tax (CEST) tool as a starting point.</p>
          <a href="/contact" className="inline-block px-6 py-3 bg-[#0070F3] text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors">Contact Support</a>
        </div>
      </div>
    </div>
  </div>
);

export default IR35GuidancePage;
