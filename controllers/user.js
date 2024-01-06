import { asyncError } from '../middlewares/error.js';
import { User } from '../models/user.js';
import ErrorHandler from '../utils/error.js';
import { cookieOptions, getDataUri, sendEmail, sendToken } from '../utils/features.js';
import cloudinary from 'cloudinary';

export const login = asyncError(async (req, res, next) => {
	const { email, password } = req.body;

	const user = await User.findOne({ email }).select('+password');

	if (!user) {
		return res.status(400).json({ success: false, message: 'Incorrect Email' });
	}

	if (!password) return next(new ErrorHandler('Please Enter Password'));

	const isMatched = await user.comparePassword(password);

	if (!isMatched) {
		return next(new ErrorHandler('Invalid Password', 400));
	}

	sendToken(user, res, `Welcome Back, ${user.name}`, 200);
});

export const register = asyncError(async (req, res, next) => {
	const { name, email, phone, password, address, city, state, zipCode } = req.body;

	let user = await User.findOne({ email });

	if (user) return next(new ErrorHandler('User Already Exist In App', 400));

	let avatar = undefined;

	if (req.file) {
		const file = getDataUri(req.file);
		const myCloud = await cloudinary.v2.uploader.upload(file.content);
		avatar = {
			public_id: myCloud.public_id,
			url: myCloud.secure_url,
		};
	}

	user = await User.create({
		avatar,
		name,
		email,
		phone,
		password,
		address,
		city,
		state,
		zipCode,
	});

	sendToken(user, res, `Registration Successfully ${user.name}, Thanks For Joining`, 201);
});

export const logOut = asyncError(async (req, res, next) => {
	// Clear the cookie and send a JSON response
	res.cookie('token', '', {
		...cookieOptions,
		expires: new Date(Date.now()),
	});
	res.status(200).json({
		success: true,
		message: 'Log Out Successfully',
	});
});

export const getMyProfile = asyncError(async (req, res, next) => {
	const user = await User.findById(req.user._id);

	res.status(200).json({
		success: true,
		user,
	});
});

export const updateImage = asyncError(async (req, res, next) => {
	const user = await User.findById(req.user._id);

	const file = getDataUri(req.file);

	await cloudinary.v2.uploader.destroy(user.avatar.public_id);

	const myCloud = await cloudinary.v2.uploader.upload(file.content);
	user.avatar = {
		public_id: myCloud.public_id,
		url: myCloud.secure_url,
	};

	await user.save();

	res.status(200).json({
		success: true,
		message: `${user.name}s, Profile Avatar Image Updated Successfully`,
	});
});

export const updateProfile = asyncError(async (req, res, next) => {
	const user = await User.findById(req.user._id);

	const { name, email, phone, address, city, state, zipCode } = req.body;

	if (name) user.name = name;
	if (email) user.email = email;
	if (phone) user.phone = phone;
	if (address) user.address = address;
	if (city) user.city = city;
	if (state) user.state = state;
	if (zipCode) user.zipCode = zipCode;

	await user.save();

	res.status(200).json({
		success: true,
		message: `${user.name}s, Profile Updated Successfully`,
	});
});

export const changePassword = asyncError(async (req, res, next) => {
	const user = await User.findById(req.user._id).select('+password');

	const { oldPassword, newPassword } = req.body;

	if (!oldPassword || !newPassword) return next(new ErrorHandler('Please Enter Old Password & New Password', 400));

	const isMatched = await user.comparePassword(oldPassword);

	if (!isMatched) return next(new ErrorHandler('Invalid Old Password'));

	user.password = newPassword;
	await user.save();

	res.status(200).json({
		success: true,
		message: `${user.name}, Your Password Changed Successfully`,
	});
});

export const forgotPassword = asyncError(async (req, res, next) => {
	const { email } = req.body;
	const user = await User.findOne({ email });

	if (!user) return next(new ErrorHandler('Invalid Email', 404));

	const randomNumber = Math.random() * (9999 - 1000) + 1000;
	const otp = Math.floor(randomNumber);
	const otp_expire = 15 * 60 * 1000;

	user.otp = otp;
	user.otp_expire = new Date(Date.now() + otp_expire);
	await user.save();

	const message = `${user.name}, Your OTP for resetting password is ${otp}. Please ignore if you haven't requested this.`;
	try {
		await sendEmail('OTP For Resetting Password', user.email, message);
	} catch (error) {
		user.otp = null;
		user.otp_expire = null;
		await user.save();
		return next(error);
	}

	res.status(200).json({
		success: true,
		message: `Email of OTP Verification code sent to ${user.email} successfully`,
	});
});

export const resetPassword = asyncError(async (req, res, next) => {
	const { otp, password } = req.body;

	const user = await User.findOne({
		otp,
		otp_expire: {
			$gt: Date.now(),
		},
	});

	if (!user) return next(new ErrorHandler('Incorrect OTP or has been expired', 400));

  if(!password) return next(new ErrorHandler('Please enter new password', 400)); 
	user.password = password;
	user.otp = undefined;
	user.otp_expire = undefined;

	await user.save();

	res.status(200).json({
		success: true,
		message: `${user.name}s, password changed successful, you can login in now.`,
	});
});
