/**
 * LU32 — AI Integration Proof Slice (STARTER)
 * ------------------------------------------------------------
 * The AI SUGGESTS an incident severity. Your code CHECKS the answer.
 * If the answer is bad, a FALLBACK keeps things working.
 * The real severity only changes when a human APPROVES.
 *
 * Run it:  node index.js
 * No install, no API key. The "model" is a fake function below.
 *
 * You only fill in 3 tiny functions. Everything else is done for you.
 */

// ── The data (your "database"). The AI must NOT change `currentSeverity`. ──
const incident = {
  id: 'INC-482',
  title: 'Checkout latency spike after deploy v18.4',
  currentSeverity: 'MEDIUM',
  service: 'payments',
  reporterEmail: 'oncall@acme.example',   // private — do NOT send to the model
  internalToken: 'tok_secret_do_not_send' // private — do NOT send to the model
};
const timeline = [
  'Deploy v18.4 completed for payments',
  'Error rate rising in payments-checkout',
  'Retry queue depth increasing'
];

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// ── A fake "model". Change MODE to try each case. ──
// 'valid'  -> a good answer
// 'badEnum'-> an unknown severity ("URGENT")
// 'failed' -> the model failed (returns null)
const MODE = 'valid';
function fakeModel() {
  if (MODE === 'failed') return null;
  if (MODE === 'badEnum') return { suggestedSeverity: 'URGENT', reason: 'errors rising' };
  return { suggestedSeverity: 'HIGH', reason: 'errors rising after v18.4' };
}

// ============================================================
// TASK 1 — What is the model allowed to see?
// Return an object with only the safe fields (no secrets).
// ============================================================
function buildContext() {
  // Allow-list, not deny-list: name exactly the fields the model may see, so a
  // new private field added to `incident` later never leaks by default.
  // reporterEmail (personal data) and internalToken (a credential) stay out.
  // `incident.id` is also left out: the model doesn't need it to judge severity,
  // and the app (not the model) links the suggestion back to the incident.
  return {
    title: incident.title,
    currentSeverity: incident.currentSeverity,
    service: incident.service,
    timeline: [...timeline] // a copy, so nothing downstream can edit the real timeline
  };
}

// ============================================================
// TASK 2 — Is the answer safe to use?
// Return true only if suggestedSeverity is one of SEVERITIES
// AND there is a non-empty reason.
// ============================================================
function isValid(answer) {
  // Model output is untrusted until checked here: it could be null, a string,
  // an array, or an object with a made-up severity like "URGENT".
  if (answer === null || typeof answer !== 'object' || Array.isArray(answer)) return false;

  // Exact match against the allowed list: "high" or "Urgent" are rejected, not guessed at.
  if (!SEVERITIES.includes(answer.suggestedSeverity)) return false;

  // A reason must be real text: rejects a missing reason, a number, "" and "   ".
  if (typeof answer.reason !== 'string' || answer.reason.trim() === '') return false;

  return true;
}

// ============================================================
// TASK 3 — What does the user see when the model fails or is invalid?
// Return a short message so the workflow still makes sense.
// ============================================================
function fallback() {
  // No severity is suggested or applied: the real severity is left exactly as it was,
  // and the responder sets it by hand, as they would without the AI feature.
  return {
    status: 'MANUAL_REVIEW',
    message: `AI severity suggestion is unavailable for ${incident.id}. ` +
      `Severity stays ${incident.currentSeverity}. Please review the timeline and set it manually.`
  };
}

// ── Given to you: runs one request start to finish. ──
function run() {
  console.log('Context sent to model:', buildContext());

  const answer = fakeModel();

  if (!answer || !isValid(answer)) {
    console.log('Result:', fallback());
    return;
  }

  console.log('AI suggests:', answer.suggestedSeverity, '(not applied yet)');
  console.log('Real severity is still:', incident.currentSeverity);

  // A human approves — the only place the real value changes:
  incident.currentSeverity = answer.suggestedSeverity;
  console.log('After human approval:', incident.currentSeverity);
}

run();
