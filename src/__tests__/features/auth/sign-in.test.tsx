/**
 * Feature: User Sign In
 *
 * Covers the /signin page: form rendering, validation, credential submission,
 * error display, and post-login redirect behaviour per role.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import SignInPage from '@/pages/SignInPage';
import { renderWithRouter, createMockUser, createMockProfile, createMockAuthValue } from '../../test-utils';

// ── Mock AuthContext ──────────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderSignIn() {
  return renderWithRouter(
    <Routes>
      <Route path="/signin"            element={<SignInPage />} />
      <Route path="/customer/dashboard" element={<div data-testid="customer-dashboard" />} />
      <Route path="/vendor/dashboard"   element={<div data-testid="vendor-dashboard" />} />
      <Route path="/admin"              element={<div data-testid="admin-panel" />} />
    </Routes>,
    { routerProps: { initialEntries: ['/signin'] } }
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Feature: User Sign In', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue(
      createMockAuthValue() as ReturnType<typeof useAuth>
    );
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('Scenario: Sign-in page renders the correct UI elements', () => {
    it('should display email and password inputs', () => {
      renderSignIn();
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    });

    it('should display a "Sign In" submit button', () => {
      renderSignIn();
      expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
    });

    it('should display a "Forgot password?" link', () => {
      renderSignIn();
      expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
    });

    it('should display a "Sign in as Admin" link to /admin/login', () => {
      renderSignIn();
      const adminLink = screen.getByRole('link', { name: /sign in as admin/i });
      expect(adminLink).toHaveAttribute('href', '/admin/login');
    });

    it('should display a "Sign up" link to /user-type', () => {
      renderSignIn();
      const signUpLink = screen.getByRole('link', { name: /sign up/i });
      expect(signUpLink).toHaveAttribute('href', '/user-type');
    });
  });

  // ── Validation ────────────────────────────────────────────────────────────

  describe('Scenario: Form validation prevents invalid submissions', () => {
    it('should show validation error when email is empty on submit', async () => {
      // NOTE: Uses empty email (not invalid-format email) because the input
      // has type="email" and jsdom's HTML5 validation would block form
      // submission for invalid format before react-hook-form can run.
      // An empty required email also triggers the zod "Valid email is required" error.
      const user = userEvent.setup();
      renderSignIn();

      // Leave email empty, type something in password to avoid password error
      await user.type(screen.getByPlaceholderText(/enter your password/i), 'anypassword');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(screen.getByText(/valid email is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error when password is empty', async () => {
      const user = userEvent.setup();
      renderSignIn();

      await user.type(screen.getByPlaceholderText(/enter your email/i), 'user@example.com');
      // Leave password empty
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });
  });

  // ── Successful submission ─────────────────────────────────────────────────

  describe('Scenario: User submits valid credentials', () => {
    it('should call signIn with the provided email and password', async () => {
      const mockSignIn = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({ signIn: mockSignIn }) as ReturnType<typeof useAuth>
      );

      const user = userEvent.setup();
      renderSignIn();

      await user.type(screen.getByPlaceholderText(/enter your email/i), 'buyer@company.com');
      await user.type(screen.getByPlaceholderText(/enter your password/i), 'SecurePass123!');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledOnce();
        expect(mockSignIn).toHaveBeenCalledWith('buyer@company.com', 'SecurePass123!');
      });
    });

    it('should redirect a customer to /customer/dashboard after sign-in', async () => {
      // First render shows the unauthenticated sign-in form;
      // after signIn resolves the auth state updates and the component re-renders
      // with an authenticated customer profile → redirect triggers.
      let callCount = 0;
      vi.mocked(useAuth).mockImplementation(() => {
        callCount++;
        if (callCount > 2) {
          return createMockAuthValue({
            user: createMockUser(),
            profile: createMockProfile('customer'),
          }) as ReturnType<typeof useAuth>;
        }
        return createMockAuthValue({
          signIn: vi.fn().mockResolvedValue(undefined),
        }) as ReturnType<typeof useAuth>;
      });

      const user = userEvent.setup();
      renderSignIn();

      await user.type(screen.getByPlaceholderText(/enter your email/i), 'buyer@company.com');
      await user.type(screen.getByPlaceholderText(/enter your password/i), 'SecurePass123!');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(screen.getByTestId('customer-dashboard')).toBeInTheDocument();
      });
    });
  });

  // ── Error handling ────────────────────────────────────────────────────────

  describe('Scenario: Sign-in fails due to wrong credentials', () => {
    it('should display the error message returned by the auth service', async () => {
      const errorMessage = 'Invalid login credentials';
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({
          signIn: vi.fn().mockRejectedValue(new Error(errorMessage)),
        }) as ReturnType<typeof useAuth>
      );

      const user = userEvent.setup();
      renderSignIn();

      await user.type(screen.getByPlaceholderText(/enter your email/i), 'wrong@example.com');
      await user.type(screen.getByPlaceholderText(/enter your password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should re-enable the Sign In button after a failed attempt', async () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({
          signIn: vi.fn().mockRejectedValue(new Error('Auth error')),
        }) as ReturnType<typeof useAuth>
      );

      const user = userEvent.setup();
      renderSignIn();

      await user.type(screen.getByPlaceholderText(/enter your email/i), 'x@x.com');
      await user.type(screen.getByPlaceholderText(/enter your password/i), 'badpassword');
      await user.click(screen.getByRole('button', { name: /^sign in$/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^sign in$/i })).not.toBeDisabled();
      });
    });
  });

});
