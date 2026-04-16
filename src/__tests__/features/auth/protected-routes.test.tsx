/**
 * Feature: Protected Route Access Control
 *
 * Verifies that CustomerRoute, VendorRoute, and AdminRoute enforce role-based
 * access and redirect appropriately when the auth state does not match.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import {
  ProtectedRoute,
  CustomerRoute,
  VendorRoute,
  AdminRoute,
} from '@/components/auth/ProtectedRoute';
import { renderWithRouter, createMockUser, createMockProfile, createMockAuthValue } from '../../test-utils';

// ── Mock AuthContext ──────────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Renders a protected route inside a Routes tree so that <Navigate> redirects
 * are handled correctly and we can assert which "page" was rendered.
 */
function renderProtected(children: React.ReactElement, initialPath = '/protected') {
  return renderWithRouter(
    <Routes>
      <Route path="/protected" element={children} />
      <Route path="/signin"    element={<div data-testid="signin-page">Sign In</div>} />
      <Route path="/"          element={<div data-testid="home-page">Home</div>} />
    </Routes>,
    { routerProps: { initialEntries: [initialPath] } }
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Feature: Protected Route Access Control', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('Scenario: Auth state is still loading', () => {
    it('should show a loading spinner and NOT render protected content', () => {
      // Given auth is still resolving
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({ loading: true }) as ReturnType<typeof useAuth>
      );

      renderProtected(
        <ProtectedRoute>
          <div data-testid="protected-content">Secret</div>
        </ProtectedRoute>
      );

      // Then the spinner is shown, not the content
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('signin-page')).not.toBeInTheDocument();
    });
  });

  // ── Unauthenticated ────────────────────────────────────────────────────────

  describe('Scenario: Unauthenticated user visits a protected route', () => {
    it('should redirect to /signin', () => {
      // Given no user is logged in
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({ user: null, profile: null }) as ReturnType<typeof useAuth>
      );

      renderProtected(
        <ProtectedRoute>
          <div data-testid="protected-content">Secret</div>
        </ProtectedRoute>
      );

      // Then the sign-in page is shown
      expect(screen.getByTestId('signin-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  // ── Correct role ───────────────────────────────────────────────────────────

  describe('Scenario: Customer accesses a customer-only route', () => {
    it('should render the protected content', () => {
      // Given a logged-in customer
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({
          user: createMockUser(),
          profile: createMockProfile('customer'),
        }) as ReturnType<typeof useAuth>
      );

      renderProtected(
        <CustomerRoute>
          <div data-testid="customer-content">Customer Dashboard</div>
        </CustomerRoute>
      );

      // Then they can see the content
      expect(screen.getByTestId('customer-content')).toBeInTheDocument();
    });
  });

  describe('Scenario: Vendor accesses a vendor-only route', () => {
    it('should render the protected content', () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({
          user: createMockUser(),
          profile: createMockProfile('vendor'),
        }) as ReturnType<typeof useAuth>
      );

      renderProtected(
        <VendorRoute>
          <div data-testid="vendor-content">Vendor Dashboard</div>
        </VendorRoute>
      );

      expect(screen.getByTestId('vendor-content')).toBeInTheDocument();
    });
  });

  describe('Scenario: Admin accesses an admin-only route', () => {
    it('should render the protected content', () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({
          user: createMockUser(),
          profile: createMockProfile('admin'),
        }) as ReturnType<typeof useAuth>
      );

      renderProtected(
        <AdminRoute>
          <div data-testid="admin-content">Admin Panel</div>
        </AdminRoute>
      );

      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });
  });

  // ── Wrong role ─────────────────────────────────────────────────────────────

  describe('Scenario: Vendor tries to access a customer-only route', () => {
    it('should redirect to home (/)', () => {
      // Given a vendor is logged in
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({
          user: createMockUser(),
          profile: createMockProfile('vendor'),
        }) as ReturnType<typeof useAuth>
      );

      renderProtected(
        <CustomerRoute>
          <div data-testid="customer-content">Customer Dashboard</div>
        </CustomerRoute>
      );

      // Then they are redirected to home
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.queryByTestId('customer-content')).not.toBeInTheDocument();
    });
  });

  describe('Scenario: Customer tries to access a vendor-only route', () => {
    it('should redirect to home (/)', () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({
          user: createMockUser(),
          profile: createMockProfile('customer'),
        }) as ReturnType<typeof useAuth>
      );

      renderProtected(
        <VendorRoute>
          <div data-testid="vendor-content">Vendor Dashboard</div>
        </VendorRoute>
      );

      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.queryByTestId('vendor-content')).not.toBeInTheDocument();
    });
  });

  describe('Scenario: Customer tries to access an admin-only route', () => {
    it('should redirect to home (/)', () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({
          user: createMockUser(),
          profile: createMockProfile('customer'),
        }) as ReturnType<typeof useAuth>
      );

      renderProtected(
        <AdminRoute>
          <div data-testid="admin-content">Admin Panel</div>
        </AdminRoute>
      );

      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });
  });

});
