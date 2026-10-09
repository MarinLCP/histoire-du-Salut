// Les cartes d'accueil (V11.4) : les cartes qui présentent le site à la première visite (rouvertes par
// « Revoir la présentation »). La 4e propose de l'installer comme une application (V12.4), sauf si c'est déjà fait. « Passer », Échap ou un toucher à côté les referment ; « Suivant » (ou glisser
// du doigt, ou les flèches du clavier) passe à la carte d'après ; « Commencer » referme la dernière.
// Les petites illustrations reprennent le style du site (pastilles, blocs bleus de la frise, ruban doré) :
// elles sont décoratives (aria-hidden), tout est dit dans le texte.

import { useEffect, useRef, useState } from 'react';
import { useModalDialog } from '../hooks/useModalDialog.js';
import { TOUCH_SCREEN, useMediaQuery } from '../hooks/useMediaQuery.js';
import { RibbonIcon } from '../frise/RibbonIcon.jsx';
import BookmarkTag from '../components/BookmarkTag.jsx';
import InstallHelp from '../install/InstallHelp.jsx';
import { useInstall } from '../install/useInstall.js';
import './WelcomeCards.css';

// Un glissement de doigt plus long que ça (en px) change de carte
const SWIPE_DISTANCE = 50;

function WelcomeCards({ onClose }) {
  const { dialogRef, backdropProps } = useModalDialog(onClose);
  const nextRef = useRef(null);
  const [index, setIndex] = useState(0);
  // Où le doigt s'est posé (pour un glissement) : pas un état, rien à redessiner
  const swipeStart = useRef(null);
  // Écran tactile : « appui long » ; souris : « clic droit » (les deux marchent partout)
  const isTouch = useMediaQuery(TOUCH_SCREEN);
  const isInstalled = useInstall().way === 'installed';
  const cards = welcomeCards(isTouch, isInstalled);
  const card = cards[index];
  const isLast = index === cards.length - 1;

  // Le bouton principal prend le focus une fois la fenêtre ouverte (useModalDialog l'ouvre juste avant ; sans ça,
  // le navigateur le donnerait au premier bouton, « Passer »)
  useEffect(() => nextRef.current.focus(), []);

  const goTo = (next) => setIndex(Math.min(cards.length - 1, Math.max(0, next)));
  const next = () => (isLast ? onClose() : goTo(index + 1));

  function onKeyDown(event) {
    if (event.key === 'ArrowRight') goTo(index + 1);
    if (event.key === 'ArrowLeft') goTo(index - 1);
  }

  function onPointerUp(event) {
    if (swipeStart.current === null) return;
    const distance = event.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(distance) < SWIPE_DISTANCE) return;
    goTo(distance < 0 ? index + 1 : index - 1);
  }

  return (
    <dialog ref={dialogRef} className="welcome" aria-labelledby="welcome-title" onClose={onClose} onKeyDown={onKeyDown}
      {...backdropProps}>
      <div className="welcome-card" onPointerDown={(event) => { swipeStart.current = event.clientX; }} onPointerUp={onPointerUp}>
        <div className="welcome-illustration" aria-hidden="true">{card.illustration}</div>
        <h2 id="welcome-title">{card.title}</h2>
        {card.text}
        <div className="welcome-dots" aria-label={`Carte ${index + 1} sur ${cards.length}`} role="img">
          {cards.map((each, rank) => <span key={each.title} className={rank === index ? 'current' : undefined} />)}
        </div>
        <div className="welcome-buttons">
          {isLast ? <span /> : <button type="button" className="welcome-skip" onClick={onClose}>Passer</button>}
          <button type="button" className="button-primary" onClick={next} ref={nextRef}>
            {isLast ? 'Commencer' : 'Suivant'}
          </button>
        </div>
      </div>
    </dialog>
  );
}

// Les cartes : titre, texte, illustration ; la dernière (installer) seulement si l'app n'est pas déjà installée
function welcomeCards(isTouch, isInstalled) {
  const press = isTouch ? 'Appui long' : 'Clic droit (ou appui long)';
  const cards = [
    {
      title: 'Bienvenue',
      text: (
        <>
          <p>Lis la Bible comme une seule grande histoire, de la Création à l'Apocalypse. Deux façons de lire :</p>
          <ul>
            <li><strong>Histoire du salut</strong> : les grands épisodes, dans l'ordre de l'histoire ;</li>
            <li><strong>Bible entière</strong> : tous les livres, chapitre après chapitre.</li>
          </ul>
        </>
      ),
      illustration: <ReadingsIllustration />,
    },
    {
      title: 'La frise, ta carte',
      text: (
        <p>
          La frise montre où tu en es dans l'histoire{isTouch ? ' (bouton « Frise », en bas à gauche)' : ', à gauche'} :
          le bateau descend la cascade au fil de ta lecture. Touche un bloc pour y aller ; le ruban doré marque
          l'endroit où tu t'étais arrêté.
        </p>
      ),
      illustration: <FriseIllustration />,
    },
    {
      title: 'Tes notes et surlignages',
      text: (
        <p>
          {press} sur un verset : surligner, écrire une note, poser le marque-page, voir les passages parallèles.
          Avec un compte, tu retrouves tes notes sur tous tes appareils ; elles restent privées.
        </p>
      ),
      illustration: <VerseIllustration />,
    },
  ];
  if (isInstalled) return cards;
  return [...cards, {
    title: 'Une application',
    text: (
      <>
        <p>Mets-la sur ton écran d'accueil : elle s'ouvre comme une app, en plein écran, et se relit même sans réseau.</p>
        <InstallHelp />
      </>
    ),
    illustration: <AppIllustration />,
  }];
}

// L'icône de l'application sur un écran d'accueil
function AppIllustration() {
  return (
    <div className="welcome-app">
      <img src="/icons/icon-192.png" alt="" width="64" height="64" />
      <span>Lerouleau</span>
    </div>
  );
}

// Les deux lectures, comme les pastilles de la navigation
function ReadingsIllustration() {
  return (
    <div className="pill-tabs">
      <span className="pill-tab current">Histoire du salut</span>
      <span className="pill-tab">Bible entière</span>
    </div>
  );
}

// Un petit escalier de la frise, avec le bateau et le ruban du marque-page
function FriseIllustration() {
  return (
    <div className="welcome-frise">
      {[0, 1, 2, 3].map((step) => <span key={step} style={{ '--step': step }} />)}
      <svg className="welcome-boat" viewBox="0 0 24 20"><path d="M3 12h18l-3 6H6zM11 3v8M11 3l6 6h-6z" /></svg>
      <RibbonIcon className="welcome-ribbon" />
    </div>
  );
}

// Un verset surligné, avec sa note et son marque-page
function VerseIllustration() {
  return (
    <div className="welcome-verse">
      <p><sup>3</sup><mark>Dieu dit : « Que la lumière soit. »</mark></p>
      <BookmarkTag />
      <p className="welcome-note">Le premier jour : tout commence par une parole.</p>
    </div>
  );
}

export default WelcomeCards;
