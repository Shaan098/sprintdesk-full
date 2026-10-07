const Project = require('../models/Project');

// Loads the project and checks the logged-in user is a member (optionally with a given role).
module.exports = function requireMember(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.params.id;
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ error: 'Project not found' });

      const member = project.members.find((m) => m.user.toString() === req.user.id);
      if (!member) return res.status(403).json({ error: 'You are not a member of this project' });
      if (allowedRoles.length && !allowedRoles.includes(member.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.project = project;
      req.role = member.role;
      next();
    } catch (err) {
      next(err);
    }
  };
};
