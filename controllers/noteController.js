const mongoose = require('mongoose');
const Note = require('../models/Note');
const { asyncHandler, getUserIdFromQuery, isValidId } = require('../utils/helpers');

// Small helper: every note endpoint needs the logged-in user id from the query params.
const requireUserId = (req, res) => {
  const id = getUserIdFromQuery(req);
  if (!id || !isValidId(id)) {
    res.status(400).json({ message: 'A valid logged-in user id is required (?id=...)' });
    return null;
  }
  return id;
};

const requireNoteId = (req, res) => {
  const noteId = req.params.noteId || req.params.id;
  if (!noteId || !isValidId(noteId)) {
    res.status(400).json({ message: 'A valid note id is required' });
    return null;
  }
  return noteId;
};

// POST /notes  -> create a single note for the logged-in user
const createNote = asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'title and content are required' });
  }

  const note = await Note.create({ title, content, userId });
  res.status(201).json({ message: 'Note created successfully', note });
});

// PATCH /notes/:noteId -> update a single note (owner only), returns the updated note
const updateNote = asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const noteId = requireNoteId(req, res);
  if (!noteId) return;

  const existing = await Note.findById(noteId);
  if (!existing) return res.status(404).json({ message: 'Note not found' });
  if (existing.userId.toString() !== userId) {
    return res.status(403).json({ message: 'You are not allowed to update this note' });
  }

  const { title, content } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;

  const note = await Note.findByIdAndUpdate(
    noteId,
    { $set: updates },
    { new: true, runValidators: true, context: 'query' }
  );

  res.status(200).json({ message: 'Note updated successfully', note });
});

// PUT /notes/replace/:noteId -> replace the entire note document (owner only)
const replaceNote = asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const noteId = requireNoteId(req, res);
  if (!noteId) return;

  const existing = await Note.findById(noteId);
  if (!existing) return res.status(404).json({ message: 'Note not found' });
  if (existing.userId.toString() !== userId) {
    return res.status(403).json({ message: 'You are not allowed to replace this note' });
  }

  // Whole document comes from the body, but ownership always stays with the caller.
  const { _id, __v, createdAt, userId: bodyUserId, ...rest } = req.body;
  if (bodyUserId && bodyUserId !== userId) {
    return res.status(403).json({ message: 'You cannot assign this note to another user' });
  }

  const replacement = { ...rest, userId };

  const note = await Note.findOneAndReplace({ _id: noteId }, replacement, {
    new: true,
    runValidators: true,
    context: 'query',
  });

  res.status(200).json({ message: 'Note replaced successfully', note });
});

// PATCH /notes/all -> update the title of ALL notes of the logged-in user
const updateAllNotes = asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const title = req.body.title !== undefined ? req.body.title : req.query.title;
  if (!title) {
    return res.status(400).json({ message: 'title is required' });
  }

  const result = await Note.updateMany(
    { userId },
    { $set: { title } },
    { runValidators: true, context: 'query' }
  );

  res.status(200).json({
    message: 'All notes updated successfully',
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  });
});

// DELETE /notes/:noteId -> delete a single note (owner only), returns the deleted note
const deleteNote = asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const noteId = requireNoteId(req, res);
  if (!noteId) return;

  const note = await Note.findOneAndDelete({ _id: noteId, userId });
  if (!note) {
    const exists = await Note.findById(noteId);
    if (exists) {
      return res.status(403).json({ message: 'You are not allowed to delete this note' });
    }
    return res.status(404).json({ message: 'Note not found' });
  }

  res.status(200).json({ message: 'Note deleted successfully', note });
});

// GET /notes/paginate-sort?page=2&limit=3 -> paginated, newest first
const paginateSort = asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
  const skip = (page - 1) * limit;

  const [total, notes] = await Promise.all([
    Note.countDocuments({ userId }),
    Note.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  res.status(200).json({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    results: notes,
  });
});

// GET /notes/:id -> get a note by its id (owner only)
const getNoteById = asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const noteId = requireNoteId(req, res);
  if (!noteId) return;

  const note = await Note.findOne({ _id: noteId, userId });
  if (!note) {
    const exists = await Note.findById(noteId);
    if (exists) {
      return res.status(403).json({ message: 'You are not allowed to read this note' });
    }
    return res.status(404).json({ message: 'Note not found' });
  }

  res.status(200).json({ note });
});

// GET /notes/note-by-content?content=Workout Plan
const getNoteByContent = asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const { content } = req.query;
  if (!content) {
    return res.status(400).json({ message: 'content query param is required' });
  }

  const note = await Note.findOne({ userId, content });
  if (!note) {
    return res.status(404).json({ message: 'Note not found' });
  }

  res.status(200).json({ note });
});

// GET /notes/note-with-user -> notes (title, userId, createdAt) + user email
const getNotesWithUser = asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const notes = await Note.find({ userId })
    .select('title userId createdAt')
    .populate('userId', 'email')
    .lean();

  res.status(200).json({ count: notes.length, notes });
});

// GET /notes/aggregate?title=Code Review Notes -> aggregation + $lookup users
const aggregateNotes = asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const match = { userId: new mongoose.Types.ObjectId(String(userId)) };
  if (req.query.title) {
    match.title = { $regex: String(req.query.title), $options: 'i' };
  }

  const notes = await Note.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        title: 1,
        content: 1,
        createdAt: 1,
        updatedAt: 1,
        'user.name': 1,
        'user.email': 1,
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  res.status(200).json({ count: notes.length, notes });
});

// DELETE /notes -> delete all notes of the logged-in user
const deleteAllNotes = asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const result = await Note.deleteMany({ userId });

  res.status(200).json({
    message: 'All notes deleted successfully',
    deletedCount: result.deletedCount,
  });
});

module.exports = {
  createNote,
  updateNote,
  replaceNote,
  updateAllNotes,
  deleteNote,
  paginateSort,
  getNoteById,
  getNoteByContent,
  getNotesWithUser,
  aggregateNotes,
  deleteAllNotes,
};
