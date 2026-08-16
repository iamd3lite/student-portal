/* =============================================================
   FU ePortal - client-side app
   The whole portal is built from the details a student enters
   at registration. Everything persists in localStorage so it
   works fully before any backend exists.
   ============================================================= */
(function () {
  "use strict";

  var KEYS = { account: "fu.account", session: "fu.session", enrolled: "fu.enrolled", photo: "fu.photo" };
  var MAX_COURSES = 7;          // per semester
  var MAX_TOTAL = MAX_COURSES * 2; // across both semesters

  /* ---- Department metadata: programme, faculty, code + per-semester courses ---- */
  var DEPARTMENTS = {
    "Computer Science": { code: "CSC", programme: "B.Sc. Computer Science", faculty: "Computing and Information Technology",
      sem1: ["Data Structures & Algorithms","Operating Systems","Database Systems","Computer Architecture","Discrete Mathematics","Systems Programming","Object-Oriented Programming"],
      sem2: ["Software Engineering","Computer Networks","Artificial Intelligence","Web Application Development","Compiler Construction","Mobile Application Development","Human-Computer Interaction"] },
    "Electrical Engineering": { code: "EEE", programme: "B.Eng. Electrical Engineering", faculty: "Engineering",
      sem1: ["Circuit Theory","Electromagnetic Fields","Digital Electronics","Signals & Systems","Electrical Machines I","Engineering Mathematics III","Measurements & Instrumentation"],
      sem2: ["Control Systems","Power Systems Analysis","Microprocessors","Communication Systems","Electrical Machines II","Analogue Electronics","Power Electronics"] },
    "Mechanical Engineering": { code: "MEE", programme: "B.Eng. Mechanical Engineering", faculty: "Engineering",
      sem1: ["Thermodynamics I","Fluid Mechanics I","Strength of Materials","Engineering Drawing","Dynamics of Machines","Materials Science","Engineering Mathematics III"],
      sem2: ["Thermodynamics II","Fluid Mechanics II","Machine Design","Heat Transfer","Manufacturing Technology","Mechanical Vibrations","Applied Mechanics"] },
    "Mass Communication": { code: "MAC", programme: "B.Sc. Mass Communication", faculty: "Arts and Social Sciences",
      sem1: ["News Writing & Reporting","Media Law & Ethics","Broadcast Production","Photojournalism","History of Nigerian Media","Communication Theories","Graphics of Communication"],
      sem2: ["Public Relations","Advertising Principles","Development Communication","Media Management","Investigative Journalism","Online & Multimedia Journalism","Film Studies"] },
    "Accounting": { code: "ACC", programme: "B.Sc. Accounting", faculty: "Management Sciences",
      sem1: ["Financial Accounting","Cost Accounting","Business Law","Quantitative Techniques","Principles of Auditing","Company Law","Microeconomics"],
      sem2: ["Management Accounting","Taxation","Corporate Reporting","Public Sector Accounting","Accounting Information Systems","Financial Management","Auditing & Assurance"] },
    "Economics": { code: "ECO", programme: "B.Sc. Economics", faculty: "Management Sciences",
      sem1: ["Microeconomics I","Macroeconomics I","Statistics for Economists","History of Economic Thought","Mathematical Economics","Structure of the Nigerian Economy","Public Finance"],
      sem2: ["Microeconomics II","Macroeconomics II","Econometrics","Development Economics","International Economics","Monetary Economics","Labour Economics"] },
    "Law": { code: "LAW", programme: "LL.B. Law", faculty: "Law",
      sem1: ["Constitutional Law","Law of Contract","Criminal Law","Nigerian Legal System","Law of Torts","Legal Methods","Legal Research & Writing"],
      sem2: ["Commercial Law","Equity & Trusts","Jurisprudence","Company Law","Land Law","Law of Evidence","Administrative Law"] },
    "Microbiology": { code: "MCB", programme: "B.Sc. Microbiology", faculty: "Science",
      sem1: ["General Microbiology","Bacteriology","Microbial Physiology","Mycology","Cell Biology","Biostatistics","Analytical Biochemistry"],
      sem2: ["Virology","Immunology","Food Microbiology","Medical Microbiology","Microbial Genetics","Industrial Microbiology","Environmental Microbiology"] },
    "Biochemistry": { code: "BCH", programme: "B.Sc. Biochemistry", faculty: "Science",
      sem1: ["General Biochemistry","Enzymology","Carbohydrate Metabolism","Analytical Methods","Cell Biology","Bioorganic Chemistry","Biostatistics"],
      sem2: ["Lipid & Protein Metabolism","Molecular Biology","Clinical Biochemistry","Membrane Biochemistry","Nutritional Biochemistry","Immunochemistry","Pharmacological Biochemistry"] },
    "Medicine & Surgery": { code: "MED", programme: "MBBS Medicine & Surgery", faculty: "Clinical Sciences",
      sem1: ["Human Anatomy I","Physiology I","Medical Biochemistry I","Histology","Embryology","Medical Ethics","Biostatistics"],
      sem2: ["Human Anatomy II","Physiology II","Pathology","Pharmacology","Microbiology & Immunology","Community Medicine","Clinical Skills"] }
  };

  /* General studies courses (2 per semester, different each semester) */
  var GENERAL = {
    sem1: ["Entrepreneurship Studies","Nigerian Peoples & Culture"],
    sem2: ["Peace & Conflict Resolution","Environment & Sustainable Development"]
  };

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
  function getPhoto() { return localStorage.getItem(KEYS.photo) || ""; }
  function savePhoto(dataUrl) { localStorage.setItem(KEYS.photo, dataUrl); }
  function clearPhoto() { remove(KEYS.photo); }

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

  /* Build the course catalogue from department + level (9 courses per semester) */
  function buildCatalog(a) {
    var meta = deptMeta(a.department);
    var lvl = (a.level || "100").charAt(0); // "3" from "300"
    var fallback1 = ["Foundations I","Theory & Practice","Analysis & Design","Research Methods","Core Studies I","Applied Concepts","Professional Practice I"];
    var fallback2 = ["Foundations II","Advanced Topics","Systems & Models","Project Studies","Core Studies II","Field Practice","Professional Practice II"];
    var sem1Titles = (meta.sem1 && meta.sem1.length) ? meta.sem1 : fallback1;
    var sem2Titles = (meta.sem2 && meta.sem2.length) ? meta.sem2 : fallback2;
    var units = [3, 3, 2, 3, 2, 3, 2]; // varied credit units
    var courses = [];

    function addDept(titles, sem) {
      titles.slice(0, 7).forEach(function (title, i) {
        // sem 1 => odd course numbers (01,03,05..), sem 2 => even (02,04,06..)
        var num = sem === 1 ? (i * 2 + 1) : (i * 2 + 2);
        var code = meta.code + " " + lvl + pad2(num);
        var prevNum = num > 1 ? num - 1 : 1;
        courses.push({
          code: code, title: title, unit: units[i] || 3, sem: sem,
          prereq: lvl === "1" ? "None" : meta.code + " " + (parseInt(lvl, 10) - 1) + pad2(prevNum)
        });
      });
    }
    addDept(sem1Titles, 1);
    addDept(sem2Titles, 2);

    // 2 general studies courses per semester (different titles + codes each semester)
    GENERAL.sem1.forEach(function (title, i) {
      courses.push({ code: "GST " + lvl + pad2(i * 2 + 1), title: title, unit: 2, sem: 1, prereq: "None" });
    });
    GENERAL.sem2.forEach(function (title, i) {
      courses.push({ code: "GST " + lvl + pad2(i * 2 + 2), title: title, unit: 2, sem: 2, prereq: "None" });
    });
    return courses;
  }
  function pad2(n) { return String(n).padStart(2, "0"); }
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
    if (!isLoggedIn() || !getAccount()) { window.location.replace("index.html"); return false; }
    return true;
  }
  function initSignout() {
    var acct = getAccount() || {};
    var name = (acct.firstName || "").trim();
    document.querySelectorAll(".signout").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        confirmModal({
          title: name ? "Sign out, " + name + "?" : "Sign out?",
          message: "Are you sure you want to sign out of the ePortal? You'll need your matric number and password to sign back in.",
          confirmText: "Sign out",
          cancelText: "Stay signed in",
          onConfirm: function () { logout(); window.location.href = a.getAttribute("href") || "index.html"; }
        });
      });
    });
  }

  /* ---------------------------- confirm modal ---------------------------- */
  function confirmModal(opts) {
    var back = document.createElement("div");
    back.className = "modal-backdrop";
    back.innerHTML =
      "<div class=\"modal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"modal-title\">" +
        "<div class=\"modal-icon\" aria-hidden=\"true\"><svg class=\"icon\" viewBox=\"0 0 24 24\">" +
        "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"/><path d=\"m16 17 5-5-5-5\"/><path d=\"M21 12H9\"/></svg></div>" +
        "<h2 class=\"modal-title\" id=\"modal-title\"></h2>" +
        "<p class=\"modal-message\"></p>" +
        "<div class=\"modal-actions\">" +
          "<button class=\"button button-outline\" type=\"button\" data-cancel></button>" +
          "<button class=\"button\" type=\"button\" data-confirm></button>" +
        "</div>" +
      "</div>";
    back.querySelector(".modal-title").textContent = opts.title || "Are you sure?";
    back.querySelector(".modal-message").textContent = opts.message || "";
    var confirmBtn = back.querySelector("[data-confirm]");
    var cancelBtn = back.querySelector("[data-cancel]");
    confirmBtn.textContent = opts.confirmText || "Confirm";
    cancelBtn.textContent = opts.cancelText || "Cancel";

    function close() {
      back.classList.remove("show");
      document.removeEventListener("keydown", onKey);
      setTimeout(function () { back.remove(); }, 200);
    }
    function onKey(e) { if (e.key === "Escape") close(); }

    confirmBtn.addEventListener("click", function () { close(); if (opts.onConfirm) opts.onConfirm(); });
    cancelBtn.addEventListener("click", close);
    back.addEventListener("click", function (e) { if (e.target === back) close(); });
    document.addEventListener("keydown", onKey);

    document.body.appendChild(back);
    requestAnimationFrame(function () { back.classList.add("show"); confirmBtn.focus(); });
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
    var pct = Math.round(enrolled.length / MAX_TOTAL * 100);
    var bar = document.querySelector("[data-progress-bar]"); if (bar) bar.style.width = pct + "%";
    setText("[data-progress-units]", enrolled.length + " of " + MAX_TOTAL + " courses");
    setText("[data-progress-pct]", pct + "% complete");
    setText("[data-progress-count]", "You have registered " + enrolled.length + " of the maximum " + MAX_TOTAL + " courses (" + units + " credit units) this session.");
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
    setText("[data-registered-units]", enrolled.length + " courses");
    setText("[data-remaining-units]", Math.max(0, MAX_TOTAL - enrolled.length) + " courses");
  }

  /* ---------------------------- available courses ---------------------------- */
  function initAvailable(a) {
    var host = document.querySelector("[data-courses]");
    if (!host) return;
    var courses = buildCatalog(a), enrolled = getEnrolled();

    function sectionHTML(title, list, sem) {
      var rows = list.map(function (c) {
        var checked = enrolled.indexOf(c.code) > -1;
        var id = "en-" + c.code.replace(/\s+/g, "").toLowerCase();
        return "<tr data-row><td>" + "</td><td class=\"course-code\">" + esc(c.code) +
          "</td><td class=\"course-title\">" + esc(c.title) + "</td><td>" + c.unit +
          "</td><td" + (c.prereq === "None" ? " class=\"muted\"" : "") + ">" + esc(c.prereq) +
          "</td><td><span class=\"enroll-control\">" +
          "<input class=\"enroll-check\" id=\"" + id + "\" type=\"checkbox\" value=\"" + esc(c.code) +
          "\" data-unit=\"" + c.unit + "\" data-sem=\"" + c.sem + "\"" + (checked ? " checked" : "") + ">" +
          "<label class=\"button button-sm enroll-button\" for=\"" + id + "\">" +
          "<svg class=\"icon icon-plus\" viewBox=\"0 0 24 24\"><path d=\"M12 5v14M5 12h14\"/></svg>" +
          "<svg class=\"icon icon-check\" viewBox=\"0 0 24 24\"><path d=\"m5 12 4 4L19 6\"/></svg>" +
          "<span class=\"enroll-default\">Enroll</span><span class=\"enroll-selected\">Selected</span></label>" +
          "</span></td></tr>";
      }).join("");
      return "<section class=\"course-section\"><div class=\"section-head\"><div class=\"section-head-group\">" +
        "<h2 class=\"section-title\">" + title + "</h2><span class=\"count-badge\">" + list.length + " courses</span>" +
        "</div><span class=\"sem-counter\" data-sem-counter=\"" + sem + "\">0 / " + MAX_COURSES + " selected</span>" +
        "</div><div class=\"table-card\"><div class=\"table-scroll\"><table><thead><tr>" +
        "<th>SN</th><th>Code</th><th>Title</th><th>Unit</th><th>Pre-requisite</th><th>Action</th>" +
        "</tr></thead><tbody>" + rows + "</tbody></table></div></div></section>";
    }

    var sem1 = courses.filter(function (c) { return c.sem === 1; });
    var sem2 = courses.filter(function (c) { return c.sem === 2; });
    host.innerHTML = sectionHTML("First Semester", sem1, 1) + sectionHTML("Second Semester", sem2, 2);

    // number the SN cells per table
    host.querySelectorAll("tbody").forEach(function (tb) {
      tb.querySelectorAll("tr[data-row]").forEach(function (tr, i) {
        tr.cells[0].textContent = String(i + 1).padStart(2, "0");
      });
    });

    var checks = Array.prototype.slice.call(host.querySelectorAll(".enroll-check"));
    function countSem(sem) {
      var n = 0, units = 0;
      checks.forEach(function (c) {
        if (c.checked && parseInt(c.getAttribute("data-sem"), 10) === sem) { n++; units += parseInt(c.getAttribute("data-unit"), 10); }
      });
      return { n: n, units: units };
    }
    function recount() {
      var s1 = countSem(1), s2 = countSem(2);
      var total = s1.n + s2.n, units = s1.units + s2.units;
      setText("[data-sem-counter='1']", s1.n + " / " + MAX_COURSES + " selected");
      setText("[data-sem-counter='2']", s2.n + " / " + MAX_COURSES + " selected");
      setText("[data-units-selected]", total + " / " + (MAX_COURSES * 2));
      setText("[data-units-note]", total + " course" + (total === 1 ? "" : "s") + " \u00B7 " + units + " units");
      var bar = document.querySelector("[data-tray-bar]");
      if (bar) bar.style.width = Math.round(total / (MAX_COURSES * 2) * 100) + "%";
      // reflect full state on each semester counter
      var c1 = document.querySelector("[data-sem-counter='1']"); if (c1) c1.classList.toggle("is-full", s1.n >= MAX_COURSES);
      var c2 = document.querySelector("[data-sem-counter='2']"); if (c2) c2.classList.toggle("is-full", s2.n >= MAX_COURSES);
      return { s1: s1.n, s2: s2.n };
    }
    checks.forEach(function (c) {
      c.addEventListener("change", function () {
        if (c.checked) {
          var sem = parseInt(c.getAttribute("data-sem"), 10);
          if (countSem(sem).n > MAX_COURSES) {
            c.checked = false; recount();
            toast("You can register a maximum of " + MAX_COURSES + " courses in " + (sem === 1 ? "First" : "Second") + " Semester.", "error");
            return;
          }
        }
        recount();
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
      if (countSem(1).n > MAX_COURSES) return toast("First Semester exceeds the " + MAX_COURSES + "-course limit.", "error");
      if (countSem(2).n > MAX_COURSES) return toast("Second Semester exceeds the " + MAX_COURSES + "-course limit.", "error");
      saveEnrolled(selected);
      toast("Registration saved \u2014 " + selected.length + " course" + (selected.length === 1 ? "" : "s") + ".", "success");
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

  /* ---------------------------- profile photo ---------------------------- */
  // Render the saved photo into every [data-avatar]; keep initials as fallback.
  function applyAvatars() {
    var photo = getPhoto();
    document.querySelectorAll("[data-avatar]").forEach(function (el) {
      var existing = el.querySelector(".avatar-img");
      if (photo) {
        if (existing) { existing.style.backgroundImage = "url('" + photo + "')"; }
        else {
          var span = document.createElement("span");
          span.className = "avatar-img";
          span.style.backgroundImage = "url('" + photo + "')";
          el.appendChild(span);
        }
        el.classList.add("has-photo");
      } else if (existing) {
        existing.remove();
        el.classList.remove("has-photo");
      }
    });
  }

  // Resize an image file to a square data URL so localStorage stays small.
  function fileToAvatar(file, cb) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var size = 240;
        var canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        var ctx = canvas.getContext("2d");
        var side = Math.min(img.width, img.height);
        var sx = (img.width - side) / 2, sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        cb(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = function () { toast("That image could not be read.", "error"); };
      img.src = e.target.result;
    };
    reader.onerror = function () { toast("That file could not be read.", "error"); };
    reader.readAsDataURL(file);
  }

  function initPhotoUpload() {
    var input = document.querySelector("[data-photo-input]");
    if (!input) return;
    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      if (!file) return;
      if (!/^image\//.test(file.type)) return toast("Please choose an image file.", "error");
      if (file.size > 6 * 1024 * 1024) return toast("Image is too large (max 6 MB).", "error");
      fileToAvatar(file, function (dataUrl) {
        try { savePhoto(dataUrl); }
        catch (err) { return toast("Could not save photo (storage full).", "error"); }
        applyAvatars();
        toast("Profile photo updated.", "success");
      });
      input.value = "";
    });
    var removeBtn = document.querySelector("[data-photo-remove]");
    if (removeBtn) removeBtn.addEventListener("click", function () {
      if (!getPhoto()) return toast("No photo to remove.", "info");
      clearPhoto(); applyAvatars(); toast("Profile photo removed.", "info");
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
    applyAvatars();
    initSignout();
    initDashboard(account);
    initMyCourses(account);
    initAvailable(account);
    initProfile(account);
    initPhotoUpload();
  });
})();
