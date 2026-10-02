// La frise : une cascade de blocs à gauche du texte (maquette V7.1 validée, d'après le dessin de Marin).
// - Vue d'ensemble : un grand escalier, un bloc par époque (ou grand ensemble), ses enfants en petites marches.
// - Clic sur un bloc de l'escalier : on descend d'un niveau ; les niveaux du dessus deviennent des bandes
//   verticales à gauche (clic = remonter). Un seul niveau cliquable à la fois, nombre de niveaux quelconque.
// - Onglets au-dessus : vue d'ensemble, 2e niveau, niveau le plus fin.
// Les blocs sont placés au pixel près par une fonction pure (cascadeLayout.js) ; d'un niveau à l'autre,
// un même nœud garde sa clé React et glisse vers sa nouvelle place (transition CSS).
// Cachée en ligne tant qu'elle n'est pas finie (feature flag "frise", voir HistoryPage.jsx).

import { memo, useState } from 'react';
import { Icon } from './Icon.jsx';
import { layoutCascade } from './cascadeLayout.js';
import { pathAfterClick, pathOfTab, pressedTab } from './cascadeNavigation.js';
import { useElementSize } from './useElementSize.js';
import { useOverview } from './useOverview.js';
import './Frise.css';

// mode : 'history' (histoire du salut) ou 'bible' (Bible entière)
// tabNames : les noms des trois onglets (ex. « Vue d'ensemble », « Épisodes », « Chapitres »)
function Frise({ mode, tabNames }) {
  const tree = useOverview(mode);
  // Les nœuds dans lesquels on est entré ([] = vue d'ensemble)
  const [path, setPath] = useState([]);
  const [stageRef, size] = useElementSize();
  const blocks = size.width > 0 ? layoutCascade(tree, path, size) : [];

  function openBlock(block) {
    const next = pathAfterClick(tree, block);
    if (next) setPath(next);
  }

  return (
    <nav className="frise" aria-label="Frise">
      <div className="frise-tabs" role="group" aria-label="Niveau de la frise">
        {tabNames.map((name, tab) => (
          <button key={name} type="button" aria-pressed={pressedTab(path) === tab}
            onClick={() => setPath(pathOfTab(tree, path, tab))}>
            {name}
          </button>
        ))}
      </div>
      <div className="frise-stage" ref={stageRef}>
        {blocks.map((block) => <CascadeBlock key={block.key} block={block} onOpen={openBlock} />)}
      </div>
    </nav>
  );
}

// Un bloc : un rectangle de couleur (un bleu par niveau). Les bandes et les blocs de l'escalier sont des boutons
// avec leur titre ; les petites marches sont un simple décor (aria-hidden : les lecteurs d'écran les ignorent).
function CascadeBlock({ block, onOpen }) {
  const style = {
    left: block.left, top: block.top, width: block.width, height: block.height, zIndex: block.z,
    borderRadius: `0 ${block.radius}px 0 0`,
  };
  const className = `frise-block depth-${Math.min(block.depth, 4)} ${block.kind}${block.small ? ' small' : ''}`;

  if (block.kind === 'step') return <div className={className} style={style} aria-hidden="true" />;
  return (
    <button type="button" className={className} style={style} onClick={() => onOpen(block)}>
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

// memo : la frise ne se redessine pas quand la lecture change à côté (surlignage, menu d'un verset...)
export default memo(Frise);
