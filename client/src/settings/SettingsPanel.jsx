// Le panneau Paramètres : ouvert par le bouton de la barre du haut, il glisse depuis la droite (SidePanel).
// On y règle la taille du texte et le thème (et, plus bas, la sauvegarde des notes et surlignages).

import SidePanel from '../components/SidePanel.jsx';
import './SettingsPanel.css';

const TEXT_SIZE_CHOICES = [['small', 'Petite'], ['normal', 'Normale'], ['large', 'Grande']];
const THEME_CHOICES = [['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']];

// settings : les réglages actuels ; onChange(changes) : en changer un ; children : des sections en plus
function SettingsPanel({ settings, onChange, onClose, children }) {
  return (
    <SidePanel title="Paramètres" onClose={onClose}>
      <ChoiceGroup legend="Taille du texte" name="text-size" choices={TEXT_SIZE_CHOICES}
        value={settings.textSize} onPick={(textSize) => onChange({ textSize })} />
      <ChoiceGroup legend="Thème" name="theme" choices={THEME_CHOICES}
        value={settings.theme} onPick={(theme) => onChange({ theme })} />
      {children}
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
