// Le panneau Paramètres : ouvert par le bouton de la barre du haut, il glisse depuis la droite.
// On y règle la taille du texte et le thème (et, plus bas, la sauvegarde des notes et surlignages).
// Une fenêtre <dialog> modale (useModalDialog) : Échap ou un toucher sur le fond la referment.

import { useModalDialog } from '../hooks/useModalDialog.js';
import './SettingsPanel.css';

const TEXT_SIZE_CHOICES = [['small', 'Petite'], ['normal', 'Normale'], ['large', 'Grande']];
const THEME_CHOICES = [['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']];

// settings : les réglages actuels ; onChange(changes) : en changer un ; children : des sections en plus
function SettingsPanel({ settings, onChange, onClose, children }) {
  const { dialogRef, backdropProps } = useModalDialog(onClose);

  return (
    <dialog ref={dialogRef} className="settings-panel" onClose={onClose} aria-labelledby="settings-title" {...backdropProps}>
      <div className="settings-content">
        <header className="settings-header">
          <h2 id="settings-title">Paramètres</h2>
          <button type="button" className="settings-close" onClick={onClose}>Fermer</button>
        </header>
        <ChoiceGroup legend="Taille du texte" name="text-size" choices={TEXT_SIZE_CHOICES}
          value={settings.textSize} onPick={(textSize) => onChange({ textSize })} />
        <ChoiceGroup legend="Thème" name="theme" choices={THEME_CHOICES}
          value={settings.theme} onPick={(theme) => onChange({ theme })} />
        {children}
      </div>
    </dialog>
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
