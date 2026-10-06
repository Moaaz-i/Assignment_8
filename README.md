# Assignment 8 — Sticky Notes API (Users + Notes)

Express.js + Mongoose (MongoDB) REST API for the Sticky Notes assignment.

## Folder structure

```
Assignment 8/
├── server.js                 # Express app + global error handler
├── .env                      # PORT / MONGO_URI / JWT_SECRET
├── config/
│   └── db.js                 # MongoDB connection
├── models/
│   ├── User.js               # name, email(unique), password, phone, age(18-60)
│   └── Note.js               # title(custom validator), content, userId(ref User)
├── middleware/
│   └── auth.js               # JWT auth (Bearer token)
├── controllers/
│   ├── userController.js     # signup / login / update / delete / get user
│   └── noteController.js     # all note operations
├── routes/
│   ├── index.js              # /users , /notes
│   ├── userRoutes.js
│   └── noteRoutes.js
├── utils/
│   └── helpers.js            # asyncHandler + logged-in user id helper
├── bonus.js                  # Bonus: Longest Common Prefix (LeetCode 14)
├── assignment8-postman.json  # Postman collection (import this file)
└── package.json
```

## Run

```bash
npm install
npm start        # or: npm run dev  (nodemon)
node bonus.js    # bonus self test
```

Server: `http://localhost:3000` — MongoDB: `mongodb://127.0.0.1:27017/assignment8`

## Models

### User (0.5)
| field | type | rules |
|-------|------|-------|
| name | String | required |
| email | String | required, unique |
| password | String | required (hashed with bcrypt) |
| phone | String | required |
| age | Number | between 18 and 60 |

### Note (0.5)
| field | type | rules |
|-------|------|-------|
| title | String | required + **custom validator: not entirely uppercase** ("FIRST NOTE" ❌ / "First Note" ✅) |
| content | String | required |
| userId | ObjectId → Users | required |
| createdAt / updatedAt | Timestamp | automatic (`timestamps: true`) |

## User APIs (2.5)

| # | Method | URL | Description |
|---|--------|-----|-------------|
| 1 | POST | `/users/signup` | Signup, e-mail must be unique (0.5) |
| 2 | POST | `/users/login` | Login with `email` + `password` from body → returns JWT (0.5) |
| 3 | PATCH | `/users/:id` | Update logged-in user **except password**; new e-mail must be unique (0.5) |
| 4 | DELETE | `/users?id=<userId>` | Delete logged-in user (0.5) |
| 5 | GET | `/users?id=<userId>` | Get logged-in user data by id (0.5) |

## Note APIs (6)

| # | Method | URL | Description |
|---|--------|-----|-------------|
| 1 | POST | `/notes?id=<userId>` | Create a single note (0.5) |
| 2 | PATCH | `/notes/:noteId?id=<userId>` | Update note, returns updated note, owner only (0.5) |
| 3 | PUT | `/notes/replace/:noteId?id=<userId>` | Replace the whole note document, owner only (0.5) |
| 4 | PATCH | `/notes/all?id=<userId>` | Update the **title of all** notes of the logged-in user (0.5) |
| 5 | DELETE | `/notes/:noteId?id=<userId>` | Delete note, returns deleted note, owner only (0.5) |
| 6 | GET | `/notes/paginate-sort?id=<userId>&page=2&limit=3` | Paginated notes sorted by `createdAt` desc (0.5) |
| 7 | GET | `/notes/:id?id=<userId>` | Get a note by id, owner only (0.5) |
| 8 | GET | `/notes/note-by-content?id=<userId>&content=Workout Plan` | Get a note by its content (0.5) |
| 9 | GET | `/notes/note-with-user?id=<userId>` | Notes (`title,userId,createdAt`) + user `email` via populate (0.5) |
| 10 | GET | `/notes/aggregate?id=<userId>&title=Code Review Notes` | Aggregation + `$lookup` (name, email) + search by title (1) |
| 11 | DELETE | `/notes?id=<userId>` | Delete all notes of the logged-in user (0.5) |

> The logged-in user id is read from the **query params** as the assignment requires
> (it is also accepted in the body as `userId`). `/users/:id` additionally accepts the route param.

## Postman

Import `assignment8-postman.json`, then:

1. Run **Sign Up New User** / **Login User**.
2. Copy the user `_id` into the collection variable `userId` and the token into `token`.
3. Create a note and copy its `_id` into `noteId`.
4. Every request has a meaningful name (e.g. "Create Single Note").

## Bonus (2)

`bonus.js` — Longest Common Prefix (LeetCode 14), runs self-tests when executed with `node bonus.js`.
