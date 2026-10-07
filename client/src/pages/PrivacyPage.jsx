// Page « Confidentialité » (adresse /confidentialite) : quelles données le site garde, pourquoi, combien de temps,
// et comment tout supprimer. Google demande son lien sur l'écran de consentement de « Continuer avec Google »,
// et le RGPD l'impose. Si le code change ce qui est gardé (nouvelle table, nouveau service), cette page change aussi.

import './PrivacyPage.css';

// L'adresse où écrire pour exercer ses droits. À remplacer par l'adresse du nom de domaine dès qu'il est acheté (V11.3).
const CONTACT_EMAIL = 'contact@ton-domaine.fr';
// Date de la dernière modification de cette page (à changer à chaque modification)
const UPDATED_ON = '7 octobre 2026';

function PrivacyPage() {
  return (
    <article className="privacy-page" aria-labelledby="privacy-title">
      <h1 id="privacy-title">Confidentialité</h1>
      <p className="privacy-updated">Mise à jour le {UPDATED_ON}</p>

      <p>
        <strong>L'essentiel :</strong> tu peux lire tout le site sans compte et sans rien donner. Un compte sert
        seulement à retrouver tes notes, surlignages et marque-pages sur tous tes appareils. Pas de publicité, pas de
        mesure d'audience, rien n'est vendu ni partagé. Tu peux tout supprimer toi-même, en un clic.
      </p>

      <h2>Sans compte</h2>
      <p>
        Tes réglages (taille du texte, thème), tes notes, tes surlignages et tes marque-pages restent dans ton
        navigateur (le « stockage local »). Ils ne sont pas envoyés au site. Pour les effacer, vide les données du
        site dans ton navigateur.
      </p>

      <h2>Avec un compte</h2>
      <p>Le site garde :</p>
      <ul>
        <li>ton adresse e-mail, pour te reconnaître et t'envoyer le code qui la valide ;</li>
        <li>
          ton mot de passe, seulement sous une forme brouillée (« hachée ») : personne, pas même nous, ne peut le
          relire ;
        </li>
        <li>
          si tu passes par « Continuer avec Google » : ton identifiant chez Google et ton prénom. Google ne nous donne
          ni ton mot de passe ni accès à tes autres données ;
        </li>
        <li>tes notes (privées : elles ne sont jamais montrées à personne), tes surlignages et tes marque-pages ;</li>
        <li>
          si tu partages ta progression : le lien de partage. Il montre ton prénom (compte Google) et l'endroit où tu
          en es, jamais ton e-mail ni tes notes. « Arrêter de partager » le supprime.
        </li>
      </ul>

      <h2>Combien de temps</h2>
      <ul>
        <li>Ton compte et ce qu'il contient : tant que tu ne le supprimes pas.</li>
        <li>Le code envoyé par e-mail : 15 minutes.</li>
        <li>Ta connexion : 30 jours, ou jusqu'à ce que tu te déconnectes.</li>
      </ul>

      <h2>Cookies</h2>
      <p>
        Un seul cookie quand tu es connecté, pour que le site se souvienne de ta connexion, et un cookie de 10 minutes
        pendant « Continuer avec Google ». Ils sont indispensables au fonctionnement du compte : aucun cookie de
        publicité ou de mesure d'audience, c'est pourquoi le site ne te demande pas ton accord.
      </p>

      <h2>Qui d'autre voit tes données</h2>
      <ul>
        <li><strong>Render</strong> héberge le site et sa base de données.</li>
        <li><strong>Brevo</strong> envoie les e-mails du site (le code de validation) : il reçoit ton adresse e-mail.</li>
        <li><strong>Google</strong>, seulement si tu choisis « Continuer avec Google ».</li>
      </ul>
      <p>Les polices de caractères sont hébergées par le site lui-même : les afficher n'appelle aucun autre service.</p>

      <h2>Tes droits</h2>
      <p>
        Tu peux supprimer ton compte et tout ce qu'il contient : <strong>Compte et réglages → Supprimer mon
        compte</strong>. La suppression est immédiate et définitive. Pour consulter, corriger ou récupérer tes données,
        ou pour toute question, écris à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Tu peux aussi
        t'adresser à la CNIL (<a href="https://www.cnil.fr">cnil.fr</a>).
      </p>
    </article>
  );
}

export default PrivacyPage;
