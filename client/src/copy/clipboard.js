// Copie un texte dans le presse-papiers. Renvoie une promesse, rejetée si la copie échoue.

export async function copyText(text) {
  // L'API moderne n'existe qu'en HTTPS ou sur localhost (contexte "sécurisé")
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Ex. sur le téléphone en dev (http://10.x.x.x:5173) : on passe par l'ancienne méthode
  copyWithHiddenTextarea(text);
}

// Ancienne méthode : sélectionner le texte dans une zone de texte invisible, puis "copier"
function copyWithHiddenTextarea(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';

  // Quand un <dialog> est ouvert, le reste de la page est inactif (on ne peut rien y sélectionner) :
  // la zone de texte doit donc être placée DANS le dialog ouvert
  const container = document.querySelector('dialog[open]') ?? document.body;
  container.append(textarea);
  textarea.select();
  // Nécessaire sur iPhone, où select() seul ne suffit pas
  textarea.setSelectionRange(0, text.length);

  const hasCopied = document.execCommand('copy');
  textarea.remove();
  if (!hasCopied) throw new Error('Copie impossible');
}
