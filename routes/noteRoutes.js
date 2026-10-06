const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const auth = require('../middleware/auth');

router.use(auth);

// Static paths must be declared before "/:noteId" and "/:id".
router.post('/', noteController.createNote);
router.patch('/all', noteController.updateAllNotes);
router.put('/replace/:noteId', noteController.replaceNote);
router.get('/paginate-sort', noteController.paginateSort);
router.get('/note-by-content', noteController.getNoteByContent);
router.get('/note-with-user', noteController.getNotesWithUser);
router.get('/aggregate', noteController.aggregateNotes);
router.delete('/', noteController.deleteAllNotes);

router.patch('/:noteId', noteController.updateNote);
router.delete('/:noteId', noteController.deleteNote);
router.get('/:id', noteController.getNoteById);

module.exports = router;
