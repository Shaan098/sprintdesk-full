import { useState } from 'react';
import { api } from './api';

export default function TicketModal({ projectId, ticket, members, sprints, isAdmin, defaultSprint, onClose, onChanged }) {
  const editing = Boolean(ticket);
  const [f, setF] = useState({
    title: ticket?.title || '',
    description: ticket?.description || '',
    type: ticket?.type || 'task',
    priority: ticket?.priority || 'medium',
    sprint: ticket ? ticket.sprint || '' : defaultSprint,
    assignee: ticket?.assignee?._id || '',
    stepsToReproduce: ticket?.stepsToReproduce || '',
  });
  const [comments, setComments] = useState(ticket?.comments || []);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const nameOf = (id) => members.find((m) => m.user._id === id)?.user.name || 'Someone';

  async function save(e) {
    e.preventDefault();
    const body = { ...f, sprint: f.sprint || null, assignee: f.assignee || null };
    try {
      if (editing) { delete body.type; await api.updateTicket(projectId, ticket._id, body); }
      else await api.createTicket(projectId, body);
      onChanged();
    } catch (err) { setError(err.message); }
  }

  async function addComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await api.addComment(projectId, ticket._id, comment.trim());
      setComments(res.comments);
      setComment('');
    } catch (err) { setError(err.message); }
  }

  async function remove() {
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    try { await api.deleteTicket(projectId, ticket._id); onChanged(); } catch (err) { setError(err.message); }
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={editing ? 'Edit ticket' : 'New ticket'}>
        <form onSubmit={save}>
          <h2>{editing ? 'Edit ticket' : 'New ticket'}</h2>
          <label>Title<input value={f.title} onChange={set('title')} required autoFocus /></label>
          <div className="row">
            <label>Type
              <select value={f.type} onChange={set('type')} disabled={editing}>
                <option value="task">Task</option>
                <option value="bug">Bug</option>
              </select>
            </label>
            <label>Priority
              <select value={f.priority} onChange={set('priority')}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </label>
          </div>
          <div className="row">
            <label>Sprint
              <select value={f.sprint} onChange={set('sprint')}>
                <option value="">Backlog (no sprint)</option>
                {sprints.filter((s) => s.status !== 'completed').map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </label>
            <label>Assignee
              <select value={f.assignee} onChange={set('assignee')}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
              </select>
            </label>
          </div>
          <label>Description<textarea rows="3" value={f.description} onChange={set('description')} /></label>
          {f.type === 'bug' && (
            <label>Steps to reproduce<textarea rows="3" value={f.stepsToReproduce} onChange={set('stepsToReproduce')} /></label>
          )}
          {error && <p className="error" role="alert">{error}</p>}
          <div className="actions">
            <button className="btn primary">{editing ? 'Save changes' : 'Create ticket'}</button>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            {editing && isAdmin && <button type="button" className="btn danger" onClick={remove}>Delete ticket</button>}
          </div>
        </form>

        {editing && (
          <section className="comments">
            <h3>Comments</h3>
            {comments.length === 0 && <p className="muted">No comments yet.</p>}
            <ul>
              {comments.map((c) => (
                <li key={c._id}><strong>{nameOf(c.author)}</strong><p>{c.text}</p></li>
              ))}
            </ul>
            <form onSubmit={addComment} className="inline-form">
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment" aria-label="Write a comment" />
              <button className="btn small">Post comment</button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
