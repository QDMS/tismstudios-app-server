import express from 'express';
import {
	changePassword,
	forgotPassword,
	getMyProfile,
	logOut,
	login,
	register,
	resetPassword,
	updateImage,
	updateProfile,
} from '../controllers/user.js';
import { isAuthenticated } from '../middlewares/auth.js';
import { singleUpload } from '../middlewares/multer.js';

const router = express.Router();

{
	/* Auth Routes */
}
router.post('/login', login);
router.post('/new', singleUpload, register);
router.get('/logout', isAuthenticated, logOut);

{
	/* Profile Routes */
}
router.get('/me', isAuthenticated, getMyProfile);
router.put('/updateprofile', isAuthenticated, updateProfile);
router.put('/changepassword', isAuthenticated, changePassword);
router.put('/updateimage', isAuthenticated, singleUpload, updateImage);

{
	/* Forgot Password & Reset Password*/
} 
router.route('/forgotpassword').post(forgotPassword).put(resetPassword);

export default router;
