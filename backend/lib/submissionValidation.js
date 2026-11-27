function text(value) {
  return String(value || "").trim();
}

function validEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeSubmission(body, kind) {
  const data = {
    name: text(body.name),
    email: text(body.email).toLowerCase(),
    phone: text(body.phone),
    subject: text(kind === "scholar" ? body.topic : body.subject),
    message: text(kind === "scholar" ? body.question : body.message),
  };
  const valid = data.name.length > 0 && data.name.length <= 120
    && validEmail(data.email)
    && data.phone.length <= 40
    && data.subject.length > 0 && data.subject.length <= 160
    && data.message.length > 0 && data.message.length <= 5000;
  return { valid, data };
}

module.exports = { normalizeSubmission, validEmail };
