import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { vi } from 'vitest';

// ── Mock data factories ───────────────────────────────────────────────────────

export const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-test-123',
  email: 'test@collabov.com',
  email_confirmed_at: '2025-01-01T00:00:00Z',
  user_metadata: {},
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

export const createMockProfile = (
  userType: 'customer' | 'vendor' | 'admin' | 'contractor' = 'customer',
  overrides: Record<string, unknown> = {}
) => ({
  id: 'user-test-123',
  email: 'test@collabov.com',
  full_name: 'Test User',
  user_type: userType,
  profile_completed: false,
  onboarding_step: 0,
  verified: false,
  profile_picture_url: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

export const createMockAuthValue = (
  overrides: Record<string, unknown> = {}
) => ({
  user: null,
  profile: null,
  session: null,
  loading: false,
  signUp: vi.fn().mockResolvedValue(undefined),
  signIn: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
  updateProfile: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

// ── Render helpers ────────────────────────────────────────────────────────────

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  routerProps?: MemoryRouterProps;
}

/**
 * Wraps the component in a MemoryRouter for testing.
 * Use `routerProps.initialEntries` to set the starting URL.
 */
export function renderWithRouter(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { routerProps = {}, ...renderOptions } = options;
  return render(
    <MemoryRouter {...routerProps}>
      {ui}
    </MemoryRouter>,
    renderOptions
  );
}
