const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: false, // Optional, an exam can be standalone
    },
    title: {
      type: String,
      required: [true, 'Please add an exam title'],
    },
    date: {
      type: Date,
      required: [true, 'Please add an exam date'],
    },
    syllabus: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Exam', examSchema);
