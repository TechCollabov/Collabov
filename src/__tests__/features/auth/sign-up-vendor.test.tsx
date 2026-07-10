/**
 * Feature: Vendor Registration (3-step flow)
 *
 * Step 1 — Business type(s) (MSP / IT Agency / Staff Augmentation), up to 2
 * Step 2 — Email + Password + Contact number
 * Step 3 — Email OTP verification (calls signUp, then verifyOtp)
 *
 * Company name, services, tech stack, and documents are collected later
 * from the vendor dashboard (My Listing), not during signup.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
    auth: {
      verifyOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      resend: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));

import { supabase } from '@/lib/supabase';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderVendorSignup(initialPath = '/vendor/signup') {
  return renderWithRouter(<VendorSignup />, {
    routerProps: { initialEntries: [initialPath] },
  });
}

/** Select one or more business types in Step 1 and advance. */
async function completeBusinessTypes(
  user: ReturnType<typeof userEvent.setup>,
  labels: RegExp[] = [/managed it \(msp\)/i]
) {
  for (const label of labels) {
    await user.click(screen.getByRole('button', { name: label }));
  }
  await user.click(screen.getByRole('button', { name: /^continue$/i }));
}

/** Fill Step 2 (account) with valid email + password + phone and advance. */
async function completeAccountStep(
  user: ReturnType<typeof userEvent.setup>,
  email = 'vendor@msp.com',
  password = 'ValidPass1!',
  phone = '+44 7700 900000'
) {
  await user.type(screen.getByPlaceholderText(/you@company\.com/i), email);
  await user.type(screen.getByPlaceholderText(/min 10 chars/i), password);
  await user.type(screen.getByPlaceholderText(/\+44 7700 900000/i), phone);
  await user.click(screen.getByRole('button', { name: /^continue$/i }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Feature: Vendor Registration (3-step flow)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue(
      createMockAuthValue() as ReturnType<typeof useAuth>
    );
  });

  // ── Step 1: Business type(s) ──────────────────────────────────────────────

  describe('Scenario: Step 1 asks for business type(s) before anything else', () => {
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

    it('should display the step indicator showing Step 1 of 3', () => {
      renderVendorSignup();
      expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
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

    it('should allow selecting a second business type', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await user.click(screen.getByRole('button', { name: /managed it \(msp\)/i }));
      await user.click(screen.getByRole('button', { name: /staff augmentation/i }));

      expect(screen.getByRole('button', { name: /^continue$/i })).toBeEnabled();
    });

    it('should disable the third option once two are already selected', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await user.click(screen.getByRole('button', { name: /managed it \(msp\)/i }));
      await user.click(screen.getByRole('button', { name: /it agency/i }));

      expect(screen.getByRole('button', { name: /staff augmentation/i })).toBeDisabled();
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

  // ── Step 1 → Step 2 ───────────────────────────────────────────────────────

  describe('Scenario: Selecting business type(s) advances to Step 2 (Account)', () => {
    it('should show the "Create your provider account" heading after Step 1', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await completeBusinessTypes(user);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /create your provider account/i })
        ).toBeInTheDocument();
      });
    });
  });

  // ── Step 2: Validation ────────────────────────────────────────────────────

  describe('Scenario: Password must meet security requirements on Step 2', () => {
    it('should reject a password shorter than 10 characters', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessTypes(user);

      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'v@msp.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'Short1!');
      await user.type(screen.getByPlaceholderText(/\+44 7700 900000/i), '+44 7700 900000');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
    });

    it('should reject a password missing an uppercase letter', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessTypes(user);

      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'v@msp.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'nouppercase1!');
      await user.type(screen.getByPlaceholderText(/\+44 7700 900000/i), '+44 7700 900000');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/uppercase/i)).toBeInTheDocument();
    });

    it('should reject a password missing a number', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessTypes(user);

      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'v@msp.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'NoNumber!!!');
      await user.type(screen.getByPlaceholderText(/\+44 7700 900000/i), '+44 7700 900000');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/include a number/i)).toBeInTheDocument();
    });

    it('should reject a password missing a symbol', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessTypes(user);

      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'v@msp.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'NoSymbol1234');
      await user.type(screen.getByPlaceholderText(/\+44 7700 900000/i), '+44 7700 900000');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/include a symbol/i)).toBeInTheDocument();
    });

    it('should require a contact number', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessTypes(user);

      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'v@msp.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'ValidPass1!');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/contact number is required/i)).toBeInTheDocument();
    });
  });

  describe('Scenario: Step 2 rejects personal email domains', () => {
    // TODO(revert-before-launch): business-email check is temporarily disabled
    // in VendorSignup.tsx for testing — re-enable this test when it's restored.
    it.skip('should reject a gmail.com address', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessTypes(user);

      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'vendor@gmail.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'ValidPass1!');
      await user.type(screen.getByPlaceholderText(/\+44 7700 900000/i), '+44 7700 900000');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/business email address/i)).toBeInTheDocument();
    });
  });

  describe('Scenario: Step 2 shows a live password strength bar', () => {
    it('should show no strength bar before any password is typed', () => {
      renderVendorSignup();
      expect(screen.queryByText(/too weak|^weak$|^fair$|^good$|^strong$/i)).not.toBeInTheDocument();
    });

    it('should label a weak password as such', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessTypes(user);

      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'aaaaaaaaaa');
      expect(await screen.findByText(/weak/i)).toBeInTheDocument();
    });

    it('should label a password meeting all 4 rules as Strong', async () => {
      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessTypes(user);

      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'ValidPass1!');
      expect(await screen.findByText(/^strong$/i)).toBeInTheDocument();
    });
  });

  // ── Step 2 → Step 3 (or straight to dashboard) ────────────────────────────

  describe('Scenario: Valid Step 2 calls signUp with both business types and phone', () => {
    it('should call signUp with vendor user type, both business types, and phone', async () => {
      const mockSignUp = vi.fn().mockResolvedValue({ user: { id: 'v1' }, hasSession: false });
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({ signUp: mockSignUp }) as ReturnType<typeof useAuth>
      );

      const user = userEvent.setup();
      renderVendorSignup();

      await completeBusinessTypes(user, [/managed it \(msp\)/i, /staff augmentation/i]);
      await completeAccountStep(user, 'vendor@msp.com', 'ValidPass1!', '+44 7700 900000');

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledOnce();
        expect(mockSignUp).toHaveBeenCalledWith(
          'vendor@msp.com',
          'ValidPass1!',
          expect.objectContaining({
            userType: 'vendor',
            additionalData: expect.objectContaining({
              businessType: 'msp',
              businessTypeSecondary: 'staffaug',
              contactPhone: '+44 7700 900000',
            }),
          })
        );
      });
    });

    it('should show the OTP screen when signUp does not return a session', async () => {
      const mockSignUp = vi.fn().mockResolvedValue({ user: { id: 'v1' }, hasSession: false });
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({ signUp: mockSignUp }) as ReturnType<typeof useAuth>
      );

      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessTypes(user);
      await completeAccountStep(user);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /verify your email/i })).toBeInTheDocument();
      });
    });

    it('should display an error on Step 2 when signUp throws', async () => {
      const errorMessage = 'This email is already registered.';
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({
          signUp: vi.fn().mockRejectedValue(new Error(errorMessage)),
        }) as ReturnType<typeof useAuth>
      );

      const user = userEvent.setup();
      renderVendorSignup();
      await completeBusinessTypes(user);
      await completeAccountStep(user);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  // ── Step 3: OTP verification ──────────────────────────────────────────────

  describe('Scenario: Step 3 verifies the email OTP code', () => {
    async function reachOtpStep(user: ReturnType<typeof userEvent.setup>) {
      const mockSignUp = vi.fn().mockResolvedValue({ user: { id: 'v1' }, hasSession: false });
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({ signUp: mockSignUp }) as ReturnType<typeof useAuth>
      );
      renderVendorSignup();
      await completeBusinessTypes(user);
      await completeAccountStep(user);
      await waitFor(() => screen.getByRole('heading', { name: /verify your email/i }));
    }

    it('should call supabase.auth.verifyOtp with the entered code', async () => {
      const user = userEvent.setup();
      await reachOtpStep(user);

      await user.type(screen.getByPlaceholderText('000000'), '123456');
      await user.click(screen.getByRole('button', { name: /verify & continue/i }));

      await waitFor(() => {
        expect(supabase.auth.verifyOtp).toHaveBeenCalledWith(
          expect.objectContaining({ token: '123456', type: 'signup' })
        );
      });
    });

    it('should show an error when the code is rejected', async () => {
      vi.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce({
        data: {}, error: { message: 'Token has expired or is invalid' },
      } as any);

      const user = userEvent.setup();
      await reachOtpStep(user);

      await user.type(screen.getByPlaceholderText('000000'), '000000');
      await user.click(screen.getByRole('button', { name: /verify & continue/i }));

      expect(await screen.findByText(/expired or is invalid/i)).toBeInTheDocument();
    });

    it('should call supabase.auth.resend when "Resend" is clicked', async () => {
      const user = userEvent.setup();
      await reachOtpStep(user);

      await user.click(screen.getByRole('button', { name: /resend/i }));

      await waitFor(() => {
        expect(supabase.auth.resend).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'signup' })
        );
      });
    });
  });

});
