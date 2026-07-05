/**
 * Feature: Vendor Registration (6-step flow)
 *
 * Step 1 — Business type (MSP / IT Agency / Staff Augmentation)
 * Step 2 — Email + Password
 * Step 3 — Company basics
 * Step 4 — Services & tech stack
 * Step 5 — Verification documents (UK docs)
 * Step 6 — Confirmation (calls signUp, shows "Application submitted!")
 *
 * Verifies each step's validation rules and the final signUp call shape.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import VendorSignup from '@/pages/vendor/VendorSignup';
import { renderWithRouter, createMockAuthValue } from '../../test-utils';

// ── Mock AuthContext ──────────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';

// ── Mock Supabase client ──────────────────────────────────────────────────────
// Step 3 (company basics) calls supabase.rpc('check_vendor_rejected', ...) to
// block re-registration by a previously-rejected company. Without this mock the
// test would hit the real network and be flaky/slow — resolve it instantly.

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderVendorSignup(initialPath = '/vendor/signup') {
  return renderWithRouter(<VendorSignup />, {
    routerProps: { initialEntries: [initialPath] },
  });
}

/** Create a fake File object for document upload tests. */
function fakeFile(name = 'cert.pdf', type = 'application/pdf') {
  return new File(['(binary content)'], name, { type });
}

/** Select a business type in Step 1 and advance. Buttons are selectable cards, so
 *  their accessible name includes the blurb/contract text too — match by substring. */
async function completeBusinessType(
  user: ReturnType<typeof userEvent.setup>,
  label: RegExp = /managed it \(msp\)/i
) {
  await user.click(screen.getByRole('button', { name: label }));
  await user.click(screen.getByRole('button', { name: /^continue$/i }));
}

/** Fill Step 2 (credentials) with valid email + password and advance. */
async function completeCredentials(
  user: ReturnType<typeof userEvent.setup>,
  email = 'vendor@msp.com',
  password = 'ValidPass1!'
) {
  await user.type(screen.getByPlaceholderText(/you@company\.com/i), email);
  await user.type(screen.getByPlaceholderText(/min 10 chars/i), password);
  await user.click(screen.getByRole('button', { name: /^continue$/i }));
}

/** Fill Step 3 (company basics) with a company name and advance. */
async function completeCompanyBasics(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText(/techpro solutions ltd/i), 'Acme MSP Ltd');
  await user.click(screen.getByRole('button', { name: /^continue$/i }));
}

/** Select at least one service category in Step 4 and advance. */
async function completeServices(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^software development$/i }));
  await user.click(screen.getByRole('button', { name: /^continue$/i }));
}

/** Upload the required company registration document in Step 5 and advance. */
async function completeDocuments(user: ReturnType<typeof userEvent.setup>) {
  const fileInputs = document.querySelectorAll(
    'input[type="file"]'
  ) as NodeListOf<HTMLInputElement>;
  await user.upload(fileInputs[0], fakeFile('companies-house.pdf'));
  await user.click(screen.getByRole('button', { name: /^submit application$/i }));
}

/** Walk from the very start through to the confirmation screen (Step 6). */
async function completeAllSteps(user: ReturnType<typeof userEvent.setup>) {
  await completeBusinessType(user);
  await waitFor(() => screen.getByPlaceholderText(/you@company\.com/i));
  await completeCredentials(user);
  await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
  await completeCompanyBasics(user);
  await waitFor(() => screen.getByText(/software development/i));
  await completeServices(user);
  await waitFor(() => screen.getByText(/company registration certificate/i));
  await completeDocuments(user);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Feature: Vendor Registration (6-step flow)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue(
      createMockAuthValue() as ReturnType<typeof useAuth>
    );
  });

  // ── Step 1: Business type ─────────────────────────────────────────────────

  describe('Scenario: Step 1 asks for a business type before anything else', () => {
    it('should display the "What kind of provider are you?" heading', () => {
      renderVendorSignup();
      expect(
        screen.getByRole('heading', { name: /what kind of provider are you/i })
      ).toBeInTheDocument();
    });

    it('should display all three business type options', () => {
      renderVendorSignup();
      expect(screen.getByRole('button', { name: /managed it \(msp\)/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /it agency/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /staff augmentation/i })).toBeInTheDocument();
    });

    it('should display the step indicator showing Step 1 of 5', () => {
      renderVendorSignup();
      expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
    });

    it('should disable Continue until a business type is selected', () => {
      renderVendorSignup();
      expect(screen.getByRole('button', { name: /^continue$/i })).toBeDisabled();
    });

    it('should enable Continue once a business type is selected', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await user.click(screen.getByRole('button', { name: /it agency/i }));

      expect(screen.getByRole('button', { name: /^continue$/i })).toBeEnabled();
    });
  });

  // ── Step 1 → Step 2 ───────────────────────────────────────────────────────

  describe('Scenario: Selecting a business type advances to Step 2 (Credentials)', () => {
    it('should show the "Create your provider account" heading after Step 1', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await completeBusinessType(user);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /create your provider account/i })
        ).toBeInTheDocument();
      });
    });

    it('should pre-select the business type given in the /vendor/signup/:type route', () => {
      // Needs a real matched <Route> (not just MemoryRouter) for useParams() to see :type.
      render(
        <MemoryRouter initialEntries={['/vendor/signup/staffaug']}>
          <Routes>
            <Route path="/vendor/signup/:type" element={<VendorSignup />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByRole('button', { name: /^continue$/i })).toBeEnabled();
    });
  });

  // ── Step 2: Validation ────────────────────────────────────────────────────

  describe('Scenario: Password must meet security requirements on Step 2', () => {
    it('should reject a password shorter than 10 characters', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessType(user);

      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'v@msp.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'Short1!');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
    });

    it('should reject a password missing an uppercase letter', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessType(user);

      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'v@msp.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'nouppercase1!');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/uppercase/i)).toBeInTheDocument();
    });

    it('should reject a password missing a number', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessType(user);

      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'v@msp.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'NoNumber!!!');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/include a number/i)).toBeInTheDocument();
    });

    it('should reject a password missing a symbol', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessType(user);

      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'v@msp.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'NoSymbol1234');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/include a symbol/i)).toBeInTheDocument();
    });
  });

  // ── Step 2 → Step 3 ───────────────────────────────────────────────────────

  describe('Scenario: Valid Step 2 advances to Step 3 (Company Basics)', () => {
    it('should show the company name field after Step 2 is completed', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessType(user);

      await completeCredentials(user);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/techpro solutions ltd/i)).toBeInTheDocument();
      });
    });

    it('should show the "Company basics" heading in Step 3', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessType(user);

      await completeCredentials(user);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /company basics/i })
        ).toBeInTheDocument();
      });
    });
  });

  // ── Step 3: Validation ────────────────────────────────────────────────────

  describe('Scenario: Step 3 requires a company name', () => {
    it('should show an error when company name is omitted', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessType(user);
      await completeCredentials(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));

      const form = screen.getByRole('button', { name: /^continue$/i }).closest('form')!;
      fireEvent.submit(form);

      expect(await screen.findByText(/company name is required/i)).toBeInTheDocument();
    });
  });

  // ── Step 3 → Step 4 ───────────────────────────────────────────────────────

  describe('Scenario: Valid Step 3 advances to Step 4 (Services & tech stack)', () => {
    it('should show the services selection after Step 3 is completed', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessType(user);
      await completeCredentials(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeCompanyBasics(user);

      await waitFor(() => {
        expect(screen.getByText(/software development/i)).toBeInTheDocument();
      });
    });

    it('should show the "Services & tech stack" heading in Step 4', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessType(user);
      await completeCredentials(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeCompanyBasics(user);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /services & tech stack/i })
        ).toBeInTheDocument();
      });
    });
  });

  // ── Step 4: Validation ────────────────────────────────────────────────────

  describe('Scenario: Step 4 requires at least one service category', () => {
    it('should show an error when no services are selected', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessType(user);
      await completeCredentials(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeCompanyBasics(user);
      await waitFor(() => screen.getByText(/software development/i));

      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/select at least one service/i)).toBeInTheDocument();
    });
  });

  // ── Step 4 → Step 5 ───────────────────────────────────────────────────────

  describe('Scenario: Valid Step 4 advances to Step 5 (Verification Documents)', () => {
    it('should show the document upload UI after Step 4 is completed', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessType(user);
      await completeCredentials(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeCompanyBasics(user);
      await waitFor(() => screen.getByText(/software development/i));
      await completeServices(user);

      await waitFor(() => {
        expect(
          screen.getByText(/company registration certificate/i)
        ).toBeInTheDocument();
      });
    });

    it('should show the "Verification documents" heading in Step 5', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessType(user);
      await completeCredentials(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeCompanyBasics(user);
      await waitFor(() => screen.getByText(/software development/i));
      await completeServices(user);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /verification documents/i })
        ).toBeInTheDocument();
      });
    });
  });

  // ── Step 5: Validation ────────────────────────────────────────────────────

  describe('Scenario: Step 5 requires the Companies House registration certificate', () => {
    it('should show an error when no registration doc is uploaded', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessType(user);
      await completeCredentials(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeCompanyBasics(user);
      await waitFor(() => screen.getByText(/software development/i));
      await completeServices(user);
      await waitFor(() => screen.getByText(/company registration certificate/i));

      await user.click(screen.getByRole('button', { name: /^submit application$/i }));

      expect(
        await screen.findByText(/company registration certificate is required/i)
      ).toBeInTheDocument();
    });
  });

  // ── Step 5 → Step 6 ───────────────────────────────────────────────────────

  describe('Scenario: Valid Step 5 advances to Step 6 (Confirmation)', () => {
    it('should show the confirmation heading after uploading the registration doc', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await completeAllSteps(user);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /application submitted/i })
        ).toBeInTheDocument();
      });
    });

    it('should show the "Create Account & Submit" button on Step 6', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await completeAllSteps(user);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /create account & submit/i })
        ).toBeInTheDocument();
      });
    });
  });

  // ── Step 6: Final submission ──────────────────────────────────────────────

  describe('Scenario: Step 6 submits the vendor registration', () => {
    it('should call signUp with vendor user type, business type, and company data', async () => {
      const mockSignUp = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({ signUp: mockSignUp }) as ReturnType<typeof useAuth>
      );

      const user = userEvent.setup();
      renderVendorSignup();

      await completeBusinessType(user, /it agency/i);
      await completeCredentials(user, 'vendor@msp.com', 'ValidPass1!');
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeCompanyBasics(user);
      await waitFor(() => screen.getByText(/software development/i));
      await completeServices(user);
      await waitFor(() => screen.getByText(/company registration certificate/i));
      await completeDocuments(user);

      await waitFor(() => screen.getByRole('button', { name: /create account & submit/i }));
      await user.click(screen.getByRole('button', { name: /create account & submit/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledOnce();
        expect(mockSignUp).toHaveBeenCalledWith(
          'vendor@msp.com',
          'ValidPass1!',
          expect.objectContaining({
            userType: 'vendor',
            additionalData: expect.objectContaining({
              businessType: 'agency',
              companyName: expect.any(String),
            }),
          })
        );
      });
    });

    it('should display an error on Step 6 when signUp throws', async () => {
      const errorMessage = 'This email is already registered.';
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({
          signUp: vi.fn().mockRejectedValue(new Error(errorMessage)),
        }) as ReturnType<typeof useAuth>
      );

      const user = userEvent.setup();
      renderVendorSignup();

      await completeAllSteps(user);

      await waitFor(() => screen.getByRole('button', { name: /create account & submit/i }));
      await user.click(screen.getByRole('button', { name: /create account & submit/i }));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

});
