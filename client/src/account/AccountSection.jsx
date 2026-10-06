// La section « Mon compte » du panneau Paramètres : se connecter ou créer un compte ; une fois connecté,
// l'e-mail du compte, « Se déconnecter » et « Supprimer mon compte » (mot de passe retapé pour confirmer).
// account : useAccount() (branché dans App)

import { useState } from 'react';
import SignInForm from './SignInForm.jsx';
import './AccountSection.css';

function AccountSection({ account }) {
  return (
    <section className="account-section" aria-labelledby="account-title">
      <h3 id="account-title">Mon compte</h3>
      <AccountContent account={account} />
    </section>
  );
}

function AccountContent({ account }) {
  if (account.user === undefined) return <p>…</p>;
  if (account.user === null) {
    return (
      <>
        <p>Un compte garde tes notes, tes surlignages et ton marque-page, sur tous tes appareils.</p>
        <SignInForm account={account} />
      </>
    );
  }
  return <SignedIn account={account} />;
}

function SignedIn({ account }) {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <>
      <p>Connecté : <strong>{account.user.email}</strong></p>
      <div className="account-actions">
        <button type="button" onClick={account.logOut}>Se déconnecter</button>
        {!isDeleting && <button type="button" onClick={() => setIsDeleting(true)}>Supprimer mon compte</button>}
      </div>
      {isDeleting && <DeleteAccountForm account={account} onCancel={() => setIsDeleting(false)} />}
    </>
  );
}

function DeleteAccountForm({ account, onCancel }) {
  const [error, setError] = useState(null);

  async function submit(event) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get('password');
    try {
      await account.deleteAccount({ password });
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <form className="account-form" onSubmit={submit}>
      <p>Ton compte et tout ce qu'il contient seront effacés, sans retour possible.</p>
      <label>
        Mot de passe, pour confirmer
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error && <p className="account-error" role="alert">{error}</p>}
      <button type="submit" className="account-danger">Supprimer définitivement</button>
      <button type="button" className="account-link" onClick={onCancel}>Annuler</button>
    </form>
  );
}

export default AccountSection;
