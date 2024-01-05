import mongoose from 'mongoose';

const schema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Please Enter Name'],
	},
	description: {
		type: String,
		required: [true, 'Please Enter Description'],
	},
	price: {
		type: Number,
		required: [true, 'Please Enter Price'],
	},
	stock: {
		type: Number,
		required: [true, 'Please Enter # Of Stock'],
	},
	category: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Category',
	},
	images: [
		{
			public_id: String,
			url: String,
		},
	],
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

export const Product = mongoose.model('Product', schema);
