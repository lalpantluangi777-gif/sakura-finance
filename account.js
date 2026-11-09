// Sign-in page: email + password, Google, password-reset email. Result is saved as a small
// profile (uid, email, name) in localStorage key "sk.fb"; no password is ever stored.
(function () {
  'use strict';
  const V = '10.12.2', root = document.getElementById('app'), q = new URLSearchParams(location.search);
  try { const th = localStorage.getItem('sk.theme'); document.documentElement.dataset.theme = th === 'midnight' ? 'midnight' : 'pink'; } catch (e) { }
  const h = (tag, attrs, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs || {})) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v); } for (const k of kids.flat(Infinity)) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k))); return e; };
  let mod = null;
  async function fb() {
    if (mod) return mod;
    const [appM, authM] = await Promise.all([import('https://www.gstatic.com/firebasejs/' + V + '/firebase-app.js'), import('https://www.gstatic.com/firebasejs/' + V + '/firebase-auth.js')]);
    const app = appM.initializeApp(window.FIREBASE_CONFIG); mod = { A: authM, auth: authM.getAuth(app) }; return mod;
  }
  const MSG = {
    'auth/invalid-credential': 'Wrong email or password.', 'auth/wrong-password': 'Wrong email or password.', 'auth/user-not-found': 'No account with this email.',
    'auth/email-already-in-use': 'This email already has an account. Use Sign in.', 'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'That email address is not valid.', 'auth/missing-password': 'Enter your password.', 'auth/too-many-requests': 'Too many tries. Wait a few minutes.',
    'auth/network-request-failed': 'No internet connection.', 'auth/popup-closed-by-user': 'Google window was closed.', 'auth/cancelled-popup-request': 'Google window was closed.',
    'auth/popup-blocked': 'Popup was blocked. Allow popups for this site and try again.', 'auth/unauthorized-domain': 'This website address is not authorised in Firebase (Authentication > Settings > Authorized domains).',
    'auth/operation-not-allowed': 'This sign-in method is not turned on in Firebase (Authentication > Sign-in method).'
  };
  const say = (e) => (e && MSG[e.code]) || ('Something went wrong' + (e && e.code ? ' (' + e.code + ')' : '') + '.');
  function save(u, provider) {
    const p = { uid: String(u.uid).slice(0, 128), email: String(u.email || '').slice(0, 200), name: String(u.displayName || '').slice(0, 80), verified: !!u.emailVerified, provider, ts: Date.now() };
    try { localStorage.setItem('sk.fb', JSON.stringify(p)); } catch (e) { }
    return p;
  }
  let tab = ['signin', 'signup', 'reset'].includes(q.get('a')) ? q.get('a') : 'signin';
  const emailPre = (q.get('email') || '').slice(0, 200);
  function done(text, extra) {
    root.replaceChildren(h('div', { class: 'screen center' }, h('div', { style: 'font-size:52px' }, '✓'), h('h2', {}, text), extra ? h('p', { class: 'sub' }, extra) : null,
      h('a', { class: 'btn', style: 'display:block;text-decoration:none;text-align:center;margin-top:18px;width:100%', href: 'index.html' }, 'Back to Sakura Finance')));
  }
  async function run(btn, errBox, fn) {
    btn.disabled = true; errBox.textContent = '…';
    try { await fn(); } catch (e) { errBox.textContent = say(e); } finally { btn.disabled = false; }
  }
  function draw() {
    const email = h('input', { type: 'email', placeholder: 'Email', autocomplete: 'email', value: emailPre });
    const pw = h('input', { type: 'password', placeholder: 'Password', autocomplete: tab === 'signup' ? 'new-password' : 'current-password' });
    const err = h('div', { class: 'err' });
    const tabs = h('div', { class: 'seg2' }, ['signin', 'signup', 'reset'].map(k => h('button', { class: tab === k ? 'on' : '', onclick: () => { tab = k; draw(); } }, { signin: 'Sign in', signup: 'Sign up', reset: 'Forgot password' }[k])));
    const go = h('button', { class: 'btn' }, { signin: 'Sign in', signup: 'Create account', reset: 'Send reset email' }[tab]);
    go.addEventListener('click', () => run(go, err, async () => {
      const m = email.value.trim(); if (!m) { err.textContent = 'Enter your email.'; return; }
      const { A, auth } = await fb();
      if (tab === 'reset') { await A.sendPasswordResetEmail(auth, m); done('Reset email sent', 'Open the email from Firebase (check Spam too) and choose a new account password. This does not change your app lock password.'); return; }
      if (!pw.value) { err.textContent = 'Enter your password.'; return; }
      if (tab === 'signup') { const c = await A.createUserWithEmailAndPassword(auth, m, pw.value); try { await A.sendEmailVerification(c.user); } catch (e) { } save(c.user, 'password'); done('Account created', 'We sent a verification email to ' + m + '.'); }
      else { const c = await A.signInWithEmailAndPassword(auth, m, pw.value); save(c.user, 'password'); done('Signed in', c.user.email); }
    }));
    const google = h('button', { class: 'btn soft', style: 'margin-bottom:12px' }, 'G  Continue with Google');
    google.addEventListener('click', () => run(google, err, async () => { const { A, auth } = await fb(); const c = await A.signInWithPopup(auth, new A.GoogleAuthProvider()); save(c.user, 'google'); done('Signed in with Google', c.user.email); }));
    root.replaceChildren(h('div', { class: 'screen' }, h('div', { class: 'scroll', style: 'padding-bottom:30px' },
      h('a', { class: 'backbtn', href: 'index.html', style: 'display:inline-block;text-decoration:none;text-align:center;line-height:36px', 'aria-label': 'Back' }, '‹'),
      h('div', { class: 'brand', style: 'text-align:center;margin-top:10px' }, 'SAKURA FINANCE'), h('p', { class: 'sub', style: 'text-align:center' }, 'Account'),
      h('div', { class: 'card' }, tabs, tab === 'reset' ? null : google, tab === 'reset' ? null : h('p', { class: 'sub', style: 'text-align:center;margin:0 0 8px' }, 'or use email'),
        h('label', {}, 'Email'), email, tab === 'reset' ? null : [h('label', {}, 'Password'), pw], err, go),
      h('p', { class: 'sub' }, 'Your money data stays encrypted on this phone. Signing in only proves who you are; it does not upload your transactions.'))));
  }
  if (q.get('a') === 'signout') {
    (async () => { try { const { auth } = await fb(); await auth.signOut(); } catch (e) { } try { localStorage.removeItem('sk.fb'); } catch (e) { } done('Signed out'); })();
  } else draw();
})();
