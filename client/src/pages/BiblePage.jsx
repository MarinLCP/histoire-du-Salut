// Page « Bible entière » (adresse /bible). Pour l'instant un titre : la lecture des 74 livres,
// chapitre après chapitre, arrive en V7.0b (API) et V7.0c (cette page).
// Cachée en ligne tant qu'elle n'est pas finie (feature flag "bible", voir App.jsx).

import './BiblePage.css';

function BiblePage() {
  return (
    <section className="bible-page">
      <h1>La Bible entière</h1>
      <p>Les 74 livres, chapitre après chapitre : bientôt ici.</p>
    </section>
  );
}

export default BiblePage;
