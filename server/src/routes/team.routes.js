const express = require('express');
const {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} = require('../controllers/team.controller');
const adminAuth = require('../middleware/adminAuth');
const cacheControl = require('../middleware/cacheControl');

const router = express.Router();

router.route('/').get(cacheControl('public, max-age=300'), getTeamMembers).post(adminAuth(), createTeamMember);
router.route('/:id').put(adminAuth(), updateTeamMember).delete(adminAuth('owner'), deleteTeamMember);

module.exports = router;
