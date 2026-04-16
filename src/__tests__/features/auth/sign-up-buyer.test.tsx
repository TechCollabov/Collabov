/**
 * Feature: Buyer Registration (3-step flow)
 *
 * Step 1 — Email + Password
 * Step 2 — Company Profile ("Your company profile")
 * Step 3 — Confirmation screen ("You are all set!")
 *
 * Verifies password validation rules, step navigation, form field requirements,
 * and the signUp call shape as defined in the MVP spec.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerSignup from '@/pages/CustomerSignup';
import { renderWithRouter, createMockAuthValue } from '../../test-utils';

// ── Mock AuthContext ──────────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderBuyerSignup() {
  return renderWithRouter(<CustomerSignup />, {
    routerProps: { initialEntries: ['/signup/customer'] },
  });
}

/**
 * Fill Step 1 with valid credentials and click Continue.
 * Uses a valid-format email so HTML5 type="email" validation passes.
 */
async function completeStep1(
  user: ReturnType<typeof userEvent.setup>,
  email = 'buyer@company.com',
  password = 'ValidPass1!'
) {
  await user.type(screen.getByPlaceholderText(/you@company\.com/i), email);
  await user.type(screen.getByPlaceholderText(/min 10 chars/i), password);
  await user.type(screen.getByPlaceholderText(/repeat your password/i), password);
  await user.click(screen.getByRole('button', { name: /^continue$/i }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Feature: Buyer Registration (3-step flow)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue(
      createMockAuthValue() as ReturnType<typeof useAuth>
    );
  });

  // ── Step 1: Rendering ─────────────────────────────────────────────────────

  describe('Scenario: Step 1 renders the account creation form', () => {
    it('should display the "Create your account" heading', () => {
      renderBuyerSignup();
      expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    });

    it('should display email, password, and confirm-password fields', () => {
      renderBuyerSignup();
      expect(screen.getByPlaceholderText(/you@company\.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/min 10 chars/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/repeat your password/i)).toBeInTheDocument();
    });

    it('should display the step indicator showing Step 1 of 2', () => {
      renderBuyerSignup();
      expect(screen.getByText(/step 1 of 2/i)).toBeInTheDocument();
    });
  });

  // ── Step 1: Password validation ───────────────────────────────────────────

  describe('Scenario: Password must meet security requirements', () => {
    it('should reject a password shorter than 10 characters', async () => {
      const user = userEvent.setup();
      renderBuyerSignup();

      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'a@b.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'Short1!');
      await user.type(screen.getByPlaceholderText(/repeat your password/i), 'Short1!');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
    });

    it('should reject a password without an uppercase letter', async () => {
      const user = userEvent.setup();
      renderBuyerSignup();

      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'a@b.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'nouppercase1!');
      await user.type(screen.getByPlaceholderText(/repeat your password/i), 'nouppercase1!');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/uppercase/i)).toBeInTheDocument();
    });

    it('should reject a password without a number', async () => {
      const user = userEvent.setup();
      renderBuyerSignup();

      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'a@b.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'NoNumberHere!');
      await user.type(screen.getByPlaceholderText(/repeat your password/i), 'NoNumberHere!');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/number/i)).toBeInTheDocument();
    });

    it('should reject a password without a symbol', async () => {
      const user = userEvent.setup();
      renderBuyerSignup();

      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'a@b.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'NoSymbol1234');
      await user.type(screen.getByPlaceholderText(/repeat your password/i), 'NoSymbol1234');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/symbol/i)).toBeInTheDocument();
    });

    it('should reject mismatched passwords', async () => {
      const user = userEvent.setup();
      renderBuyerSignup();

      await user.type(screen.getByPlaceholderText(/you@company\.com/i), 'a@b.com');
      await user.type(screen.getByPlaceholderText(/min 10 chars/i), 'ValidPass1!');
      await user.type(screen.getByPlaceholderText(/repeat your password/i), 'DifferentPass1!');
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      expect(await screen.findByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  // ── Step 1 → Step 2 transition ────────────────────────────────────────────

  describe('Scenario: Valid Step 1 advances to Step 2', () => {
    it('should show the company profile form after valid credentials', async () => {
      const user = userEvent.setup();
      renderBuyerSignup();

      await completeStep1(user);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /your company profile/i })
        ).toBeInTheDocument();
      });
    });

    it('should show the step indicator for Step 2 of 2', async () => {
      const user = userEvent.setup();
      renderBuyerSignup();

      await completeStep1(user);

      await waitFor(() => {
        expect(screen.getByText(/step 2 of 2/i)).toBeInTheDocument();
      });
    });
  });

  // ── Step 2: Rendering ─────────────────────────────────────────────────────

  describe('Scenario: Step 2 renders the company profile form', () => {
    it('should display the Legal Entity Name input', async () => {
      const user = userEvent.setup();
      renderBuyerSignup();

      await completeStep1(user);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/acme technologies ltd/i)
        ).toBeInTheDocument();
      });
    });

    it('should display industry and headcount select fields', async () => {
      const user = userEvent.setup();
      renderBuyerSignup();

      await completeStep1(user);

      await waitFor(() => {
        // Both are combobox roles; at least 2 should be present in step 2
        const combos = screen.getAllByRole('combobox');
        expect(combos.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  // ── Step 2: Validation ────────────────────────────────────────────────────

  describe('Scenario: Step 2 requires a legal entity name', () => {
    it('should show an error when company name is omitted', async () => {
      const user = userEvent.setup();
      renderBuyerSignup();

      await completeStep1(user);
      await waitFor(() => screen.getByRole('heading', { name: /your company profile/i }));

      // Use fireEvent.submit to bypass HTML5 'required' validation so the
      // component's own JS validation runs and shows the custom error.
      const form = screen.getByRole('button', { name: /^create account$/i }).closest('form')!;
      fireEvent.submit(form);

      expect(await screen.findByText(/legal entity name is required/i)).toBeInTheDocument();
    });
  });

  // ── Step 2: Submission ────────────────────────────────────────────────────

  describe('Scenario: Valid Step 2 submits registration', () => {
    it('should call signUp with customer user type and company name', async () => {
      const mockSignUp = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({ signUp: mockSignUp }) as ReturnType<typeof useAuth>
      );

      const user = userEvent.setup();
      renderBuyerSignup();

      // Complete Step 1
      await completeStep1(user, 'buyer@company.com', 'ValidPass1!');
      await waitFor(() => screen.getByRole('heading', { name: /your company profile/i }));

      // Fill Step 2
      await user.type(
        screen.getByPlaceholderText(/acme technologies ltd/i),
        'Acme Technologies Ltd'
      );

      // Select industry (first combobox in step 2)
      const combos = screen.getAllByRole('combobox');
      await user.selectOptions(combos[0], 'Technology');

      // Select headcount (second combobox in step 2)
      await user.selectOptions(combos[1], '11–50 employees');

      await user.click(screen.getByRole('button', { name: /^create account$/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledOnce();
        expect(mockSignUp).toHaveBeenCalledWith(
          'buyer@company.com',
          'ValidPass1!',
          expect.objectContaining({
            userType: 'customer',
            additionalData: expect.objectContaining({
              companyName: expect.any(String),
            }),
          })
        );
      });
    });

    it('should display the confirmation screen (Step 3) after successful sign-up', async () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({
          signUp: vi.fn().mockResolvedValue(undefined),
        }) as ReturnType<typeof useAuth>
      );

      const user = userEvent.setup();
      renderBuyerSignup();

      await completeStep1(user);
      await waitFor(() => screen.getByRole('heading', { name: /your company profile/i }));

      await user.type(screen.getByPlaceholderText(/acme technologies ltd/i), 'Acme Ltd');

      const combos = screen.getAllByRole('combobox');
      await user.selectOptions(combos[0], 'Technology');
      await user.selectOptions(combos[1], '1–10 employees');

      await user.click(screen.getByRole('button', { name: /^create account$/i }));

      // Step 3: "You are all set!" confirmation
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /you are all set/i })).toBeInTheDocument();
      });
    });
  });

  // ── Step 2: Sign-up error ─────────────────────────────────────────────────

  describe('Scenario: Registration fails (e.g. duplicate email)', () => {
    it('should display the error message on screen when signUp throws', async () => {
      const errorMessage = 'This email is already registered.';
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({
          signUp: vi.fn().mockRejectedValue(new Error(errorMessage)),
        }) as ReturnType<typeof useAuth>
      );

      const user = userEvent.setup();
      renderBuyerSignup();

      await completeStep1(user);
      await waitFor(() => screen.getByRole('heading', { name: /your company profile/i }));

      await user.type(screen.getByPlaceholderText(/acme technologies ltd/i), 'Acme Ltd');
      const combos = screen.getAllByRole('combobox');
      await user.selectOptions(combos[0], 'Technology');
      await user.selectOptions(combos[1], '1–10 employees');

      await user.click(screen.getByRole('button', { name: /^create account$/i }));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

});
