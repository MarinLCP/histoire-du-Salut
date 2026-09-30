import Passage from './components/Passage.jsx';
import { samplePassage } from './data/samplePassage.js';

function App() {
  return (
    <main>
      <Passage passage={samplePassage} />
    </main>
  );
}

export default App;
