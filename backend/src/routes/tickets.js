const express = require('express');
const auth = require('../middleware/auth');
const requireMember = require('../middleware/project');
const Ticket = require('../models/Ticket');
const Sprint = require('../models/Sprint');

const router = express.Router({ mergeParams: true });
router.use(auth);

const { FLOW, isValidMove } = require('../utils/flow');

const isMember = (project, userId) => project.members.some((m) => m.user.toString() === userId.toString());

router.post('/', requireMember(), async (req, res, next) => {
  try {
    const { title, description, type, priority, sprint, assignee, stepsToReproduce } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    if (sprint && !(await Sprint.findOne({ _id: sprint, project: req.project._id }))) {
      return res.status(400).json({ error: 'Sprint does not belong to this project' });
    }
    if (assignee && !isMember(req.project, assignee)) {
      return res.status(400).json({ error: 'Assignee must be a project member' });
    }
    const ticket = await Ticket.create({
      project: req.project._id,
      title, description, type, priority, sprint, assignee, stepsToReproduce,
      reporter: req.user.id,
    });
    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

// Filters: ?sprint=&status=&type=&assignee=&priority=
router.get('/', requireMember(), async (req, res, next) => {
  try {
    const filter = { project: req.project._id };
    ['sprint', 'status', 'type', 'assignee', 'priority'].forEach((k) => {
      if (req.query[k]) filter[k] = req.query[k];
    });
    const tickets = await Ticket.find(filter)
      .populate('assignee', 'name email')
      .populate('reporter', 'name email')
      .sort('-createdAt');
    res.json(tickets);
  } catch (err) {
    next(err);
  }
});

router.patch('/:ticketId', requireMember(), async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.ticketId, project: req.project._id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const { status, title, description, priority, assignee, sprint, stepsToReproduce } = req.body;

    if (status && status !== ticket.status) {
      if (!FLOW.includes(status)) return res.status(400).json({ error: 'Invalid status' });
      if (!isValidMove(ticket.status, status)) {
        return res.status(400).json({ error: `Cannot move from ${ticket.status} to ${status}` });
      }
      ticket.status = status;
    }
    if (assignee && !isMember(req.project, assignee)) {
      return res.status(400).json({ error: 'Assignee must be a project member' });
    }
    Object.entries({ title, description, priority, assignee, sprint, stepsToReproduce }).forEach(([k, v]) => {
      if (v !== undefined) ticket[k] = v;
    });
    await ticket.save();
    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

router.post('/:ticketId/comments', requireMember(), async (req, res, next) => {
  try {
    if (!req.body.text) return res.status(400).json({ error: 'text is required' });
    const ticket = await Ticket.findOne({ _id: req.params.ticketId, project: req.project._id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    ticket.comments.push({ author: req.user.id, text: req.body.text });
    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

router.delete('/:ticketId', requireMember('admin'), async (req, res, next) => {
  try {
    const deleted = await Ticket.findOneAndDelete({ _id: req.params.ticketId, project: req.project._id });
    if (!deleted) return res.status(404).json({ error: 'Ticket not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
