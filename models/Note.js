const mongoose = require('mongoose');

// "Title" must NOT be entirely uppercase, e.g. "FIRST NOTE" is invalid, "First Note" is valid.
const isEntirelyUppercase = (value) => {
  if (typeof value !== 'string') return false;
  const hasLetters = /[a-z]/i.test(value);
  return hasLetters && value === value.toUpperCase();
};

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      validate: {
        validator: (value) => !isEntirelyUppercase(value),
        message: 'Title must not be entirely uppercase',
      },
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
