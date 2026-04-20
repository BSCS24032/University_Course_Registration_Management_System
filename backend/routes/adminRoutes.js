const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Every route here requires Admin role
router.use(authenticateToken, authorizeRoles('Admin'));

// Stats dashboard
router.get('/stats', ctrl.getStats);

// Departments
router.get('/departments', ctrl.listDepartments);
router.post('/departments', ctrl.createDepartment);
router.put('/departments/:id', ctrl.updateDepartment);
router.delete('/departments/:id', ctrl.deleteDepartment);

// Programs
router.get('/programs', ctrl.listPrograms);
router.post('/programs', ctrl.createProgram);
router.delete('/programs/:id', ctrl.deleteProgram);

// Program ↔ Course mapping (controls which courses each program may take)
router.post('/program-courses', ctrl.addProgramCourse);
router.delete('/program-courses/:program_id/:course_id', ctrl.removeProgramCourse);

// Instructors
router.get('/instructors', ctrl.listInstructors);
router.post('/instructors', ctrl.createInstructor);
router.put('/instructors/:id', ctrl.updateInstructor);

// Students
router.get('/students', ctrl.listStudents);
router.get('/students/:id', ctrl.getStudent);
router.put('/students/:id', ctrl.updateStudent);
router.patch('/students/:id/credit-limit', ctrl.setCreditLimit);

module.exports = router;
