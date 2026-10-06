// Le formulaire pour se connecter ou créer un compte (e-mail + mot de passe), avec un lien pour passer
// de l'un à l'autre. Utilisé dans « Mon compte » (Paramètres) et, plus tard, quand il faut un compte.
// account : useAccount() ; startWith : 'login' ou 'create' (l'onglet ouvert au départ)

import { useState } from 'react';

const MODES = {
  login: { action: 'logIn', submit: 'Se connecter', switchTo: 'create', switchLabel: 'Pas encore de compte ? Créer un compte', autoComplete: 'current-password' },
  create: { action: 'createAccount', submit: 'Créer mon compte', switchTo: 'login', switchLabel: 'Déjà un compte ? Se connecter', autoComplete: 'new-password' },
};

function SignInForm({ account, startWith = 'login' }) {
  const [mode, setMode] = useState(startWith);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const settings = MODES[mode];

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSending(true);
    setError(null);
    try {
      await account[settings.action]({ email: form.get('email'), password: form.get('password') });
    } catch (submitError) {
      setError(submitError.message);
      setIsSending(false);
    }
  }

  return (
    <form className="account-form" onSubmit={submit}>
      <label>
        E-mail
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Mot de passe{mode === 'create' && ' (10 caractères au moins)'}
        <input name="password" type="password" autoComplete={settings.autoComplete} minLength={mode === 'create' ? 10 : undefined} required />
      </label>
      {error && <p className="account-error" role="alert">{error}</p>}
      <button type="submit" className="account-primary" disabled={isSending}>{settings.submit}</button>
      <button type="button" className="account-link" onClick={() => { setMode(settings.switchTo); setError(null); }}>
        {settings.switchLabel}
      </button>
    </form>
  );
}

export default SignInForm;
