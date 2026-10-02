// La frise : une cascade de blocs à gauche du texte (maquette V7.1 validée, d'après le dessin de Marin).
// Vue d'ensemble : un grand escalier, un bloc par époque (ou grand ensemble), ses enfants en petites marches.
// Les blocs sont placés en position absolue, au pixel près, par une fonction pure (cascadeLayout.js).
// Cachée en ligne tant qu'elle n'est pas finie (feature flag "frise", voir HistoryPage.jsx).

import { memo } from 'react';
import { Icon } from './Icon.jsx';
import { layoutOverview } from './cascadeLayout.js';
import { useElementSize } from './useElementSize.js';
import { useOverview } from './useOverview.js';
import './Frise.css';

// mode : 'history' (histoire du salut) ou 'bible' (Bible entière)
function Frise({ mode }) {
  const tree = useOverview(mode);
  const [stageRef, size] = useElementSize();
  const blocks = size.width > 0 ? layoutOverview(tree, size) : [];

  return (
    <nav className="frise" aria-label="Frise">
      <div className="frise-stage" ref={stageRef}>
        {blocks.map((block) => <CascadeBlock key={block.key} block={block} />)}
      </div>
    </nav>
  );
}

// Un bloc : un rectangle de couleur (un bleu par niveau) ; seuls les blocs de l'escalier ont un titre,
// les petites marches sont un simple décor (aria-hidden : les lecteurs d'écran les ignorent)
function CascadeBlock({ block }) {
  const style = {
    left: block.left, top: block.top, width: block.width, height: block.height, zIndex: block.z,
    borderRadius: `0 ${block.radius}px 0 0`,
  };
  const className = `frise-block depth-${block.depth}${block.small ? ' small' : ''}`;

  if (!block.labelled) return <div className={className} style={style} aria-hidden="true" />;
  return (
    <div className={className} style={style}>
      <span className="frise-label">
        <Icon name={block.node.icon} />
        <span>{block.node.title}</span>
      </span>
    </div>
  );
}

// memo : la frise ne se redessine pas quand la lecture change à côté (surlignage, menu d'un verset...)
export default memo(Frise);
