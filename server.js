// Library Book Management API - Set A
// Node.js + Express.js, data stored in an in-memory JavaScript array.

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware: lets Express read JSON sent in the request body
app.use(express.json());

// ---------------------------------------------------------------
// In-memory "database" (initial data from the question paper)
// ---------------------------------------------------------------
let books = [
  { id: 101, title: "Wings of Fire", author: "A.P.J. Abdul Kalam", genre: "Autobiography", publishedYear: 1999, available: true },
  { id: 102, title: "The Alchemist", author: "Paulo Coelho", genre: "Fiction", publishedYear: 1988, available: true },
  { id: 103, title: "Harry Potter", author: "J.K. Rowling", genre: "Fantasy", publishedYear: 1997, available: false },
];

// Next unique id (starts after the highest existing id)
let nextId = Math.max(...books.map((b) => b.id)) + 1;

// ---------------------------------------------------------------
// Helper: validate a book body. Returns an array of error messages.
// ---------------------------------------------------------------
function validateBook(body) {
  const errors = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return ["Request body must be a JSON object"];
  }

  const isText = (v) => typeof v === "string" && v.trim().length > 0;

  if (!isText(body.title)) errors.push("title is required and must be a non-empty string");
  if (!isText(body.author)) errors.push("author is required and must be a non-empty string");
  if (!isText(body.genre)) errors.push("genre is required and must be a non-empty string");

  const year = body.publishedYear;
  const thisYear = new Date().getFullYear();
  if (typeof year !== "number" || !Number.isInteger(year) || year < 1 || year > thisYear) {
    errors.push(`publishedYear is required and must be a whole number between 1 and ${thisYear}`);
  }

  if (typeof body.available !== "boolean") {
    errors.push("available is required and must be true or false");
  }

  return errors;
}

// ---------------------------------------------------------------
// 1. GET all books
// ---------------------------------------------------------------
app.get("/api/books", (req, res) => {
  res.status(200).json(books);
});

// ---------------------------------------------------------------
// 6. Filter books by author (case-insensitive)
//    IMPORTANT: declared BEFORE /api/books/:id so "filter" is not read as an id
// ---------------------------------------------------------------
app.get("/api/books/filter", (req, res) => {
  const { author } = req.query;

  if (typeof author !== "string" || author.trim() === "") {
    return res.status(400).json({ error: "author query parameter is required, e.g. /api/books/filter?author=value" });
  }

  const search = author.trim().toLowerCase();
  const result = books.filter((b) => b.author.toLowerCase() === search);

  // No match -> empty array with 200
  res.status(200).json(result);
});

// ---------------------------------------------------------------
// 2. POST a new book
// ---------------------------------------------------------------
app.post("/api/books", (req, res) => {
  const errors = validateBook(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Invalid input", details: errors });
  }

  const { title, author, genre, publishedYear, available } = req.body;
  const newBook = {
    id: nextId++,
    title: title.trim(),
    author: author.trim(),
    genre: genre.trim(),
    publishedYear,
    available,
  };

  books.push(newBook);
  res.status(201).json(newBook);
});

// ---------------------------------------------------------------
// 3. GET book by id
// ---------------------------------------------------------------
app.get("/api/books/:id", (req, res) => {
  const id = Number(req.params.id);
  const book = books.find((b) => b.id === id);

  if (!book) {
    return res.status(404).json({ error: `Book with id ${req.params.id} not found` });
  }
  res.status(200).json(book);
});

// ---------------------------------------------------------------
// 4. PUT (update) a book
// ---------------------------------------------------------------
app.put("/api/books/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = books.findIndex((b) => b.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Book with id ${req.params.id} not found` });
  }

  const errors = validateBook(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Invalid input", details: errors });
  }

  const { title, author, genre, publishedYear, available } = req.body;
  // The id never changes, even if the body contains one
  books[index] = {
    id: books[index].id,
    title: title.trim(),
    author: author.trim(),
    genre: genre.trim(),
    publishedYear,
    available,
  };

  res.status(200).json(books[index]);
});

// ---------------------------------------------------------------
// 5. DELETE a book
// ---------------------------------------------------------------
app.delete("/api/books/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = books.findIndex((b) => b.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Book with id ${req.params.id} not found` });
  }

  const [removed] = books.splice(index, 1);
  res.status(200).json({ message: "Book deleted successfully", book: removed });
});

// ---------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------
// Unknown route
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Bad JSON in request body (e.g. missing quote or comma)
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// ---------------------------------------------------------------
// Start the server (only when run directly with: node server.js)
// ---------------------------------------------------------------
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Library Book Management API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
