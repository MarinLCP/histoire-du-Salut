// Le petit bateau de la frise (maquette V7.1) : il descend la cascade au fil de la lecture.

export function Boat({ left, top }) {
  return (
    <div className="frise-boat" style={{ left, top }} aria-hidden="true">
      <svg viewBox="0 0 48 48">
        <path d="M6 30h36l-5 9H11z" fill="#c8862b" stroke="#6b4310" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M14 30V22h20v8" fill="#e7b45a" stroke="#6b4310" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M19 22v-5h10v5" fill="#f2cf86" stroke="#6b4310" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M24 17V9l7 4z" fill="#fff8e6" stroke="#6b4310" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M4 41c4-2 6-2 10 0s6 2 10 0 6-2 10 0 6 2 10 0" fill="none" stroke="#ffffff" strokeWidth="1.6"
          strokeLinecap="round" />
      </svg>
    </div>
  );
}
