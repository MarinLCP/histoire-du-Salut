// Gestes et repères communs aux parcours.

// Le premier verset de la Création (Gn 1,1), trouvé par son texte comme le ferait un utilisateur
export function firstVerse(page) {
  return page.getByRole('button', { name: /AU COMMENCEMENT/ });
}

// Appui long : on appuie, on attend plus que les 500 ms de l'app, on relâche
export async function longPress(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();

  await page.mouse.move(box.x + 30, box.y + 10);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
}

// Fait défiler jusqu'en bas de la page, comme un pouce qui scrolle
export async function scrollToBottom(page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}
