// La frise : une cascade de blocs à gauche du texte (maquette V7.1 validée, d'après le dessin de Marin).
// - Vue d'ensemble : un grand escalier, un bloc par époque (ou grand ensemble), ses enfants en petites marches.
// - Clic sur un bloc de l'escalier : la lecture y saute, et on descend d'un niveau ; les niveaux du dessus
//   deviennent des bandes verticales à gauche (clic = remonter). Un seul niveau cliquable à la fois.
// - Onglets au-dessus : vue d'ensemble, 2e niveau, niveau le plus fin, autour de ce qu'on lit.
// - Pendant la lecture : le bloc lu est surligné, le bateau descend la cascade, et la frise suit la lecture.
// Les blocs sont placés au pixel près par des fonctions pures (cascadeLayout.js, readingSync.js) ; d'un niveau
// à l'autre, un même nœud garde sa clé React et glisse vers sa nouvelle place (transition CSS).
// Cachée en ligne tant qu'elle n'est pas finie (feature flag "frise", voir HistoryPage.jsx).

import { memo, useState } from 'react';
import { Icon } from './Icon.jsx';
import { Boat } from './Boat.jsx';
import { layoutCascade, boatPlace } from './cascadeLayout.js';
import { pathAfterClick, pathOfTab, pressedTab } from './cascadeNavigation.js';
import { readingPath, currentStair, followReading } from './readingSync.js';
import { useElementSize } from './useElementSize.js';
import { useOverview } from './useOverview.js';
import { useReadingPosition } from './useReadingPosition.js';
import './Frise.css';

// mode : 'history' (histoire du salut) ou 'bible' (Bible entière)
// tabNames : les noms des trois onglets (ex. « Vue d'ensemble », « Épisodes », « Chapitres »)
// onJump(position) : faire sauter la lecture à cette position (passage ou chapitre)
function Frise({ mode, tabNames, onJump }) {
  const tree = useOverview(mode);
  const readingAt = useReadingPosition();
  const [stageRef, size] = useElementSize();
  const [view, setView] = useState({ path: [], changes: 0, readingKey: '' });

  // La lecture a changé de nœud : la frise la suit, au même niveau de zoom
  // (mise à jour pendant l'affichage : React recommence aussitôt, sans effet ni affichage intermédiaire)
  const reading = readingPath(tree, readingAt);
  const readingKey = reading.join('.');
  if (readingKey !== view.readingKey) {
    const followed = followReading(view.path, reading);
    setView({ path: followed ?? view.path, changes: view.changes + (followed ? 1 : 0), readingKey });
  }

  // changes : compte les changements de niveau, pour cacher l'écume et le bateau pendant le glissement
  const goTo = (path) => setView((current) => ({ ...current, path, changes: current.changes + 1 }));

  function openBlock(block) {
    if (block.kind !== 'strip') onJump(block.node.position);
    const next = pathAfterClick(tree, block);
    if (next) goTo(next);
  }

  const blocks = size.width > 0 ? layoutCascade(tree, view.path, size) : [];
  const stair = blocks.length > 0 ? currentStair(tree, view.path, readingAt) : null;

  return (
    <nav className="frise" aria-label="Frise">
      <div className="frise-tabs" role="group" aria-label="Niveau de la frise">
        {tabNames.map((name, tab) => (
          <button key={name} type="button" aria-pressed={pressedTab(view.path) === tab}
            onClick={() => goTo(pathOfTab(tree, reading.length > 0 ? reading : view.path, tab))}>
            {name}
          </button>
        ))}
      </div>
      <div className={`frise-stage morph-${view.changes % 2}`} ref={stageRef}>
        {blocks.map((block) => (
          <CascadeBlock key={block.key} block={block} isRead={startsWith(reading, block.nodePath)} onOpen={openBlock} />
        ))}
        {stair && <Boat {...boatPlace(blocks, stair)} />}
      </div>
    </nav>
  );
}

// Un bloc : un rectangle de couleur (un bleu par niveau). Les bandes et les blocs de l'escalier sont des boutons
// avec leur titre ; les petites marches sont un simple décor (aria-hidden : les lecteurs d'écran les ignorent).
// isRead : la lecture est dans ce bloc. Un bloc de l'escalier a alors son titre surligné, une petite marche
// est éclairée ; une bande, elle, ne change pas (elle contient toujours ce qu'on regarde)
const READ_CLASS = { stair: 'current', step: 'reading-here', strip: null };

function CascadeBlock({ block, isRead, onOpen }) {
  const style = {
    left: block.left, top: block.top, width: block.width, height: block.height, zIndex: block.z,
    borderRadius: `0 ${block.radius}px 0 0`,
    ...(block.foam && { '--foam-x': `${block.foam.x}px`, '--foam-w': `${block.foam.width}px` }),
  };
  const className = [
    'frise-block', `depth-${Math.min(block.depth, 4)}`, block.kind,
    block.small && 'small', block.foam && 'foamy', isRead && READ_CLASS[block.kind],
  ].filter(Boolean).join(' ');

  if (block.kind === 'step') return <div className={className} style={style} aria-hidden="true" />;
  return (
    <button type="button" className={className} style={style} onClick={() => onOpen(block)}
      aria-current={isRead && block.kind === 'stair' ? 'location' : undefined}>
      <span className="frise-label">
        <Icon name={block.node.icon} />
        <span>
          {block.node.title}
          {block.node.detail && <small>{block.node.detail}</small>}
        </span>
      </span>
    </button>
  );
}

// Le chemin `path` commence-t-il par `prefix` ? (ex. [1, 0, 2] commence par [1, 0])
function startsWith(path, prefix) {
  return prefix.length <= path.length && prefix.every((index, rank) => path[rank] === index);
}

// memo : la frise ne se redessine pas quand la page change à côté (surlignage, menu d'un verset...)
export default memo(Frise);
