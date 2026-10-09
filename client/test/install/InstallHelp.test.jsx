// @vitest-environment jsdom
// Tests de « comment installer l'application » : le bouton quand le navigateur sait installer, les gestes sur
// iPhone, le menu ailleurs, rien quand l'app est déjà installée.

import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import InstallHelp from '../../src/install/InstallHelp.jsx';

const originalUserAgent = navigator.userAgent;
const setUserAgent = (value) => Object.defineProperty(navigator, 'userAgent', { value, configurable: true });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setUserAgent(originalUserAgent);
});

// Le navigateur propose d'installer (Android, Chrome, Edge) ; accepted : la réponse du lecteur
function browserOffersInstall(accepted = true) {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome: accepted ? 'accepted' : 'dismissed' });
  act(() => window.dispatchEvent(event));
  return event;
}

describe('InstallHelp', () => {
  test('un autre navigateur : passer par son menu', () => {
    render(<InstallHelp />);

    expect(screen.getByText(/Dans le menu de ton navigateur/)).toBeDefined();
  });

  test('iPhone : les gestes de Safari (Partager, puis « Sur l\'écran d\'accueil »)', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)');
    render(<InstallHelp />);

    expect(screen.getByText('Partager')).toBeDefined();
    expect(screen.getByText('Sur l\'écran d\'accueil')).toBeDefined();
  });

  test('le navigateur sait installer : notre bouton ouvre sa fenêtre (une seule fois)', async () => {
    render(<InstallHelp />);
    const offer = browserOffersInstall();

    expect(offer.defaultPrevented).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Installer l\'application' }));

    expect(offer.prompt).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Installer l\'application' })).toBeNull());
  });

  test('déjà installée (ouverte depuis son icône) : rien', () => {
    vi.stubGlobal('matchMedia', (query) => ({ matches: query === '(display-mode: standalone)' }));
    const { container } = render(<InstallHelp />);

    expect(container.innerHTML).toBe('');
  });
});
