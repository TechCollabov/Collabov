/**
 * Feature: Vendor Registration (5-step flow)
 *
 * Step 1 — Business type + Email + Password
 * Step 2 — Company basics
 * Step 3 — Services & tech stack
 * Step 4 — Verification documents (UK docs)
 * Step 5 — Confirmation (calls signUp, shows "Application submitted!")
 *
 * Verifies each step's validation rules and the final signUp call shape.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VendorSignup from '@/pages/vendor/VendorSignup';
import { renderWithRouter, createMockAuthValue } from '../../test-utils';

// ── Mock AuthContext ──────────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';

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

/** Fill Step 1 with valid data (business type + email + password) and advance. */
async function completeStep1(
  user: ReturnType<typeof userEvent.setup>,
  email = 'vendor@msp.com',
  password = 'ValidPass1!'
) {
  // Select MSP business type — the radio is inside a <label> that wraps it
  await user.click(screen.getByLabelText(/msp \(managed service provider\)/i));
  await user.type(screen.getByPlaceholderText(/you@company\.com/i), email);
  await user.type(screen.getByPlaceholderText(/min 10 chars/i), password);
  await user.click(screen.getByRole('button', { name: /^continue$/i }));
}

/** Fill Step 2 with a company name and advance. */
async function completeStep2(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText(/techpro solutions ltd/i), 'Acme MSP Ltd');
  await user.click(screen.getByRole('button', { name: /^continue$/i }));
}

/** Select at least one service category in Step 3 and advance. */
async function completeStep3(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^software development$/i }));
  await user.click(screen.getByRole('button', { name: /^continue$/i }));
}

/** Upload the required company registration document in Step 4 and advance. */
async function completeStep4(user: ReturnType<typeof userEvent.setup>) {
  // File inputs are rendered via a .map() with className="sr-only" — no data-testid.
  // The first file input corresponds to the required "Company Registration Certificate".
  const fileInputs = document.querySelectorAll(
    'input[type="file"]'
  ) as NodeListOf<HTMLInputElement>;
  await user.upload(fileInputs[0], fakeFile('companies-house.pdf'));
  await user.click(screen.getByRole('button', { name: /^submit application$/i }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Feature: Vendor Registration (5-step flow)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue(
      createMockAuthValue() as ReturnType<typeof useAuth>
    );
  });

  // ── Step 1: Rendering ─────────────────────────────────────────────────────

  describe('Scenario: Step 1 renders business type and credentials', () => {
    it('should display the "Create your provider account" heading', () => {
      renderVendorSignup();
      expect(
        screen.getByRole('heading', { name: /create your provider account/i })
      ).toBeInTheDocument();
    });

    it('should display business type options (MSP, IT Agency, Staff Augmentation)', () => {
      renderVendorSignup();
      expect(screen.getByLabelText(/msp \(managed service provider\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/it agency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/staff augmentation firm/i)).toBeInTheDocument();
    });

    it('should display email and password fields', () => {
      renderVendorSignup();
      expect(screen.getByPlaceholderText(/you@company\.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/min 10 chars/i)).toBeInTheDocument();
    });

    it('should display the step indicator showing Step 1 of 4', () => {
      renderVendorSignup();
      expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
    });
  });

  // ── Step 1: Validation ────────────────────────────────────────────────────

  describe('Scenario: Step 1 requires a business type selection', () => {
    it('should show an error if no business type is selected', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'v@msp.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'ValidPass1!');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/please select your business type/i)).toBeInTheDocument();
    });
  });

  describe('Scenario: Password must meet security requirements on Step 1', () => {
    it('should reject a password shorter than 10 characters', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await user.click(screen.getByLabelText(/msp \(managed service provider\)/i));
      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'v@msp.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'Short1!');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
    });

    it('should reject a password missing an uppercase letter', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await user.click(screen.getByLabelText(/msp \(managed service provider\)/i));
      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'v@msp.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'nouppercase1!');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/uppercase/i)).toBeInTheDocument();
    });

    it('should reject a password missing a number', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await user.click(screen.getByLabelText(/msp \(managed service provider\)/i));
      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'v@msp.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'NoNumber!!!');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/include a number/i)).toBeInTheDocument();
    });

    it('should reject a password missing a symbol', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await user.click(screen.getByLabelText(/msp \(managed service provider\)/i));
      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'v@msp.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'NoSymbol1234');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/include a symbol/i)).toBeInTheDocument();
    });
  });

  // ── Step 1 → Step 2 ───────────────────────────────────────────────────────

  describe('Scenario: Valid Step 1 advances to Step 2 (Company Basics)', () => {
    it('should show the company name field after Step 1 is completed', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await completeStep1(user);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/techpro solutions ltd/i)).toBeInTheDocument();
      });
    });

    it('should show the "Company basics" heading in Step 2', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await completeStep1(user);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /company basics/i })
        ).toBeInTheDocument();
      });
    });
  });

  // ── Step 2: Validation ────────────────────────────────────────────────────

  describe('Scenario: Step 2 requires a company name', () => {
    it('should show an error when company name is omitted', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await completeStep1(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));

      // Use fireEvent.submit to bypass HTML5 'required' validation so the
      // component's own JS validation runs and shows the custom error.
      const form = screen.getByRole('button', { name: /^continue$/i }).closest('form')!;
      fireEvent.submit(form);

      expect(await screen.findByText(/company name is required/i)).toBeInTheDocument();
    });
  });

  // ── Step 2 → Step 3 ───────────────────────────────────────────────────────

  describe('Scenario: Valid Step 2 advances to Step 3 (Services & tech stack)', () => {
    it('should show the services selection after Step 2 is completed', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await completeStep1(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeStep2(user);

      await waitFor(() => {
        expect(screen.getByText(/software development/i)).toBeInTheDocument();
      });
    });

    it('should show the "Services & tech stack" heading in Step 3', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await completeStep1(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeStep2(user);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /services & tech stack/i })
        ).toBeInTheDocument();
      });
    });
  });

  // ── Step 3: Validation ────────────────────────────────────────────────────

  describe('Scenario: Step 3 requires at least one service category', () => {
    it('should show an error when no services are selected', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await completeStep1(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeStep2(user);

      await waitFor(() => screen.getByText(/software development/i));

      // Proceed without selecting a service
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/select at least one service/i)).toBeInTheDocument();
    });
  });

  // ── Step 3 → Step 4 ───────────────────────────────────────────────────────

  describe('Scenario: Valid Step 3 advances to Step 4 (Verification Documents)', () => {
    it('should show the document upload UI after Step 3 is completed', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await completeStep1(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeStep2(user);
      await waitFor(() => screen.getByText(/software development/i));
      await completeStep3(user);

      await waitFor(() => {
        // Step 4 shows UK document upload prompts
        expect(
          screen.getByText(/company registration certificate/i)
        ).toBeInTheDocument();
      });
    });

    it('should show the "Verification documents" heading in Step 4', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await completeStep1(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeStep2(user);
      await waitFor(() => screen.getByText(/software development/i));
      await completeStep3(user);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /verification documents/i })
        ).toBeInTheDocument();
      });
    });
  });

  // ── Step 4: Validation ────────────────────────────────────────────────────

  describe('Scenario: Step 4 requires the Companies House registration certificate', () => {
    it('should show an error when no registration doc is uploaded', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await completeStep1(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeStep2(user);
      await waitFor(() => screen.getByText(/software development/i));
      await completeStep3(user);
      await waitFor(() => screen.getByText(/company registration certificate/i));

      await user.click(screen.getByRole('button', { name: /^submit application$/i }));

      expect(
        await screen.findByText(/company registration certificate is required/i)
      ).toBeInTheDocument();
    });
  });

  // ── Step 4 → Step 5 ───────────────────────────────────────────────────────

  describe('Scenario: Valid Step 4 advances to Step 5 (Confirmation)', () => {
    it('should show the confirmation heading after uploading the registration doc', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await completeStep1(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeStep2(user);
      await waitFor(() => screen.getByText(/software development/i));
      await completeStep3(user);
      await waitFor(() => screen.getByText(/company registration certificate/i));

      await completeStep4(user);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /application submitted/i })
        ).toBeInTheDocument();
      });
    });

    it('should show the "Create Account & Submit" button on Step 5', async () => {
      const user = userEvent.setup();
      renderVendorSignup();

      await completeStep1(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeStep2(user);
      await waitFor(() => screen.getByText(/software development/i));
      await completeStep3(user);
      await waitFor(() => screen.getByText(/company registration certificate/i));

      await completeStep4(user);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /create account & submit/i })
        ).toBeInTheDocument();
      });
    });
  });

  // ── Step 5: Final submission ──────────────────────────────────────────────

  describe('Scenario: Step 5 submits the vendor registration', () => {
    it('should call signUp with vendor user type and company data', async () => {
      const mockSignUp = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({ signUp: mockSignUp }) as ReturnType<typeof useAuth>
      );

      const user = userEvent.setup();
      renderVendorSignup();

      await completeStep1(user, 'vendor@msp.com', 'ValidPass1!');
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeStep2(user);
      await waitFor(() => screen.getByText(/software development/i));
      await completeStep3(user);
      await waitFor(() => screen.getByText(/company registration certificate/i));
      await completeStep4(user);

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
              companyName: expect.any(String),
            }),
          })
        );
      });
    });

    it('should display an error on Step 5 when signUp throws', async () => {
      const errorMessage = 'This email is already registered.';
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({
          signUp: vi.fn().mockRejectedValue(new Error(errorMessage)),
        }) as ReturnType<typeof useAuth>
      );

      const user = userEvent.setup();
      renderVendorSignup();

      await completeStep1(user);
      await waitFor(() => screen.getByPlaceholderText(/techpro solutions ltd/i));
      await completeStep2(user);
      await waitFor(() => screen.getByText(/software development/i));
      await completeStep3(user);
      await waitFor(() => screen.getByText(/company registration certificate/i));
      await completeStep4(user);

      await waitFor(() => screen.getByRole('button', { name: /create account & submit/i }));
      await user.click(screen.getByRole('button', { name: /create account & submit/i }));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

});
