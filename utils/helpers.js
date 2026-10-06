const mongoose = require('mongoose');

// Wraps async controllers so errors go straight to the global error handler.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// The assignment states the logged-in user id comes from the query params,
// but some endpoints also define it as a route param (:id / :noteId) or in the body.
const getLoggedInUserId = (req) => {
  if (req.params && (req.params.id || req.params.userId)) {
    return req.params.id || req.params.userId;
  }
  if (req.query && (req.query.id || req.query.userId)) {
    return req.query.id || req.query.userId;
  }
  if (req.body && (req.body.userId || req.body.id)) {
    return req.body.userId || req.body.id;
  }
  return undefined;
};

// For the note endpoints ":id" and ":noteId" belong to the note, so the logged-in
// user id must come from the query params (or the body) only.
const getUserIdFromQuery = (req) => {
  if (req.query && (req.query.id || req.query.userId)) {
    return req.query.id || req.query.userId;
  }
  if (req.params && req.params.userId) {
    return req.params.userId;
  }
  if (req.body && (req.body.userId || req.body.id)) {
    return req.body.userId || req.body.id;
  }
  return undefined;
};

const isValidId = (id) => mongoose.isValidObjectId(id);

module.exports = { asyncHandler, getLoggedInUserId, getUserIdFromQuery, isValidId };
