const express = require('express');
const auth = require('../middleware/auth');
const requireMember = require('../middleware/project');
const Sprint = require('../models/Sprint');

const router = express.Router({ mergeParams: true });
router.use(auth);

router.post('/', requireMember('admin'), async (req, res, next) => {
  try {
    const { name, goal, startDate, endDate } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: 'name, startDate and endDate are required' });
    }
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ error: 'endDate must be after startDate' });
    }
    const sprint = await Sprint.create({ project: req.project._id, name, goal, startDate, endDate });
    res.status(201).json(sprint);
  } catch (err) {
    next(err);
  }
});

router.get('/', requireMember(), async (req, res, next) => {
  try {
    res.json(await Sprint.find({ project: req.project._id }).sort('-startDate'));
  } catch (err) {
    next(err);
  }
});

// Start or complete a sprint (only one active sprint per project)
router.patch('/:sprintId', requireMember('admin'), async (req, res, next) => {
  try {
    const sprint = await Sprint.findOne({ _id: req.params.sprintId, project: req.project._id });
    if (!sprint) return res.status(404).json({ error: 'Sprint not found' });

    const { status, name, goal } = req.body;
    if (status === 'active') {
      const active = await Sprint.findOne({ project: req.project._id, status: 'active', _id: { $ne: sprint._id } });
      if (active) return res.status(409).json({ error: 'Another sprint is already active' });
    }
    if (status) sprint.status = status;
    if (name) sprint.name = name;
    if (goal !== undefined) sprint.goal = goal;
    await sprint.save();
    res.json(sprint);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
