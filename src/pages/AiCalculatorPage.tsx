import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { isBusinessEmail } from '../lib/workflows';

const SERVICES = [
  'Software Development',
  'Managed IT',
  'Cybersecurity',
  'Cloud & DevOps',
  'QA & Testing',
];

const LOCATIONS = ['UK only', 'Eastern Europe', 'South Asia', 'No preference'] as const;
type Location = (typeof LOCATIONS)[number];

const LOCATION_MULTIPLIER: Record<Location, number> = {
  'UK only': 0.85,
  'Eastern Europe': 0.45,
  'South Asia': 0.30,
  'No preference': 0.40,
};

function formatGBP(value: number): string {
  return '£' + Math.round(value).toLocaleString('en-GB');
}

// Total steps: 4 questions + 1 email = 5
const TOTAL_STEPS = 5;

const AiCalculatorPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [staffCount, setStaffCount] = useState<string>('');
  const [avgSalary, setAvgSalary] = useState<string>('');
  const [services, setServices] = useState<string[]>([]);
  const [location, setLocation] = useState<Location | ''>('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Computed results
  const staffNum = parseInt(staffCount, 10) || 0;
  const salaryNum = parseInt(avgSalary, 10) || 0;
  const ukEquivalentCost = staffNum * salaryNum;
  const multiplier = location ? LOCATION_MULTIPLIER[location as Location] : 0;
  const estimatedPlatformCost = ukEquivalentCost * multiplier;
  const estimatedSaving = ukEquivalentCost - estimatedPlatformCost;
  const savingPercent = ukEquivalentCost > 0 ? Math.round((estimatedSaving / ukEquivalentCost) * 100) : 0;

  const progressPercent = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);

  function toggleService(s: string) {
    setServices(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  }

  function canProceed(): boolean {
    if (step === 1) return staffNum >= 1;
    if (step === 2) return salaryNum > 0;
    if (step === 3) return services.length > 0;
    if (step === 4) return location !== '';
    return false;
  }

  function handleNext() {
    if (step < 4) setStep(s => s + 1);
    else if (step === 4) setStep(5); // email step
  }

  function handleBack() {
    if (step > 1) setStep(s => s - 1);
  }

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setEmailError('Please enter your work email.');
      return;
    }
    if (!isBusinessEmail(email)) {
      setEmailError('Please use a business email address (not Gmail, Yahoo, Hotmail, or Outlook).');
      return;
    }
    setEmailError('');
    setShowResults(true);
  }

  function handleFindVendors() {
    const q = services.join('+');
    navigate(`/results?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}`);
  }

  const stepLabel = step <= 4 ? `Step ${step} of 4` : 'Almost there!';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-[#0B2D59] mb-2">
          Should You Outsource? Find Out in 60 Seconds.
        </h1>
        <p className="text-gray-500">
          Rules-based savings estimate. Free. No sign-up required until you want results.
        </p>
      </div>

      {/* Card */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">{stepLabel}</span>
            <span className="text-sm font-medium text-[#0070F3]">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%`, backgroundColor: '#0070F3' }}
            />
          </div>
        </div>

        {/* Results view */}
        {showResults ? (
          <div>
            <h2 className="text-xl font-bold text-[#0B2D59] mb-6">Your Savings Estimate</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Your current team cost estimate</p>
                <p className="text-2xl font-black text-[#0B2D59]">{formatGBP(ukEquivalentCost)}</p>
                <p className="text-xs text-gray-400 mt-1">/ year</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Estimated platform cost</p>
                <p className="text-2xl font-black text-[#0070F3]">{formatGBP(estimatedPlatformCost)}</p>
                <p className="text-xs text-gray-400 mt-1">/ year</p>
              </div>
              <div className="bg-[#0E7C6A]/10 rounded-xl p-4 text-center border border-[#0E7C6A]/30">
                <p className="text-xs text-[#0E7C6A] font-medium mb-1">Potential annual saving</p>
                <p className="text-2xl font-black text-[#0E7C6A]">{formatGBP(estimatedSaving)}</p>
                <p className="text-xs text-[#0E7C6A] mt-1">{savingPercent}% reduction</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-8">
              Based on {staffNum} IT staff at {formatGBP(salaryNum)} average salary, sourcing from {location}.
            </p>

            <button
              onClick={handleFindVendors}
              className="w-full py-3 px-6 rounded-xl text-white font-bold text-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0070F3' }}
            >
              Find Matching Vendors
            </button>
          </div>
        ) : step === 5 ? (
          /* Email capture step */
          <form onSubmit={handleEmailSubmit}>
            <h2 className="text-xl font-bold text-[#0B2D59] mb-2">One last step</h2>
            <p className="text-gray-500 mb-6">Enter your work email to see your full savings report</p>

            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="work-email">
              Work email address
            </label>
            <input
              id="work-email"
              type="email"
              required
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError(''); }}
              placeholder="you@company.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0070F3] mb-2"
            />
            {emailError && (
              <p className="text-red-500 text-sm mb-3">{emailError}</p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-6 rounded-xl text-white font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#0070F3' }}
              >
                See My Savings Report
              </button>
            </div>
          </form>
        ) : (
          /* Questions 1–4 */
          <div>
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-[#0B2D59] mb-6">
                  How many IT staff do you currently have?
                </h2>
                <input
                  type="number"
                  min={1}
                  value={staffCount}
                  onChange={e => setStaffCount(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 text-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-[#0B2D59] mb-6">
                  What is the average annual salary per person?
                </h2>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium">£</span>
                  <input
                    type="number"
                    min={1}
                    value={avgSalary}
                    onChange={e => setAvgSalary(e.target.value)}
                    placeholder="65000"
                    className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-3 text-gray-800 text-lg focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2">e.g. £65,000</p>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-[#0B2D59] mb-6">
                  Which services do you need?
                </h2>
                <div className="space-y-3">
                  {SERVICES.map(s => (
                    <label
                      key={s}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        services.includes(s)
                          ? 'border-[#0070F3] bg-[#0070F3]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
                          services.includes(s)
                            ? 'border-[#0070F3] bg-[#0070F3]'
                            : 'border-gray-300'
                        }`}
                      >
                        {services.includes(s) && <CheckCircle className="h-4 w-4 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={services.includes(s)}
                        onChange={() => toggleService(s)}
                      />
                      <span className="font-medium text-gray-700">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-xl font-bold text-[#0B2D59] mb-6">
                  Where would you prefer your vendor to be based?
                </h2>
                <div className="space-y-3">
                  {LOCATIONS.map(loc => (
                    <label
                      key={loc}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        location === loc
                          ? 'border-[#0070F3] bg-[#0070F3]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          location === loc ? 'border-[#0070F3]' : 'border-gray-300'
                        }`}
                      >
                        {location === loc && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#0070F3]" />
                        )}
                      </div>
                      <input
                        type="radio"
                        name="location"
                        value={loc}
                        className="sr-only"
                        checked={location === loc}
                        onChange={() => setLocation(loc)}
                      />
                      <span className="font-medium text-gray-700">{loc}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`flex-1 flex items-center justify-center gap-1 py-3 px-6 rounded-xl text-white font-bold transition-opacity ${
                  canProceed() ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'
                }`}
                style={{ backgroundColor: '#0070F3' }}
              >
                {step === 4 ? 'Continue to email capture' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiCalculatorPage;
