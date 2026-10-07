import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import TicketModal from './TicketModal';

const COLUMNS = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'in_review', label: 'In review' },
  { key: 'done', label: 'Done' },
];

const initials = (name = '') => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const fmt = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export default function Board({ projectId, user }) {
  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [sprintFilter, setSprintFilter] = useState('active');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modal, setModal] = useState(null); // { ticket } where ticket is null for a new one
  const [sprintForm, setSprintForm] = useState(null);
  const [invite, setInvite] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [p, s, t] = await Promise.all([api.project(projectId), api.sprints(projectId), api.tickets(projectId)]);
      setProject(p); setSprints(s); setTickets(t); setError('');
    } catch (e) { setError(e.message); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (!project) return <div className="empty">{error ? <p className="error">{error}</p> : <p>Loading project…</p>}</div>;

  const members = project.members;
  const isAdmin = members.find((m) => m.user._id === user.id)?.role === 'admin';
  const activeSprint = sprints.find((s) => s.status === 'active');

  const visible = tickets.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (sprintFilter === 'all') return true;
    if (sprintFilter === 'backlog') return !t.sprint;
    if (sprintFilter === 'active') return activeSprint ? t.sprint === activeSprint._id : true;
    return t.sprint === sprintFilter;
  });
  const doneCount = visible.filter((t) => t.status === 'done').length;
  const pct = visible.length ? Math.round((doneCount / visible.length) * 100) : 0;

  async function run(fn) {
    try { await fn(); await load(); setError(''); } catch (e) { setError(e.message); }
  }

  const move = (id, status) => {
    const t = tickets.find((x) => x._id === id);
    if (t && t.status !== status) run(() => api.updateTicket(projectId, id, { status }));
  };

  async function createSprint(e) {
    e.preventDefault();
    await run(async () => { await api.createSprint(projectId, sprintForm); setSprintForm(null); });
  }

  async function inviteMember(e) {
    e.preventDefault();
    await run(async () => { await api.addMember(projectId, { email: invite }); setInvite(null); });
  }

  return (
    <div className="board-page">
      <header className="board-head">
        <div>
          <h1>{project.name}</h1>
          <div className="members">
            {members.map((m) => (
              <span key={m.user._id} className="avatar" title={`${m.user.name} (${m.role})`}>{initials(m.user.name)}</span>
            ))}
            {isAdmin && (invite === null
              ? <button className="link" onClick={() => setInvite('')}>Add teammate</button>
              : <form onSubmit={inviteMember} className="inline-form">
                  <input type="email" value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="teammate@email.com" required autoFocus />
                  <button className="btn small">Add</button>
                  <button type="button" className="link" onClick={() => setInvite(null)}>Cancel</button>
                </form>)}
          </div>
        </div>
        <button className="btn primary" onClick={() => setModal({ ticket: null })}>New ticket</button>
      </header>

      {error && <p className="error banner" role="alert">{error}</p>}

      <section className="sprint-bar" aria-label="Sprint">
        <div className="sprint-controls">
          <label>Sprint
            <select value={sprintFilter} onChange={(e) => setSprintFilter(e.target.value)}>
              <option value="active">Active sprint</option>
              <option value="all">All tickets</option>
              <option value="backlog">Backlog (no sprint)</option>
              {sprints.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.status})</option>)}
            </select>
          </label>
          <label>Type
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">Tasks and bugs</option>
              <option value="task">Tasks</option>
              <option value="bug">Bugs</option>
            </select>
          </label>
          {isAdmin && <button className="btn small" onClick={() => setSprintForm({ name: '', goal: '', startDate: '', endDate: '' })}>New sprint</button>}
        </div>
        {activeSprint && sprintFilter === 'active' && (
          <div className="sprint-info">
            <strong>{activeSprint.name}</strong>
            <span>{fmt(activeSprint.startDate)} to {fmt(activeSprint.endDate)}</span>
            {activeSprint.goal && <span className="goal">Goal: {activeSprint.goal}</span>}
            {isAdmin && <button className="btn small" onClick={() => run(() => api.updateSprint(projectId, activeSprint._id, { status: 'completed' }))}>Complete sprint</button>}
          </div>
        )}
        {sprintFilter !== 'active' && sprintFilter !== 'all' && sprintFilter !== 'backlog' && isAdmin && (() => {
          const s = sprints.find((x) => x._id === sprintFilter);
          return s && s.status === 'planned'
            ? <div className="sprint-info"><button className="btn small" onClick={() => run(() => api.updateSprint(projectId, s._id, { status: 'active' }))}>Start this sprint</button></div>
            : null;
        })()}
        <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100" aria-label="Tickets done">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
          <span>{doneCount} of {visible.length} done</span>
        </div>
      </section>

      {sprintForm && (
        <form className="sprint-form" onSubmit={createSprint}>
          <label>Name<input value={sprintForm.name} onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })} required /></label>
          <label>Goal<input value={sprintForm.goal} onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })} /></label>
          <label>Start<input type="date" value={sprintForm.startDate} onChange={(e) => setSprintForm({ ...sprintForm, startDate: e.target.value })} required /></label>
          <label>End<input type="date" value={sprintForm.endDate} onChange={(e) => setSprintForm({ ...sprintForm, endDate: e.target.value })} required /></label>
          <button className="btn primary small">Create sprint</button>
          <button type="button" className="link" onClick={() => setSprintForm(null)}>Cancel</button>
        </form>
      )}

      <div className="columns">
        {COLUMNS.map((col) => {
          const items = visible.filter((t) => t.status === col.key);
          return (
            <section key={col.key} className={`column c-${col.key}${overCol === col.key ? ' over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.key); }}
              onDragLeave={() => setOverCol(null)}
              onDrop={(e) => { e.preventDefault(); setOverCol(null); move(e.dataTransfer.getData('text/plain'), col.key); }}>
              <h2>{col.label} <span className="count">{items.length}</span></h2>
              {items.length === 0 && <p className="col-empty">Drop a ticket here</p>}
              {items.map((t) => (
                <article key={t._id} className={`card ${t.type}`} draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', t._id)}
                  onClick={() => setModal({ ticket: t })} tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setModal({ ticket: t })}>
                  <div className="card-top">
                    <span className={`tag ${t.type}`}>{t.type === 'bug' ? 'Bug' : 'Task'}</span>
                    <span className={`prio ${t.priority}`}>{t.priority}</span>
                  </div>
                  <h3>{t.title}</h3>
                  <div className="card-foot">
                    <span>{t.comments.length > 0 ? `${t.comments.length} comment${t.comments.length > 1 ? 's' : ''}` : ''}</span>
                    {t.assignee && <span className="avatar sm" title={t.assignee.name}>{initials(t.assignee.name)}</span>}
                  </div>
                </article>
              ))}
            </section>
          );
        })}
      </div>

      {modal && (
        <TicketModal projectId={projectId} ticket={modal.ticket} members={members} sprints={sprints}
          isAdmin={isAdmin} defaultSprint={activeSprint?._id || ''}
          onClose={() => setModal(null)} onChanged={async () => { setModal(null); await load(); }} />
      )}
    </div>
  );
}
