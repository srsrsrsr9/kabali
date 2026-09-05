/* Storage.
 *
 * Three backends, tried in order, so the page is useful at every stage of
 * setup:
 *
 *   1. Supabase  — when config.js is filled in AND you are signed in.
 *                  Rows live in your own Postgres, scoped to your user by
 *                  row-level security, and sync live between devices.
 *   2. IndexedDB — always used as a local mirror. Survives reloads, works
 *                  where localStorage is refused (file:// pages, some
 *                  privacy modes), and is evicted less eagerly.
 *   3. localStorage — mirrored to as well, as a second line of defence.
 *
 * Writes go to the mirror first and are pushed to Supabase after. A push
 * that fails is queued and retried on the next write, on reconnect, and on
 * sign-in, so a dropped connection mid-call does not lose the note.
 *
 * Conflict handling is last-write-wins per row. Two devices editing the
 * same school's same field within seconds of each other is the only case
 * that loses anything, and the loser is whichever saved first.
 */
(function () {
  "use strict";

  var COLS = ["schools", "rentals", "tasks"];
  var LS_KEY = "ddk-tracker-v1";
  var IDB_NAME = "ddk-tracker", IDB_STORE = "state", IDB_KEY = "all";
  var TABLE = "tracker_rows";

  /* ---------- IndexedDB ---------- */
  var idb = (function () {
    var opening = null;
    function open() {
      if (opening) return opening;
      opening = new Promise(function (res, rej) {
        try {
          if (!window.indexedDB) { rej(new Error("no indexedDB")); return; }
          var r = window.indexedDB.open(IDB_NAME, 1);
          r.onupgradeneeded = function () {
            try {
              if (!r.result.objectStoreNames.contains(IDB_STORE)) r.result.createObjectStore(IDB_STORE);
            } catch (e) {}
          };
          r.onsuccess = function () { res(r.result); };
          r.onerror = function () { rej(r.error || new Error("open failed")); };
          r.onblocked = function () { rej(new Error("blocked")); };
        } catch (e) { rej(e); }
      });
      return opening;
    }
    function run(mode, fn) {
      return open().then(function (d) {
        return new Promise(function (res, rej) {
          var t, req;
          try { t = d.transaction(IDB_STORE, mode); req = fn(t.objectStore(IDB_STORE)); }
          catch (e) { rej(e); return; }
          t.oncomplete = function () { res(req ? req.result : undefined); };
          t.onerror = function () { rej(t.error); };
          t.onabort = function () { rej(t.error || new Error("aborted")); };
        });
      });
    }
    return {
      get: function () { return run("readonly", function (s) { return s.get(IDB_KEY); }); },
      set: function (v) { return run("readwrite", function (s) { return s.put(v, IDB_KEY); }); }
    };
  })();

  /* ---------- state ---------- */
  var cfg = window.TRACKER_CONFIG || {};
  var sb = null;
  var mode = "loading";      // loading | cloud | device | none
  var err = null, rev = 0;
  var cache = { schools: {}, rentals: {}, tasks: {} };
  var subs = [];
  var useIdb = false, useLs = false, persisted = null;
  var authState = "off";     // off | signed-out | sending | signed-in | error
  var authEmail = null, userId = null, authNote = null;
  var pending = {};          // "col/id" -> true (deleted rows carry value "del")

  function notify() { rev++; for (var i = 0; i < subs.length; i++) subs[i](); }
  function key(col, id) { return col + "/" + id; }

  /* ---------- local mirror ---------- */
  function lsUsable() {
    try {
      var k = "__probe" + Date.now();
      localStorage.setItem(k, "1");
      var ok = localStorage.getItem(k) === "1";
      localStorage.removeItem(k);
      return ok;
    } catch (e) { return false; }
  }
  function readLs() {
    try { var raw = JSON.parse(localStorage.getItem(LS_KEY) || "{}"); return raw && typeof raw === "object" ? raw : null; }
    catch (e) { return null; }
  }
  function adopt(raw) {
    if (!raw || typeof raw !== "object") return false;
    var any = false;
    COLS.forEach(function (c) {
      if (raw[c] && typeof raw[c] === "object") {
        cache[c] = raw[c];
        if (Object.keys(raw[c]).length) any = true;
      }
    });
    return any;
  }
  function saveLocal() {
    var ok = false;
    if (useLs) {
      try { localStorage.setItem(LS_KEY, JSON.stringify(cache)); ok = true; }
      catch (e) { useLs = false; }
    }
    if (useIdb) {
      idb.set(JSON.parse(JSON.stringify(cache))).then(function () {}, function () { useIdb = false; notify(); });
      ok = true;
    }
    if (!ok && mode !== "cloud") {
      mode = "none";
      err = "This browser has stopped saving — it is out of space or blocking storage. Copy a backup from the Timeline tab before you close the page.";
      notify();
    }
  }

  /* ---------- Supabase ---------- */
  function configured() {
    return !!(cfg.supabaseUrl && cfg.supabaseAnonKey &&
              cfg.supabaseUrl.indexOf("YOUR-") < 0 &&
              window.supabase && window.supabase.createClient);
  }

  function pull() {
    if (!sb || !userId) return Promise.resolve();
    return sb.from(TABLE).select("collection,doc_id,data").then(function (r) {
      if (r.error) { err = "Could not load from Supabase: " + r.error.message; notify(); return; }
      var fresh = { schools: {}, rentals: {}, tasks: {} };
      (r.data || []).forEach(function (row) {
        if (fresh[row.collection]) fresh[row.collection][row.doc_id] = row.data || {};
      });
      /* Anything edited offline and not yet pushed must survive the pull. */
      Object.keys(pending).forEach(function (k) {
        var p = k.split("/"), col = p[0], id = p.slice(1).join("/");
        if (pending[k] === "del") { delete fresh[col][id]; }
        else if (cache[col] && cache[col][id]) { fresh[col][id] = cache[col][id]; }
      });
      cache = fresh;
      saveLocal();
      err = null;
      notify();
    });
  }

  function push(col, id) {
    if (!sb || !userId) return;
    var k = key(col, id);
    var row = cache[col] ? cache[col][id] : null;
    var done = function () { delete pending[k]; notify(); };
    var fail = function (m) {
      pending[k] = row ? true : "del";
      err = "Not yet saved to Supabase (" + m + "). It is safe on this device and will retry.";
      notify();
    };
    if (!row) {
      sb.from(TABLE).delete().eq("collection", col).eq("doc_id", id)
        .then(function (r) { r.error ? fail(r.error.message) : done(); }, function (e) { fail(String(e)); });
      return;
    }
    sb.from(TABLE).upsert({
      user_id: userId, collection: col, doc_id: id, data: row, updated_at: new Date().toISOString()
    }, { onConflict: "user_id,collection,doc_id" })
      .then(function (r) { r.error ? fail(r.error.message) : done(); }, function (e) { fail(String(e)); });
  }

  function flush() {
    Object.keys(pending).forEach(function (k) {
      var p = k.split("/");
      push(p[0], p.slice(1).join("/"));
    });
  }

  function watchRealtime() {
    if (!sb || !userId) return;
    try {
      sb.channel("tracker-" + userId)
        .on("postgres_changes",
            { event: "*", schema: "public", table: TABLE, filter: "user_id=eq." + userId },
            function (payload) {
              var row = payload.new || payload.old;
              if (!row || !cache[row.collection]) return;
              var k = key(row.collection, row.doc_id);
              if (pending[k]) return;               // our own unsent edit wins locally
              if (payload.eventType === "DELETE") delete cache[row.collection][row.doc_id];
              else cache[row.collection][row.doc_id] = row.data || {};
              saveLocal();
              notify();
            })
        .subscribe();
    } catch (e) { /* realtime is a bonus; polling on reload still works */ }
  }

  var signedInFor = null;
  function onSignedIn(session) {
    if (signedInFor === session.user.id) return;   // getSession and onAuthStateChange both fire at boot
    signedInFor = session.user.id;
    userId = session.user.id;
    authEmail = session.user.email;
    authState = "signed-in";
    mode = "cloud";
    notify();
    pull().then(flush);
    watchRealtime();
  }

  function initSupabase() {
    try { sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey); }
    catch (e) { authState = "error"; authNote = "Could not start Supabase: " + e.message; notify(); return; }

    sb.auth.onAuthStateChange(function (_evt, session) {
      if (session && session.user) { onSignedIn(session); }
      else { signedInFor = null; userId = null; authEmail = null; authState = "signed-out"; mode = "device"; notify(); }
    });

    sb.auth.getSession().then(function (r) {
      var session = r && r.data && r.data.session;
      if (session && session.user) onSignedIn(session);
      else { authState = "signed-out"; mode = "device"; notify(); }
    }, function () { authState = "signed-out"; mode = "device"; notify(); });
  }

  /* ---------- boot ---------- */
  function startLocal(then) {
    try {
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then(function (g) { persisted = !!g; notify(); }, function () {});
      }
    } catch (e) {}
    useLs = lsUsable();
    idb.get().then(function (v) {
      useIdb = true;
      if (!adopt(v) && useLs) adopt(readLs());
      if (mode === "loading") mode = "device";
      notify(); saveLocal(); if (then) then();
    }, function () {
      useIdb = false;
      if (useLs) { adopt(readLs()); if (mode === "loading") mode = "device"; }
      else if (mode === "loading") { mode = "none"; }
      notify(); if (then) then();
    });
  }

  startLocal(function () { if (configured()) initSupabase(); });

  window.addEventListener("online", function () { if (sb && userId) flush(); });

  /* ---------- public interface ---------- */
  window.TrackerStore = {
    subscribe: function (fn) { subs.push(fn); return function () { subs = subs.filter(function (f) { return f !== fn; }); }; },
    mode: function () { return mode; },
    rev: function () { return rev; },
    error: function () { return err; },
    persisted: function () { return persisted; },
    pendingCount: function () { return Object.keys(pending).length; },
    backends: function () {
      var b = [];
      if (mode === "cloud") b.push("Supabase");
      if (useIdb) b.push("IndexedDB");
      if (useLs) b.push("localStorage");
      return b.join(" + ") || "nothing";
    },

    auth: function () {
      return {
        state: configured() ? authState : "off",
        email: authEmail,
        note: authNote,
        signIn: function (email) {
          if (!sb) return;
          authState = "sending"; authNote = null; notify();
          sb.auth.signInWithOtp({
            email: email,
            options: { emailRedirectTo: window.location.href.split("#")[0] }
          }).then(function (r) {
            if (r.error) { authState = "error"; authNote = r.error.message; }
            else { authState = "sending"; authNote = "Check " + email + " for a sign-in link, then open it on this device."; }
            notify();
          }, function (e) { authState = "error"; authNote = String(e); notify(); });
        },
        signOut: function () { if (sb) sb.auth.signOut(); }
      };
    },

    all: function (col) { return cache[col] || {}; },
    get: function (col, id) { return (cache[col] || {})[id] || null; },

    put: function (col, id, patch) {
      var cur = (cache[col] || {})[id] || {};
      cache[col][id] = Object.assign({}, cur, patch, { updatedAt: new Date().toISOString() });
      notify(); saveLocal();
      if (mode === "cloud") push(col, id);
    },
    remove: function (col, id) {
      delete cache[col][id];
      notify(); saveLocal();
      if (mode === "cloud") push(col, id);
    },
    newId: function () { return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },

    exportJSON: function () {
      return JSON.stringify({ format: "ddk-tracker", version: 1, exportedAt: new Date().toISOString(), data: cache }, null, 2);
    },
    importJSON: function (text) {
      var parsed;
      try { parsed = JSON.parse(text); }
      catch (e) { return "That is not valid JSON — paste the whole backup, including the outer braces."; }
      var d = parsed && parsed.data;
      if (!d || typeof d !== "object") return "No tracker data found in that text. Expected a backup with a \"data\" section.";
      var wrote = 0;
      COLS.forEach(function (col) {
        var incoming = d[col];
        if (!incoming || typeof incoming !== "object") return;
        Object.keys(incoming).forEach(function (id) {
          var row = incoming[id];
          if (!row || typeof row !== "object") return;
          cache[col][id] = Object.assign({}, cache[col][id] || {}, row);
          wrote++;
          if (mode === "cloud") push(col, id);
        });
      });
      saveLocal(); notify();
      return wrote ? null : "That backup was empty — nothing to restore.";
    }
  };
})();
