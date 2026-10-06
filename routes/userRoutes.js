const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.patch('/:id', userController.updateUser);
router.delete('/', userController.deleteUser);
router.get('/', userController.getUser);

module.exports = router;
