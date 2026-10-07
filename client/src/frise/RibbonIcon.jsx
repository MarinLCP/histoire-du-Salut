// Le dessin du ruban doré du marque-page : le même dans la frise, sous un verset et sur une carte d'accueil
// (décoratif : aria-hidden, le texte ou l'étiquette à côté dit de quoi il s'agit). Couleur : celle du texte
// (fill: currentColor dans le CSS de chaque endroit).

export function RibbonIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 26" aria-hidden="true"><path d="M1 0h14v24l-7-6-7 6z" /></svg>
  );
}
