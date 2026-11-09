'use strict';
/* Sakura Finance Mobile - a private, offline-first finance app.
   - Everything stays on this phone. There is no server and no tracking.
   - Your data is encrypted with AES-256-GCM. The key is protected by your password
     (PBKDF2-SHA256, 310,000 rounds) and, if you enable it, by fingerprint/face unlock (WebAuthn PRF).
   - The page is built with DOM calls only (never innerHTML), and a strict Content-Security-Policy blocks injected code. */

// ============================================================ tiny helpers
const enc = new TextEncoder(), dec = new TextDecoder();
const $app = document.getElementById('app');
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : String(kid));
  return el;
}
const svgNS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs, ...kids) {
  const el = document.createElementNS(svgNS, tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
  for (const kid of kids.flat(Infinity)) if (kid != null) el.append(kid.nodeType ? kid : String(kid));
  return el;
}
const b64 = u8 => btoa(String.fromCharCode(...new Uint8Array(u8)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const rnd = n => crypto.getRandomValues(new Uint8Array(n));
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const ym = d => d.slice(0, 7);
const uid = () => b64(rnd(9)).replace(/[^A-Za-z0-9]/g, 'x');
const lsGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } };
const lsDel = k => { try { localStorage.removeItem(k); } catch { } };

// ============================================================ languages
const CATS = [['Food', '🍜'], ['Groceries', '🛒'], ['Dining', '🍽️'], ['Transport', '🚌'], ['Travel', '✈️'], ['Fuel', '⛽'], ['Bills', '🧾'],
['Rent', '🏠'], ['Utilities', '💡'], ['Shopping', '🛍️'], ['Clothing', '👕'], ['Health', '💊'], ['Fitness', '🏋️'], ['Education', '🎓'],
['Books', '📚'], ['Entertainment', '🎬'], ['Subscriptions', '📺'], ['Insurance', '🛡️'], ['Loans', '🏦'], ['Savings', '🐷'], ['Gifts', '🎁'],
['Charity', '🤝'], ['Family', '👪'], ['Pets', '🐾'], ['Taxes', '📑'], ['Business', '💼'], ['Purchases', '📦'], ['Payroll', '👥'], ['Other', '✨']];
const INCOME_CATS = [['Salary', '💰'], ['Business', '💼'], ['Freelance', '💻'], ['Sales', '🏷️'], ['Bonus', '🎉'], ['Interest', '📈'],
['Investments', '📊'], ['Rental', '🏘️'], ['Refund', '↩️'], ['Gifts', '🎁'], ['Other', '✨']];
const BIZ_ONLY = ['Sales', 'Purchases', 'Payroll'];
const icon = c => (CATS.concat(INCOME_CATS).find(x => x[0] === c) || [0, '✨'])[1];

const LANG = {
  en: {
    name: 'English', welcome: 'Welcome to', tag: 'One Platform for Personal & Business Finance', create: 'Create your account',
    your_name: 'Your name', password: 'Password', confirm: 'Confirm password', pw_hint: 'At least 8 characters. Use a phrase only you know.',
    pw_warn: 'There is NO "forgot password": your data is encrypted with it. Write it down somewhere safe, and make backups.',
    start: 'Create account', unlock: 'Unlock', hello: 'Welcome back', wrong: 'Wrong password.', locked_for: 'Too many attempts. Try again in {s}s.',
    bio: 'Unlock with fingerprint / face', bio_fail: 'Biometric unlock failed. Use your password.', short: 'Password must be at least 8 characters.',
    nomatch: 'Passwords do not match.', need_name: 'Please enter your name.', erase_q: 'Erase everything on this phone?',
    mode_title: 'How would you like to use Sakura Finance?', personal: 'Personal', personal_d: 'For individuals and families',
    business: 'Business', business_d: 'For small, medium and large companies', mode_hint: 'You can switch any time from the top of the screen.',
    home: 'Home', activity: 'Activity', budgets: 'Budgets', assistant: 'Assistant', invoices: 'Invoices', settings: 'Settings',
    balance: 'Your available balance', income: 'Income', expense: 'Expense', this_month: 'This month', spend_freq: 'Spend frequency',
    today: 'Today', week: 'Week', month: 'Month', year: 'Year', recent: 'Recent transactions', see_all: 'See all', breakdown: 'Where your money goes',
    nodata: 'Nothing yet. Tap + to add your first entry, or load demo data in Settings.', add: 'Add', amount: 'Amount', note: 'Note', date: 'Date',
    category: 'Category', save: 'Save', cancel: 'Cancel', delete: 'Delete', all: 'All', search: 'Search', budget_set: 'Set budget', limit: 'Monthly limit',
    used: '{a} of {b} used', no_budget: 'No budgets yet. Set limits to keep spending in check.', over: 'Over budget!', warn80: 'Almost at the limit',
    receivable: 'To receive', payable: 'To pay', profit: 'Profit', new_invoice: 'New invoice', sale: 'Sale', purchase: 'Purchase', party: 'Customer / Supplier',
    due: 'Due date', item: 'Item', qty: 'Qty', price: 'Price', add_line: '+ Add item', total: 'Total', paid: 'Paid', unpaid: 'Unpaid', mark_paid: 'Mark paid',
    no_inv: 'No invoices yet.', need_lines: 'Add at least one item with a price.', ask_ph: 'Tell me: "salary 5000 dawng"...',
    send: 'Send', welcome_bot: 'Hi! I am your money assistant. Tell me what you earned or spent and I will record it, or ask about your balance, reports, a money plan or a lesson. Type "help".',
    language: 'Language', currency: 'Currency', security: 'Security', change_pw: 'Change password', cur_pw: 'Current password', new_pw: 'New password',
    bio_on: 'Fingerprint / face unlock', bio_unsupported: 'This phone/browser cannot use biometrics to protect the key. Password unlock still works.',
    bio_enabled: 'Biometric unlock enabled.', bio_disabled: 'Biometric unlock disabled.', autolock: 'Auto-lock after', min: 'min', lock_now: 'Lock now',
    data: 'Your data', export: 'Export encrypted backup', import: 'Import backup', demo: 'Load demo data', erase: 'Erase everything',
    exported: 'Backup saved.', imported: 'Backup restored.', bad_backup: 'That file is not a valid backup, or the password is different.',
    about: 'Private by design: no accounts online, no servers. Data never leaves this phone unless you export it.', saved: 'Saved.',
    done_inc: 'Done. Recorded income {a} ({c}).', done_exp: 'Done. Recorded expense {a} ({c}).', ask_amt: 'How much was it?', moved_inc: 'Okay, changed to income.',
    moved_exp: 'Okay, changed to expense.', undone: 'Removed: {w}.', nothing_undo: 'Nothing to undo.', bal_msg: 'You have {b} in total. This month: income {i}, expense {e}.',
    rep: '{p}: income {i}, expense {e}.', top_msg: 'Biggest spending this month: {l}.', top_none: 'No expenses this month yet.',
    afford_yes: 'Yes, you can afford {a}. You would still have {l} left.', afford_tight: 'You can pay {a}, but only {l} would be left. Think twice.',
    afford_no: 'That is more than your balance of {b}. Better save first.', plan_head: 'Your money plan - average monthly income {i}, average spending {e}.',
    plan_rule: 'Suggested split (50/30/20): needs {n}, wants {w}, savings {s}.', plan_now: 'Right now your savings rate is {p}%.',
    tip_top: 'Your biggest cost is {c}. Cut it by 10% to free {a} a month.', tip_low: 'Pay yourself first: move {a} to savings the day income arrives.',
    tip_good: 'Great job - you keep {p}% of what you earn. Build an emergency fund next.', tip_neg: 'You spend more than you earn. List what you can cut first.',
    plan_nodata: 'Add some income and expenses first, then I can build a plan.', unknown: 'I did not catch that. Try: "lunch 120", "salary 5000", "balance", "report" or "help".', ask_kind: 'Is {a} income or an expense? Reply like "salary" or "lunch".',
    help: 'I can: record income/expenses ("received 5000 salary", "spent 200 petrol"), tell your balance, reports (today, yesterday, week, month, year), top spending, budgets, "can I afford 3000?", a money plan, lessons ("teach me budgeting") and undo.',
    budget_msg: 'Budgets this month:', no_budget_msg: 'You have no budgets yet.', thanks: 'You are welcome!',
    l_budget: 'BUDGET: a plan for your money before you spend it. Write your income, list fixed costs, set a limit per category, and check weekly.',
    l_503020: '50/30/20: 50% of income for needs, 30% for wants, 20% for savings and debt. Ask me for "a money plan" to see it with your numbers.',
    l_emergency: 'EMERGENCY FUND: keep 3-6 months of living costs somewhere easy to reach. Start small, even 5% of income.',
    l_save: 'SAVING TIPS: save first and spend what is left; track small expenses; wait 24 hours before big purchases; pay high-interest loans early; review your month on the 1st.',
    p_today: 'Today', p_yesterday: 'Yesterday', p_week: 'Last 7 days', p_month: 'This month', p_year: 'This year',
    lock_title: 'Locked', idle_lock: 'Locked because you were away.', p1: 'Weak', p2: 'Okay', p3: 'Good', p4: 'Strong',
    c_Food: 'Food', c_Groceries: 'Groceries', c_Dining: 'Dining', c_Transport: 'Transport', c_Travel: 'Travel', c_Fuel: 'Fuel', c_Bills: 'Bills', c_Rent: 'Rent',
    c_Utilities: 'Utilities', c_Shopping: 'Shopping', c_Clothing: 'Clothing', c_Health: 'Health', c_Fitness: 'Fitness', c_Education: 'Education', c_Books: 'Books',
    c_Entertainment: 'Fun', c_Subscriptions: 'Subscriptions', c_Insurance: 'Insurance', c_Loans: 'Loans', c_Savings: 'Savings', c_Gifts: 'Gifts', c_Charity: 'Charity',
    c_Family: 'Family', c_Pets: 'Pets', c_Taxes: 'Taxes', c_Business: 'Business', c_Purchases: 'Purchases', c_Payroll: 'Payroll', c_Other: 'Other', c_Salary: 'Salary',
    c_Freelance: 'Freelance', c_Sales: 'Sales', c_Bonus: 'Bonus', c_Interest: 'Interest', c_Investments: 'Investments', c_Rental: 'Rental', c_Refund: 'Refund',
  },
  lus: {
    name: 'Mizo', welcome: 'Chibai! Lo kal rawh', tag: 'Mimal leh Business sum enkawlna platform pakhat', create: 'Account siam rawh',
    your_name: 'I hming', password: 'Password', confirm: 'Password nemnghet', pw_hint: 'Character 8 tal. Nangmah chauh hriat thu hman rawh.',
    pw_warn: 'Password theihnghilh a nei lo: i data chu a hmangin encrypt a ni. Hmun himah ziak la, backup siam reng rawh.',
    start: 'Account siam', unlock: 'Hawng', hello: 'Lo kal leh e', wrong: 'Password dik lo.', locked_for: 'Tum tam lutuk. Second {s} hnuah tum leh rawh.',
    bio: 'Kuta chhuiin / hmai hmangin hawng', bio_fail: 'Biometric hawng a hlawhchham. Password hmang rawh.', short: 'Password chu character 8 tal a ni tur.',
    nomatch: 'Password pahnih a inang lo.', need_name: 'I hming ziak rawh.', erase_q: 'He phone-a thil zawng zawng paih vek ang em?',
    mode_title: 'Sakura Finance engtin nge i hman duh?', personal: 'Mimal', personal_d: 'Mimal leh chhungkua tan', business: 'Business',
    business_d: 'Company te, laia leh lian tan', mode_hint: 'Screen chung ber aṭangin eng hunah pawh i thlak thei.',
    home: 'Home', activity: 'Activity', budgets: 'Budget', assistant: 'Assistant', invoices: 'Invoice', settings: 'Setting',
    balance: 'I sum neih theih', income: 'Lakluhna', expense: 'Senso', this_month: 'He thla', spend_freq: 'Senso dan',
    today: 'Vawiin', week: 'Chawlhkar', month: 'Thla', year: 'Kum', recent: 'A tuk lai transaction', see_all: 'Tinreng', breakdown: 'I sum a kal dan',
    nodata: 'A la awm lo. + hmet la dah rawh, emaw Setting-ah demo data load rawh.', add: 'Dah', amount: 'Zat', note: 'Note', date: 'Ni',
    category: 'Thil chi', save: 'Dahkhawm', cancel: 'Tihtawp', delete: 'Paih', all: 'Zawng zawng', search: 'Zawng', budget_set: 'Budget dah', limit: 'Thla tin limit',
    used: '{b} zinga {a} hman', no_budget: 'Budget a la awm lo. Limit dah la senso enkawl rawh.', over: 'Budget a liam!', warn80: 'Limit a hnai tawh',
    receivable: 'Dawn tur', payable: 'Pek tur', profit: 'Profit', new_invoice: 'Invoice thar', sale: 'Zawrh', purchase: 'Lei', party: 'Customer / Supplier',
    due: 'Pek tur ni', item: 'Thil', qty: 'Zat', price: 'Man', add_line: '+ Thil belh', total: 'Total', paid: 'Pek tawh', unpaid: 'Pek loh', mark_paid: 'Pek tawh tih',
    no_inv: 'Invoice a la awm lo.', need_lines: 'Thil man nei pakhat tal belh rawh.', ask_ph: 'Sawi rawh: "salary 5000 dawng"...', send: 'Thawn',
    welcome_bot: 'Chibai! Kei hi i sum assistant ka ni. Engzah nge i lakluh emaw i sen tih min hrilh la, ka dah ang; emaw balance, report, sum ruahmanna leh zirtirna min zawt thei. "help" tih ziak rawh.',
    language: 'Tawng', currency: 'Pawisa chi', security: 'Himna', change_pw: 'Password thlak', cur_pw: 'Password hman mek', new_pw: 'Password thar',
    bio_on: 'Kuta chhui / hmai hmangin hawng', bio_unsupported: 'He phone/browser hian biometric hmangin key a vengin a thei lo. Password hmangin hawng thei a ni.',
    bio_enabled: 'Biometric hawng a on a ni.', bio_disabled: 'Biometric hawng a off a ni.', autolock: 'Auto-lock', min: 'minute', lock_now: 'Tuh vek',
    data: 'I data', export: 'Encrypted backup chhuah', import: 'Backup lak lut', demo: 'Demo data load', erase: 'Zawng zawng paih',
    exported: 'Backup dahkhawm a ni.', imported: 'Backup siam leh a ni.', bad_backup: 'Backup dik lo emaw password a danglam.',
    about: 'Mahni tana siam: online account a awm lo, server a awm lo. I export loh chuan he phone aṭang data a chhuak lo.', saved: 'Dahkhawm a ni.',
    done_inc: 'Tih fel a ni. {c} atan lakluhna {a} dah a ni.', done_exp: 'Tih fel a ni. {c} atan senso {a} dah a ni.', ask_amt: 'Engzah nge a nih?',
    moved_inc: 'Aw, lakluhna ah ka thlak ta.', moved_exp: 'Aw, senso ah ka thlak ta.', undone: 'Paih a ni: {w}.', nothing_undo: 'Paih tur a awm lo.',
    bal_msg: 'I sum zawng zawng chu {b} a ni. He thla: lakluhna {i}, senso {e}.', rep: '{p}: lakluhna {i}, senso {e}.',
    top_msg: 'He thla senso lian ber: {l}.', top_none: 'He thla hian senso a la awm lo.', afford_yes: 'Aw, {a} i lei thei. A tâwpah {l} i la nei ang.',
    afford_tight: '{a} i pek thei, mahse {l} chauh i la nei ang. Ngaihtuah hram rawh.', afford_no: 'I balance {b} aiin a tam. Khawl hmasa zawk rawh.',
    plan_head: 'I sum ruahmanna - thla tin lakluhna average {i}, senso average {e}.', plan_rule: 'Tha tur then dan (50/30/20): mamawh {n}, duh {w}, khawl {s}.',
    plan_now: 'Tunah chuan i sum khawl zat chu {p}% a ni.', tip_top: 'I senso lian ber chu {c} a ni. 10% tihtlem la, thla tin {a} i khawl ang.',
    tip_low: 'Nangma hmasa zawk rawh: lakluhna i dawn ni khan {a} khawl rawh.', tip_good: 'A tha hle - i lakluh zinga {p}% i khawl. Emergency fund siam rawh.',
    tip_neg: 'I lakluh aia i sen a tam. Tihtlem theih tur hmasa phawt list rawh.', plan_nodata: 'Lakluhna leh senso hmasa phawt dah rawh, chutah ruahmanna ka siam ang.',
    unknown: 'Ka hre thiam lo. Hetiang tih tum rawh: "chaw 80", "salary 5000 dawng", "balance", "report", "help".', ask_kind: '{a} hi lakluh (income) emaw senso (expense) em? "salary" emaw "chaw" tih ang chi ziak rawh.',
    help: 'Ka tih theih: lakluhna/senso dah ("salary 5000 dawng", "petrol 200 sen"), balance hrilh, report (vawiin, nimin, chawlhkar, thla, kum), senso lian ber, budget, "3000 ka lei thei em?", sum ruahmanna, zirtirna ("budget min zirtir") leh paih (undo).',
    budget_msg: 'He thla budget:', no_budget_msg: 'Budget a la awm lo.', thanks: 'Aw, ka lawm e!',
    l_budget: 'BUDGET: I sum i hman hmain ruahmanna siam a ni. Lakluhna ziak la, hmanrua nei fel list la, category tin limit dah la, chawlhkar khat zel-ah en rawh.',
    l_503020: '50/30/20: Lakluhna 50% mamawh, 30% duh, 20% khawl leh pawisa hlen atan. "Sum ruahmanna" min zawt la, i sum aṭangin ka siam ang.',
    l_emergency: 'EMERGENCY FUND: Thla 3-6 chhung nunna sum chu lak mai theih hmunah khawl rawh. Tlem aṭanga ṭan rawh, lakluhna 5% pawh a tha.',
    l_save: 'KHAWL DAN: Khawl hmasa la a bak sen rawh; senso te te ziak rawh; thil lian lei hmain darkar 24 nghah rawh; interest sang loan hmasa phuar rawh; thla tin ni 1-ah en rawh.',
    p_today: 'Vawiin', p_yesterday: 'Nimin', p_week: 'Ni 7 chhung', p_month: 'He thla', p_year: 'He kum', lock_title: 'Tuh a ni', idle_lock: 'I kal bo avangin tuh a ni.',
    p1: 'Chak lo', p2: 'A pawng', p3: 'A tha', p4: 'Chak',
    c_Food: 'Chaw', c_Groceries: 'Grocery', c_Dining: 'Restaurant', c_Transport: 'Kalna', c_Travel: 'Zinna', c_Fuel: 'Petrol/Diesel', c_Bills: 'Bill', c_Rent: 'In man',
    c_Utilities: 'Current leh Tui', c_Shopping: 'Shopping', c_Clothing: 'Silhfen', c_Health: 'Hriselna', c_Fitness: 'Fitness', c_Education: 'Zirna', c_Books: 'Lehkhabu',
    c_Entertainment: 'Hlimna', c_Subscriptions: 'Subscription', c_Insurance: 'Insurance', c_Loans: 'Loan', c_Savings: 'Khawl', c_Gifts: 'Thilpek', c_Charity: 'Thawhlawm',
    c_Family: 'Chhungkua', c_Pets: 'Ran', c_Taxes: 'Tax', c_Business: 'Business', c_Purchases: 'Lei', c_Payroll: 'Hlawh pek', c_Other: 'Dang', c_Salary: 'Hlawh',
    c_Freelance: 'Freelance', c_Sales: 'Zawrh', c_Bonus: 'Bonus', c_Interest: 'Interest', c_Investments: 'Investment', c_Rental: 'In man lakluh', c_Refund: 'Refund',
  },
};

// ---- strings for auto-add, goals, student mode, themes, language packs
Object.assign(LANG.en, {
  acc_title: 'Account (optional)', acc_why: 'Sign in with Google or email to link your profile and get a password-reset email. Your money data stays on this phone.', acc_signin: 'Sign in / Sign up', acc_signed: 'Signed in', acc_unverified: 'email not verified',
  acc_out: 'Sign out', acc_out_q: 'Sign out of your account? Your data stays on this phone.', acc_reset: 'Send password reset email', forgot: 'Forgot password?',
  forgot_why: 'Your data is locked with this app password, so nobody can reset it, not even us. The reset email only changes your online account password. To get back in you can restore an encrypted backup file, or erase this phone and start fresh.',
  accent: 'Colour',
  calendar: 'Calendar',
  student: 'Student', student_d: 'For school & college students', auto_add: 'Auto-add', auto_card: 'Add from bank SMS / UPI / statement', cap_title: 'Auto-add transactions',
  cap_msgs: 'Messages', cap_file: 'Statement file', cap_paste: 'Paste your bank / UPI / GPay messages here. You can paste many at once - no typing of amounts.',
  cap_find: 'Find transactions', cap_found: '{n} transactions found', cap_none: 'No transaction found. The message must show an amount and words like debited, credited, paid or received.',
  cap_add: 'Add selected', cap_added: '{n} added, {d} duplicates skipped.', cap_csv: 'Choose the CSV statement you downloaded from your bank or app',
  cap_csv_bad: 'Could not find dates and amounts in this file. Please use the CSV statement (not PDF).',
  cap_tip: 'Android tip: install the app, then in your Messages app tap Share and choose Sakura - the message arrives here by itself.', dup: 'duplicate',
  subs: 'Subscriptions', per_month: '/month', goals: 'Goals', goal_new: 'New goal', goal_name: 'Goal name', goal_target: 'Target amount', goal_add: 'Add money',
  goal_done: '🎉 Goal reached!', allowance: 'Weekly allowance', allowance_set: 'Set allowance', left_week: 'left this week', over_allow: 'Over your allowance!',
  theme: 'Theme', theme_pink: 'Pink', theme_dark: 'Black & Red', theme_auto: 'Automatic', pack_title: 'Add a language', pack_import: 'Add language file',
  pack_template: 'Download template', pack_ok: 'Language added.', pack_bad: 'That is not a valid language file.', amount_q: 'Amount?', pick_cat: 'Category',
});
Object.assign(LANG.lus, {
  acc_title: 'Account (duh chuan)', acc_why: 'Google emaw email hmangin login la, i profile nen inzawm la password reset email i dawng thei ang. I sum data chu he phone ah a awm reng.', acc_signin: 'Login / Sign up', acc_signed: 'Login tawh', acc_unverified: 'email verify a la ni lo',
  acc_out: 'Logout', acc_out_q: 'Logout i duh em? I data chu he phone ah a awm reng ang.', acc_reset: 'Password reset email thawn', forgot: 'Password theihnghilh?',
  forgot_why: 'I data hi he app password hmangin a khar a, chuvang chuan tumahin reset thei lo. Reset email hian online account password chauh a thlak. Kir leh nan backup file (encrypted) restore emaw he phone erase la a thar lo tan ngai a ni.',
  accent: 'Rawng',
  calendar: 'Ni Calendar',
  student: 'Zirlai', student_d: 'School leh college zirlai tan', auto_add: 'Auto-dah', auto_card: 'Bank SMS / UPI / statement aṭanga dah', cap_title: 'Transaction auto-dah',
  cap_msgs: 'Message', cap_file: 'Statement file', cap_paste: 'I bank / UPI / GPay message hi hetah paste rawh. A tam tak pawh paste thei - zat ziak a ngai lo.',
  cap_find: 'Transaction zawng', cap_found: 'Transaction {n} hmuh a ni', cap_none: 'Transaction hmuh a ni lo. Message-ah zat leh debited, credited, paid emaw received a awm tur a ni.',
  cap_add: 'Thlan chu dah', cap_added: '{n} dah a ni, {d} inang (duplicate) khap a ni.', cap_csv: 'I bank emaw app aṭanga i download CSV statement thlang rawh',
  cap_csv_bad: 'He file-ah hian ni leh zat hmuh a ni lo. CSV statement (PDF ni lo) hmang rawh.',
  cap_tip: 'Android tip: app install la, i Message app-ah Share hmet la Sakura thlang rawh - message chu hetah a lo kal ang.', dup: 'inang',
  subs: 'Subscription', per_month: '/thla', goals: 'Tum', goal_new: 'Tum thar', goal_name: 'Tum hming', goal_target: 'Tum zat', goal_add: 'Sum dah',
  goal_done: '🎉 Tum chu a thleng ta!', allowance: 'Chawlhkar tin pawisa pek', allowance_set: 'Pawisa pek dah', left_week: 'he chawlhkar a la awm', over_allow: 'I pawisa pek a liam ta!',
  theme: 'Theme', theme_pink: 'Pink', theme_dark: 'Dum leh Sen', theme_auto: 'Automatic', pack_title: 'Tawng belh', pack_import: 'Tawng file belh',
  pack_template: 'Template download', pack_ok: 'Tawng belh a ni.', pack_bad: 'Tawng file dik lo.', amount_q: 'Engzah?', pick_cat: 'Thil chi',
});

// extra languages (langs.js) + packs the user added
if (typeof EXTRA_LANGS !== 'undefined') Object.assign(LANG, EXTRA_LANGS);
try { const p = JSON.parse(lsGet('sk.packs') || '{}'); for (const [k, v] of Object.entries(p)) LANG[k] = v; } catch { }
let lang = 'en';
const t = (k, v) => {
  let s = (LANG[lang] && LANG[lang][k]) ?? LANG.en[k] ?? k;
  if (v) for (const [a, b] of Object.entries(v)) s = s.replaceAll('{' + a + '}', b);
  return s;
};

// ============================================================ crypto + storage
const AAD = enc.encode('sakura-finance-v1');
const ITER = 310000;
const META = 'sk.meta', DATA = 'sk.data';
let S = null;   // unlocked session: {dekRaw, dekKey, data}
let meta = null;

const loadMeta = () => { try { return JSON.parse(lsGet(META)); } catch { return null; } };
const saveMeta = () => lsSet(META, JSON.stringify(meta));
async function kdf(pw, salt, iter) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pw.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
const aesKey = raw => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
async function seal(key, bytes) {
  const iv = rnd(12);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: AAD }, key, bytes);
  return { iv: b64(iv), ct: b64(ct) };
}
const open = (key, o) => crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv), additionalData: AAD }, key, unb64(o.ct));
const emptyBook = () => ({ tx: [], budgets: {}, invoices: [], goals: [], allowance: 0, cur: '₹' });
const emptyData = () => ({ v: 1, mode: 'personal', modeChosen: false, rules: {}, seen: [], books: { personal: emptyBook(), student: emptyBook(), business: emptyBook() } });

async function persist() {
  if (!S) return;
  const blob = await seal(S.dekKey, enc.encode(JSON.stringify(S.data)));
  if (!lsSet(DATA, JSON.stringify(blob))) alert('Storage is full or blocked - your last change could not be saved.');
}
async function openData(dekRaw) {
  const dekKey = await aesKey(dekRaw);
  const blob = JSON.parse(lsGet(DATA));
  const data = JSON.parse(dec.decode(await open(dekKey, blob)));   // GCM tag check = tamper detection
  data.books.personal = Object.assign(emptyBook(), data.books.personal);
  data.books.business = Object.assign(emptyBook(), data.books.business);
  data.books.student = Object.assign(emptyBook(), data.books.student);
  data.rules = data.rules || {}; data.seen = data.seen || []; data.profile = data.profile || {};
  S = { dekRaw, dekKey, data };
}
const lockedSeconds = () => Math.max(0, Math.ceil(((meta && meta.lockUntil) || 0) - Date.now() / 1000));
async function failAttempt() {
  meta.fails = (meta.fails || 0) + 1;
  if (meta.fails >= 4) meta.lockUntil = Date.now() / 1000 + Math.min(900, 15 * 2 ** (meta.fails - 4));
  saveMeta();
}
async function createAccount(name, pw) {
  const dekRaw = rnd(32), salt = rnd(16);
  const kek = await kdf(pw, salt, ITER);
  meta = { v: 1, name, salt: b64(salt), iter: ITER, wrap: await seal(kek, dekRaw), bio: null, fails: 0, lockUntil: 0, lang, autolock: 2 };
  saveMeta();
  S = { dekRaw, dekKey: await aesKey(dekRaw), data: emptyData() };
  await persist();
}
async function unlockPassword(pw) {
  if (lockedSeconds() > 0) return 'locked';
  try {
    const kek = await kdf(pw, unb64(meta.salt), meta.iter);
    const dekRaw = new Uint8Array(await open(kek, meta.wrap));
    await openData(dekRaw);
    meta.fails = 0; meta.lockUntil = 0; saveMeta();
    return 'ok';
  } catch { await failAttempt(); return 'wrong'; }
}
async function changePassword(oldPw, newPw) {
  try {
    const kek = await kdf(oldPw, unb64(meta.salt), meta.iter);
    await open(kek, meta.wrap);
  } catch { return false; }
  const salt = rnd(16), kek2 = await kdf(newPw, salt, ITER);
  meta.salt = b64(salt); meta.iter = ITER; meta.wrap = await seal(kek2, S.dekRaw); saveMeta();
  return true;
}
// ---- biometric unlock: WebAuthn PRF gives a secret that only the fingerprint/face can release
const bioSupported = () => !!(window.PublicKeyCredential && navigator.credentials && window.isSecureContext);
async function prfSecret(credId, prfSalt, create) {
  const pk = {
    challenge: rnd(32), timeout: 60000, userVerification: 'required',
    extensions: { prf: { eval: { first: prfSalt } } },
  };
  let res;
  if (create) {
    res = await navigator.credentials.create({
      publicKey: Object.assign(pk, {
        rp: { name: 'Sakura Finance', id: location.hostname },
        user: { id: rnd(16), name: meta.name || 'user', displayName: meta.name || 'user' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
      })
    });
    credId = new Uint8Array(res.rawId);
    const ext = res.getClientExtensionResults().prf;
    if (!ext || !ext.enabled) throw new Error('prf-unsupported');
  }
  const got = await navigator.credentials.get({ publicKey: Object.assign(pk, { allowCredentials: [{ type: 'public-key', id: credId }], rpId: location.hostname }) });
  const out = got.getClientExtensionResults().prf;
  if (!out || !out.results || !out.results.first) throw new Error('prf-unsupported');
  return { credId, secret: new Uint8Array(out.results.first) };
}
async function enableBio() {
  const prfSalt = rnd(32);
  const { credId, secret } = await prfSecret(null, prfSalt, true);
  const key = await aesKey(secret.slice(0, 32));
  meta.bio = { id: b64(credId), salt: b64(prfSalt), wrap: await seal(key, S.dekRaw) };
  saveMeta();
}
async function unlockBio() {
  const { secret } = await prfSecret(unb64(meta.bio.id), unb64(meta.bio.salt), false);
  const dekRaw = new Uint8Array(await open(await aesKey(secret.slice(0, 32)), meta.bio.wrap));
  await openData(dekRaw);
  meta.fails = 0; meta.lockUntil = 0; saveMeta();
}
// ---- backups
async function makeBackup() {
  return JSON.stringify({ format: 'sakura-backup-v1', name: meta.name, salt: meta.salt, iter: meta.iter, wrap: meta.wrap,
    data: JSON.parse(lsGet(DATA)) });
}
async function readBackup(text, pw) {
  const b = JSON.parse(text);
  if (b.format !== 'sakura-backup-v1') throw new Error('format');
  const kek = await kdf(pw, unb64(b.salt), b.iter);
  const dekRaw = new Uint8Array(await open(kek, b.wrap));
  const data = JSON.parse(dec.decode(await open(await aesKey(dekRaw), b.data)));
  return { b, dekRaw, data };
}
function wipeAll() { lsDel(META); lsDel(DATA); meta = null; S = null; }

// ============================================================ finance logic
const book = () => S.data.books[S.data.mode];
const isBiz = () => S.data.mode === 'business';
const fmt = n => book().cur + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const short = n => { const a = Math.abs(n); return (n < 0 ? '-' : '') + (a >= 1e7 ? (a / 1e7).toFixed(1) + 'Cr' : a >= 1e5 ? (a / 1e5).toFixed(1) + 'L' : a >= 1e3 ? (a / 1e3).toFixed(a >= 1e4 ? 0 : 1) + 'k' : Math.round(a)); };
const sum = (type, pred) => book().tx.filter(x => x.type === type && (!pred || pred(x))).reduce((a, x) => a + x.amt, 0);
const balance = () => sum('income') - sum('expense');
const monthTotals = m => [sum('income', x => ym(x.date) === m), sum('expense', x => ym(x.date) === m)];
const byCat = m => { const o = {}; book().tx.forEach(x => { if (x.type === 'expense' && ym(x.date) === m) o[x.cat] = (o[x.cat] || 0) + x.amt; }); return Object.entries(o).sort((a, b) => b[1] - a[1]); };
const receivable = () => book().invoices.filter(i => i.kind === 'sale' && !i.paid).reduce((a, i) => a + total(i), 0);
const payable = () => book().invoices.filter(i => i.kind === 'purchase' && !i.paid).reduce((a, i) => a + total(i), 0);
const total = inv => inv.lines.reduce((a, l) => a + l.q * l.p, 0);
const catsFor = type => (type === 'income' ? INCOME_CATS : CATS).filter(c => isBiz() || !BIZ_ONLY.includes(c[0]));
function addTx(type, cat, amt, note, date) {
  const x = { id: uid(), date: date || today(), type, cat, amt: Math.round(amt * 100) / 100, note: note || '' };
  book().tx.push(x); return x;
}
const sortedTx = () => book().tx.slice().sort((a, b) => b.date.localeCompare(a.date) || (b.id < a.id ? -1 : 1));
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function loadDemo() {
  const b = book(); const now = new Date(); let seed = 7;
  const r = (a, c) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return a + seed % (c - a + 1); };
  for (let m = 11; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1), mm = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const last = m === 0 ? now.getDate() : 27;
    addTx('income', isBiz() ? 'Sales' : 'Salary', isBiz() ? r(60000, 90000) : 42000, isBiz() ? 'Sales' : 'Monthly salary', mm + '-01');
    if (last >= 3) addTx('expense', isBiz() ? 'Payroll' : 'Rent', isBiz() ? 30000 : 12000, isBiz() ? 'Staff' : 'House rent', mm + '-03');
    const pool = [['Food', 120, 600], ['Groceries', 300, 1800], ['Dining', 250, 1500], ['Transport', 60, 700], ['Fuel', 400, 1500], ['Utilities', 300, 1800], ['Shopping', 400, 3500], ['Health', 200, 1800], ['Entertainment', 200, 1200]];
    for (let i = 0; i < (m === 0 ? 6 : 16); i++) { const p = pool[r(0, pool.length - 1)]; addTx('expense', p[0], r(p[1], p[2]), '', mm + '-' + String(r(1, last)).padStart(2, '0')); }
  }
  ['Food', 'Groceries', 'Dining', 'Transport', 'Shopping'].forEach((c, i) => b.budgets[c] = [4000, 6000, 3000, 3000, 5000][i]);
}

// ============================================================ assistant (offline rules, English + Mizo)
const fold = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
let pendingAmt = 0;
const VOCAB = ['balance', 'report', 'budget', 'income', 'expense', 'salary', 'spent', 'today', 'yesterday', 'week', 'month', 'help', 'undo', 'thanks', 'summary', 'groceries', 'petrol', 'recharge', 'rent'];
const ABBR = { bal: 'balance', bl: 'balance', blnc: 'balance', balanc: 'balance', rep: 'report', repo: 'report', rpt: 'report', bud: 'budget', hlp: 'help', inc: 'income', exp: 'expense', sal: 'salary', yday: 'yesterday', tdy: 'today', wk: 'week', mth: 'month' };
function lev(a, b) { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; }
function fixWords(low) {
  return low.split(/(\s+)/).map(w => { if (!/^[a-z]+$/.test(w)) return w; if (ABBR[w]) return ABBR[w]; if (w.length < 5 || VOCAB.includes(w)) return w; const m = VOCAB.find(v => v.length >= 5 && Math.abs(v.length - w.length) <= 1 && lev(v, w) <= 1); return m || w; }).join('');
}
const W = {
  undo: ['undo', 'delete last', 'remove last', 'paih rawh', 'tihlui'], help: ['help', 'what can you do', 'ti thei', 'eng nge'], report: ['report', 'summary', 'hisab', 'hmuhchhuak'],
  thanks: ['thanks', 'thank you', 'kan lawm', 'lawm'], lesson: ['teach', 'lesson', 'learn', 'explain', 'zirtir', 'hrilh', 'what is'],
  afford: ['afford', 'can i buy', 'can i spend', 'can i pay', 'lei thei'], plan: ['plan', 'advice', 'advise', 'save more', 'how to save', 'suggest', 'tips', 'ruahmanna', 'zilh'],
  top: ['spend most', 'spent most', 'biggest', 'top spending', 'where did my money', 'tam ber', 'sen tam'], budget: ['budget'],
  howmuch: ['how much', 'money left', 'what do i have', 'my money', 'engzah', 'ka sum', 'ka pawisa', 'ka neih', 'ka nei', 'balance'],
  income: ['received', 'earned', 'got ', 'salary', 'income', 'sold', 'dawng', 'lakluh', 'hlawh', 'lak ', 'zawrh'],
  expense: ['spent', 'spend', 'bought', 'paid', 'pay ', 'purchase', 'expense', 'sen', 'lei', 'hman', 'pe ', 'senso'],
  today: ['today', 'vawiin'], yesterday: ['yesterday', 'nimin'], week: ['week', 'chawlhkar'], month: ['month', 'thla'], year: ['year', 'kumin', ' kum'],
};
const CAT_WORDS = {
  Food: 'food lunch dinner breakfast snack tea coffee chaw buhfai eitur', Groceries: 'grocery groceries vegetable rice dal thlai ration',
  Dining: 'restaurant dining cafe hotel', Transport: 'bus taxi sumo cab uber kalna metro ticket auto', Fuel: 'petrol diesel fuel gas', Bills: 'bill bills',
  Rent: 'rent in_man', Utilities: 'electric electricity water internet wifi recharge current data', Shopping: 'shopping bazar dawr amazon gadget',
  Clothing: 'clothes shirt puan silhfen', Health: 'medicine doctor hospital pharmacy damdawi hriselna', Education: 'school fee fees college course zirna',
  Books: 'book books lehkhabu', Entertainment: 'movie cinema game hlimna', Subscriptions: 'netflix spotify subscription', Loans: 'loan emi',
  Savings: 'saving savings khawl', Gifts: 'gift thilpek', Charity: 'donation charity thawhlawm tithe', Travel: 'flight train trip zinna', Taxes: 'tax',
  Payroll: 'payroll wages', Purchases: 'stock purchase',
};
const INC_WORDS = { Salary: 'salary hlawh', Freelance: 'freelance', Sales: 'sales sold zawrh', Bonus: 'bonus', Interest: 'interest', Investments: 'dividend investment', Rental: 'rental', Refund: 'refund' };
const hasW = (low, list, whole) => list.some(w => new RegExp('(^|[^a-z0-9])' + w.trim().replace(/_/g, ' ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (whole ? '(?![a-z0-9])' : '')).test(low));
function findCat(low, map) { for (const [c, ws] of Object.entries(map)) if (hasW(low, ws.split(' ').filter(Boolean), true)) return c; return null; }
function parseAmount(low) {
  const m = low.replace(/(\d),(\d{3})/g, '$1$2').match(/(\d+(?:\.\d+)?)\s*(k|thousand|lakhs?|lacs?|million|crore|sing|za)?(?![a-z])/);
  if (!m) return 0;
  const mult = { k: 1e3, thousand: 1e3, lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5, million: 1e6, crore: 1e7, sing: 1e3, za: 1e2 }[m[2]] || 1;
  return parseFloat(m[1]) * mult;
}
let lastTx = null, pending = null;
function smallTalk(low) {
  const mz = lang === 'lus', n = meta.name ? ' ' + meta.name : '';
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  if (/^(hello|hi|hey|hii+|good (morning|afternoon|evening)|namaste|hola|bonjour|hallo|kan dam em|chibai|ka dam|nihao)\b/.test(low))
    return mz ? pick(['Chibai' + n + '! Engnge ka tanpui theih che?', 'Hi' + n + '! Sum chungchang i zawh duh em?']) : pick(['Hello' + n + '! How can I help with your money today?', 'Hi' + n + '! Tell me what you spent or earned, or ask me anything.']);
  if (/\b(how are you|i dam em|dam em)\b/.test(low)) return mz ? 'Ka dam e, i lawm e! Nang chu?' : "I'm doing great, thanks for asking! Ready to help with your money.";
  if (/\b(who are you|your name|i hming|nang chu kua)\b/.test(low)) return mz ? 'Sakura Assistant ka ni. I sum enkawl tanpuitu ka ni.' : "I'm the Sakura assistant. I record income and spending, answer questions about your money and help you plan.";
  if (/\b(thank|thanks|thx|kan lawm|lawmthu|ka lawm)\b/.test(low)) return mz ? 'Rinawm takin! Ka lawm e.' : "You're welcome!";
  if (/\b(bye|goodbye|good night|tata)\b/.test(low)) return mz ? 'Tuh leh ang!' : 'Bye! See you soon.';
  if (/\b(what can you do|help me|engtin nge|i tih theih)\b/.test(low) && !/\d/.test(low)) return mz ? 'Ka ti thei: income/sen record, balance hrilh, report, sum plan, leh sum zirna.' : 'I can record income and expenses, tell your balance and reports, make a money plan, and teach basics like budgeting and saving.';
  return null;
}
function assist(text) {
  const low = fixWords(fold(text)), amt = parseAmount(low);
  if (!amt) { const st = smallTalk(low); if (st) return st; }
  const inc = hasW(low, W.income), exp = hasW(low, W.expense);
  const rec = (type, cat, a) => {
    const x = addTx(type, cat, a, 'assistant'); lastTx = x.id; pending = null;
    let msg = t(type === 'income' ? 'done_inc' : 'done_exp', { a: fmt(a), c: t('c_' + cat) });
    if (type === 'expense' && book().budgets[cat]) {
      const spent = byCat(ym(today())).find(c => c[0] === cat); const sp = spent ? spent[1] : 0, lim = book().budgets[cat];
      if (sp >= lim) msg += '\n' + t('over') + ' (' + t('c_' + cat) + ')'; else if (sp >= .8 * lim) msg += '\n' + t('warn80') + ' (' + t('c_' + cat) + ')';
    }
    return msg;
  };
  if (!amt && pendingAmt) {
    const i2 = hasW(low, W.income), e2 = hasW(low, W.expense), cE = findCat(low, CAT_WORDS), cI = findCat(low, INC_WORDS);
    if (i2 || e2 || cE || cI) { const a = pendingAmt; pendingAmt = 0; const type = (i2 && !e2) || (cI && !cE && !e2) ? 'income' : 'expense'; return rec(type, type === 'income' ? (cI || 'Other') : (cE || 'Other'), a); }
  }
  if (hasW(low, W.undo)) {
    const i = book().tx.findIndex(x => x.id === lastTx); if (i < 0) return t('nothing_undo');
    const x = book().tx.splice(i, 1)[0]; lastTx = null; return t('undone', { w: fmt(x.amt) + ' ' + t('c_' + x.cat) });
  }
  if (hasW(low, W.help)) return t('help');
  if (hasW(low, W.thanks)) return t('thanks');
  if (hasW(low, W.lesson)) return /50|30|20|rule/.test(low) ? t('l_503020') : /emergency|fund/.test(low) ? t('l_emergency') : /sav|tips|khawl/.test(low) ? t('l_save') : t('l_budget');
  if (amt && hasW(low, W.afford)) {
    const bal = balance(), left = bal - amt, [mi] = monthTotals(ym(today()));
    return left < 0 ? t('afford_no', { b: fmt(bal) }) : (left < .2 * Math.max(mi, 1) || left < amt * .25) ? t('afford_tight', { a: fmt(amt), l: fmt(left) }) : t('afford_yes', { a: fmt(amt), l: fmt(left) });
  }
  if (hasW(low, W.plan)) return planMsg();
  if (hasW(low, W.top)) {
    const rows = byCat(ym(today())).slice(0, 3); return rows.length ? t('top_msg', { l: rows.map(r => t('c_' + r[0]) + ' ' + fmt(r[1])).join(', ') }) : t('top_none');
  }
  if (hasW(low, W.budget) && !amt) {
    const e = Object.entries(book().budgets); if (!e.length) return t('no_budget_msg');
    const sp = Object.fromEntries(byCat(ym(today())));
    return t('budget_msg') + '\n' + e.map(([c, l]) => '• ' + t('c_' + c) + ': ' + fmt(sp[c] || 0) + ' / ' + fmt(l) + ' (' + Math.round((sp[c] || 0) / l * 100) + '%)').join('\n');
  }
  if (pending && amt) return rec(pending.type, pending.cat, amt);
  if (amt && !inc && !exp && findCat(low, CAT_WORDS)) return rec('expense', findCat(low, CAT_WORDS), amt);
  if (amt && !inc && !exp && findCat(low, INC_WORDS)) return rec('income', findCat(low, INC_WORDS), amt);
  if (amt && low.replace(/[^a-z]/g, '').length <= 2) { pendingAmt = amt; return t('ask_kind', { a: fmt(amt) }); }
  if (amt && (inc || exp)) {
    const type = inc && !exp ? 'income' : (exp && !inc ? 'expense' : (hasW(low, ['received', 'earned', 'dawng', 'salary']) ? 'income' : 'expense'));
    const cat = type === 'income' ? (findCat(low, INC_WORDS) || 'Other') : (findCat(low, CAT_WORDS) || 'Other');
    return rec(type, cat, amt);
  }
  if (!amt && hasW(low, W.report) && !hasW(low, W.today) && !hasW(low, W.week) && !hasW(low, W.yesterday) && !hasW(low, W.year)) { const m = ym(today()), [i, e] = monthTotals(m); return t('rep', { p: t('p_month'), i: fmt(i), e: fmt(e) }); }
  if (!amt && hasW(low, W.howmuch)) { const [i, e] = monthTotals(ym(today())); return t('bal_msg', { b: fmt(balance()), i: fmt(i), e: fmt(e) }); }
  if (!amt) {
    const per = hasW(low, W.yesterday) ? 'yesterday' : hasW(low, W.today) ? 'today' : hasW(low, W.week) ? 'week' : hasW(low, W.year) ? 'year' : hasW(low, W.month) ? 'month' : null;
    if (per) {
      const to = today(), from = { today: to, yesterday: daysAgo(1), week: daysAgo(6), month: ym(to) + '-01', year: to.slice(0, 4) + '-01-01' }[per];
      const end = per === 'yesterday' ? daysAgo(1) : to, f = type => sum(type, x => x.date >= from && x.date <= end);
      return t('rep', { p: t('p_' + per), i: fmt(f('income')), e: fmt(f('expense')) });
    }
    if (lastTx && (inc || exp) && low.split(/\s+/).length <= 6 && !findCat(low, CAT_WORDS) && !findCat(low, INC_WORDS)) {
      const x = book().tx.find(y => y.id === lastTx); if (x) { x.type = inc && !exp ? 'income' : 'expense'; if (x.type === 'income' && !INCOME_CATS.some(c => c[0] === x.cat)) x.cat = 'Other'; return t(x.type === 'income' ? 'moved_inc' : 'moved_exp'); }
    }
    if (inc || exp) { pending = { type: inc && !exp ? 'income' : 'expense', cat: (inc && !exp ? findCat(low, INC_WORDS) : findCat(low, CAT_WORDS)) || 'Other' }; return t('ask_amt'); }
  }
  return null;
}
function planMsg() {
  const months = [], d = new Date();
  for (let i = 0; i < 3; i++) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); months.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0')); }
  const rows = months.map(m => monthTotals(m)).filter(r => r[0] || r[1]);
  if (!rows.length || !rows.reduce((a, r) => a + r[0], 0)) return t('plan_nodata');
  const inc = rows.reduce((a, r) => a + r[0], 0) / rows.length, exp = rows.reduce((a, r) => a + r[1], 0) / rows.length, rate = Math.round((inc - exp) / inc * 100);
  const cats = {}; months.forEach(m => byCat(m).forEach(([c, v]) => { if (c !== 'Savings') cats[c] = (cats[c] || 0) + v; }));
  const out = [t('plan_head', { i: fmt(inc), e: fmt(exp) }), t('plan_rule', { n: fmt(inc * .5), w: fmt(inc * .3), s: fmt(inc * .2) }), t('plan_now', { p: rate })];
  out.push(rate < 0 ? t('tip_neg') : rate < 20 ? t('tip_low', { a: fmt(inc * .2) }) : t('tip_good', { p: rate }));
  const top = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]; if (top) out.push(t('tip_top', { c: t('c_' + top[0]), a: fmt(top[1] / rows.length * .1) }));
  return out.join('\n');
}

// ============================================================ UI
let viewM = '', calDay = '', view = 'home', tab = 'week', filter = 'all', query = '', chat = [], lastActive = Date.now(), hiddenAt = 0, lockNote = '';
const root = () => { $app.replaceChildren(); return $app; };
const logoSvg = (cls = 'logo') => {
  const g = svg('svg', { viewBox: '0 0 64 64', class: cls, 'aria-hidden': 'true' });
  for (let k = 0; k < 5; k++) { const a = (90 + k * 72) * Math.PI / 180; g.append(svg('circle', { cx: 32 + 14 * Math.cos(a), cy: 32 - 14 * Math.sin(a), r: 11, style: 'fill:var(' + (k % 2 ? '--pink' : '--pink2') + ')' })); }
  g.append(svg('circle', { cx: 32, cy: 32, r: 6, style: 'fill:var(--bg)' })); return g;
};
let sheetPushed = false, skipPop = 0, histFromPop = false;
function closeSheet() { const s = $app.querySelector('.sheet-bg'); if (s) s.remove(); if (sheetPushed) { sheetPushed = false; skipPop++; history.back(); } }
function syncHist() {
  const top = history.state && history.state.v;
  if (sheetPushed) { if (!$app.querySelector('.sheet-bg')) { sheetPushed = false; history.replaceState({ v: view }, ''); } return; }
  if (view === 'home') { if (top && top !== 'home') { skipPop++; history.back(); } }
  else if (!top || top === 'home' || (view === 'profile' && top === 'settings')) history.pushState({ v: view }, '');
  else if (top !== view) history.replaceState({ v: view }, '');
}
window.addEventListener('popstate', e => {
  if (skipPop > 0) { skipPop--; return; }
  if (!S) return;
  if (sheetPushed) { sheetPushed = false; const sh = $app.querySelector('.sheet-bg'); if (sh) sh.remove(); return; }
  const v = (e.state && e.state.v) || 'home';
  if (v !== view) { view = v; histFromPop = true; try { route(); } finally { histFromPop = false; } }
});
function sheet(...content) {
  const old = $app.querySelector('.sheet-bg'); if (old) old.remove();
  const bg = h('div', { class: 'sheet-bg', onclick: e => { if (e.target === bg) closeSheet(); } }, h('div', { class: 'sheet', role: 'dialog' }, h('div', { class: 'grab' }), h('button', { class: 'sheet-x', 'aria-label': 'Close', onclick: () => closeSheet() }, '✕'), ...content));
  $app.append(bg); if (!sheetPushed) { history.pushState({ sheet: 1 }, ''); sheetPushed = true; } return bg;
}
function toast(msg) { const el = h('div', { style: 'position:absolute;left:50%;top:18px;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:9px 16px;border-radius:14px;font-size:13px;z-index:50;max-width:86%;text-align:center' }, msg); $app.append(el); setTimeout(() => el.remove(), 2400); }
function strength(pw) { let s = 0; if (pw.length >= 8) s++; if (pw.length >= 12) s++; if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++; if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++; return s; }
function langPicker(onchange) {
  return h('select', { 'aria-label': 'Language', onchange: e => { lang = e.target.value; if (meta) { meta.lang = lang; saveMeta(); } onchange(); } },
    Object.entries(LANG).map(([k, v]) => h('option', { value: k, selected: k === lang }, v.name)));
}

// ---------- onboarding / lock
function fbUser() {
  try { const u = JSON.parse(lsGet('sk.fb') || 'null'); if (u && typeof u.email === 'string' && typeof u.uid === 'string') return { uid: u.uid.slice(0, 128), email: u.email.slice(0, 200), name: String(u.name || '').slice(0, 80), verified: !!u.verified, provider: u.provider === 'google' ? 'google' : 'password' }; } catch (e) { }
  return null;
}
function accountCard(onboard) {
  const u = fbUser(), go = (a, extra) => { location.href = 'account.html?a=' + a + (extra || ''); };
  if (u) return h('div', { class: 'card' }, h('div', { class: 'row' }, h('div', { class: 'sp' }, h('b', {}, '✓ ' + t('acc_signed')), h('div', { class: 'sub', style: 'margin:2px 0 0' }, u.email + (u.provider === 'google' ? ' · Google' : u.verified ? '' : ' · ' + t('acc_unverified')))),
    onboard ? null : h('button', { class: 'btn soft small', style: 'width:auto;margin:0', onclick: () => { if (confirm(t('acc_out_q'))) go('signout'); } }, t('acc_out'))),
    onboard ? null : h('button', { class: 'btn soft small', style: 'margin-top:10px', onclick: () => go('reset', '&email=' + encodeURIComponent(u.email)) }, t('acc_reset')));
  return h('div', { class: 'card' }, h('h2', { style: 'margin-bottom:4px' }, t('acc_title')), h('p', { class: 'sub', style: 'margin:0 0 10px;text-align:left' }, t('acc_why')),
    h('button', { class: 'btn soft', onclick: () => go('signin') }, 'G  ' + t('acc_signin')));
}
function forgotSheet() {
  const u = (meta && meta.email) || (fbUser() || {}).email || '';
  sheet(h('h2', {}, t('forgot')), h('p', { class: 'sub', style: 'text-align:left' }, t('forgot_why')),
    u ? h('button', { class: 'btn soft', onclick: () => { location.href = 'account.html?a=reset&email=' + encodeURIComponent(u); } }, '✉ ' + t('acc_reset')) : null,
    h('button', { class: 'btn soft', style: 'margin-top:10px', onclick: () => { closeSheet(); restoreSheet(); } }, t('import')),
    h('button', { class: 'btn danger', style: 'margin-top:10px', onclick: () => { if (confirm(t('erase_q'))) { wipeAll(); closeSheet(); route(); } } }, t('erase')));
}
function screenOnboard() {
  const r = root();
  const fbu = fbUser(), name = h('input', { placeholder: t('your_name'), autocomplete: 'name', maxlength: 40, value: (fbu && fbu.name) || '' });
  const pw = h('input', { type: 'password', placeholder: t('password'), autocomplete: 'new-password' });
  const pw2 = h('input', { type: 'password', placeholder: t('confirm'), autocomplete: 'new-password' });
  const meter = h('div', { class: 'meter' }, h('i'));
  const err = h('div', { class: 'err' });
  pw.addEventListener('input', () => { const s = strength(pw.value), bar = meter.firstChild; bar.style.width = s * 25 + '%'; bar.style.background = ['var(--red)', 'var(--red)', 'var(--amber)', 'var(--green)', 'var(--green)'][s]; });
  const go = h('button', {
    class: 'btn', onclick: async () => {
      if (!name.value.trim()) return err.textContent = t('need_name');
      if (pw.value.length < 8) return err.textContent = t('short');
      if (pw.value !== pw2.value) return err.textContent = t('nomatch');
      go.disabled = true; err.textContent = '…';
      await createAccount(name.value.trim(), pw.value); if (fbu) { meta.email = fbu.email; meta.fbuid = fbu.uid; saveMeta(); } startIdle(); route();
    }
  }, t('start'));
  r.append(h('div', { class: 'screen' }, h('div', { class: 'scroll', style: 'padding-bottom:30px;text-align:center' },
    h('div', { class: 'row', style: 'justify-content:flex-end;width:130px;margin-left:auto' }, langPicker(screenOnboard)),
    logoSvg(), h('div', { class: 'brand' }, 'SAKURA FINANCE'), h('p', { class: 'sub' }, t('tag')),
    accountCard(true),
    h('div', { class: 'card' }, h('h2', { style: 'margin-bottom:6px' }, t('create')),
      h('label', {}, t('your_name')), name, h('label', {}, t('password')), pw, meter, h('div', { class: 'sub', style: 'margin:6px 0 0;text-align:left' }, t('pw_hint')),
      h('label', {}, t('confirm')), pw2, err, go,
      h('p', { class: 'sub', style: 'margin:12px 0 0;color:var(--red);text-align:left' }, '⚠ ' + t('pw_warn'))),
    h('button', { class: 'btn soft', onclick: restoreSheet }, t('import')))));
}
function restoreSheet() {
  const file = h('input', { type: 'file', accept: '.json,.sakura' }), pw = h('input', { type: 'password', placeholder: t('password') }), err = h('div', { class: 'err' });
  sheet(h('h2', {}, t('import')), h('label', {}, 'File'), file, h('label', {}, t('password') + ' (backup)'), pw, err,
    h('button', {
      class: 'btn', onclick: async () => {
        try {
          const f = file.files[0]; if (!f) return; const { b, data } = await readBackup(await f.text(), pw.value);
          if (S && meta) { S.data = data; await persist(); closeSheet(); toast(t('imported')); route(); return; }
          meta = { v: 1, name: b.name, salt: b.salt, iter: b.iter, wrap: b.wrap, bio: null, fails: 0, lockUntil: 0, lang, autolock: 2 }; saveMeta();
          lsSet(DATA, JSON.stringify(b.data)); closeSheet(); screenLock();
        } catch { err.textContent = t('bad_backup'); }
      }
    }, t('import')));
}
function screenLock(note) {
  S = null; closeSheet(); const r = root();
  const pw = h('input', { type: 'password', placeholder: t('password'), autocomplete: 'current-password', 'aria-label': t('password') });
  const err = h('div', { class: 'err' }, note || lockNote); lockNote = '';
  let timer = null;
  const tick = () => { const s = lockedSeconds(); if (s > 0) { err.textContent = t('locked_for', { s }); go.disabled = true; timer = setTimeout(tick, 1000); } else if (go.disabled) { go.disabled = false; err.textContent = ''; } };
  const go = h('button', {
    class: 'btn', onclick: async () => {
      go.disabled = true; err.textContent = '…';
      const res = await unlockPassword(pw.value);
      if (res === 'ok') { clearTimeout(timer); startIdle(); route(); } else { pw.value = ''; err.textContent = res === 'wrong' ? t('wrong') : ''; go.disabled = false; tick(); }
    }
  }, t('unlock'));
  pw.addEventListener('keydown', e => { if (e.key === 'Enter') go.click(); });
  const bioBtn = meta.bio && bioSupported() ? h('button', {
    class: 'btn soft', style: 'margin-top:10px', onclick: async () => {
      try { await unlockBio(); startIdle(); route(); } catch { err.textContent = t('bio_fail'); }
    }
  }, '🔐 ' + t('bio')) : null;
  r.append(h('div', { class: 'screen center' }, logoSvg(), h('div', { class: 'brand' }, 'SAKURA FINANCE'),
    h('div', { class: 'avatar', style: 'width:64px;height:64px;font-size:26px;margin:14px 0 6px' }, (meta.name || '?')[0].toUpperCase()),
    h('h2', {}, t('hello') + ', ' + meta.name), h('div', { style: 'width:100%;margin-top:18px' }, pw, err, go, bioBtn,
      h('button', { class: 'btn soft', style: 'margin-top:10px', onclick: restoreSheet }, t('import')),
      h('p', { class: 'sub', style: 'margin-top:14px;cursor:pointer;text-decoration:underline', onclick: forgotSheet }, t('forgot')))));
  tick(); if (!meta.bio) pw.focus();
}
// ---------- auto-lock
let idleTimer = null;
function startIdle() {
  lastActive = Date.now(); clearInterval(idleTimer);
  idleTimer = setInterval(() => { if (S && Date.now() - lastActive > (meta.autolock || 2) * 60000) lockNow(t('idle_lock')); }, 5000);
}
function lockNow(note) { clearInterval(idleTimer); S = null; chat = []; lastTx = null; pending = null; pendingAmt = 0; lockNote = note || ''; screenLock(); }
['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(ev => document.addEventListener(ev, () => { lastActive = Date.now(); }, { passive: true, capture: true }));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = Date.now();
  else if (S && hiddenAt && Date.now() - hiddenAt > 30000) lockNow(t('idle_lock'));
});

// ---------- mode picker
function screenMode() {
  const r = root();
  const card = (mode, ic, ttl, d) => h('button', { class: 'mcard', onclick: async () => { S.data.mode = mode; S.data.modeChosen = true; await persist(); route(); } },
    h('div', { style: 'font-size:34px' }, ic), h('b', {}, ttl), h('small', {}, d));
  r.append(h('div', { class: 'screen center' }, logoSvg(), h('div', { class: 'brand' }, 'SAKURA FINANCE'), h('p', { class: 'sub' }, t('tag')),
    h('h2', { style: 'margin:6px 0 14px' }, t('mode_title')),
    h('div', { class: 'modes' }, card('personal', '👤', t('personal') + ' Finance', t('personal_d')), card('student', '🎒', t('student') + ' Finance', t('student_d')), card('business', '🏢', t('business') + ' Finance', t('business_d'))),
    h('p', { class: 'sub', style: 'margin-top:16px' }, t('mode_hint'))));
}
// ---------- charts
function areaChart(vals, labels) {
  const W_ = 320, H_ = 140, pad = 12, max = Math.max(...vals, 1);
  const pts = vals.map((v, i) => [pad + i * (W_ - 2 * pad) / Math.max(vals.length - 1, 1), H_ - 24 - (v / max) * (H_ - 50)]);
  let d = 'M' + pts[0].join(',');
  for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`; }
  const g = svg('svg', { viewBox: `0 0 ${W_} ${H_}`, width: '100%', role: 'img', 'aria-label': t('spend_freq') },
    svg('defs', {}, svg('linearGradient', { id: 'ag', x1: 0, y1: 0, x2: 0, y2: 1 }, svg('stop', { offset: '0', style: 'stop-color:var(--lav);stop-opacity:.35' }), svg('stop', { offset: '1', style: 'stop-color:var(--lav);stop-opacity:0' }))),
    svg('path', { d: d + ` L${pts[pts.length - 1][0]},${H_ - 24} L${pts[0][0]},${H_ - 24} Z`, style: 'fill:url(#ag)' }),
    svg('path', { d, fill: 'none', style: 'stroke:var(--lav)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
  const mi = vals.indexOf(Math.max(...vals));
  if (vals[mi] > 0) { g.append(svg('circle', { cx: pts[mi][0], cy: pts[mi][1], r: 5, style: 'fill:var(--card);stroke:var(--pink)', 'stroke-width': 3 }), svg('text', { x: Math.min(Math.max(pts[mi][0], 26), W_ - 26), y: pts[mi][1] - 10, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, style: 'fill:var(--ink)' }, short(vals[mi]))); }
  labels.forEach((l, i) => { if (labels.length <= 7 || i % 2 === 0) g.append(svg('text', { x: pts[i][0], y: H_ - 6, 'text-anchor': 'middle', 'font-size': 10, style: 'fill:var(--mute)' }, l)); });
  return g;
}
const PAL = ['var(--pink)', 'var(--lav)', 'var(--pink2)', 'var(--lavL)', 'var(--amber)', 'var(--green)'];
function donut(rows) {
  const tot = rows.reduce((a, r) => a + r[1], 0), R = 38, C = 2 * Math.PI * R; let off = 0;
  const g = svg('svg', { viewBox: '0 0 100 100', width: 110, height: 110, role: 'img', 'aria-label': t('breakdown') });
  g.append(svg('circle', { cx: 50, cy: 50, r: R, fill: 'none', style: 'stroke:var(--pinkL)', 'stroke-width': 16 }));
  rows.forEach((r, i) => { const len = r[1] / tot * C; g.append(svg('circle', { cx: 50, cy: 50, r: R, fill: 'none', style: 'stroke:' + PAL[i % PAL.length], 'stroke-width': 16, 'stroke-dasharray': `${len} ${C - len}`, 'stroke-dashoffset': -off, transform: 'rotate(-90 50 50)' })); off += len; });
  return g;
}
function series() {
  const now = new Date(), tx = book().tx.filter(x => x.type === 'expense');
  if (tab === 'year') { const out = [], lab = []; for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1), m = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); out.push(tx.filter(x => ym(x.date) === m).reduce((a, x) => a + x.amt, 0)); lab.push(d.toLocaleString(undefined, { month: 'short' }).slice(0, 3)); } return [out, lab]; }
  const n = tab === 'week' ? 7 : tab === 'today' ? 7 : 30, out = [], lab = [];
  for (let i = n - 1; i >= 0; i--) { const dd = daysAgo(i); out.push(tx.filter(x => x.date === dd).reduce((a, x) => a + x.amt, 0)); lab.push(dd.slice(8)); }
  return [out, lab];
}
// ---------- main shell
const NAVI = {
  home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z', activity: 'M4 6h16M4 12h16M4 18h10',
  budgets: 'M12 3a9 9 0 1 0 9 9h-9z M14 3.2A9 9 0 0 1 20.8 10H14z', invoices: 'M6 3h9l4 4v14H6z M9 12h7 M9 16h7',
  assistant: 'M4 5h16v11H9l-5 4z', calendar: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
};
function navBtn(id, label) {
  return h('button', { class: view === id ? 'on' : '', onclick: () => { view = id; route(); }, 'aria-label': label },
    svg('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg('path', { d: NAVI[id] })), label);
}
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthLabel = m => { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1, 1); try { return d.toLocaleString(lang === 'lus' ? 'en' : lang, { month: 'long' }); } catch (e) { return MON[d.getMonth()]; } };
const shiftYM = (m, n) => { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
function alerts() {
  const out = [], m = ym(today()); const bc = byCat(m);
  for (const [c, v] of bc) { const lim = book().budgets[c]; if (lim && v >= lim) out.push('⚠ ' + t('c_' + c) + ': ' + t('over')); else if (lim && v >= .8 * lim) out.push('⚠ ' + t('c_' + c) + ': ' + t('warn80')); }
  return out;
}
function bellBtn() {
  const n = alerts().length;
  return h('button', { class: 'bell', 'aria-label': 'Notifications', onclick: () => { const a = alerts(); toast(a.length ? a.join('  ') : '✓ OK'); } }, '🔔', n ? h('i', {}, String(n)) : null);
}
function monthPill() {
  const m = viewM || ym(today());
  return h('div', { class: 'sp pillwrap' }, h('button', { class: 'pill', onclick: () => { viewM = shiftYM(m, -1); route(); }, 'aria-label': 'Previous month' }, '‹'),
    h('span', { class: 'pill mid' }, monthLabel(m) + (m.slice(0, 4) !== today().slice(0, 4) ? ' ' + m.slice(0, 4) : '')),
    h('button', { class: 'pill', disabled: m >= ym(today()), onclick: () => { viewM = shiftYM(m, 1); if (viewM >= ym(today())) viewM = ''; route(); }, 'aria-label': 'Next month' }, '›'));
}
const SUPPORT = { email: '', whatsapp: '' }; // <-- put your support email / WhatsApp number (with country code) here
const prof = () => (S.data.profile = S.data.profile || {});
function avatarContent() { const ph = prof().photo; return ph ? h('img', { src: ph, alt: '', style: 'width:100%;height:100%;border-radius:50%;object-fit:cover' }) : (meta.name || '?')[0].toUpperCase(); }
function resizeImage(file, max = 160) {
  return new Promise((ok, no) => { const rd = new FileReader();
    rd.onerror = () => no(new Error('read')); rd.onload = () => { const img = new Image();
      img.onload = () => { const r = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.width * r)); c.height = Math.max(1, Math.round(img.height * r));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', .85)); };
      img.onerror = () => no(new Error('img')); img.src = rd.result; };
    rd.readAsDataURL(file); });
}
function photoPicker(key, obj, label) {
  const box = h('div', { class: 'row', style: 'margin:8px 0' }), draw = () => { box.replaceChildren(...[
    obj[key] ? h('img', { src: obj[key], alt: '', style: 'width:56px;height:56px;border-radius:' + (key === 'logo' ? '12px' : '50%') + ';object-fit:cover' }) : h('div', { class: 'avatar', style: 'width:56px;height:56px' }, '📷'),
    h('label', { class: 'btn soft small', style: 'width:auto;margin:0' }, label, h('input', { type: 'file', accept: 'image/*', class: 'hide', onchange: async e => { const f = e.target.files[0]; if (!f) return; try { obj[key] = await resizeImage(f); draw(); } catch (x) { toast('Image error'); } } })),
    obj[key] ? h('button', { class: 'btn danger small', style: 'width:auto', onclick: () => { delete obj[key]; draw(); } }, '✕') : null].filter(Boolean)); };
  draw(); return box;
}
function viewProfile() {
  const p = prof(), co = (p.company = p.company || {}), me = { photo: p.photo };
  const f = (label, val, type = 'text') => { const i = h('input', { type, value: val || '', placeholder: label, maxlength: 120, 'aria-label': label }); return [h('label', {}, label), i, i]; };
  const nm = f(t('your_name'), meta.name), em = f('Email', p.email, 'email'), ph = f('Phone', p.phone, 'tel');
  const cn = f('Company name', co.name), tx = f('GSTIN / Tax ID', co.tax), ad = f('Address', co.address), cp = f('Company phone', co.phone), ce = f('Company email', co.email, 'email');
  const err = h('div', { class: 'err' });
  const n = Object.values(S.data.books).reduce((a, b) => a + (b.tx ? b.tx.length : 0), 0);
  shell(h('div', { class: 'scroll' }, h('div', { class: 'row', style: 'margin-bottom:6px' }, h('h1', { class: 'sp' }, '👤 Profile'), h('button', { class: 'btn soft small', style: 'width:auto', onclick: () => { view = 'settings'; route(); } }, '⚙ ' + t('settings'))),
    h('div', { class: 'card' }, h('h2', { style: 'margin-bottom:4px' }, 'Photo'), photoPicker('photo', me, '📷 Upload photo'), h('p', { class: 'sub', style: 'margin:6px 0 0' }, n + ' transactions · stored only on this phone')),
    h('div', { class: 'card' }, h('h2', { style: 'margin-bottom:6px' }, 'Personal'), nm.slice(0, 2), em.slice(0, 2), ph.slice(0, 2)),
    isBiz() ? h('div', { class: 'card' }, h('h2', { style: 'margin-bottom:6px' }, '🏢 Company'), photoPicker('logo', co, '🖼 Upload logo'), cn.slice(0, 2), tx.slice(0, 2), ad.slice(0, 2), cp.slice(0, 2), ce.slice(0, 2)) : null,
    accountCard(false), err,
    h('button', { class: 'btn', onclick: async () => {
      const name = nm[2].value.trim(); if (!name) { err.textContent = t('need_name'); return; }
      meta.name = name; saveMeta(); p.email = em[2].value.trim(); p.phone = ph[2].value.trim();
      if (me.photo) p.photo = me.photo; else delete p.photo;
      co.name = cn[2].value.trim(); co.tax = tx[2].value.trim(); co.address = ad[2].value.trim(); co.phone = cp[2].value.trim(); co.email = ce[2].value.trim();
      await persist(); toast(t('saved')); history.back(); } }, t('save') || 'Save')));
}
const FAQ = [
  ['How do I add expenses automatically?', 'Tap the ⚡ button on Home, paste your bank/UPI SMS or choose a bank statement file (.csv).'],
  ['I forgot my password', 'Your data is encrypted with your password, so it cannot be reset. Restore from a backup file (Settings → Data → Import) if you have one.'],
  ['Is my data safe?', 'Yes. Everything is encrypted on this phone (AES-256). Nothing is sent to any server.'],
  ['How do I switch Personal / Student / Business?', 'Use the switch at the top of Home.'],
  ['How do I change language or theme?', 'Settings → Language / Theme.']];
function supportSheet() {
  const q = h('input', { type: 'search', placeholder: 'Search help…' }), list = h('div', {});
  const draw = () => { list.replaceChildren(...FAQ.filter(x => !q.value || (x[0] + x[1]).toLowerCase().includes(q.value.toLowerCase())).map(x => h('details', { class: 'det' }, h('summary', {}, x[0]), h('p', { class: 'sub' }, x[1])))); };
  q.oninput = draw; draw();
  const links = [SUPPORT.email ? h('a', { class: 'btn soft', style: 'display:block;text-align:center;text-decoration:none;margin-top:8px', href: 'mailto:' + SUPPORT.email + '?subject=Sakura%20Finance%20support' }, '✉ Email support') : null,
    SUPPORT.whatsapp ? h('a', { class: 'btn soft', style: 'display:block;text-align:center;text-decoration:none;margin-top:8px', href: 'https://wa.me/' + SUPPORT.whatsapp.replace(/\D/g, ''), target: '_blank', rel: 'noopener' }, '💬 WhatsApp') : null];
  sheet(h('h2', {}, '🛟 Help & support'), q, list, links, SUPPORT.email || SUPPORT.whatsapp ? null : h('p', { class: 'sub', style: 'margin-top:10px' }, 'Support contact not set yet.'));
}
function shell(body, opts = {}) {
  const r = root();
  const modeSw = h('div', { class: 'mode' }, ['personal', 'student', 'business'].map(m => h('button', { class: S.data.mode === m ? 'on' : '', onclick: async () => { S.data.mode = m; await persist(); if (view === 'invoices' && m !== 'business') view = 'budgets'; route(); } }, t(m))));
  r.append(h('div', { class: 'screen' },
    h('div', { class: 'top' + (opts.warm ? ' warm' : '') }, (opts.back ?? view !== 'home') ? h('button', { class: 'backbtn', 'aria-label': 'Back', onclick: () => history.back() }, '‹') : null, h('button', { class: 'avatar', 'aria-label': 'Profile', onclick: () => { view = 'profile'; route(); } }, avatarContent()),
      opts.pill ? opts.pill : h('div', { class: 'sp' }), opts.pill ? null : modeSw, h('button', { class: 'laybtn', title: 'Desktop / Mobile view', 'aria-label': 'Switch desktop or mobile view', onclick: toggleLayout }, isDeskNow() ? '📱' : '🖥'), opts.bell !== false ? bellBtn() : null),
    body,
    opts.noNav ? null : h('div', { class: 'nav' }, navBtn('home', t('home')), navBtn('calendar', t('calendar')),
      h('button', { class: 'fab', onclick: () => addSheet(), 'aria-label': t('add') }, '+'),
      isBiz() ? navBtn('invoices', t('invoices')) : navBtn('budgets', t('budgets')), navBtn('assistant', t('assistant')))));
}
const txRow = (x, onclick) => h('div', { class: 'it', onclick }, h('div', { class: 'ic' }, icon(x.cat)),
  h('div', { style: 'flex:1;min-width:0' }, h('div', { class: 'nm' }, t('c_' + x.cat)), h('div', { class: 'nt' }, (x.note && x.note !== 'assistant' ? x.note + ' · ' : '') + x.date)),
  h('div', { class: x.type === 'income' ? 'pos' : 'neg' }, (x.type === 'income' ? '+' : '-') + fmt(x.amt)));

function allowanceCard() {
  const al = book().allowance || 0, spent = sum('expense', x => x.date >= weekStart()), left = al - spent, p = al ? Math.min(1, spent / al) : 0;
  return h('div', { class: 'card', onclick: allowanceSheet }, h('div', { class: 'row' }, h('div', { class: 'ic' }, '🎒'), h('div', { class: 'sp' }, h('b', {}, t('allowance')), h('div', { style: 'font-size:12px;color:var(--mute)' }, al ? fmt(al) : t('allowance_set'))),
    al ? h('b', { class: left < 0 ? 'neg' : 'pos' }, fmt(left) + ' ' + t('left_week')) : h('span', { class: 'tag' }, '+')), al ? h('div', { class: 'bar' + (p >= 1 ? ' over' : p >= .8 ? ' warn' : '') }, h('i', { style: 'width:' + p * 100 + '%' })) : null);
}
function viewHome() {
  const m = viewM || ym(today()), [inc, exp] = monthTotals(m), bc = byCat(m).slice(0, 5), [vals, labs] = series();
  const body = h('div', { class: 'scroll dash' },
    h('div', { class: 'hero' }, h('small', {}, t('balance')), h('div', { class: 'big' }, fmt(balance())),
      h('div', { class: 'chips' }, h('span', { class: 'chip' }, '▼ ' + t('income') + ' ' + fmt(inc)), h('span', { class: 'chip' }, '▲ ' + t('expense') + ' ' + fmt(exp)))),
    h('button', { class: 'btn soft', style: 'margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:8px', onclick: () => captureSheet() }, '⚡ ' + t('auto_card')),
    S.data.mode === 'student' ? allowanceCard() : null,
    isBiz() ? h('div', { class: 'kpis' }, [[t('receivable'), receivable(), 'pos'], [t('payable'), payable(), 'neg'], [t('profit'), inc - exp, inc - exp >= 0 ? 'pos' : 'neg']].map(k => h('div', { class: 'kpi' }, h('h3', {}, k[0]), h('b', { class: k[2] }, fmt(k[1]))))) : null,
    h('div', { class: 'card span2' }, h('h2', {}, t('spend_freq')),
      h('div', { class: 'tabs' }, ['week', 'month', 'year'].map(k => h('button', { class: 'tab' + (tab === k ? ' on' : ''), onclick: () => { tab = k; route(); } }, t(k)))),
      areaChart(vals, labs)),
    bc.length ? h('div', { class: 'card' }, h('h2', { style: 'margin-bottom:8px' }, t('breakdown')), h('div', { class: 'row' }, donut(bc),
      h('div', { style: 'flex:1' }, bc.map((r, i) => h('div', { class: 'row', style: 'font-size:13px;margin:4px 0' }, h('i', { style: `width:10px;height:10px;border-radius:50%;background:${PAL[i % PAL.length]};display:inline-block` }), h('span', { class: 'sp' }, t('c_' + r[0])), h('b', {}, Math.round(r[1] / exp * 100) + '%')))))) : null,
    h('div', { class: 'card' }, h('div', { class: 'row' }, h('h2', { class: 'sp' }, t('recent')), h('button', { class: 'btn soft small', onclick: () => { view = 'activity'; route(); } }, t('see_all'))),
      h('div', { class: 'list' }, sortedTx().slice(0, 5).map(x => txRow(x, () => txSheet(x))), book().tx.length ? null : h('p', { class: 'sub', style: 'margin:12px 0' }, t('nodata')))));
  shell(body, { pill: monthPill(), warm: true });
}
function viewCalendar() {
  const m = viewM || ym(today()), y = +m.slice(0, 4), mo = +m.slice(5, 7) - 1, first = new Date(y, mo, 1).getDay(), dim = new Date(y, mo + 1, 0).getDate();
  const day = calDay && calDay.startsWith(m) ? calDay : (m === ym(today()) ? today() : m + '-01'), tx = book().tx.filter(x => ym(x.date) === m);
  const has = {}; tx.forEach(x => { has[x.date] = (has[x.date] || 0) + (x.type === 'income' ? 1 : 2); });
  const grid = h('div', { class: 'cal' }, ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => h('b', { class: 'dow' }, d)));
  for (let i = 0; i < first; i++) grid.append(h('span'));
  for (let d = 1; d <= dim; d++) { const ds = m + '-' + String(d).padStart(2, '0');
    grid.append(h('button', { class: 'd' + (ds === day ? ' sel' : '') + (ds === today() ? ' tod' : '') + (has[ds] ? ' has' : ''), onclick: () => { calDay = ds; route(); } }, String(d))); }
  const list = book().tx.filter(x => x.date === day), dayExp = list.filter(x => x.type === 'expense').reduce((a, x) => a + x.amt, 0), dayInc = list.filter(x => x.type === 'income').reduce((a, x) => a + x.amt, 0);
  shell(h('div', { class: 'scroll' },
    h('div', { class: 'card' }, grid),
    h('div', { class: 'card' }, h('div', { class: 'row' }, h('h2', { class: 'sp' }, day), h('span', { class: 'pos' }, '+' + fmt(dayInc)), h('span', { class: 'neg' }, '-' + fmt(dayExp))),
      h('div', { class: 'list' }, list.length ? list.map(x => txRow(x, () => txSheet(x))) : h('p', { class: 'sub', style: 'margin:12px 0' }, t('nodata')))),
    h('button', { class: 'btn soft', onclick: () => { view = 'activity'; route(); } }, t('activity') + ' →')), { pill: monthPill(), warm: true });
}
function viewActivity() {
  const list = h('div', { class: 'list' });
  const draw = () => {
    list.replaceChildren(); let last = '';
    const q = fold(query);
    const rows = sortedTx().filter(x => (filter === 'all' || x.type === filter) && (!q || fold(t('c_' + x.cat) + ' ' + x.note).includes(q)));
    if (!rows.length) list.append(h('p', { class: 'sub' }, t('nodata')));
    rows.slice(0, 200).forEach(x => { if (x.date !== last) { last = x.date; list.append(h('h3', { style: 'margin:14px 0 2px' }, x.date)); } list.append(txRow(x, () => txSheet(x))); });
  };
  const search = h('input', { type: 'search', placeholder: t('search'), value: query, oninput: e => { query = e.target.value; draw(); } });
  shell(h('div', { class: 'scroll' }, h('div', { class: 'row', style: 'margin-bottom:10px' }, h('div', { class: 'sp' }, search), h('button', { class: 'btn small', onclick: () => captureSheet(), 'aria-label': t('auto_add') }, '⚡')), h('div', { class: 'tabs' }, ['all', 'income', 'expense'].map(k => h('button', { class: 'tab' + (filter === k ? ' on' : ''), onclick: () => { filter = k; route(); } }, t(k)))), h('div', { class: 'card' }, list)), { back: true });
  draw();
}
function txSheet(x) {
  sheet(h('h2', {}, t('c_' + x.cat) + ' ' + (x.type === 'income' ? '+' : '-') + fmt(x.amt)), h('p', { class: 'sub' }, x.date + (x.note ? ' · ' + x.note : '')),
    h('button', { class: 'btn danger', onclick: async () => { book().tx = book().tx.filter(y => y.id !== x.id); await persist(); closeSheet(); route(); } }, t('delete')));
}
function addSheet() {
  let type = 'expense', cat = null;
  const amount = h('input', { class: 'amount', inputmode: 'decimal', placeholder: '0', 'aria-label': t('amount') });
  const note = h('input', { placeholder: t('note'), maxlength: 80 }), date = h('input', { type: 'date', value: today() });
  const seg = h('div', { class: 'seg' }), grid = h('div', { class: 'cats' }), err = h('div', { class: 'err' });
  const draw = () => {
    seg.replaceChildren(...['expense', 'income'].map(k => h('button', { class: type === k ? 'on' : '', onclick: () => { type = k; cat = null; draw(); } }, t(k))));
    grid.replaceChildren(...catsFor(type).map(c => h('button', { class: 'cat' + (cat === c[0] ? ' on' : ''), onclick: () => { cat = c[0]; draw(); } }, h('span', {}, c[1]), t('c_' + c[0]))));
  };
  draw();
  sheet(seg, amount, h('label', {}, t('category')), grid, h('label', {}, t('note')), note, h('label', {}, t('date')), date, err,
    h('button', {
      class: 'btn', style: 'margin-top:8px', onclick: async () => {
        const a = parseFloat(String(amount.value).replace(',', '.'));
        if (!(a > 0) || a > 1e12) return err.textContent = t('amount') + '?';
        addTx(type, cat || 'Other', a, note.value.trim(), date.value || today()); await persist(); closeSheet(); route();
      }
    }, t('save')));
}
function viewBudgets() {
  const sp = Object.fromEntries(byCat(ym(today()))), rows = Object.entries(book().budgets);
  shell(h('div', { class: 'scroll' }, h('div', { class: 'row', style: 'margin-bottom:12px' }, h('h1', { class: 'sp' }, t('budgets')), h('button', { class: 'btn small', onclick: budgetSheet }, '+ ' + t('budget_set'))),
    rows.length ? rows.map(([c, l]) => { const s = sp[c] || 0, p = s / l; return h('div', { class: 'card', onclick: () => budgetSheet(c, l) },
      h('div', { class: 'row' }, h('div', { class: 'ic' }, icon(c)), h('div', { class: 'sp' }, h('b', {}, t('c_' + c)), h('div', { class: 'nt', style: 'font-size:12px;color:var(--mute)' }, t('used', { a: fmt(s), b: fmt(l) }))), h('b', { class: p >= 1 ? 'neg' : '' }, Math.round(p * 100) + '%')),
      h('div', { class: 'bar' + (p >= 1 ? ' over' : p >= .8 ? ' warn' : '') }, h('i', { style: `width:${Math.min(100, p * 100)}%` }))); })
      : h('div', { class: 'card' }, h('p', { class: 'sub' }, t('no_budget'))), ...goalsAndSubs()));
}
function budgetSheet(c, l) {
  const sel = h('select', {}, catsFor('expense').map(x => h('option', { value: x[0], selected: x[0] === c }, x[1] + ' ' + t('c_' + x[0])))), lim = h('input', { inputmode: 'decimal', value: l || '', placeholder: t('limit') });
  sheet(h('h2', {}, t('budget_set')), h('label', {}, t('category')), sel, h('label', {}, t('limit')), lim,
    h('button', { class: 'btn', style: 'margin-top:14px', onclick: async () => { const v = parseFloat(lim.value); if (v > 0) { book().budgets[sel.value] = v; await persist(); closeSheet(); route(); } } }, t('save')),
    c ? h('button', { class: 'btn danger', style: 'margin-top:8px', onclick: async () => { delete book().budgets[c]; await persist(); closeSheet(); route(); } }, t('delete')) : null);
}
function viewInvoices() {
  const invs = book().invoices.slice().sort((a, b) => b.date.localeCompare(a.date));
  shell(h('div', { class: 'scroll' }, h('div', { class: 'row', style: 'margin-bottom:12px' }, h('h1', { class: 'sp' }, t('invoices')), h('button', { class: 'btn small', onclick: invoiceSheet }, '+ ' + t('new_invoice'))),
    h('div', { class: 'kpis', style: 'grid-template-columns:1fr 1fr' }, h('div', { class: 'kpi' }, h('h3', {}, t('receivable')), h('b', { class: 'pos' }, fmt(receivable()))), h('div', { class: 'kpi' }, h('h3', {}, t('payable')), h('b', { class: 'neg' }, fmt(payable())))),
    invs.length ? invs.map(i => h('div', { class: 'card', onclick: () => invoiceDetail(i) }, h('div', { class: 'row' }, h('div', { class: 'ic' }, i.kind === 'sale' ? '🏷️' : '📦'), h('div', { class: 'sp' }, h('b', {}, i.no + ' · ' + (i.party || '—')), h('div', { style: 'font-size:12px;color:var(--mute)' }, t('due') + ' ' + i.due)),
      h('div', { style: 'text-align:right' }, h('b', {}, fmt(total(i))), h('div', { class: i.paid ? 'pos' : 'neg', style: 'font-size:12px' }, t(i.paid ? 'paid' : 'unpaid')))))) : h('div', { class: 'card' }, h('p', { class: 'sub' }, t('no_inv')))));
}
function invoiceSheet() {
  let kind = 'sale', lines = [{ n: '', q: 1, p: '' }];
  const party = h('input', { placeholder: t('party'), maxlength: 60 }), due = h('input', { type: 'date', value: daysAgo(-15) }), seg = h('div', { class: 'seg' }), box = h('div'), err = h('div', { class: 'err' });
  const paid = h('input', { type: 'checkbox', style: 'width:auto' });
  const draw = () => {
    seg.replaceChildren(...['sale', 'purchase'].map(k => h('button', { class: kind === k ? 'on' : '', onclick: () => { kind = k; draw(); } }, t(k))));
    box.replaceChildren(...lines.map((l, i) => h('div', { class: 'row', style: 'margin-top:8px' },
      h('input', { placeholder: t('item'), value: l.n, style: 'flex:2', oninput: e => l.n = e.target.value, maxlength: 50 }),
      h('input', { placeholder: t('qty'), value: l.q, inputmode: 'decimal', style: 'flex:1', oninput: e => l.q = e.target.value }),
      h('input', { placeholder: t('price'), value: l.p, inputmode: 'decimal', style: 'flex:1.3', oninput: e => l.p = e.target.value }))));
  };
  draw();
  sheet(h('h2', {}, t('new_invoice')), seg, party, h('label', {}, t('due')), due, h('label', {}, t('item')), box,
    h('button', { class: 'btn soft small', style: 'margin-top:10px', onclick: () => { lines.push({ n: '', q: 1, p: '' }); draw(); } }, t('add_line')),
    h('label', { style: 'display:flex;gap:8px;align-items:center;margin-top:14px' }, paid, t('paid')), err,
    h('button', {
      class: 'btn', style: 'margin-top:8px', onclick: async () => {
        const ls = lines.map(l => ({ n: l.n.trim() || '—', q: parseFloat(l.q), p: parseFloat(l.p) })).filter(l => l.q > 0 && l.p >= 0);
        if (!ls.length) return err.textContent = t('need_lines');
        const n = book().invoices.filter(i => i.kind === kind).length + 1;
        const inv = { id: uid(), no: (kind === 'sale' ? 'INV-' : 'BILL-') + String(n).padStart(4, '0'), kind, party: party.value.trim(), date: today(), due: due.value || today(), lines: ls, paid: false };
        book().invoices.push(inv); if (paid.checked) payInvoice(inv); await persist(); closeSheet(); route();
      }
    }, t('save')));
}
function payInvoice(i) { if (i.paid) return; i.paid = true; addTx(i.kind === 'sale' ? 'income' : 'expense', i.kind === 'sale' ? 'Sales' : 'Purchases', total(i), 'Invoice ' + i.no); }
function invoiceDetail(i) {
  sheet(h('h2', {}, i.no + ' · ' + fmt(total(i))), h('p', { class: 'sub' }, (i.party || '') + ' · ' + t('due') + ' ' + i.due),
    h('div', { class: 'list' }, i.lines.map(l => h('div', { class: 'it' }, h('div', { class: 'sp nm' }, l.n), h('div', {}, l.q + ' × ' + fmt(l.p))))),
    i.paid ? null : h('button', { class: 'btn', style: 'margin-top:10px', onclick: async () => { payInvoice(i); await persist(); closeSheet(); route(); } }, t('mark_paid')),
    h('button', { class: 'btn danger', style: 'margin-top:8px', onclick: async () => { book().invoices = book().invoices.filter(x => x.id !== i.id); await persist(); closeSheet(); route(); } }, t('delete')));
}
let draft = '';
const VL = { en: 'en-IN', lus: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', zh: 'zh-CN' };
function viewAssistant() {
  if (!chat.length && Array.isArray(S.data.chat)) chat = S.data.chat.map(x => [String(x[0]), String(x[1])]);
  if (!chat.length) chat.push(['bot', t('welcome_bot')]);
  const log = h('div', { class: 'chat' }, chat.slice(-120).map(([w, m]) => h('div', { class: 'msg ' + w }, m)));
  const input = h('input', { placeholder: t('ask_ph'), value: draft, enterkeyhint: 'send', 'aria-label': t('assistant'), oninput: e => draft = e.target.value });
  const toEnd = () => { const sc = log.closest('.scroll'); if (sc) sc.scrollTop = sc.scrollHeight; };
  const send = async (txt, spoken) => {
    txt = (txt ?? input.value).trim(); if (!txt) return; draft = ''; input.value = '';
    chat.push(['me', txt]); log.append(h('div', { class: 'msg me' }, txt));
    const rep = assist(txt) || t('unknown'); chat.push(['bot', rep]); log.append(h('div', { class: 'msg bot' }, rep));
    while (log.children.length > 120) log.firstChild.remove();
    if (chat.length > 200) chat = chat.slice(-120);
    S.data.chat = chat.slice(-60); toEnd(); if (!spoken) input.focus({ preventScroll: true });
    try { if (spoken && window.speechSynthesis) { const u = new SpeechSynthesisUtterance(rep); u.lang = VL[lang] || 'en-IN'; speechSynthesis.speak(u); } } catch (e) { }
    try { await persist(); } catch (e) { }
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const mic = h('button', { class: 'mic', 'aria-label': 'Voice', onclick: () => {
    if (!SR) { toast('Voice not supported in this browser (use Chrome)'); return; }
    const r = new SR(); r.lang = VL[lang] || 'en-IN'; r.interimResults = false; r.maxAlternatives = 1;
    mic.classList.add('on'); r.onresult = ev => { const tx = ev.results[0][0].transcript; input.value = tx; send(tx, true); };
    r.onerror = ev => { mic.classList.remove('on'); toast(ev.error === 'not-allowed' ? 'Allow the microphone' : 'Voice: ' + ev.error); };
    r.onend = () => mic.classList.remove('on'); try { r.start(); } catch (e) { mic.classList.remove('on'); }
  } }, '🎤');
  const sug = [lang === 'lus' ? 'engzah ka nei?' : 'how much do I have?', lang === 'lus' ? 'engah nge ka sen tam ber?' : 'where did I spend most?', lang === 'lus' ? 'sum ruahmanna min siamsak rawh' : 'make me a money plan', lang === 'lus' ? 'budget min zirtir rawh' : 'teach me budgeting'];
  shell(h('div', { class: 'screen', style: 'position:relative;flex:1' }, h('div', { class: 'scroll', style: 'padding-bottom:150px' }, h('div', { class: 'sugg' }, sug.map(s => h('button', { onclick: () => send(s) }, s))), log),
    h('div', { class: 'composer' }, mic, input, h('button', { onclick: () => send(), 'aria-label': t('send') }, '➤'))));
  setTimeout(() => { const s = $app.querySelector('.scroll .chat'); if (s) s.parentElement.scrollTop = 1e6; }, 30);
}
function viewSettings() {
  const row = (label, ctl) => h('div', { class: 'toggle' }, h('span', {}, label), ctl);
  const cur = h('select', { style: 'width:110px', onchange: async e => { book().cur = e.target.value; await persist(); } }, ['₹', '$', '€', '£', '¥', '₩', '৳', 'Rs', 'A$', 'C$', 'AED', '₦', '฿', '₱', 'R'].map(c => h('option', { value: c, selected: c === book().cur }, c)));
  const lock = h('select', { style: 'width:110px', onchange: e => { meta.autolock = +e.target.value; saveMeta(); startIdle(); } }, [1, 2, 5, 10].map(m => h('option', { value: m, selected: m === (meta.autolock || 2) }, m + ' ' + t('min'))));
  const bioRow = h('div', { class: 'toggle' }, h('span', {}, '🔐 ' + t('bio_on')));
  const bioBtn = h('button', { class: 'btn small ' + (meta.bio ? 'danger' : ''), onclick: async () => {
    if (meta.bio) { meta.bio = null; saveMeta(); toast(t('bio_disabled')); return route(); }
    try { await enableBio(); toast(t('bio_enabled')); route(); } catch (e) { toast(t('bio_unsupported')); }
  } }, meta.bio ? 'ON' : 'OFF');
  bioRow.append(bioBtn);
  const file = h('input', { type: 'file', accept: '.json,.sakura', class: 'hide', onchange: () => restoreSheet2(file) });
  shell(h('div', { class: 'scroll set' }, h('div', { class: 'row', style: 'margin-bottom:6px' }, h('h1', { class: 'sp' }, t('settings')), h('button', { class: 'btn soft small', onclick: () => { view = 'home'; route(); } }, '✕')),
    h('div', { class: 'card', onclick: () => { view = 'profile'; route(); }, style: 'cursor:pointer' }, h('div', { class: 'row' }, h('div', { class: 'avatar', style: 'width:52px;height:52px' }, avatarContent()),
      h('div', { class: 'sp' }, h('b', {}, meta.name), h('div', { class: 'sub' }, (prof().email || prof().phone || '') + (isBiz() && prof().company && prof().company.name ? ' · ' + prof().company.name : ''))), h('span', { class: 'tag' }, '✎'))),
    accountCard(false),
    h('div', { class: 'card' }, h('h2', { style: 'margin-bottom:10px' }, 'View'), h('div', { class: 'tabs' }, [['auto', 'Auto'], ['desktop', '🖥 Desktop'], ['mobile', '📱 Mobile']].map(([k, n]) => h('button', { class: 'tab' + ((lsGet('sk.layout') || 'auto') === k ? ' on' : ''), onclick: () => { k === 'auto' ? (() => { try { localStorage.removeItem('sk.layout'); } catch {} })() : lsSet('sk.layout', k); applyLayout(); route(); } }, n)))),
    h('div', { class: 'card' }, h('h2', { style: 'margin-bottom:10px' }, t('theme')), themeRow(), accentRow()),
    h('div', { class: 'card' }, row(t('language'), langPicker(route)), row(t('currency'), cur), langPackRow()),
    h('div', { class: 'card' }, h('h2', {}, t('security')), bioRow, row(t('autolock'), lock),
      h('button', { class: 'btn soft', style: 'margin-top:6px', onclick: pwSheet }, t('change_pw')), h('button', { class: 'btn', style: 'margin-top:8px', onclick: () => lockNow() }, '🔒 ' + t('lock_now'))),
    h('div', { class: 'card' }, h('h2', {}, t('data')),
      h('button', { class: 'btn soft', style: 'margin-top:8px', onclick: async () => { const blob = new Blob([await makeBackup()], { type: 'application/json' }), a = h('a', { href: URL.createObjectURL(blob), download: 'sakura-backup-' + today() + '.sakura' }); document.body.append(a); a.click(); a.remove(); toast(t('exported')); } }, t('export')),
      h('button', { class: 'btn soft', style: 'margin-top:8px', onclick: restoreSheet }, t('import')),
      h('button', { class: 'btn soft', style: 'margin-top:8px', onclick: async () => { loadDemo(); await persist(); view = 'home'; route(); } }, t('demo')),
      h('button', { class: 'btn danger', style: 'margin-top:8px', onclick: () => { if (confirm(t('erase_q'))) { wipeAll(); route(); } } }, t('erase'))),
    h('button', { class: 'btn soft', style: 'margin-bottom:10px', onclick: supportSheet }, '🛟 Help & support'),
    h('p', { class: 'sub' }, t('about')), file), { noNav: false, back: true });
}
function restoreSheet2() { }
function pwSheet() {
  const o = h('input', { type: 'password', placeholder: t('cur_pw') }), n = h('input', { type: 'password', placeholder: t('new_pw') }), err = h('div', { class: 'err' });
  sheet(h('h2', {}, t('change_pw')), h('label', {}, t('cur_pw')), o, h('label', {}, t('new_pw')), n, err,
    h('button', { class: 'btn', onclick: async () => { if (n.value.length < 8) return err.textContent = t('short'); if (await changePassword(o.value, n.value)) { closeSheet(); toast(t('saved')); } else err.textContent = t('wrong'); } }, t('save')));
}


// ============================================================ auto-add: read bank / UPI / GPay messages and statements
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const MERCHANTS = [
  [/swiggy|zomato|dominos|pizza|kfc|mcdonald|burger|cafe|restaur|starbucks|barbeque/i, 'Dining'], [/uber|ola\b|olacabs|rapido|metro|irctc|redbus|fastag|toll|bus\b/i, 'Transport'],
  [/makemytrip|goibibo|cleartrip|indigo|airindia|spicejet|yatra|airbnb|booking\.com/i, 'Travel'], [/amazon|flipkart|myntra|ajio|meesho|nykaa|shopping|mall/i, 'Shopping'],
  [/netflix|spotify|hotstar|primevideo|prime video|youtube|jiocinema|sonyliv|zee5|apple\.com|google play|subscription|disney/i, 'Subscriptions'],
  [/bigbasket|blinkit|zepto|dmart|grofers|instamart|jiomart|grocery|supermarket|reliance fresh/i, 'Groceries'], [/jio|airtel|vodafone|\bvi\b|bsnl|recharge|broadband|electricity|bescom|water|gas bill|tneb|mseb|wifi|dth|tata ?play|act fibernet/i, 'Utilities'],
  [/petrol|diesel|hpcl|bpcl|iocl|indian oil|shell|fuel|bharat petroleum/i, 'Fuel'], [/pharm|apollo|medplus|1mg|netmeds|hospital|clinic|doctor|lab\b|diagnostic/i, 'Health'],
  [/school|college|university|tuition|fees?\b|byju|unacademy|udemy|coursera|exam/i, 'Education'], [/lic\b|insurance|policybazaar|hdfc life|star health/i, 'Insurance'],
  [/emi\b|loan|bajaj fin|credit card payment|cred\b/i, 'Loans'], [/rent|landlord|nobroker/i, 'Rent'], [/bookmyshow|pvr|inox|cinema|movie|steam|playstation|xbox/i, 'Entertainment'],
  [/mutual fund|zerodha|groww|upstox|sip\b|nps\b|ppf/i, 'Investments'], [/tax|gst|income tax|itd/i, 'Taxes'], [/donat|temple|church|charity|ngo/i, 'Charity'],
];
const merchKey = m => (m || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24);
function guessCat(merchant, type, text) {
  const k = merchKey(merchant), rules = S.data.rules || {};
  if (k && rules[k]) return rules[k];
  const probe = (merchant + ' ' + (text || '')).toLowerCase();
  if (type === 'income') return /salary|payroll|sal cr/.test(probe) ? 'Salary' : /refund|reversal|cashback/.test(probe) ? 'Refund' : /interest/.test(probe) ? 'Interest' : /dividend/.test(probe) ? 'Investments' : (isBiz() ? 'Sales' : 'Other');
  for (const [re, c] of MERCHANTS) if (re.test(probe)) return c;
  return 'Other';
}
function parseDateStr(s, fallback) {
  s = String(s || '');
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return fixDate(+m[1], +m[2], +m[3], fallback);
  m = s.match(/(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/);
  if (m) { let y = +m[3]; if (y < 100) y += 2000; let d = +m[1], mo = +m[2]; if (mo > 12 && d <= 12) [d, mo] = [mo, d]; return fixDate(y, mo, d, fallback); }
  for (const mm of s.matchAll(/(\d{1,2})(?:st|nd|rd|th)?[\s\-,]*([A-Za-z]{3})[a-z]*[\s\-,]*(\d{2,4})?/g)) {
    if (!MONTHS[mm[2].toLowerCase()]) continue;
    let y = mm[3] ? +mm[3] : new Date().getFullYear(); if (y < 100) y += 2000; return fixDate(y, MONTHS[mm[2].toLowerCase()], +mm[1], fallback);
  }
  return fallback;
}
function fixDate(y, mo, d, fb) { const dt = new Date(y, mo - 1, d); if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d || dt > new Date(Date.now() + 864e5)) return fb; return y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }
function cleanMerchant(s) {
  s = (s || '').replace(/^\s*(neft|imps|rtgs|upi|ach|ecs|pos)\b[\s\-:\/]*/i, '').replace(/\bvpa\b/ig, '').replace(/@[a-z0-9.]+/ig, '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').replace(/^[\s.:,-]+|[\s.:,-]+$/g, '');
  s = s.replace(/\s+(on|via|ref|refno|ref\.?\s?no|upi|using|from|a\/c|avl|bal|txn|dated|for)\b.*$/i, '').trim();
  if (s.length > 32) s = s.slice(0, 32).trim();
  if (s === s.toUpperCase()) s = s.toLowerCase();
  const seen = new Set(); s = s.split(' ').filter(w => { const k = w.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).join(' ');
  return s.replace(/\b([a-z])([a-z]*)/g, (m, a, b) => a.toUpperCase() + b).replace(/\.$/, '');
}
function parseMessage(raw, defaultDate) {
  const text = String(raw || '').replace(/\s+/g, ' ').trim(); if (text.length < 8) return null;
  const low = text.toLowerCase();
  if (/\botp\b|one.time password|verification code|do not share/.test(low) && !/\b(debited|credited|spent|paid)\b/.test(low)) return null;
  if (/\b(request(ed)? (money|for)|collect request|pending|will be debited|due on|reminder)\b/.test(low) && !/\b(debited|credited|has been|successfully)\b/.test(low)) return null;
  const balAt = low.search(/\b(avl|avail|available|bal|balance|a\/c bal|limit)\b/);
  const head = balAt > 25 ? text.slice(0, balAt) : text;
  let m = /(?:rs\.?|inr|₹|usd|\$|eur|€|gbp|£)\s*([\d,]+(?:\.\d{1,2})?)/i.exec(head) || /([\d,]+(?:\.\d{1,2})?)\s*(?:rs\b|inr\b|\/-)/i.exec(head)
    || /\b(?:debited|credited|paid|sent|received|spent|withdrawn|deposited|transferred|dr|cr)\b[^\d]{0,18}?(\d[\d,]*(?:\.\d{1,2})?)/i.exec(head);
  if (!m) return null;
  const amt = parseFloat(m[1].replace(/,/g, '')); if (!(amt > 0) || amt > 1e10) return null;
  const dRe = /\b(debited|debit|spent|paid|sent|purchase[d]?|withdrawn|withdrawal|payment of|transferred to|charged|deducted|dr)\b/g, cRe = /\b(credited|credit|received|deposited|refund(?:ed)?|salary|added to|reversed|cr)\b/g;
  const di = low.search(dRe), ci = low.search(cRe);
  let type = di < 0 && ci < 0 ? null : (ci < 0 ? 'expense' : di < 0 ? 'income' : (/\b(received|credited)\b.*\bfrom\b/.test(low) && ci <= di + 40 ? 'income' : di < ci ? 'expense' : 'income'));
  if (/\b(you have received|has been credited|credited to|received from|received rs|received ₹)\b/.test(low)) type = 'income';
  if (/\b(sent to|paid to|debited from|debited by|you paid|you sent)\b/.test(low)) type = 'expense';
  if (!type) return null;
  const mer = (type === 'expense' ? /\b(?:to|at|towards|@)\s+(?:vpa\s+)?([A-Za-z0-9&@._\- ]{2,40})/i : /\b(?:from|by(?!\s*(?:rs|inr|usd|₹|\$|\d)))\s+(?:vpa\s+)?([A-Za-z0-9&@._\- ]{2,40})/i).exec(text.replace(/^.*?(?:debited|credited|paid|sent|received|spent)/i, m0 => m0));
  let merchant = cleanMerchant(mer ? mer[1] : '');
  if (/^(your|a\/c|ac|account|bank|card|xx|x+\d)/i.test(merchant) || /^\d+$/.test(merchant)) merchant = '';
  if (!merchant) {
    const tail = text.split(/\.\s+/).map(x => x.trim()).filter(x => x && !/(debited|credited|spent|avl|bal|not you|call|otp|ref|a\/c)/i.test(x)).pop();
    if (tail) merchant = cleanMerchant(tail);
  }
  const date = parseDateStr(text, defaultDate || today());
  const rm = /(?:ref(?:erence)?(?:\s*(?:no|number))?\.?|upi ref|txn(?:\s*id)?|utr|rrn)\s*[:#.\-]?\s*(\d{6,})/i.exec(text);
  const ref = rm ? rm[1] : '';
  return { type, amt, merchant, date, ref, cat: guessCat(merchant, type, text) };
}
function splitMessages(blob) {
  const blocks = String(blob).split(/\n\s*\n+/).map(x => x.trim()).filter(Boolean), out = [];
  for (const b of blocks) {
    const lines = b.split('\n').map(x => x.trim()).filter(Boolean);
    if (lines.length > 1 && lines.every(l => parseMessage(l))) out.push(...lines); else out.push(b);
  }
  return out;
}
function parseCSV(text) {
  text = String(text).replace(/^﻿/, ''); const sample = text.split('\n').filter(l => l.trim()).slice(0, 12);
  const delim = [',', ';', '\t', '|'].map(d => [d, sample.reduce((a, l) => a + l.split(d).length - 1, 0)]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true; else if (ch === delim) { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); if (row.some(c => c.trim())) rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  row.push(cur); if (row.some(c => c.trim())) rows.push(row);
  return rows;
}
function parseStatement(text) {
  const rows = parseCSV(text), num = s => { const v = parseFloat(String(s || '').replace(/[^0-9.\-]/g, '')); return isNaN(v) ? 0 : v; };
  let hi = rows.findIndex(r => r.some(c => /date/i.test(c)) && r.some(c => /(narration|particular|description|details|remarks|merchant|transaction|payee)/i.test(c)) && r.some(c => /(debit|withdraw|credit|deposit|amount|dr\b|cr\b)/i.test(c)));
  if (hi < 0) hi = rows.findIndex(r => r.some(c => /date/i.test(c)) && r.some(c => /(debit|withdraw|credit|deposit|amount)/i.test(c)));
  if (hi < 0) return [];
  const H = rows[hi].map(c => c.toLowerCase().trim()), idx = re => H.findIndex(c => re.test(c));
  const iD = idx(/date/), iN = idx(/(narration|particular|description|details|remarks|merchant|payee|transaction)/), iDr = idx(/(debit|withdraw|dr\b)/), iCr = idx(/(credit|deposit|cr\b)/), iA = idx(/^amount|amount$/), iT = idx(/^(type|dr\/cr|cr\/dr)$/), iR = idx(/(ref|chq|cheque|utr)/);
  const out = [];
  for (const r of rows.slice(hi + 1)) {
    const date = parseDateStr(r[iD], null); if (!date) continue;
    let type = null, amt = 0;
    if (iDr >= 0 && num(r[iDr]) > 0) { type = 'expense'; amt = num(r[iDr]); }
    else if (iCr >= 0 && num(r[iCr]) > 0) { type = 'income'; amt = num(r[iCr]); }
    else if (iA >= 0 && num(r[iA]) !== 0) { amt = Math.abs(num(r[iA])); const tt = iT >= 0 ? String(r[iT]).toLowerCase() : ''; type = /cr|credit|deposit/.test(tt) ? 'income' : /dr|debit|withdraw/.test(tt) ? 'expense' : (num(r[iA]) < 0 ? 'expense' : 'income'); }
    if (!type || !(amt > 0)) continue;
    const desc = (r[iN] || '').replace(/\s+/g, ' ').trim(), merchant = cleanMerchant(desc.replace(/^(upi|imps|neft|pos|atm|ach|ecs)[\/\-\s]*(?:(?:dr|cr)[\/\-\s]*)?(?:\d{6,}[\/\-\s]*)?/i, '').replace(/\d{6,}/g, ''));
    out.push({ type, amt, merchant, date, ref: iR >= 0 ? (String(r[iR]).match(/\d{6,}/) || [''])[0] : '', cat: guessCat(merchant, type, desc) });
  }
  return out;
}
const txHash = x => [x.date, x.type, x.amt.toFixed(2), x.ref || merchKey(x.merchant)].join('|');
function captureSheet(prefill) {
  let mode = prefill ? 'msg' : 'msg', found = [];
  const area = h('textarea', { placeholder: t('cap_paste'), 'aria-label': t('cap_paste') }), out = h('div'), err = h('div', { class: 'err' });
  if (prefill) area.value = prefill;
  const file = h('input', { type: 'file', accept: '.csv,.txt,text/csv', onchange: async () => {
    const f = file.files[0]; if (!f) return; const rows = parseStatement(await f.text());
    if (!rows.length) { err.textContent = t('cap_csv_bad'); return; } err.textContent = ''; show(rows);
  } });
  const seg = h('div', { class: 'seg2' }), box = h('div');
  const drawSeg = () => seg.replaceChildren(...[['msg', t('cap_msgs')], ['file', t('cap_file')]].map(([k, l]) => h('button', { class: mode === k ? 'on' : '', onclick: () => { mode = k; found = []; out.replaceChildren(); err.textContent = ''; drawSeg(); drawBox(); } }, l)));
  const drawBox = () => box.replaceChildren(...(mode === 'msg' ? [area, h('button', { class: 'btn', style: 'margin-top:8px', onclick: () => {
    const rows = splitMessages(area.value).map(m => parseMessage(m)).filter(Boolean);
    if (!rows.length) { err.textContent = t('cap_none'); out.replaceChildren(); return; } err.textContent = ''; show(rows);
  } }, '⚡ ' + t('cap_find')), h('p', { class: 'sub', style: 'margin:10px 0 0' }, t('cap_tip'))] : [h('p', { class: 'sub', style: 'margin:4px 0 8px' }, t('cap_csv')), file]));
  const show = rows => {
    const seen = new Set(S.data.seen || []); found = rows.map(r => ({ ...r, sug: r.cat, dup: seen.has(txHash(r)) }));
    found.forEach(r => r.on = !r.dup);
    out.replaceChildren(h('h3', { style: 'margin:14px 0 4px' }, t('cap_found', { n: found.length })),
      ...found.map(r => h('div', { class: 'det' },
        h('input', { type: 'checkbox', checked: r.on, onchange: e => r.on = e.target.checked }),
        h('div', { style: 'flex:1;min-width:0' }, h('div', { style: 'font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, r.merchant || '—'),
          h('div', { style: 'font-size:11px;color:var(--mute)' }, r.date + (r.dup ? ' · ' : ''), r.dup ? h('span', { class: 'tag' }, t('dup')) : null)),
        h('div', { class: r.type === 'income' ? 'pos' : 'neg', style: 'font-size:13px;white-space:nowrap' }, (r.type === 'income' ? '+' : '-') + fmt(r.amt)),
        h('select', { 'aria-label': t('pick_cat'), onchange: e => r.cat = e.target.value }, catsFor(r.type).map(c => h('option', { value: c[0], selected: c[0] === r.cat }, c[1] + ' ' + t('c_' + c[0])))))),
      h('button', { class: 'btn', style: 'margin-top:12px', onclick: async () => {
        let n = 0, d = 0; S.data.seen = S.data.seen || []; S.data.rules = S.data.rules || {};
        for (const r of found) {
          if (!r.on) continue; const hs = txHash(r); if (S.data.seen.includes(hs)) { d++; continue; }
          const x = addTx(r.type, r.cat, r.amt, r.merchant, r.date); if (r.ref) x.ref = r.ref; S.data.seen.push(hs); n++;
          const k = merchKey(r.merchant); if (k && r.cat !== 'Other') S.data.rules[k] = r.cat;
        }
        S.data.seen = S.data.seen.slice(-5000); await persist(); closeSheet(); route(); toast(t('cap_added', { n, d }));
      } }, t('cap_add')));
  };
  drawSeg(); drawBox();
  sheet(h('h2', {}, '⚡ ' + t('cap_title')), seg, box, err, out);
}
// messages shared from the phone's SMS app (Android "Share > Sakura")
let sharedText = '';
try { const q = new URLSearchParams(location.search), s = [q.get('title'), q.get('text')].filter(Boolean).join('\n'); if (s) { sharedText = s.slice(0, 8000); history.replaceState(null, '', location.pathname); } } catch { }

// ============================================================ goals, allowance, subscriptions
const weekStart = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function detectSubs() {
  const g = {}; book().tx.filter(x => x.type === 'expense' && x.note && x.note !== 'assistant' && !/^invoice|^payroll|^goal/i.test(x.note)).forEach(x => { (g[x.note.toLowerCase()] = g[x.note.toLowerCase()] || []).push(x); });
  return Object.values(g).map(a => { if (new Set(a.map(x => ym(x.date))).size < 2) return null; const am = a.map(x => x.amt); if (Math.min(...am) < Math.max(...am) * .9) return null; return { name: a[0].note, amt: a.slice().sort((p, q) => q.date.localeCompare(p.date))[0].amt }; }).filter(Boolean).sort((a, b) => b.amt - a.amt).slice(0, 6);
}
function goalSheet(g) {
  const name = h('input', { placeholder: t('goal_name'), value: g ? g.name : '', maxlength: 40 }), target = h('input', { inputmode: 'decimal', placeholder: t('goal_target'), value: g ? g.target : '' }), add = h('input', { inputmode: 'decimal', placeholder: t('goal_add') });
  sheet(h('h2', {}, g ? g.name : t('goal_new')), h('label', {}, t('goal_name')), name, h('label', {}, t('goal_target')), target, g ? [h('label', {}, t('goal_add')), add] : null,
    h('button', { class: 'btn', style: 'margin-top:14px', onclick: async () => {
      const tg = parseFloat(target.value); if (!name.value.trim() || !(tg > 0)) return;
      if (!g) book().goals.push({ id: uid(), name: name.value.trim(), target: tg, saved: 0 }); else { g.name = name.value.trim(); g.target = tg; const a = parseFloat(add.value); if (a > 0) { g.saved += a; addTx('expense', 'Savings', a, 'Goal: ' + g.name); } }
      await persist(); closeSheet(); route();
    } }, t('save')),
    g ? h('button', { class: 'btn danger', style: 'margin-top:8px', onclick: async () => { book().goals = book().goals.filter(x => x.id !== g.id); await persist(); closeSheet(); route(); } }, t('delete')) : null);
}
function allowanceSheet() {
  const a = h('input', { inputmode: 'decimal', placeholder: t('allowance'), value: book().allowance || '' });
  sheet(h('h2', {}, t('allowance')), h('label', {}, t('amount')), a, h('button', { class: 'btn', style: 'margin-top:14px', onclick: async () => { book().allowance = Math.max(0, parseFloat(a.value) || 0); await persist(); closeSheet(); route(); } }, t('save')));
}
function goalsAndSubs() {
  const nodes = [];
  nodes.push(h('div', { class: 'row', style: 'margin:6px 0 10px' }, h('h2', { class: 'sp' }, t('goals')), h('button', { class: 'btn small', onclick: () => goalSheet() }, '+ ' + t('goal_new'))));
  book().goals.forEach(g => { const p = Math.min(1, g.saved / g.target); nodes.push(h('div', { class: 'card', onclick: () => goalSheet(g) }, h('div', { class: 'row' }, h('div', { class: 'ic' }, '🎯'), h('div', { class: 'sp' }, h('b', {}, g.name), h('div', { style: 'font-size:12px;color:var(--mute)' }, fmt(g.saved) + ' / ' + fmt(g.target))), h('b', { class: p >= 1 ? 'pos' : '' }, p >= 1 ? t('goal_done') : Math.round(p * 100) + '%')), h('div', { class: 'bar' }, h('i', { style: 'width:' + p * 100 + '%' })))); });
  const subs = detectSubs();
  if (subs.length) { nodes.push(h('h2', { style: 'margin:14px 0 8px' }, t('subs'))); nodes.push(h('div', { class: 'card' }, h('div', { class: 'list' }, subs.map(s => h('div', { class: 'it' }, h('div', { class: 'ic' }, '🔁'), h('div', { class: 'sp nm' }, s.name), h('b', {}, fmt(s.amt) + t('per_month'))))))); }
  return nodes;
}
// ============================================================ themes + language packs
const THEMES = ['pink', 'midnight', 'auto'];
let theme = (lsGet('sk.theme') && THEMES.includes(lsGet('sk.theme'))) ? lsGet('sk.theme') : 'pink';
function applyLayout() {
  const l = lsGet('sk.layout'), d = document.documentElement;
  if (l === 'desktop' || l === 'mobile') d.dataset.layout = l; else delete d.dataset.layout;
  const vp = document.querySelector('meta[name=viewport]');
  if (vp) vp.content = l === 'desktop' && screen.width < 900 ? 'width=1100, viewport-fit=cover' : 'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content';
}
const isDeskNow = () => document.documentElement.dataset.layout === 'desktop' || (document.documentElement.dataset.layout !== 'mobile' && innerWidth >= 900);
const toggleLayout = () => { lsSet('sk.layout', isDeskNow() ? 'mobile' : 'desktop'); applyLayout(); route(); };
function applyTheme() {
  const dark = theme === 'midnight' || (theme === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'midnight' : 'pink';
  const st = document.documentElement.style;
  ['--pink', '--pink2', '--pinkL', '--hero1', '--hero2', '--bg', '--peach', '--line', '--outer', '--sh'].forEach(v => st.removeProperty(v));
  const acc = lsGet('sk.accent'), ok = acc && /^#[0-9a-f]{6}$/i.test(acc);
  if (ok) {
    const mix = (a, b, r) => { const f = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)), A = f(a), B = f(b); return '#' + A.map((v, i) => Math.round(v * r + B[i] * (1 - r)).toString(16).padStart(2, '0')).join(''); };
    const set = (k, v) => st.setProperty(k, v);
    set('--pink', acc);
    if (dark) { set('--pink2', mix(acc, '#ffffff', .75)); set('--pinkL', mix(acc, '#1B1518', .2)); set('--hero1', acc); set('--hero2', mix(acc, '#000000', .45)); }
    else { set('--pink2', mix(acc, '#ffffff', .65)); set('--pinkL', mix(acc, '#ffffff', .14)); set('--bg', mix(acc, '#ffffff', .07)); set('--peach', mix(acc, '#ffffff', .15)); set('--line', mix(acc, '#ffffff', .2)); set('--outer', mix(acc, '#ffffff', .12)); set('--hero1', mix(acc, '#ffffff', .65)); set('--hero2', acc); set('--sh', '0 6px 20px ' + mix(acc, '#ffffff', .18)); }
  }
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = dark ? '#0F0B0D' : (ok ? getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#FDEAF2' : '#FDEAF2');
}
const ACCENTS = ['', '#E5384F', '#F28C28', '#2E9E6B', '#14A3A3', '#3B82F6', '#5B5BD6', '#8B5CF6', '#334155'];
function accentRow() {
  const cur = lsGet('sk.accent') || '';
  const pick = c => { lsSet('sk.accent', c); applyTheme(); route(); };
  const dots = ACCENTS.map(c => h('button', { class: 'dot' + (cur === c ? ' on' : ''), 'aria-label': c || 'Default', style: 'background:' + (c || 'linear-gradient(135deg,#F28BB5,#EC5B97)'), onclick: () => pick(c) }));
  const custom = h('label', { class: 'dot custom' + (cur && !ACCENTS.includes(cur) ? ' on' : ''), 'aria-label': 'Custom colour', style: 'background:conic-gradient(red,yellow,lime,aqua,blue,magenta,red)' }, h('input', { type: 'color', value: cur || '#EC5B97', class: 'hide', onchange: e => pick(e.target.value) }));
  return h('div', { style: 'margin-top:14px' }, h('h3', { style: 'margin-bottom:8px' }, t('accent')), h('div', { class: 'dots' }, dots, custom));
}
function setTheme(x) { theme = x; lsSet('sk.theme', x); applyTheme(); }
applyLayout();
applyTheme();
if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
function themeRow() {
  const sw = (k, bg) => h('button', { class: 'sw' + (theme === k ? ' on' : ''), onclick: () => { setTheme(k); route(); } }, h('i', { style: 'background:' + bg }), t('theme_' + (k === 'midnight' ? 'dark' : k)));
  return h('div', { class: 'theme' }, sw('pink', 'linear-gradient(135deg,#F28BB5,#EC5B97)'), sw('midnight', 'linear-gradient(135deg,#E5384F,#0F0B0D)'), sw('auto', 'linear-gradient(90deg,#EC5B97 50%,#0F0B0D 50%)'));
}
function langPackRow() {
  const f = h('input', { type: 'file', accept: '.json,application/json', class: 'hide', onchange: async () => {
    try {
      const p = JSON.parse(await f.files[0].text());
      if (!/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(p.code) || typeof p.strings !== 'object') throw 0;
      const strings = {}; for (const [k, v] of Object.entries(p.strings)) if (typeof v === 'string' && k in LANG.en) strings[k] = v.slice(0, 400);
      strings.name = String(p.name || p.code).slice(0, 30); LANG[p.code] = strings;
      const all = JSON.parse(lsGet('sk.packs') || '{}'); all[p.code] = strings; lsSet('sk.packs', JSON.stringify(all)); toast(t('pack_ok')); route();
    } catch { toast(t('pack_bad')); }
  } });
  return h('div', {}, h('button', { class: 'btn soft', style: 'margin-top:8px', onclick: () => f.click() }, t('pack_import')),
    h('button', { class: 'btn soft', style: 'margin-top:8px', onclick: () => {
      const tpl = { code: 'xx', name: 'My language', strings: Object.fromEntries(Object.entries(LANG.en).filter(([k]) => k !== 'name')) };
      const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(tpl, null, 2)], { type: 'application/json' })), download: 'sakura-language-template.json' }); document.body.append(a); a.click(); a.remove();
    } }, t('pack_template')), f);
}

// ---------- router + boot
function route() {
  if (!window.isSecureContext || !crypto.subtle) {
    root().append(h('div', { class: 'screen center' }, h('h2', {}, 'HTTPS needed'), h('p', { class: 'sub' }, 'Open this app from an https:// address (or localhost). Encryption is not available on plain http.'))); return;
  }
  if (!meta) meta = loadMeta();
  if (!meta) return screenOnboard();
  if (!S) return screenLock();
  if (!S.data.modeChosen) return screenMode();
  if (!histFromPop) syncHist();
  if (sharedText) { const st = sharedText; sharedText = ''; setTimeout(() => captureSheet(st), 50); }
  if (view === 'budgets' && isBiz()) view = 'invoices';
  if (view === 'invoices' && !isBiz()) view = 'budgets';
  ({ home: viewHome, calendar: viewCalendar, activity: viewActivity, budgets: viewBudgets, invoices: viewInvoices, assistant: viewAssistant, settings: viewSettings, profile: viewProfile }[view] || viewHome)();
}
if (meta === null) { meta = loadMeta(); if (meta && meta.lang && LANG[meta.lang]) lang = meta.lang; }
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => { });
try { history.replaceState({ v: 'home' }, ''); } catch (e) { }
route();
