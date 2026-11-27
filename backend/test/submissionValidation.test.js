const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeSubmission, validEmail } = require("../lib/submissionValidation");

test("validates and normalizes contact submissions", () => {
  const result = normalizeSubmission({
    name: "  Test User ",
    email: " TEST@EXAMPLE.COM ",
    phone: " 555-0100 ",
    subject: " Question ",
    message: " Hello ",
  }, "contact");
  assert.equal(result.valid, true);
  assert.deepEqual(result.data, {
    name: "Test User",
    email: "test@example.com",
    phone: "555-0100",
    subject: "Question",
    message: "Hello",
  });
});

test("maps scholar-specific fields", () => {
  const result = normalizeSubmission({
    name: "Test User",
    email: "test@example.com",
    topic: "Topic",
    question: "Question",
  }, "scholar");
  assert.equal(result.valid, true);
  assert.equal(result.data.subject, "Topic");
  assert.equal(result.data.message, "Question");
});

test("rejects malformed email and overlong content", () => {
  assert.equal(validEmail("not-an-email"), false);
  assert.equal(normalizeSubmission({
    name: "Test",
    email: "test@example.com",
    subject: "Subject",
    message: "x".repeat(5001),
  }, "contact").valid, false);
});
