import { useCallback, useEffect, useState } from 'react';
import { api, getToken } from './api';
import Auth from './Auth';
import Board from './Board';

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sd_user')); } catch { return null; }
  });
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const loggedIn = Boolean(user && getToken());

  const loadProjects = useCallback(async () => {
    try {
      const list = await api.projects();
      setProjects(list);
      setActiveId((id) => id || list[0]?._id || null);
    } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => { if (loggedIn) loadProjects(); }, [loggedIn, loadProjects]);

  function logout() {
    localStorage.removeItem('sd_token');
    localStorage.removeItem('sd_user');
    setUser(null); setProjects([]); setActiveId(null);
  }

  async function createProject(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const p = await api.createProject({ name: newName.trim() });
      setNewName('');
      await loadProjects();
      setActiveId(p._id);
    } catch (err) { setError(err.message); }
  }

  if (!loggedIn) return <Auth onAuth={setUser} />;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">SprintDesk</div>
        <nav aria-label="Projects">
          <h2 className="side-title">Projects</h2>
          <ul className="project-list">
            {projects.map((p) => (
              <li key={p._id}>
                <button className={p._id === activeId ? 'active' : ''} onClick={() => setActiveId(p._id)}>{p.name}</button>
              </li>
            ))}
          </ul>
          <form onSubmit={createProject} className="new-project">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New project name" aria-label="New project name" />
            <button className="btn small">Create project</button>
          </form>
          {error && <p className="error">{error}</p>}
        </nav>
        <div className="me">
          <span>{user.name}</span>
          <button className="link" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="main">
        {activeId ? <Board key={activeId} projectId={activeId} user={user} /> : (
          <div className="empty">
            <h2>No projects yet</h2>
            <p>Create your first project from the sidebar to start planning a sprint.</p>
          </div>
        )}
      </main>
    </div>
  );
}
