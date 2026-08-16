/* =============================================================
   FU ePortal - client-side app
   The whole portal is built from the details a student enters
   at registration. Everything persists in localStorage so it
   works fully before any backend exists.
   ============================================================= */
(function () {
  "use strict";

  var KEYS = { account: "fu.account", session: "fu.session", enrolled: "fu.enrolled" };
  var MAX_UNITS = 24;

  /* ---- Department metadata: programme, faculty, course code + titles ---- */
  var DEPARTMENTS = {
    "Computer Science":      { code: "CSC", programme: "B.Sc. Computer Science",       faculty: "Computing and Information Technology",
      titles: ["Data Structures & Algorithms","Operating Systems","Database Systems","Computer Architecture","Software Engineering","Computer Networks","Artificial Intelligence","Web Application Development"] },
    "Electrical Engineering":{ code: "EEE", programme: "B.Eng. Electrical Engineering", faculty: "Engineering",
      titles: ["Circuit Theory","Electromagnetic Fields","Control Systems","Digital Electronics","Power Systems","Signals & Systems","Microprocessors","Electrical Machines"] },
    "Mechanical Engineering":{ code: "MEE", programme: "B.Eng. Mechanical Engineering", faculty: "Engineering",
      titles: ["Thermodynamics","Fluid Mechanics","Strength of Materials","Machine Design","Dynamics of Machines","Heat Transfer","Manufacturing Technology","Applied Mechanics"] },
    "Mass Communication":    { code: "MAC", programme: "B.Sc. Mass Communication",      faculty: "Arts and Social Sciences",
      titles: ["News Writing & Reporting","Media Law & Ethics","Broadcast Production","Public Relations","Advertising Principles","Media Theories","Photojournalism","Development Communication"] },
    "Accounting":            { code: "ACC", programme: "B.Sc. Accounting",              faculty: "Management Sciences",
      titles: ["Financial Accounting","Cost Accounting","Auditing & Assurance","Taxation","Management Accounting","Corporate Reporting","Public Sector Accounting","Accounting Information Systems"] },
    "Economics":             { code: "ECO", programme: "B.Sc. Economics",               faculty: "Management Sciences",
      titles: ["Microeconomics","Macroeconomics","Econometrics","Development Economics","Public Finance","International Economics","Monetary Economics","Mathematical Economics"] },
    "Law":                   { code: "LAW", programme: "LL.B. Law",                     faculty: "Law",
      titles: ["Constitutional Law","Law of Contract","Criminal Law","Law of Torts","Commercial Law","Equity & Trusts","Jurisprudence","Company Law"] },
    "Microbiology":          { code: "MCB", programme: "B.Sc. Microbiology",            faculty: "Science",
      titles: ["General Microbiology","Bacteriology","Virology","Immunology","Food Microbiology","Medical Microbiology","Microbial Genetics","Industrial Microbiology"] },
    "Biochemistry":          { code: "BCH", programme: "B.Sc. Biochemistry",            faculty: "Science",
      titles: ["General Biochemistry","Enzymology","Metabolism","Molecular Biology","Clinical Biochemistry","Membrane Biochemistry","Nutritional Biochemistry","Biochemical Methods"] },
    "Medicine & Surgery":    { code: "MED", programme: "MBBS Medicine & Surgery",       faculty: "Clinical Sciences",
      titles: ["Human Anatomy","Physiology","Pathology","Pharmacology","Microbiology & Immunology","Community Medicine","Clinical Skills","Medical Biochemistry"] }
  };

  var GENERAL = [
    { title: "Entrepreneurship Studies", sem: 1 },
    { title: "Peace & Conflict Resolution", sem: 2 }
  ];

  /* ---------------------------- storage ---------------------------- */
  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function remove(key) { localStorage.removeItem(key); }

  function getAccount() { return read(KEYS.account); }
  function saveAccount(a) { write(KEYS.account, a); }
  function isLoggedIn() { return localStorage.getItem(KEYS.session) === "1"; }
  function login() { localStorage.setItem(KEYS.session, "1"); }
  function logout() { remove(KEYS.session); }
  function getEnrolled() { return read(KEYS.enrolled) || []; }
  function saveEnrolled(list) { write(KEYS.enrolled, list); }

  /* ---------------------------- helpers ---------------------------- */
  function deptMeta(name) {
    return DEPARTMENTS[name] || { code: "GEN", programme: name || "Undeclared", faculty: "General Studies", titles: [] };
  }
  function initials(first, last) {
    return ((first || "").charAt(0) + (last || "").charAt(0)).toUpperCase() || "FU";
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* Values derived from a stored account */
  function profileValues(a) {
    var meta = deptMeta(a.department);
    var full = [a.firstName, a.lastName].filter(Boolean).join(" ");
    return {
      firstName: a.firstName || "",
      lastName: a.lastName || "",
      fullName: full,
      matric: a.matric || "",
      email: a.email || "",
      phone: a.phone || "",
      department: a.department || "",
      programme: meta.programme,
      faculty: meta.faculty,
      code: meta.code,
      level: a.level || "",
      levelLabel: a.level ? a.level + " Level" : "",
      levelProgramme: (a.level ? a.level + " Level" : "") + (meta.programme ? " \u00B7 " + meta.programme : ""),
      initials: initials(a.firstName, a.lastName),
      semester: "First Semester"
    };
  }

  /* Build the course catalogue from department + level */
  function buildCatalog(a) {
    var meta = deptMeta(a.department);
    var lvl = (a.level || "100").charAt(0); // "3" from "300"
    var titles = meta.titles.length ? meta.titles : ["Foundations I","Foundations II","Theory & Practice","Analysis & Design","Advanced Topics","Research Methods","Professional Practice","Project Studies"];
    var courses = [];
    // 4 first-semester + 4 second-semester department courses
    var codeNums = [ ["01","03","05","07"], ["02","04","06","08"] ];
    titles.slice(0, 8).forEach(function (title, i) {
      var sem = i < 4 ? 1 : 2;
      var slot = i < 4 ? i : i - 4;
      courses.push({
        code: meta.code + " " + lvl + codeNums[sem - 1][slot],
        title: title, unit: 3, sem: sem,
        prereq: lvl === "1" ? "None" : meta.code + " " + (parseInt(lvl, 10) - 1) + "0" + (slot + 1)
      });
    });
    // general studies
    GENERAL.forEach(function (g, i) {
      courses.push({ code: "GST " + lvl + "0" + (i + 1), title: g.title, unit: 3, sem: g.sem, prereq: "None" });
    });
    return courses;
  }
  function catalogMap(a) {
    var m = {};
    buildCatalog(a).forEach(function (c) { m[c.code] = c; });
    return m;
  }

  /* ---------------------------- toast ---------------------------- */
  function toast(msg, type) {
    var wrap = document.querySelector(".toast-wrap");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
    var t = document.createElement("div");
    t.className = "toast toast-" + (type || "info");
    t.textContent = msg;
    wrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("show"); });
    setTimeout(function () { t.classList.remove("show"); setTimeout(function () { t.remove(); }, 300); }, 3200);
  }

  /* ---------------------------- data binding ---------------------------- */
  function bind(values) {
    document.querySelectorAll("[data-fu]").forEach(function (el) {
      var key = el.getAttribute("data-fu");
      if (values[key] != null && values[key] !== "") el.textContent = values[key];
    });
    document.querySelectorAll("[data-fu-val]").forEach(function (el) {
      var key = el.getAttribute("data-fu-val");
      if (values[key] != null && values[key] !== "") el.value = values[key];
    });
    document.querySelectorAll("[data-fu-title]").forEach(function (el) {
      var key = el.getAttribute("data-fu-title");
      if (values[key]) document.title = el.textContent = values[key];
    });
  }

  /* ---------------------------- password reveal ---------------------------- */
  function initReveal() {
    document.querySelectorAll(".reveal-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var input = document.getElementById(btn.getAttribute("data-reveal"));
        if (!input) return;
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.classList.toggle("is-on", show);
        btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      });
    });
  }

  /* ---------------------------- register page ---------------------------- */
  function initRegister() {
    var form = document.querySelector("[data-register-form]");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
      var firstName = g("firstname"), lastName = g("lastname"), matric = g("matric"),
          email = g("email"), department = g("department"), level = g("level"),
          pass = g("password"), confirm = g("confirm");
      var agree = document.querySelector('input[name="agree"]');

      if (!firstName || !lastName) return toast("Please enter your first and last name.", "error");
      if (!matric) return toast("Please enter your matric number.", "error");
      if (!email) return toast("Please enter your student email.", "error");
      if (!department) return toast("Please select your department.", "error");
      if (!level) return toast("Please select your class / level.", "error");
      if (pass.length < 6) return toast("Password must be at least 6 characters.", "error");
      if (pass !== confirm) return toast("Passwords do not match.", "error");
      if (agree && !agree.checked) return toast("Please accept the portal usage policy.", "error");

      saveAccount({ firstName: firstName, lastName: lastName, matric: matric, email: email,
        department: department, level: level, phone: "", password: pass });
      saveEnrolled([]); // fresh student, no courses yet
      login();
      toast("Welcome, " + firstName + "! Your account is ready.", "success");
      setTimeout(function () { window.location.href = "dashboard.html"; }, 900);
    });
  }

  /* ---------------------------- login page ---------------------------- */
  function initLogin() {
    var form = document.querySelector("[data-login-form]");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var matric = (document.getElementById("matric") || {}).value || "";
      var pass = (document.getElementById("password") || {}).value || "";
      matric = matric.trim();
      var acct = getAccount();
      if (!acct) { toast("No account found on this device. Please register first.", "error");
        setTimeout(function () { window.location.href = "register.html"; }, 1200); return; }
      if (matric.toLowerCase() !== (acct.matric || "").toLowerCase() || pass !== acct.password) {
        return toast("Incorrect matric number or password.", "error");
      }
      login();
      toast("Signing you in\u2026", "success");
      setTimeout(function () { window.location.href = "dashboard.html"; }, 700);
    });
  }

  /* ---------------------------- auth guard + sign out ---------------------------- */
  function guardPortal() {
    if (!isLoggedIn() || !getAccount()) { window.location.replace("login.html"); return false; }
    return true;
  }
  function initSignout() {
    document.querySelectorAll(".signout").forEach(function (a) {
      a.addEventListener("click", function () { logout(); });
    });
  }

  /* ---------------------------- dashboard ---------------------------- */
  function initDashboard(a) {
    var body = document.querySelector("[data-registered]");
    if (!body) return;
    var map = catalogMap(a), enrolled = getEnrolled();
    var units = 0, rows = "";
    enrolled.forEach(function (code, i) {
      var c = map[code]; if (!c) return; units += c.unit;
      rows += "<tr><td>" + String(i + 1).padStart(2, "0") + "</td><td class=\"course-code\">" + esc(c.code) +
        "</td><td class=\"course-title\">" + esc(c.title) + "</td><td>" + c.unit +
        "</td><td class=\"muted\">To be assigned</td><td><span class=\"status\">Registered</span></td></tr>";
    });
    if (!rows) rows = "<tr><td colspan=\"6\" class=\"muted\" style=\"text-align:center;padding:26px\">No courses registered yet. " +
      "<a href=\"available-courses.html\" style=\"color:var(--maroon);font-weight:700\">Register now</a>.</td></tr>";
    body.innerHTML = rows;

    setText("[data-stat-units]", units);
    setText("[data-stat-courses]", enrolled.length);
    var pct = Math.round(units / MAX_UNITS * 100);
    var bar = document.querySelector("[data-progress-bar]"); if (bar) bar.style.width = pct + "%";
    setText("[data-progress-units]", units + " units selected");
    setText("[data-progress-pct]", pct + "% complete");
    setText("[data-progress-count]", "You have registered " + units + " of the maximum " + MAX_UNITS + " credit units for this semester.");
  }

  /* ---------------------------- my courses ---------------------------- */
  function initMyCourses(a) {
    var body = document.querySelector("[data-mycourses]");
    if (!body) return;
    var map = catalogMap(a), enrolled = getEnrolled();
    var units = 0, rows = "";
    enrolled.forEach(function (code, i) {
      var c = map[code]; if (!c) return; units += c.unit;
      rows += "<tr><td>" + String(i + 1).padStart(2, "0") + "</td><td class=\"course-code\">" + esc(c.code) +
        "</td><td class=\"course-title\">" + esc(c.title) + "</td><td>" + c.unit +
        "</td><td class=\"muted\">&mdash;</td><td class=\"muted\">&mdash;</td><td class=\"muted\">&mdash;</td></tr>";
    });
    if (!rows) rows = "<tr><td colspan=\"7\" class=\"muted\" style=\"text-align:center;padding:26px\">You have not registered any courses. " +
      "<a href=\"available-courses.html\" style=\"color:var(--maroon);font-weight:700\">Go to Available Courses</a>.</td></tr>";
    body.innerHTML = rows;
    setText("[data-total-units]", units);
    setText("[data-registered-units]", units + " units");
    setText("[data-remaining-units]", (MAX_UNITS - units) + " units");
  }

  /* ---------------------------- available courses ---------------------------- */
  function initAvailable(a) {
    var host = document.querySelector("[data-courses]");
    if (!host) return;
    var courses = buildCatalog(a), enrolled = getEnrolled();

    function sectionHTML(title, list) {
      var rows = list.map(function (c) {
        var checked = enrolled.indexOf(c.code) > -1;
        var id = "en-" + c.code.replace(/\s+/g, "").toLowerCase();
        return "<tr data-row><td>" + "</td><td class=\"course-code\">" + esc(c.code) +
          "</td><td class=\"course-title\">" + esc(c.title) + "</td><td>" + c.unit +
          "</td><td" + (c.prereq === "None" ? " class=\"muted\"" : "") + ">" + esc(c.prereq) +
          "</td><td><span class=\"enroll-control\">" +
          "<input class=\"enroll-check\" id=\"" + id + "\" type=\"checkbox\" value=\"" + esc(c.code) +
          "\" data-unit=\"" + c.unit + "\"" + (checked ? " checked" : "") + ">" +
          "<label class=\"button button-sm enroll-button\" for=\"" + id + "\">" +
          "<svg class=\"icon icon-plus\" viewBox=\"0 0 24 24\"><path d=\"M12 5v14M5 12h14\"/></svg>" +
          "<svg class=\"icon icon-check\" viewBox=\"0 0 24 24\"><path d=\"m5 12 4 4L19 6\"/></svg>" +
          "<span class=\"enroll-default\">Enroll</span><span class=\"enroll-selected\">Selected</span></label>" +
          "</span></td></tr>";
      }).join("");
      return "<section class=\"course-section\"><div class=\"section-head\"><div class=\"section-head-group\">" +
        "<h2 class=\"section-title\">" + title + "</h2><span class=\"count-badge\">" + list.length + " courses</span>" +
        "</div></div><div class=\"table-card\"><div class=\"table-scroll\"><table><thead><tr>" +
        "<th>SN</th><th>Code</th><th>Title</th><th>Unit</th><th>Pre-requisite</th><th>Action</th>" +
        "</tr></thead><tbody>" + rows + "</tbody></table></div></div></section>";
    }

    var sem1 = courses.filter(function (c) { return c.sem === 1; });
    var sem2 = courses.filter(function (c) { return c.sem === 2; });
    host.innerHTML = sectionHTML("First Semester", sem1) + sectionHTML("Second Semester", sem2);

    // number the SN cells per table
    host.querySelectorAll("tbody").forEach(function (tb) {
      tb.querySelectorAll("tr[data-row]").forEach(function (tr, i) {
        tr.cells[0].textContent = String(i + 1).padStart(2, "0");
      });
    });

    var checks = Array.prototype.slice.call(host.querySelectorAll(".enroll-check"));
    function recount() {
      var units = 0, n = 0;
      checks.forEach(function (c) { if (c.checked) { units += parseInt(c.getAttribute("data-unit"), 10); n++; } });
      setText("[data-units-selected]", units + " / " + MAX_UNITS);
      setText("[data-units-note]", n + " course" + (n === 1 ? "" : "s") + " selected");
      return units;
    }
    checks.forEach(function (c) {
      c.addEventListener("change", function () {
        var units = recount();
        if (units > MAX_UNITS) { c.checked = false; recount(); toast("You cannot exceed " + MAX_UNITS + " credit units.", "error"); }
      });
    });
    recount();

    // live search
    var search = document.getElementById("course-search");
    if (search) search.addEventListener("input", function () {
      var q = search.value.toLowerCase();
      host.querySelectorAll("tr[data-row]").forEach(function (tr) {
        tr.style.display = tr.textContent.toLowerCase().indexOf(q) > -1 ? "" : "none";
      });
    });

    // submit registration
    var form = document.querySelector("[data-enroll-form]");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      var selected = checks.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
      if (!selected.length) return toast("Select at least one course to register.", "error");
      saveEnrolled(selected);
      toast("Registration saved \u2014 " + selected.length + " courses.", "success");
      setTimeout(function () { window.location.href = "my-courses.html"; }, 900);
    });
  }

  /* ---------------------------- profile ---------------------------- */
  function initProfile(a) {
    var form = document.querySelector("[data-profile-form]");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (document.getElementById("email") || {}).value || "";
      var phone = (document.getElementById("phone") || {}).value || "";
      a.email = email.trim(); a.phone = phone.trim();
      saveAccount(a);
      toast("Your contact information has been saved.", "success");
    });
  }

  function setText(sel, val) { var el = document.querySelector(sel); if (el) el.textContent = val; }

  /* ---------------------------- boot ---------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    var page = document.body.getAttribute("data-page");
    initReveal();

    if (page === "register") { initRegister(); return; }
    if (page === "login") { initLogin(); return; }

    // portal pages require a session
    if (!guardPortal()) return;
    var account = getAccount();
    bind(profileValues(account));
    initSignout();
    initDashboard(account);
    initMyCourses(account);
    initAvailable(account);
    initProfile(account);
  });
})();
