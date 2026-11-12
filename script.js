/* Twin Cities Animal Rescue — Touchstone 4
   The role finder and form checks are for a student demonstration.
   No form data is sent to a rescue organization.
*/
'use strict';

// Sample volunteering roles; schedules are examples, not confirmed openings.
const volunteerRoles = [
  {
    id: 'animal-care',
    title: 'Animal Care Helper',
    description: 'Help with daily care, safe play, and keeping spaces clean.',
    availability: ['weekdays', 'weekends']
  },
  {
    id: 'event-helper',
    title: 'Event Helper',
    description: 'Greet visitors and share basic information at community events.',
    availability: ['evenings', 'weekends']
  },
  {
    id: 'supply-helper',
    title: 'Supply Helper',
    description: 'Sort donations and organize supplies for foster families.',
    availability: ['weekdays', 'evenings']
  }
];

const availabilityLabels = {
  weekdays: 'Weekdays',
  evenings: 'Evenings',
  weekends: 'Weekends',
  flexible: 'Flexible schedule'
};

const STORAGE_KEY = 'tcar-volunteer-preference-v1';

function readSavedPreference() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    const knownRole = volunteerRoles.some(role => role.id === saved.roleId);
    if (knownRole && availabilityLabels[saved.availability]) return saved;
  } catch (error) {
    // Private browsing or disabled storage should not stop the site from working.
  }
  return null;
}

function storePreference(preference) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
    return true;
  } catch (error) {
    return false;
  }
}

function findMatchingRoles(availability) {
  if (!availabilityLabels[availability]) return [];
  if (availability === 'flexible') return volunteerRoles;
  return volunteerRoles.filter(role => role.availability.includes(availability));
}

function showSavedRole(preference, wasRestored = false) {
  const summary = document.querySelector('#saved-role-summary');
  if (!summary) return;
  const contactLink = document.querySelector('#saved-role-contact');
  const role = preference && volunteerRoles.find(item => item.id === preference.roleId);
  if (!role) {
    summary.textContent = 'You have not saved a volunteer role yet.';
    contactLink.hidden = true;
    return;
  }
  summary.textContent = (wasRestored ? 'Restored from your last visit: ' : 'Saved: ') +
    role.title + ' — ' + availabilityLabels[preference.availability] + '.';
  contactLink.hidden = false;
}

function makeRoleCard(role, availability, savedId) {
  const article = document.createElement('article');
  article.className = 'match-card' + (role.id === savedId ? ' is-saved' : '');

  const heading = document.createElement('h3');
  heading.textContent = role.title;
  const description = document.createElement('p');
  description.textContent = role.description;
  const times = document.createElement('p');
  times.className = 'role-times';
  times.textContent = 'Sample times: ' + role.availability.map(time => availabilityLabels[time]).join(' or ');
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.roleId = role.id;
  button.textContent = role.id === savedId ? 'Saved role' : 'Save this role';
  article.append(heading, description, times, button);
  return article;
}

function renderMatches(availability) {
  const results = document.querySelector('#role-results');
  const feedback = document.querySelector('#match-feedback');
  if (!results || !feedback) return;
  results.replaceChildren();
  if (!availabilityLabels[availability]) {
    feedback.textContent = 'Please choose when you are available first.';
    return;
  }
  const matches = findMatchingRoles(availability);
  const saved = readSavedPreference();
  matches.forEach(role => results.appendChild(makeRoleCard(role, availability, saved && saved.roleId)));
  feedback.textContent = matches.length + ' sample role' + (matches.length === 1 ? '' : 's') +
    ' match ' + availabilityLabels[availability].toLowerCase() + '. Choose one to save.';
}

function initializeRoleFinder() {
  const availability = document.querySelector('#role-availability');
  if (!availability) return;
  document.querySelector('#show-roles').addEventListener('click', () => renderMatches(availability.value));
  document.querySelector('#role-results').addEventListener('click', event => {
    const button = event.target.closest('button[data-role-id]');
    if (!button) return;
    const chosenRole = volunteerRoles.find(role => role.id === button.dataset.roleId);
    if (!chosenRole) return;
    const choice = { roleId: chosenRole.id, availability: availability.value };
    const stored = storePreference(choice);
    showSavedRole(choice);
    renderMatches(availability.value);
    if (!stored) document.querySelector('#match-feedback').textContent =
      'Role selected, but this browser did not allow us to save it for the next visit.';
  });
  const saved = readSavedPreference();
  if (saved) {
    availability.value = saved.availability;
    renderMatches(saved.availability);
    showSavedRole(saved, true);
  }
}

function showFieldError(input, message, errorId) {
  const target = document.getElementById(errorId);
  target.textContent = message;
  if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
  return !message;
}

function validateTextField(input, errorId, label, minimum) {
  const value = input.value.trim();
  let message = '';
  if (!value) message = label + ' is required.';
  else if (value.length < minimum) message = label + ' must have at least ' + minimum + ' characters.';
  return showFieldError(input, message, errorId);
}

function validateEmail() {
  const input = document.getElementById('email');
  const value = input.value.trim();
  let message = '';
  if (!value) message = 'Email address is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || !input.checkValidity())
    message = 'Enter an email address like name@example.com.';
  return showFieldError(input, message, 'email-error');
}

function validateZip() {
  const input = document.getElementById('zip');
  const value = input.value.trim();
  return showFieldError(input, value && !/^\d{5}$/.test(value)
    ? 'ZIP code must have exactly 5 numbers.' : '', 'zip-error');
}

function validateInterest() {
  const radios = Array.from(document.querySelectorAll('input[name="interest"]'));
  const selected = radios.some(radio => radio.checked);
  const error = document.getElementById('interest-error');
  error.textContent = selected ? '' : 'Choose volunteer, foster, or adoption information.';
  radios.forEach(radio => radio.setAttribute('aria-invalid', String(!selected)));
  return selected;
}

function validateAvailability() {
  const input = document.getElementById('availability');
  return showFieldError(input, input.value ? '' : 'Choose your availability.', 'availability-error');
}

function validateForm() {
  // Run every check so users can see and fix all mistakes at once.
  const results = [
    validateTextField(document.getElementById('full-name'), 'name-error', 'Full name', 2),
    validateEmail(), validateZip(), validateInterest(), validateAvailability(),
    validateTextField(document.getElementById('experience'), 'experience-error', 'Pet experience', 10),
    validateTextField(document.getElementById('message'), 'message-error', 'Short message', 10)
  ];
  return results.every(Boolean);
}

function restoreContactPreference() {
  const saved = readSavedPreference();
  if (!saved) return;
  const role = volunteerRoles.find(item => item.id === saved.roleId);
  if (!role) return;
  document.getElementById('saved-form-choice').hidden = false;
  document.getElementById('contact-saved-role').textContent = role.title;
  document.querySelector('input[name="interest"][value="volunteer"]').checked = true;
  document.getElementById('availability').value = saved.availability;
}

function initializeForm() {
  const form = document.getElementById('interest-form');
  if (!form) return;
  restoreContactPreference();
  const checks = {
    'full-name': () => validateTextField(document.getElementById('full-name'), 'name-error', 'Full name', 2),
    email: validateEmail,
    zip: validateZip,
    availability: validateAvailability,
    experience: () => validateTextField(document.getElementById('experience'), 'experience-error', 'Pet experience', 10),
    message: () => validateTextField(document.getElementById('message'), 'message-error', 'Short message', 10)
  };
  Object.entries(checks).forEach(([id, check]) => {
    const input = document.getElementById(id);
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') check();
    });
    input.addEventListener('change', () => {
      if (input.getAttribute('aria-invalid') === 'true') check();
    });
  });
  form.querySelectorAll('input[name="interest"]').forEach(radio =>
    radio.addEventListener('change', validateInterest));

  form.addEventListener('submit', event => {
    // This classroom site has no server; prevent any real submission.
    event.preventDefault();
    const status = document.getElementById('form-status');
    if (!validateForm()) {
      status.className = 'is-error';
      status.textContent = 'Please fix the highlighted fields before continuing.';
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
    } else {
      status.className = '';
      status.textContent = 'All fields passed the checks. This class project does not send your information.';
      status.focus();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeRoleFinder();
  initializeForm();
});
