// Un passage écrit en dur, pour la V3.1 (en V3.2, il viendra de l'API).
// Même forme que la réponse de GET /api/passages/:id : le jour où on branche l'API,
// le composant Passage n'aura pas à changer.
// Texte : Gn 1,1-5, copié depuis la base (AELF).

export const samplePassage = {
  id: 1,
  position: 1,
  title: "La Création",
  book: {
    code: "Gn",
    title: "La Genèse"
  },
  start: {
    chapter: "1",
    verse: "1"
  },
  end: {
    chapter: "1",
    verse: "5"
  },
  verses: [
    {
      chapter: "1",
      verse: "1",
      kind: "verse",
      text: "AU COMMENCEMENT,\nDieu créa le ciel et la terre."
    },
    {
      chapter: "1",
      verse: "2",
      kind: "verse",
      text: "La terre était informe et vide,\nles ténèbres étaient au-dessus de l’abîme\net le souffle de Dieu planait au-dessus des eaux."
    },
    {
      chapter: "1",
      verse: "3",
      kind: "verse",
      text: "Dieu dit :\n« Que la lumière soit. »\nEt la lumière fut."
    },
    {
      chapter: "1",
      verse: "4",
      kind: "verse",
      text: "Dieu vit que la lumière était bonne,\net Dieu sépara la lumière des ténèbres."
    },
    {
      chapter: "1",
      verse: "5",
      kind: "verse",
      text: "Dieu appela la lumière « jour »,\nil appela les ténèbres « nuit ».\nIl y eut un soir, il y eut un matin : premier jour."
    }
  ]
};
