// Page « Confidentialité et mentions légales » (adresse /confidentialite), demandée par le RGPD pour un site avec
// des comptes : qui est responsable, quelles données on garde, pourquoi, combien de temps, qui d'autre les voit,
// et comment tout effacer. Le texte décrit ce que fait VRAIMENT le code : à relire à chaque changement des
// données gardées (durées : sessions.js, emailCodes.js, accountRoutes.js côté serveur).

import { Link } from 'react-router';
import './PrivacyPage.css';

const CONTACT = 'contact@lerouleau.com';
const UPDATED_ON = '7 octobre 2026';

function PrivacyPage() {
  return (
    <article className="privacy-page" aria-labelledby="privacy-title">
      <h1 id="privacy-title">Confidentialité et mentions légales</h1>
      <p className="privacy-updated">Mise à jour le {UPDATED_ON}</p>

      <section>
        <h2>En bref</h2>
        <ul>
          <li>Pas de publicité, pas de mesure d'audience, aucune donnée vendue ni transmise pour du marketing.</li>
          <li>Tes notes sont privées : personne d'autre ne les voit, pas même via un lien de partage.</li>
          <li>Un seul cookie, celui qui te garde connecté : pas besoin de bandeau « cookies ».</li>
          <li>Tu peux tout effacer toi-même, à tout moment : « Mon compte » → « Supprimer mon compte ».</li>
        </ul>
      </section>

      <section>
        <h2>Qui est responsable</h2>
        <p>
          L'histoire d'un Salut est un site non commercial, tenu par Marin, un particulier. Pour toute question
          sur tes données : <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </section>

      <section>
        <h2>Sans compte</h2>
        <p>
          Tes réglages (taille du texte, thème), tes surlignages et ton marque-page restent dans ton navigateur,
          sur ton appareil : rien n'est envoyé au site. Ils disparaissent si tu effaces les données du site dans
          ton navigateur.
        </p>
      </section>

      <section>
        <h2>Avec un compte : ce qu'on garde, et combien de temps</h2>
        <dl className="privacy-data">
          <dt>Ton adresse e-mail</dt>
          <dd>Pour te connecter et t'envoyer le code de validation. Gardée tant que ton compte existe.</dd>
          <dt>Ton mot de passe</dt>
          <dd>
            Jamais en clair : seulement une empreinte (scrypt), dont on ne peut pas retrouver le mot de passe.
            Gardée tant que ton compte existe.
          </dd>
          <dt>Le code de validation</dt>
          <dd>Envoyé par e-mail à la création du compte ; gardé sous forme d'empreinte, valable 15 minutes.</dd>
          <dt>Ta session</dt>
          <dd>
            Un cookie (« session ») qui te garde connecté, et son empreinte sur le serveur : 30 jours au plus, ou
            jusqu'à ce que tu te déconnectes.
          </dd>
          <dt>Tes notes, surlignages et marque-pages</dt>
          <dd>Pour les retrouver sur tous tes appareils. Gardés tant que tu ne les retires pas.</dd>
          <dt>Ton lien de partage</dt>
          <dd>
            Seulement si tu choisis « Partager où j'en suis » : il montre l'épisode et le chapitre où tu en es
            (jamais ton e-mail ni tes notes). Il ne marche plus dès que tu arrêtes de partager.
          </dd>
          <dt>Si tu te connectes avec Google</dt>
          <dd>
            L'identifiant que Google donne à ton compte et ton prénom (montré sur ton lien de partage, si tu
            partages). Google ne nous donne pas ton mot de passe.
          </dd>
          <dt>Les essais de connexion</dt>
          <dd>
            Pour bloquer quelqu'un qui essaierait de deviner un mot de passe : le nombre d'échecs par adresse
            e-mail, gardé 15 minutes, en mémoire seulement.
          </dd>
        </dl>
        <p>
          Pourquoi : pour te rendre le service que tu demandes en créant un compte (RGPD, article 6.1.b), et pour
          la sécurité du site (intérêt légitime, article 6.1.f).
        </p>
      </section>

      <section>
        <h2>Qui d'autre voit tes données</h2>
        <ul>
          <li>
            <strong>Render</strong> (render.com), qui héberge le site et sa base de données, sur des serveurs à
            Francfort (Union européenne).
          </li>
          <li><strong>Brevo</strong> (brevo.com), société française, qui envoie les e-mails de code de validation.</li>
          <li><strong>OVH</strong> (ovhcloud.com), société française, qui gère le nom de domaine lerouleau.com.</li>
          <li><strong>Google</strong>, seulement si tu choisis « Continuer avec Google ».</li>
        </ul>
        <p>La police de lecture est hébergée par le site lui-même : aucun appel à Google Fonts.</p>
      </section>

      <section>
        <h2>Tes droits</h2>
        <p>
          Tu peux voir, corriger, emporter ou effacer tes données. Le plus simple pour tout effacer : « Mon
          compte » → « Supprimer mon compte ». Ton compte, tes notes, surlignages, marque-pages, sessions et lien de
          partage sont alors effacés tout de suite, définitivement. Pour le reste, écris
          à <a href={`mailto:${CONTACT}`}>{CONTACT}</a> : réponse sous un mois. Si tu n'es pas satisfait, tu peux
          te plaindre auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noreferrer">cnil.fr</a>).
        </p>
      </section>

      <section>
        <h2>Mentions légales</h2>
        <ul>
          <li>Éditeur : Marin, particulier — <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</li>
          <li>Hébergeur : Render Services, Inc. (render.com).</li>
          <li>Textes bibliques : traduction officielle liturgique, avec l'accord de l'AELF (aelf.org).</li>
          <li>
            Parallèles : <a href="https://www.openbible.info/labs/cross-references/" target="_blank" rel="noreferrer">OpenBible.info</a>,
            licence CC-BY.
          </li>
        </ul>
      </section>

      <p><Link to="/">Revenir à la lecture</Link></p>
    </article>
  );
}

export default PrivacyPage;
