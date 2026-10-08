// Le formulaire pour se connecter ou créer un compte (e-mail + mot de passe), avec un lien pour passer
// de l'un à l'autre. Utilisé dans « Mon compte » (Paramètres) et dans le menu d'un verset (pour garder une note).
// Une adresse pas encore validée : le formulaire demande alors le code reçu par e-mail (CodeForm).
// account : useAccount() ; startWith : 'login' ou 'create' (l'onglet ouvert au départ)

import { useState } from 'react';
import './SignInForm.css';

const MODES = {
  login: {
    action: 'logIn', submit: 'Se connecter', switchTo: 'create', switchLabel: 'Pas encore de compte ? Créer un compte',
    autoComplete: 'current-password', passwordHint: '', minLength: undefined,
  },
  create: {
    action: 'createAccount', submit: 'Créer mon compte', switchTo: 'login', switchLabel: 'Déjà un compte ? Se connecter',
    autoComplete: 'new-password', passwordHint: ' (10 caractères au moins)', minLength: 10,
  },
};

function SignInForm({ account, startWith = 'login' }) {
  const [mode, setMode] = useState(startWith);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  // L'adresse à qui un code vient d'être envoyé (il faut le taper), ou null
  // L'inscription en attente de son code : l'adresse, et le mot de passe tapé (renvoyé avec le code : le serveur
  // vérifie que c'est bien cette inscription qu'on valide). Gardé en mémoire seulement, le temps de taper le code
  const [pending, setPending] = useState(null);
  const settings = MODES[mode];

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSending(true);
    setError(null);
    try {
      const password = form.get('password');
      const result = await account[settings.action]({ email: form.get('email'), password });
      if (result?.verificationNeeded) setPending({ email: result.email, password });
    } catch (submitError) {
      setError(submitError.message);
    }
    setIsSending(false);
  }

  if (pending) return <CodeForm account={account} {...pending} onBack={() => setPending(null)} />;
  const switchMode = () => { setMode(settings.switchTo); setError(null); };
  return (
    <div className="account-sign-in">
      {account.options?.google && <GoogleButton />}
      {mode === 'create' && account.options?.emailSignUp === false
        ? <EmailSignUpSoon hasGoogle={account.options?.google} onSwitch={switchMode} />
        : <EmailForm settings={settings} error={error} isSending={isSending} onSubmit={submit} onSwitch={switchMode} />}
    </div>
  );
}

// La page de connexion de Google s'ouvre (un vrai lien : on quitte le site, puis on y revient connecté)
function GoogleButton() {
  return <a className="account-google" href="/api/auth/google">Continuer avec Google</a>;
}

// Pas de service d'envoi d'e-mails réglé : pas de compte par e-mail (Google, s'il est réglé, est proposé au-dessus)
function EmailSignUpSoon({ hasGoogle, onSwitch }) {
  return (
    <div className="account-form">
      <p>La création de compte par e-mail arrive bientôt{hasGoogle && ' : utilise « Continuer avec Google »'}.</p>
      <button type="button" className="account-link" onClick={onSwitch}>Déjà un compte ? Se connecter</button>
    </div>
  );
}

function EmailForm({ settings, error, isSending, onSubmit, onSwitch }) {
  return (
    <form className="account-form" onSubmit={onSubmit}>
      <label>
        E-mail
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Mot de passe{settings.passwordHint}
        <input name="password" type="password" autoComplete={settings.autoComplete} minLength={settings.minLength} required />
      </label>
      {error && <p className="account-error" role="alert">{error}</p>}
      <button type="submit" className="account-primary" disabled={isSending}>{settings.submit}</button>
      <button type="button" className="account-link" onClick={onSwitch}>{settings.switchLabel}</button>
    </form>
  );
}

// Le code de 6 chiffres reçu par e-mail : une fois tapé, le compte est validé et le lecteur connecté
function CodeForm({ account, email, password, onBack }) {
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setError(null);
    try {
      await account.verifyEmail({ email, password, code: new FormData(event.currentTarget).get('code') });
    } catch (verifyError) {
      setError(verifyError.message);
    }
  }

  async function resend() {
    setError(null);
    try {
      await account.resendEmailCode(email);
      setMessage('Un nouveau code vient de partir.');
    } catch (resendError) {
      setError(resendError.message);
    }
  }

  return (
    <form className="account-form" onSubmit={submit}>
      <p>Un code de 6 chiffres a été envoyé à <strong>{email}</strong>. Pense à regarder les courriers indésirables.</p>
      <label>
        Code reçu par e-mail
        <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required />
      </label>
      {message && <p role="status">{message}</p>}
      {error && <p className="account-error" role="alert">{error}</p>}
      <button type="submit" className="account-primary">Valider</button>
      <button type="button" className="account-link" onClick={resend}>Renvoyer le code</button>
      <button type="button" className="account-link" onClick={onBack}>Changer d'adresse</button>
    </form>
  );
}

export default SignInForm;
