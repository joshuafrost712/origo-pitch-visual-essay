/**
 * Sign-up sink for the Origo visual essay.
 *
 * Bound to the private Google Sheet "Origo Sign-ups" (Extensions > Apps Script)
 * and deployed as a web app with "Anyone" access, so the public essay can post
 * to one URL:
 *
 *   - doPost — the site POSTs JSON; we validate, dedupe by email, and write a row.
 *   - doGet  — no params: a liveness string, so the URL can be checked in a
 *              browser. With ?callback= plus the same fields: the identical
 *              path, returned as JSONP. That is the fallback the site uses only
 *              if a readable POST turns out to be blocked; both routes go
 *              through handle_() so they cannot drift apart.
 *
 * Row shape (the script owns columns 1-8 and never writes 9-10):
 *   Received | Email | Name | Updates | Beta | Works on | Source | Confirmed |
 *   Contacted | Notes
 *
 * "Contacted" and "Notes" are Joshua's own triage columns. Nothing here touches
 * them, so a later sign-up can never clobber a note he wrote by hand.
 *
 * Config lives in Script Properties (Project Settings > Script Properties), not
 * in this file: this repo is public. Required: NOTIFY_EMAIL.
 *
 * Redeploy gotcha: the /exec URL serves the deployed version snapshot, not your
 * latest saved code. After editing, Deploy > Manage deployments > pencil >
 * Version: New version > Deploy, or the URL keeps serving the old script.
 */

var SHEET_NAME = 'Sign-ups'
var HEADERS = [
  'Received', 'Email', 'Name', 'Updates', 'Beta', 'Works on', 'Source',
  'Confirmed', 'Contacted', 'Notes',
]

// Column numbers. SCRIPT_COLS is the boundary: 9 (Contacted) and 10 (Notes) are
// Joshua's, and no code path below may write past this.
var COL = { received: 1, email: 2, name: 3, updates: 4, beta: 5, worksOn: 6, source: 7, confirmed: 8 }
var SCRIPT_COLS = 8

// The endpoint is public, so every field is untrusted. Cap what we store so a
// paste (or a bot) cannot bloat a cell.
var MAX_EMAIL = 254
var MAX_NAME = 120
var MAX_WORKS_ON = 1000
var MAX_SOURCE = 120

// Per-day write ceiling. This exists so a bot cannot burn the MailApp daily
// recipient quota and lock Joshua out of his own notifications.
var DAILY_CAP = 200
var DAILY_PROP = 'DAILY_COUNT'

// Field a human never sees and never fills. Any content means a bot.
var HONEYPOT_FIELD = 'website'

var CONFIRM_SUBJECT = "You're on the Origo list"
var CONFIRM_BODY = [
  'Thanks for signing up. I will write when there is something real to report, every month or two rather than every week.',
  '',
  'If you ticked the beta box, I will come to you directly when there is something worth your time.',
  '',
  'Joshua Frost',
  'SIL International',
].join('\n')

function notifyEmail_() {
  return PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL')
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME)
  if (sh.getLastRow() === 0 || !sh.getRange(1, 1).getValue()) {
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    sh.setFrozenRows(1)
  }
  return sh
}

// ---------------------------------------------------------------- validation

function truthy_(v) {
  if (v === true) return true
  return ['1', 'true', 'yes', 'on'].indexOf(String(v == null ? '' : v).trim().toLowerCase()) >= 0
}

function clip_(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max)
}

function validEmail_(email) {
  return email.length > 0 && email.length <= MAX_EMAIL && /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/.test(email)
}

// ------------------------------------------------------------- daily ceiling

function todayKey_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
}

/** Reads the counter without touching it. One property, reset on date change. */
function dailyCount_() {
  var raw = PropertiesService.getScriptProperties().getProperty(DAILY_PROP) || ''
  var parts = raw.split('|')
  if (parts[0] !== todayKey_()) return 0
  return parseInt(parts[1], 10) || 0
}

function bumpDailyCount_() {
  var n = dailyCount_() + 1
  PropertiesService.getScriptProperties().setProperty(DAILY_PROP, todayKey_() + '|' + n)
}

// ------------------------------------------------------------------ the work

/**
 * The single path both doPost and doGet run. Returns a plain result object;
 * the caller decides whether to serialise it as JSON or JSONP.
 *
 * Deliberately never echoes a submitted value back in the response, so nothing
 * untrusted can ride out through the JSONP path.
 */
function handle_(data) {
  data = data || {}

  // 1. Honeypot. Look identical to success, write nothing, send nothing.
  if (clip_(data[HONEYPOT_FIELD], 200)) return { ok: true, status: 'added' }

  // 2. Validate.
  var email = clip_(data.email, MAX_EMAIL + 1)
  if (!validEmail_(email)) return { ok: false, error: 'bad-email' }

  var updates = truthy_(data.updates)
  var beta = truthy_(data.beta)
  if (!updates && !beta) return { ok: false, error: 'no-interest' }

  var name = clip_(data.name, MAX_NAME)
  var worksOn = clip_(data.works_on, MAX_WORKS_ON)
  var source = clip_(data.source, MAX_SOURCE)

  // Serialise from here: dedupe reads then writes, and two simultaneous posts
  // from the same address would otherwise both miss and both append.
  var lock = LockService.getScriptLock()
  try {
    lock.waitLock(20000)
  } catch (err) {
    return { ok: false, error: 'busy' }
  }

  var row, isNew
  try {
    // 3. Daily ceiling, checked before anything is written.
    if (dailyCount_() >= DAILY_CAP) return { ok: false, error: 'rate' }

    var sh = sheet_()
    row = findRow_(sh, email)
    isNew = !row

    if (isNew) {
      // appendRow writes columns 1-7 of a fresh row; 8-10 stay empty.
      sh.appendRow([new Date(), email, name, updates, beta, worksOn, source])
      row = sh.getLastRow()
    } else {
      sh.getRange(row, COL.updates, 1, 2).setValues([[updates, beta]])
      // Only overwrite the note if this submission carried one, so a returning
      // signer who leaves it blank does not erase what they told us before.
      if (worksOn) sh.getRange(row, COL.worksOn).setValue(worksOn)
      if (name && !clip_(sh.getRange(row, COL.name).getValue(), MAX_NAME)) {
        sh.getRange(row, COL.name).setValue(name)
      }
    }
    bumpDailyCount_()
    SpreadsheetApp.flush()
  } finally {
    lock.releaseLock()
  }

  // 4. Email, on a new sign-up only. Never on a duplicate, a honeypot hit, a
  // validation failure, or a rate rejection.
  if (isNew) {
    sendConfirmation_(sheet_(), row, email)
    sendNotification_(email, name, updates, beta, worksOn, source)
  }

  return { ok: true, status: isNew ? 'added' : 'updated' }
}

/** Case-insensitive lookup in column B. Returns the row number, or 0. */
function findRow_(sh, email) {
  var last = sh.getLastRow()
  if (last < 2) return 0
  var values = sh.getRange(2, COL.email, last - 1, 1).getValues()
  var needle = email.toLowerCase()
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === needle) return i + 2
  }
  return 0
}

/**
 * Stamps Confirmed with what was actually sent, not what was intended. A failed
 * courtesy email must not read as a failed sign-up: the row is the part that
 * matters, so we swallow the error and leave Confirmed empty.
 */
function sendConfirmation_(sh, row, email) {
  try {
    MailApp.sendEmail({ to: email, subject: CONFIRM_SUBJECT, body: CONFIRM_BODY })
    sh.getRange(row, COL.confirmed).setValue(new Date())
  } catch (err) {
    console.error('confirmation email failed: ' + err)
  }
}

function sendNotification_(email, name, updates, beta, worksOn, source) {
  var to = notifyEmail_()
  if (!to) return
  var ticked = updates && beta ? 'updates + beta' : (beta ? 'beta' : 'updates')
  try {
    MailApp.sendEmail({
      to: to,
      subject: 'Origo sign-up: ' + ticked,
      body: [
        'Email: ' + email,
        'Name: ' + (name || '(none given)'),
        'Wants: ' + ticked,
        'Works on: ' + (worksOn || '(none given)'),
        'Source: ' + (source || '(none given)'),
      ].join('\n'),
    })
  } catch (err) {
    console.error('notification email failed: ' + err)
  }
}

// ----------------------------------------------------------------- endpoints

function doPost(e) {
  try {
    var body = (e && e.postData && e.postData.contents) || ''
    var data
    try {
      data = JSON.parse(body || '{}')
    } catch (err) {
      return json_({ ok: false, error: 'bad-request' })
    }
    return json_(handle_(data))
  } catch (err) {
    console.error('doPost failed: ' + err)
    return json_({ ok: false, error: 'server' })
  }
}

function doGet(e) {
  var params = (e && e.parameter) || {}
  if (!params.callback && !params.email) {
    return ContentService.createTextOutput('Origo sign-up endpoint is live.')
  }
  var result
  try {
    result = handle_(params)
  } catch (err) {
    console.error('doGet failed: ' + err)
    result = { ok: false, error: 'server' }
  }
  if (!params.callback) return json_(result)

  // The callback name is reflected into executable JavaScript, so it is the one
  // submitted value that must be checked rather than merely escaped.
  var cb = String(params.callback)
  if (!/^[A-Za-z_$][A-Za-z0-9_$]{0,63}$/.test(cb)) {
    return json_({ ok: false, error: 'bad-callback' })
  }
  return ContentService
    .createTextOutput(cb + '(' + JSON.stringify(result) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT)
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
