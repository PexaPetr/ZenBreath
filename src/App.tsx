import "./App.css";

export default function App() {
  return (
    <main className="app">
      <header className="app__header">
        <h1>ZenBreath</h1>
        <p className="app__tagline">Základ pro aplikaci z Google AI Studio</p>
      </header>
      <section className="app__card" aria-labelledby="next-steps-heading">
        <h2 id="next-steps-heading">Další kroky</h2>
        <ol className="app__list">
          <li>Zkopírujte sem komponenty a logiku z AI Studia (náhled „show code“).</li>
          <li>
            Volitelně nastavte <code>.env</code> podle <code>.env.example</code> pro Gemini API.
          </li>
          <li>
            <code>npm run dev</code> lokálně, poté push na GitHub a deploy (Vercel / Netlify).
          </li>
        </ol>
      </section>
    </main>
  );
}
