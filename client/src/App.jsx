import { useEffect, useState } from 'react';
import Passage from './components/Passage.jsx';
import { fetchPassage } from './api/passages.js';

const FIRST_PASSAGE_ID = 1;

function App() {
  const [passage, setPassage] = useState(null);
  const [error, setError] = useState(null);

  // Charge le passage une fois, à l'affichage de la page
  useEffect(() => {
    // Si le composant disparaît avant la réponse, on ignore celle-ci
    let ignore = false;

    fetchPassage(FIRST_PASSAGE_ID)
      .then((data) => {
        if (!ignore) setPassage(data);
      })
      .catch((fetchError) => {
        if (!ignore) setError(fetchError.message);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // États simples pour l'instant : ils seront soignés en V3.5
  if (error) return <p>{error}</p>;
  if (!passage) return <p>Chargement…</p>;

  return (
    <main>
      <Passage passage={passage} />
    </main>
  );
}

export default App;
