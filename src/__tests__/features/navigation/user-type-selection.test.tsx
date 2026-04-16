/**
 * Feature: Account Type Selection
 *
 * Verifies that the /user-type page renders the three account type cards
 * correctly and that navigation links point to the right routes per spec.
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import UserTypeSelection from '@/pages/UserTypeSelection';
import { renderWithRouter } from '../../test-utils';

describe('Feature: Account Type Selection (/user-type)', () => {

  describe('Scenario: Display three account type options', () => {
    it('should render Buyer, Vendor, and Freelancer headings', () => {
      // Given the user navigates to the account type selection page
      renderWithRouter(<UserTypeSelection />);

      // Then all three account type headings are visible
      expect(screen.getByRole('heading', { name: /^buyer$/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /^vendor$/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /^freelancer$/i })).toBeInTheDocument();
    });

    it('should display a "Coming Soon" badge on the Freelancer card', () => {
      renderWithRouter(<UserTypeSelection />);
      expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    });

    it('should render the "Join Collabov" page title', () => {
      renderWithRouter(<UserTypeSelection />);
      expect(screen.getByRole('heading', { name: /join collabov/i })).toBeInTheDocument();
    });
  });

  describe('Scenario: Buyer card links to /signup/customer', () => {
    it('should link the "Sign up as a Buyer" CTA to /signup/customer', () => {
      // Given the user sees the Buyer card
      renderWithRouter(<UserTypeSelection />);

      // When they inspect the CTA link
      const buyerLink = screen.getByRole('link', { name: /sign up as a buyer/i });

      // Then it navigates to the buyer signup flow
      expect(buyerLink).toHaveAttribute('href', '/signup/customer');
    });
  });

  describe('Scenario: Vendor card links to /vendor/signup', () => {
    it('should link the "Join as a Provider" CTA to /vendor/signup', () => {
      renderWithRouter(<UserTypeSelection />);
      const vendorLink = screen.getByRole('link', { name: /join as a provider/i });
      expect(vendorLink).toHaveAttribute('href', '/vendor/signup');
    });
  });

  describe('Scenario: Freelancer option is disabled (Coming Soon)', () => {
    it('should disable the "Join Waitlist" button', () => {
      // Given the Freelancer feature is not yet live
      renderWithRouter(<UserTypeSelection />);

      // Then the CTA button is non-interactive
      const waitlistButton = screen.getByRole('button', { name: /join waitlist/i });
      expect(waitlistButton).toBeDisabled();
    });
  });

  describe('Scenario: Existing user sign-in shortcut', () => {
    it('should display a "Sign in" link pointing to /signin', () => {
      renderWithRouter(<UserTypeSelection />);

      // RTL may find multiple "Sign in" links (logo link + footer link); pick the one at the bottom
      const signInLinks = screen.getAllByRole('link', { name: /sign in/i });
      const signInFooterLink = signInLinks.find(
        (el) => el.getAttribute('href') === '/signin'
      );
      expect(signInFooterLink).toBeDefined();
    });
  });

});
