/**
 * Feature: Navbar — Desktop & Mobile Navigation
 *
 * Testing strategy note:
 * The Navbar renders two copies of each nav item — one in the desktop nav
 * and one in the mobile full-screen panel (always in the DOM, just CSS-translated
 * off-screen). Tests therefore use getAllBy* queries and/or check for the
 * presence/absence of the conditionally-rendered desktop dropdown panel
 * (.absolute.top-full) rather than individual links.
 *
 * Covers:
 *  - Logo render and home link
 *  - Outsource hover dropdown (6 links, Coming Soon badge, correct hrefs)
 *  - Projects hover dropdown (Tenders, Jobs)
 *  - Flat links (Packages, Market Insight)
 *  - Auth CTAs (Sign In → /signin, Sign Up → /user-type)
 *  - "Post a Job" button visible only for logged-in customers
 *  - Mobile hamburger opens / close button closes the slide-in panel
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '@/components/layout/Navbar';
import { renderWithRouter, createMockUser, createMockProfile, createMockAuthValue } from '../../test-utils';

// ── Mock AuthContext ──────────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderNavbar() {
  return renderWithRouter(<Navbar />);
}

/** Returns the wrapping div that carries onMouseEnter/Leave for a dropdown button. */
function getDropdownWrapper(buttonName: RegExp) {
  return screen.getByRole('button', { name: buttonName }).parentElement!;
}

/**
 * The desktop dropdown panel is conditionally rendered as
 * <div className="absolute top-full ..."> — absent from the DOM when closed.
 * Mobile nav links are always in the DOM (CSS-translated off-screen).
 * This helper lets tests distinguish "dropdown open" from "mobile panel only".
 */
function getOpenDropdownPanel(container: HTMLElement) {
  return container.querySelector('.absolute.top-full');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Feature: Navbar', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue(
      createMockAuthValue() as ReturnType<typeof useAuth>
    );
  });

  // ── Logo ───────────────────────────────────────────────────────────────────

  describe('Scenario: Logo renders and links home', () => {
    it('should display the "Collabov" wordmark', () => {
      renderNavbar();
      // Two logos exist (desktop + mobile panel) — both should be present
      expect(screen.getAllByText('Collabov').length).toBeGreaterThanOrEqual(1);
    });

    it('should link the logo to the homepage (/)', () => {
      renderNavbar();
      const logoLinks = screen.getAllByRole('link', { name: /collabov/i });
      logoLinks.forEach(link => expect(link).toHaveAttribute('href', '/'));
    });
  });

  // ── Desktop flat links ─────────────────────────────────────────────────────

  describe('Scenario: Desktop flat navigation links', () => {
    it('should link "Packages" to /packages', () => {
      renderNavbar();
      const links = screen.getAllByRole('link', { name: /^packages$/i });
      links.forEach(link => expect(link).toHaveAttribute('href', '/packages'));
    });

    it('should link "Market Insight" to /market-insight', () => {
      renderNavbar();
      const links = screen.getAllByRole('link', { name: /^market insight$/i });
      links.forEach(link => expect(link).toHaveAttribute('href', '/market-insight'));
    });

    it('should have "Sign In" links all pointing to /signin', () => {
      renderNavbar();
      const signInLinks = screen.getAllByRole('link', { name: /^sign in$/i });
      expect(signInLinks.length).toBeGreaterThanOrEqual(1);
      signInLinks.forEach(link => expect(link).toHaveAttribute('href', '/signin'));
    });

    it('should have "Sign Up" links all pointing to /user-type', () => {
      renderNavbar();
      const signUpLinks = screen.getAllByRole('link', { name: /^sign up$/i });
      expect(signUpLinks.length).toBeGreaterThanOrEqual(1);
      signUpLinks.forEach(link => expect(link).toHaveAttribute('href', '/user-type'));
    });
  });

  // ── Outsource dropdown ─────────────────────────────────────────────────────

  describe('Scenario: Outsource dropdown is closed by default', () => {
    it('should NOT render the desktop dropdown panel before hover', () => {
      const { container } = renderNavbar();
      // The absolute panel is only added to the DOM when isOutsourceOpen is true
      expect(getOpenDropdownPanel(container)).toBeNull();
    });
  });

  describe('Scenario: Outsource dropdown opens on mouse enter', () => {
    it('should render the desktop dropdown panel on mouse enter', () => {
      const { container } = renderNavbar();
      fireEvent.mouseEnter(getDropdownWrapper(/^outsource$/i));
      expect(getOpenDropdownPanel(container)).not.toBeNull();
    });

    it('should link "Dedicated Teams" to /results?type=dedicated', () => {
      const { container } = renderNavbar();
      fireEvent.mouseEnter(getDropdownWrapper(/^outsource$/i));
      const panel = getOpenDropdownPanel(container)!;
      expect(within(panel as HTMLElement).getByRole('link', { name: /^dedicated teams$/i }))
        .toHaveAttribute('href', '/results?type=dedicated');
    });

    it('should link "IT Agencies" to /results?type=agency', () => {
      const { container } = renderNavbar();
      fireEvent.mouseEnter(getDropdownWrapper(/^outsource$/i));
      const panel = getOpenDropdownPanel(container)!;
      expect(within(panel as HTMLElement).getByRole('link', { name: /^it agencies$/i }))
        .toHaveAttribute('href', '/results?type=agency');
    });

    it('should link "MSPs" to /results?type=msp', () => {
      const { container } = renderNavbar();
      fireEvent.mouseEnter(getDropdownWrapper(/^outsource$/i));
      const panel = getOpenDropdownPanel(container)!;
      expect(within(panel as HTMLElement).getByRole('link', { name: /^msps$/i }))
        .toHaveAttribute('href', '/results?type=msp');
    });

    it('should link "Staff Augmentation" to /results?type=staffaug', () => {
      const { container } = renderNavbar();
      fireEvent.mouseEnter(getDropdownWrapper(/^outsource$/i));
      const panel = getOpenDropdownPanel(container)!;
      expect(within(panel as HTMLElement).getByRole('link', { name: /^staff augmentation$/i }))
        .toHaveAttribute('href', '/results?type=staffaug');
    });

    it('should link "Freelancers" to /freelancers and show a "Coming Soon" badge', () => {
      const { container } = renderNavbar();
      fireEvent.mouseEnter(getDropdownWrapper(/^outsource$/i));
      const panel = getOpenDropdownPanel(container)!;
      const freelancersLink = within(panel as HTMLElement).getByRole('link', { name: /freelancers/i });
      expect(freelancersLink).toHaveAttribute('href', '/freelancers');
      expect(within(panel as HTMLElement).getByText(/coming soon/i)).toBeInTheDocument();
    });

    it('should link "Outsourcing Calculator" to /ai-calculator', () => {
      const { container } = renderNavbar();
      fireEvent.mouseEnter(getDropdownWrapper(/^outsource$/i));
      const panel = getOpenDropdownPanel(container)!;
      expect(within(panel as HTMLElement).getByRole('link', { name: /outsourcing calculator/i }))
        .toHaveAttribute('href', '/ai-calculator');
    });

    it('should display section headings for Long Term, Short Term, and Other', () => {
      const { container } = renderNavbar();
      fireEvent.mouseEnter(getDropdownWrapper(/^outsource$/i));
      const panel = getOpenDropdownPanel(container)!;
      expect(within(panel as HTMLElement).getByText(/long term/i)).toBeInTheDocument();
      expect(within(panel as HTMLElement).getByText(/short term/i)).toBeInTheDocument();
      expect(within(panel as HTMLElement).getByText(/^other$/i)).toBeInTheDocument();
    });
  });

  describe('Scenario: Outsource dropdown closes on mouse leave', () => {
    it('should remove the desktop dropdown panel after mouse leave', () => {
      const { container } = renderNavbar();
      const wrapper = getDropdownWrapper(/^outsource$/i);

      fireEvent.mouseEnter(wrapper);
      expect(getOpenDropdownPanel(container)).not.toBeNull();

      fireEvent.mouseLeave(wrapper);
      expect(getOpenDropdownPanel(container)).toBeNull();
    });
  });

  // ── Projects dropdown ──────────────────────────────────────────────────────

  describe('Scenario: Projects dropdown is closed by default', () => {
    it('should NOT render the desktop dropdown panel before hover', () => {
      const { container } = renderNavbar();
      expect(getOpenDropdownPanel(container)).toBeNull();
    });
  });

  describe('Scenario: Projects dropdown opens on mouse enter', () => {
    it('should render the desktop dropdown panel on mouse enter', () => {
      const { container } = renderNavbar();
      fireEvent.mouseEnter(getDropdownWrapper(/^projects$/i));
      expect(getOpenDropdownPanel(container)).not.toBeNull();
    });

    it('should link "Tenders" to /tenders', () => {
      const { container } = renderNavbar();
      fireEvent.mouseEnter(getDropdownWrapper(/^projects$/i));
      const panel = getOpenDropdownPanel(container)!;
      expect(within(panel as HTMLElement).getByRole('link', { name: /^tenders$/i }))
        .toHaveAttribute('href', '/tenders');
    });

    it('should link "Jobs" to /jobs', () => {
      const { container } = renderNavbar();
      fireEvent.mouseEnter(getDropdownWrapper(/^projects$/i));
      const panel = getOpenDropdownPanel(container)!;
      expect(within(panel as HTMLElement).getByRole('link', { name: /^jobs$/i }))
        .toHaveAttribute('href', '/jobs');
    });
  });

  describe('Scenario: Projects dropdown closes on mouse leave', () => {
    it('should remove the desktop dropdown panel after mouse leave', () => {
      const { container } = renderNavbar();
      const wrapper = getDropdownWrapper(/^projects$/i);

      fireEvent.mouseEnter(wrapper);
      expect(getOpenDropdownPanel(container)).not.toBeNull();

      fireEvent.mouseLeave(wrapper);
      expect(getOpenDropdownPanel(container)).toBeNull();
    });
  });

  // ── Customer role: "Post a Job" ────────────────────────────────────────────

  describe('Scenario: Authenticated customer sees "Post a Job"', () => {
    it('should show the "Post a Job" link for a logged-in customer', () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({
          user: createMockUser(),
          profile: createMockProfile('customer'),
        }) as ReturnType<typeof useAuth>
      );
      renderNavbar();
      // Rendered in both desktop nav and mobile panel
      expect(screen.getAllByRole('link', { name: /post a job/i }).length).toBeGreaterThanOrEqual(1);
    });

    it('should link "Post a Job" to /customer/dashboard', () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({
          user: createMockUser(),
          profile: createMockProfile('customer'),
        }) as ReturnType<typeof useAuth>
      );
      renderNavbar();
      screen.getAllByRole('link', { name: /post a job/i }).forEach(link =>
        expect(link).toHaveAttribute('href', '/customer/dashboard')
      );
    });

    it('should NOT show "Post a Job" for a guest (unauthenticated)', () => {
      renderNavbar();
      expect(screen.queryByRole('link', { name: /post a job/i })).not.toBeInTheDocument();
    });

    it('should NOT show "Post a Job" for a logged-in vendor', () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuthValue({
          user: createMockUser(),
          profile: createMockProfile('vendor'),
        }) as ReturnType<typeof useAuth>
      );
      renderNavbar();
      expect(screen.queryByRole('link', { name: /post a job/i })).not.toBeInTheDocument();
    });
  });

  // ── Mobile navigation ──────────────────────────────────────────────────────

  describe('Scenario: Mobile panel starts off-screen', () => {
    it('should apply translate-x-full to the mobile panel when closed', () => {
      const { container } = renderNavbar();
      const mobilePanel = container.querySelector('.fixed.inset-0') as HTMLElement;
      expect(mobilePanel).toHaveClass('translate-x-full');
      expect(mobilePanel).not.toHaveClass('translate-x-0');
    });
  });

  describe('Scenario: Hamburger button toggles the mobile panel', () => {
    it('should slide the panel in when the hamburger is clicked', async () => {
      const user = userEvent.setup();
      const { container } = renderNavbar();

      await user.click(screen.getByRole('button', { name: /toggle menu/i }));

      const mobilePanel = container.querySelector('.fixed.inset-0') as HTMLElement;
      expect(mobilePanel).toHaveClass('translate-x-0');
      expect(mobilePanel).not.toHaveClass('translate-x-full');
    });

    it('should slide the panel out when the close (×) button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = renderNavbar();

      await user.click(screen.getByRole('button', { name: /toggle menu/i }));
      await user.click(screen.getByRole('button', { name: /close menu/i }));

      const mobilePanel = container.querySelector('.fixed.inset-0') as HTMLElement;
      expect(mobilePanel).toHaveClass('translate-x-full');
      expect(mobilePanel).not.toHaveClass('translate-x-0');
    });
  });

  describe('Scenario: Mobile panel contains all navigation links', () => {
    it('should include all Outsource links in the mobile panel', () => {
      const { container } = renderNavbar();
      const mobilePanel = container.querySelector('.fixed.inset-0') as HTMLElement;

      expect(within(mobilePanel).getByRole('link', { name: /^dedicated teams$/i }))
        .toHaveAttribute('href', '/results?type=dedicated');
      expect(within(mobilePanel).getByRole('link', { name: /^it agencies$/i }))
        .toHaveAttribute('href', '/results?type=agency');
      expect(within(mobilePanel).getByRole('link', { name: /^msps$/i }))
        .toHaveAttribute('href', '/results?type=msp');
      expect(within(mobilePanel).getByRole('link', { name: /^staff augmentation$/i }))
        .toHaveAttribute('href', '/results?type=staffaug');
      expect(within(mobilePanel).getByRole('link', { name: /freelancers/i }))
        .toHaveAttribute('href', '/freelancers');
      expect(within(mobilePanel).getByRole('link', { name: /outsourcing calculator/i }))
        .toHaveAttribute('href', '/ai-calculator');
    });

    it('should include Tenders and Jobs in the mobile panel', () => {
      const { container } = renderNavbar();
      const mobilePanel = container.querySelector('.fixed.inset-0') as HTMLElement;

      expect(within(mobilePanel).getByRole('link', { name: /^tenders$/i }))
        .toHaveAttribute('href', '/tenders');
      expect(within(mobilePanel).getByRole('link', { name: /^jobs$/i }))
        .toHaveAttribute('href', '/jobs');
    });

    it('should include Packages and Market Insight in the mobile panel', () => {
      const { container } = renderNavbar();
      const mobilePanel = container.querySelector('.fixed.inset-0') as HTMLElement;

      expect(within(mobilePanel).getByRole('link', { name: /^packages$/i }))
        .toHaveAttribute('href', '/packages');
      expect(within(mobilePanel).getByRole('link', { name: /^market insight$/i }))
        .toHaveAttribute('href', '/market-insight');
    });

    it('should include Sign In and Sign Up CTAs in the mobile panel', () => {
      const { container } = renderNavbar();
      const mobilePanel = container.querySelector('.fixed.inset-0') as HTMLElement;

      expect(within(mobilePanel).getByRole('link', { name: /^sign in$/i }))
        .toHaveAttribute('href', '/signin');
      expect(within(mobilePanel).getByRole('link', { name: /^sign up$/i }))
        .toHaveAttribute('href', '/user-type');
    });
  });

});
