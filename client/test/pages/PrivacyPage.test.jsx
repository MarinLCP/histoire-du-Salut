// @vitest-environment jsdom
// Tests de la page « Confidentialité » (/confidentialite) : son titre, et comment tout supprimer.

import { describe, test, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PrivacyPage from '../../src/pages/PrivacyPage.jsx';

afterEach(cleanup);

describe('PrivacyPage', () => {
  test('dit ce que le site garde et comment tout supprimer', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Confidentialité' })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Avec un compte' })).toBeDefined();
    expect(screen.getByText(/Supprimer mon\s+compte/)).toBeDefined();
  });
});
