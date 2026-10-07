const express = require('express');
const auth = require('../middleware/auth');
const requireMember = require('../middleware/project');
const Project = require('../models/Project');
const User = require('../models/User');

const router = express.Router();
router.use(auth);

// Create a project; the creator becomes admin
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const project = await Project.create({
      name,
      description,
      members: [{ user: req.user.id, role: 'admin' }],
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// List projects I belong to
router.get('/', async (req, res, next) => {
  try {
    const projects = await Project.find({ 'members.user': req.user.id }).sort('-createdAt');
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireMember(), async (req, res, next) => {
  try {
    await req.project.populate('members.user', 'name email');
    res.json(req.project);
  } catch (err) {
    next(err);
  }
});

// Admin adds a teammate by email
router.post('/:id/members', requireMember('admin'), async (req, res, next) => {
  try {
    const { email, role = 'developer' } = req.body;
    if (!['admin', 'developer'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user) return res.status(404).json({ error: 'No user with that email' });
    if (req.project.members.some((m) => m.user.equals(user._id))) {
      return res.status(409).json({ error: 'Already a member' });
    }
    req.project.members.push({ user: user._id, role });
    await req.project.save();
    res.status(201).json(req.project);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
