import { useRef, useState } from 'react';
import { api } from './api';
import ParallaxDecor from './ParallaxDecor';

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const heroRef = useRef(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function tiltHero(e) {
    if (e.pointerType !== 'mouse' || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    heroRef.current.style.setProperty('--tilt-x', `${y * -11}deg`);
    heroRef.current.style.setProperty('--tilt-y', `${x * 13}deg`);
  }

  function resetHero() {
    heroRef.current?.style.removeProperty('--tilt-x');
    heroRef.current?.style.removeProperty('--tilt-y');
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = mode === 'login' ? await api.login(form) : await api.register(form);
      localStorage.setItem('sd_token', res.token);
      localStorage.setItem('sd_user', JSON.stringify(res.user));
      onAuth(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <ParallaxDecor />
      <div className="auth-intro">
        <div className="auth-wordmark"><span className="brand-mark" aria-hidden="true">S</span> SprintDesk</div>
        <div className="auth-story">
          <p className="eyebrow">A workboard for small teams</p>
          <h1>Make room for the work that matters.</h1>
          <svg className="hand-underline" viewBox="0 0 190 18" aria-hidden="true">
            <path d="M3 12C49 3 104 4 187 9" />
          </svg>
          <p className="auth-copy">Plan a sprint and keep each ticket moving. See what is ready to ship. Everything stays with the project.</p>
        </div>
        <div className="hero-stage">
          <div className="hero-stack" ref={heroRef} onPointerMove={tiltHero} onPointerLeave={resetHero} aria-hidden="true">
            <span className="hero-sheet sheet-back" />
            <span className="hero-sheet sheet-middle" />
            <div className="board-note">
              <div className="board-note-head"><span>SPRINT BOARD</span><span className="note-rule" /></div>
              <div className="mini-board">
                <div className="mini-lane"><span className="lane-label">To do</span><span className="lane-mark" /><span className="lane-mark short" /></div>
                <div className="mini-lane lane-active"><span className="lane-label">In progress</span><span className="lane-mark" /></div>
                <div className="mini-lane"><span className="lane-label">In review</span><span className="lane-mark short" /></div>
                <div className="mini-lane lane-done"><span className="lane-label">Done</span><span className="lane-mark" /></div>
              </div>
            </div>
            <span className="paper-sticker">Sprint notes</span>
          </div>
          <svg className="sketch-arrow" viewBox="0 0 112 50" aria-hidden="true">
            <path d="M4 37C32 8 68 8 94 23M80 10l16 14-21 5" />
          </svg>
        </div>
        <p className="auth-footnote">Less chasing. A clearer view of what comes next.</p>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow form-eyebrow">{mode === 'login' ? 'Welcome back' : 'Start with a project'}</p>
        <h2>{mode === 'login' ? 'Pick up where you left off.' : 'Set up your workspace.'}</h2>
        <p className="form-intro">{mode === 'login' ? 'Your team’s board is waiting.' : 'Make an account to plan your first sprint.'}</p>
        {mode === 'register' && (
          <label>Name<input value={form.name} onChange={set('name')} required autoComplete="name" /></label>
        )}
        <label>Email<input type="email" value={form.email} onChange={set('email')} required autoComplete="email" /></label>
        <label>Password<input type="password" minLength={6} value={form.password} onChange={set('password')} required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary auth-submit" disabled={busy}>{busy ? 'One moment…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
        <button type="button" className="link auth-toggle" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  );
}
