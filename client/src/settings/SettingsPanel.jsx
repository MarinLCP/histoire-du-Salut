// Le panneau du compte et des réglages : ouvert par le bouton « personne » (en haut à droite), il glisse depuis
// la droite (SidePanel). D'abord « Mon compte » (children), puis l'affichage : taille du texte et thème,
// et en bas le lien vers la page « Confidentialité ».

import SidePanel from '../components/SidePanel.jsx';
import './SettingsPanel.css';

const TEXT_SIZE_CHOICES = [['small', 'Petite'], ['normal', 'Normale'], ['large', 'Grande']];
const THEME_CHOICES = [['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']];

// settings : les réglages actuels ; onChange(changes) : en changer un ; children : des sections en plus
function SettingsPanel({ settings, onChange, onClose, children }) {
  return (
    <SidePanel title="Compte et réglages" onClose={onClose}>
      {children}
      <ChoiceGroup legend="Taille du texte" name="text-size" choices={TEXT_SIZE_CHOICES}
        value={settings.textSize} onPick={(textSize) => onChange({ textSize })} />
      <ChoiceGroup legend="Thème" name="theme" choices={THEME_CHOICES}
        value={settings.theme} onPick={(theme) => onChange({ theme })} />
      {/* Un vrai lien (pas Link du routeur) : le panneau se ferme avec le changement de page */}
      <a className="settings-privacy" href="/confidentialite">Confidentialité</a>
    </SidePanel>
  );
}

// Un choix parmi quelques valeurs : des boutons radio, affichés côte à côte
function ChoiceGroup({ legend, name, choices, value, onPick }) {
  return (
    <fieldset className="settings-choice">
      <legend>{legend}</legend>
      <div className="settings-options">
        {choices.map(([choice, label]) => (
          <label key={choice}>
            <input type="radio" name={name} value={choice} checked={value === choice} onChange={() => onPick(choice)} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default SettingsPanel;
