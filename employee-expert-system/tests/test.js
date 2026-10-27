
const { Builder, By, until } = require("selenium-webdriver");
const edge = require("selenium-webdriver/edge");
const fs = require("fs");
const path = require("path");

// ============================================================
// EMPLOYEE EXPERT SYSTEM - 40 SELENIUM TEST CASES
// JavaScript + Selenium WebDriver + Microsoft Edge
// ============================================================

const BASE_URL =
  process.env.EES_BASE_URL ||
  "http://127.0.0.1:5500/employee-expert-system/frontend/pages/login.html";

const MANAGER_EMAIL = process.env.MANAGER_EMAIL || "";
const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD || "";
const EMPLOYEE_EMAIL = process.env.EMPLOYEE_EMAIL || "";
const EMPLOYEE_PASSWORD = process.env.EMPLOYEE_PASSWORD || "";

const WAIT = 8000;
const SHORT_WAIT = 1000;
const ACTION_DELAY_MS = Number(process.env.ACTION_DELAY_MS || 1000);

const results = [];
let driver;
let managerLoginPassed = false;
let employeeLoginPassed = false;
let createdTaskTitle = "";

// ============================================================
// SELECTORS
// ============================================================

const S = {
  email: [
    By.id("login-email"),
    By.name("email"),
    By.css('input[type="email"]')
  ],

  password: [
    By.id("login-password"),
    By.name("password"),
    By.css('input[type="password"]')
  ],

  role: [
    By.id("login-role"),
    By.name("role")
  ],

  loginButton: [
    By.id("login-btn"),
    By.css('button[type="submit"]'),
    By.css(".login-btn")
  ],

  logout: [
    By.id("logout-btn"),
    By.id("logout"),
    By.css(".btn.logout-btn"),
    By.css(".logout-btn"),
    By.css("[data-action='logout']"),
    By.css("[aria-label*='logout' i]"),
    By.css("[title*='logout' i]"),
    By.xpath(
      "//*[self::button or self::a or @role='button' or contains(@class,'nav-item')]" +
      "[contains(translate(normalize-space(.)," +
      "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'sign out')]"
    ),
    By.xpath(
      "//*[self::button or self::a or @role='button' or contains(@class,'nav-item')]" +
      "[contains(translate(normalize-space(.)," +
      "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'logout')]"
    )
  ],

  taskTitle: [
    By.id("task-title"),
    By.name("title")
  ],

  taskDescription: [
    By.id("task-desc"),
    By.name("description"),
    By.css("textarea")
  ],

  deadline: [
    By.id("task-deadline"),
    By.name("deadline")
  ],

  priority: [
    By.id("task-priority"),
    By.name("priority")
  ],

  tags: [
    By.id("task-tags"),
    By.name("tags")
  ],

  saveTask: [
    By.id("save-task-btn"),
    By.id("create-task-btn"),
    By.id("submit-task-btn"),
    By.css("#task-form button[type='submit']"),
    By.css("button[type='submit']"),
    By.xpath(
      "//button[contains(translate(normalize-space(.)," +
      "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'save task')]"
    ),
    By.xpath(
      "//button[contains(translate(normalize-space(.)," +
      "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'create task')]"
    ),
    By.xpath(
      "//button[contains(translate(normalize-space(.)," +
      "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'assign task')]"
    )
  ],

  progress: [
    By.id("update-progress")
  ],

  status: [
    By.id("update-status")
  ],

  saveUpdate: [
    By.id("update-save-btn")
  ]
};

// ============================================================
// GENERAL HELPERS
// ============================================================

function log(message) {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

function errText(error) {
  return error && error.message ? error.message : String(error);
}

function pause(ms = ACTION_DELAY_MS) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function exists(selectors) {
  for (const selector of selectors) {
    try {
      const elements = await driver.findElements(selector);

      for (const element of elements) {
        if (await element.isDisplayed()) return true;
      }
    } catch (_) {
      // Try the next selector.
    }
  }

  return false;
}

async function firstVisible(selectors, timeout = WAIT) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    for (const selector of selectors) {
      try {
        const elements = await driver.findElements(selector);

        for (const element of elements) {
          if (await element.isDisplayed() && await element.isEnabled()) {
            return element;
          }
        }
      } catch (_) {
        // Try the next selector.
      }
    }

    await pause(250);
  }

  throw new Error(
    "Visible element not found: " +
    selectors.map(String).join(" | ")
  );
}

async function clickFirst(selectors, timeout = WAIT) {
  const element = await firstVisible(selectors, timeout);

  log(`ACTION: Clicking ${selectors.map(String).join(" | ")}`);

  await element.click();

  log("ACTION COMPLETE: Click successful");
  await pause();

  return element;
}

async function fillFirst(selectors, value, timeout = WAIT) {
  const element = await firstVisible(selectors, timeout);

  log(`ACTION: Entering text into ${selectors.map(String).join(" | ")}`);

  await element.clear();
  await element.sendKeys(value);

  log("ACTION COMPLETE: Text entered");
  await pause();

  return element;
}

async function textOf(selector = By.css("body")) {
  try {
    return await (await driver.findElement(selector)).getText();
  } catch (_) {
    return "";
  }
}

async function openLogin() {
  log(`ACTION: Opening login page: ${BASE_URL}`);

  await driver.get(BASE_URL);
  await driver.wait(until.elementLocated(By.css("body")), WAIT);

  try {
    await driver.executeScript(`
      window.localStorage.clear();
      window.sessionStorage.clear();
    `);
  } catch (error) {
    log(`Storage clearing warning: ${errText(error)}`);
  }

  await driver.get(BASE_URL);
  await driver.wait(until.elementLocated(By.css("body")), WAIT);
  await pause();

  log(`Page title: ${await driver.getTitle()}`);
  log(`Current URL: ${await driver.getCurrentUrl()}`);

  if (!(await exists(S.email))) {
    throw new Error(
      "Login email field is not visible. Check the login page URL and authentication redirect."
    );
  }
}


/* ============================================================
   LOGIN AND NAVIGATION FUNCTIONS
   ============================================================ */

async function selectRole(roleName) {
  const roleSelectors = [
    ...S.role,
    By.css(`input[name="role"][value="${roleName}"]`),
    By.css(`input[value="${roleName}"]`)
  ];

  for (const selector of roleSelectors) {
    try {
      const elements = await driver.findElements(selector);

      for (const element of elements) {
        if (!(await element.isDisplayed())) continue;

        const tagName = (await element.getTagName()).toLowerCase();
        const type = (await element.getAttribute("type") || "").toLowerCase();

        if (tagName === "select") {
          await element.sendKeys(roleName);
          return true;
        }

        if (type === "radio" || type === "checkbox") {
          await element.click();
          return true;
        }
      }
    } catch (_) {
      // Try another role selector.
    }
  }

  // Support custom role buttons or labels.
  const roleText = roleName.toLowerCase();

  const customRoleSelectors = [
    By.xpath(
      `//*[self::button or self::label or @role='button']` +
      `[contains(translate(normalize-space(.),` +
      `'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),` +
      `'${roleText}')]`
    )
  ];

  try {
    await clickFirst(customRoleSelectors, 2000);
    return true;
  } catch (_) {
    log(`Role control not found for: ${roleName}`);
    return false;
  }
}

async function loginAs(role, email, password) {
  if (!email || !password) {
    throw new Error(
      `${role} credentials are missing. Configure the appropriate environment variables.`
    );
  }

  await openLogin();

  await fillFirst(S.email, email);
  await fillFirst(S.password, password);

  await selectRole(role);

  await clickFirst(S.loginButton);

  await pause(1500);

  const currentUrl = (await driver.getCurrentUrl()).toLowerCase();

  log(`${role} login destination: ${currentUrl}`);

  if (currentUrl.includes("login.html")) {
    const pageText = (await textOf()).toLowerCase();

    if (
      pageText.includes("invalid credentials") ||
      pageText.includes("incorrect password") ||
      pageText.includes("login failed")
    ) {
      throw new Error(`${role} login failed. Check the credentials.`);
    }

    throw new Error(
      `${role} login did not leave the login page. Check the selected role, credentials, and API response.`
    );
  }

  log(`PROCESS COMPLETE: ${role} login verified`);
  return true;
}

async function loginManager() {
  await loginAs("manager", MANAGER_EMAIL, MANAGER_PASSWORD);
  managerLoginPassed = true;
}

async function loginEmployee() {
  await loginAs(
    "employee",
    EMPLOYEE_EMAIL,
    EMPLOYEE_PASSWORD
  );

  employeeLoginPassed = true;
}

async function logoutCurrentUser() {
  log("PROCESS: Logging out current user");

  await clickFirst(S.logout, WAIT);
  await pause(1000);

  const currentUrl = (await driver.getCurrentUrl()).toLowerCase();

  if (!currentUrl.includes("login")) {
    // Some applications log out without navigating automatically.
    await driver.get(BASE_URL);
  }

  await driver.wait(until.elementLocated(By.css("body")), WAIT);

  log(`Logout destination: ${await driver.getCurrentUrl()}`);
}

async function openManagerTaskForm() {
  await clickFirst([
    By.id("assign-task-btn"),
    By.id("new-task-btn"),
    By.id("tasks-nav"),
    By.css("[data-action='assign-task']"),
    By.xpath(
      "//button[contains(translate(normalize-space(.)," +
      "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'assign task')]"
    ),
    By.xpath(
      "//button[contains(translate(normalize-space(.)," +
      "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'new task')]"
    ),
    By.xpath(
      "//a[contains(translate(normalize-space(.)," +
      "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'assign task')]"
    ),
    By.xpath(
      "//a[contains(translate(normalize-space(.)," +
      "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'tasks')]"
    )
  ]);
}

async function openEmployeeTasks() {
  await clickFirst([
    By.id("tasks-nav"),
    By.css("[onclick*=\"showSection('tasks')\"]"),
    By.xpath(
      "//*[self::button or self::a or contains(@class,'nav-item')]" +
      "[contains(translate(normalize-space(.)," +
      "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'my tasks')]"
    ),
    By.xpath(
      "//*[self::button or self::a]" +
      "[contains(translate(normalize-space(.)," +
      "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'tasks')]"
    )
  ]);
}

async function openUpdateForm() {
  if (await exists(S.progress)) return;

  await clickFirst([
    By.id("update-task-btn"),
    By.css(".update-task-btn"),
    By.xpath(
      "//button[contains(translate(normalize-space(.)," +
      "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'update progress')]"
    ),
    By.xpath(
      "//button[contains(translate(normalize-space(.)," +
      "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'update')]"
    ),
    By.xpath(
      "//*[contains(@class,'task-card')]" +
      "//*[self::button or self::a]" +
      "[contains(translate(normalize-space(.)," +
      "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'update')]"
    ),
    By.xpath("//*[contains(@onclick,'openUpdateModal')]")
  ]);

  await firstVisible(S.progress, WAIT);
}


/* ============================================================
   TEST RUNNER
   ============================================================ */

async function runTest(id, description, testFunction) {
  console.log("\n==============================================");
  console.log(`${id}: ${description}`);
  console.log("==============================================");

  log(`TEST STARTED: ${id} — ${description}`);

  const startTime = Date.now();
  let status = "PASS";
  let errorMessage = "";

  try {
    await testFunction();

    log(`PASS ${id}`);
  } catch (error) {
    status = "FAIL";
    errorMessage = errText(error);

    log(`FAIL ${id}: ${errorMessage}`);

    // Capture a screenshot only while WebDriver is alive.
    try {
      const screenshot = await driver.takeScreenshot();

      const screenshotDirectory = path.join(__dirname, "screenshots");

      fs.mkdirSync(screenshotDirectory, { recursive: true });

      fs.writeFileSync(
        path.join(screenshotDirectory, `${id}.png`),
        screenshot,
        "base64"
      );
    } catch (screenshotError) {
      log(`Screenshot unavailable: ${errText(screenshotError)}`);
    }
  }

  results.push({
    id,
    description,
    status,
    error: errorMessage,
    durationMs: Date.now() - startTime
  });

  log(`TEST FINISHED: ${id}`);
  await pause(SHORT_WAIT);
}

async function runSkippedTest(id, description, reason) {
  console.log("\n==============================================");
  console.log(`${id}: ${description}`);
  console.log("==============================================");

  log(`SKIP ${id}: ${reason}`);

  results.push({
    id,
    description,
    status: "SKIP",
    error: reason,
    durationMs: 0
  });
}

async function assertVisible(selectors, description) {
  if (!(await exists(selectors))) {
    throw new Error(`${description} is not visible`);
  }
}

async function assertEnabled(selectors, description) {
  const element = await firstVisible(selectors);

  if (!(await element.isEnabled())) {
    throw new Error(`${description} is disabled`);
  }
}

async function assertLoginPage() {
  await openLogin();
  await assertVisible(S.email, "Login email field");
  await assertVisible(S.password, "Login password field");
  await assertVisible(S.loginButton, "Login button");
}

/* ============================================================
   TC-001 TO TC-010: LOGIN PAGE
   ============================================================ */

async function test001() {
  await openLogin();

  const url = (await driver.getCurrentUrl()).toLowerCase();

  if (!url.includes("login")) {
    throw new Error(`Unexpected login page URL: ${url}`);
  }
}

async function test002() {
  await openLogin();

  const title = await driver.getTitle();

  if (!title || !title.toLowerCase().includes("login")) {
    throw new Error(`Unexpected page title: ${title}`);
  }
}

async function test003() {
  await openLogin();
  await assertVisible(S.email, "Email field");
}

async function test004() {
  await openLogin();
  await assertVisible(S.password, "Password field");
}

async function test005() {
  await openLogin();
  await assertVisible(S.loginButton, "Login button");
}

async function test006() {
  await openLogin();

  const email = await firstVisible(S.email);

  await email.clear();
  await email.sendKeys("test@example.com");

  const value = await email.getAttribute("value");

  if (value !== "test@example.com") {
    throw new Error("Email field did not accept text");
  }
}

async function test007() {
  await openLogin();

  const password = await firstVisible(S.password);

  const type = (await password.getAttribute("type") || "").toLowerCase();

  if (type !== "password") {
    throw new Error(`Password input type is '${type}', expected 'password'`);
  }
}

async function test008() {
  await openLogin();

  const email = await firstVisible(S.email);

  const type = (await email.getAttribute("type") || "").toLowerCase();

  if (
    type !== "email" &&
    !(await email.getAttribute("name"))?.toLowerCase().includes("email") &&
    !(await email.getAttribute("id"))?.toLowerCase().includes("email")
  ) {
    throw new Error("Email field lacks an email type, name, or ID");
  }
}

async function test009() {
  await openLogin();

  const found = await exists([
    ...S.role,
    By.css("input[name='role']"),
    By.css("select[name='role']"),
    By.css("input[type='radio']"),
    By.css("[data-role]")
  ]);

  if (!found) {
    throw new Error("No role selector or role control was found");
  }
}

async function test010() {
  await openLogin();

  const body = await driver.findElements(By.css("body"));

  if (body.length === 0) {
    throw new Error("Page body was not found");
  }
}



/* ============================================================
   TC-011 TO TC-020
   ============================================================ */

// TC-011: Email field can be cleared
async function test011() {
  await openLogin();

  const email = await firstVisible(S.email);

  await email.sendKeys("test@example.com");
  await email.clear();

  const value = await email.getAttribute("value");

  if (value !== "") {
    throw new Error("Email field could not be cleared");
  }
}

// TC-012: Password field can be cleared
async function test012() {
  await openLogin();

  const password = await firstVisible(S.password);

  await password.sendKeys("TemporaryPassword123!");
  await password.clear();

  const value = await password.getAttribute("value");

  if (value !== "") {
    throw new Error("Password field could not be cleared");
  }
}

// TC-013: Empty login form is rejected
async function test013() {
  await openLogin();

  const email = await firstVisible(S.email);
  const password = await firstVisible(S.password);

  await email.clear();
  await password.clear();

  await clickFirst(S.loginButton);

  const emailValue = await email.getAttribute("value");
  const passwordValue = await password.getAttribute("value");

  if (emailValue || passwordValue) {
    throw new Error("Login fields unexpectedly contain values");
  }

  const stillOnLogin =
    (await driver.getCurrentUrl()).toLowerCase().includes("login");

  if (!stillOnLogin) {
    throw new Error("Empty login unexpectedly navigated away");
  }
}

// TC-014: Invalid email is rejected by browser validation
async function test014() {
  await openLogin();

  const email = await firstVisible(S.email);
  const password = await firstVisible(S.password);

  await email.clear();
  await email.sendKeys("invalid-email");

  await password.clear();
  await password.sendKeys("TemporaryPassword123!");

  const valid = await driver.executeScript(
    "return arguments[0].checkValidity();",
    email
  );

  if (valid) {
    throw new Error(
      "Browser accepted an invalid email; check input type and validation"
    );
  }
}

// TC-015: Invalid login does not authenticate
async function test015() {
  await openLogin();

  await fillFirst(S.email, "invalid-user-987654@example.com");
  await fillFirst(S.password, "DefinitelyWrongPassword123!");

  await selectRole("manager");
  await clickFirst(S.loginButton);

  await pause(1500);

  const currentUrl = (await driver.getCurrentUrl()).toLowerCase();

  if (!currentUrl.includes("login")) {
    throw new Error(
      "Invalid credentials navigated away from the login page"
    );
  }
}

// TC-016: Manager login
async function test016() {
  await loginManager();
}

// TC-017: Manager dashboard is accessible
async function test017() {
  if (!managerLoginPassed) {
    throw new Error("Manager login prerequisite failed");
  }

  const url = (await driver.getCurrentUrl()).toLowerCase();

  if (url.includes("login")) {
    throw new Error("Manager dashboard is not accessible");
  }

  await assertVisible(
    S.logout,
    "Manager dashboard logout control"
  );
}

// TC-018: Manager logout control is visible
async function test018() {
  if (!managerLoginPassed) {
    throw new Error("Manager login prerequisite failed");
  }

  await assertVisible(
    S.logout,
    "Manager logout control"
  );
}

// TC-019: Manager can open task form
async function test019() {
  if (!managerLoginPassed) {
    throw new Error("Manager login prerequisite failed");
  }

  await openManagerTaskForm();

  await firstVisible(S.taskTitle, WAIT);
}

// TC-020: Task title field is visible
async function test020() {
  await assertVisible(S.taskTitle, "Task title field");
}


/* ============================================================
   TC-021 TO TC-030
   ============================================================ */

// TC-021: Task description field is visible
async function test021() {
  await assertVisible(
    S.taskDescription,
    "Task description field"
  );
}

// TC-022: Task deadline field exists
async function test022() {
  await assertVisible(
    S.deadline,
    "Task deadline field"
  );
}

// TC-023: Task priority field exists
async function test023() {
  await assertVisible(
    S.priority,
    "Task priority field"
  );
}

// TC-024: Task tags field exists
async function test024() {
  await assertVisible(
    S.tags,
    "Task tags field"
  );
}

// TC-025: Manager can create a task
async function test025() {
  if (!managerLoginPassed) {
    throw new Error("Manager login prerequisite failed");
  }

  // Open the form if it is not already open.
  if (!(await exists(S.taskTitle))) {
    await openManagerTaskForm();
  }

  const titleElement = await firstVisible(S.taskTitle);

  createdTaskTitle =
    "Selenium Test Task " + Date.now();

  await titleElement.clear();
  await titleElement.sendKeys(createdTaskTitle);

  const description = await firstVisible(S.taskDescription);

  await description.clear();
  await description.sendKeys(
    "Automated test task created by Selenium."
  );

  // Fill the deadline only if the field is available.
  if (await exists(S.deadline)) {
    const deadline = await firstVisible(S.deadline);

    const type = (
      await deadline.getAttribute("type") || ""
    ).toLowerCase();

    if (type === "date") {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const formattedDate = [
        futureDate.getFullYear(),
        String(futureDate.getMonth() + 1).padStart(2, "0"),
        String(futureDate.getDate()).padStart(2, "0")
      ].join("-");

      await deadline.clear();
      await deadline.sendKeys(formattedDate);
    }
  }

  // Select medium priority when that option exists.
  if (await exists(S.priority)) {
    const priority = await firstVisible(S.priority);

    const tag = (
      await priority.getTagName()
    ).toLowerCase();

    if (tag === "select") {
      const options = await priority.findElements(
        By.css("option")
      );

      for (const option of options) {
        const text = (
          await option.getText()
        ).toLowerCase();

        const value = (
          await option.getAttribute("value") || ""
        ).toLowerCase();

        if (
          text.includes("medium") ||
          value === "medium"
        ) {
          await option.click();
          break;
        }
      }
    }
  }

  // Add tags if the field is available.
  if (await exists(S.tags)) {
    const tags = await firstVisible(S.tags);

    await tags.clear();
    await tags.sendKeys("selenium, automated-test");
  }

  // Select an employee if the task form provides a selector.
  const employeeSelectors = [
    By.id("task-employee"),
    By.id("task-assignee"),
    By.id("assignedTo"),
    By.name("employee"),
    By.name("assignedTo"),
    By.css("select[name*='employee' i]")
  ];

  if (await exists(employeeSelectors)) {
    const employeeSelect = await firstVisible(
      employeeSelectors
    );

    const tag = (
      await employeeSelect.getTagName()
    ).toLowerCase();

    if (tag === "select") {
      const options = await employeeSelect.findElements(
        By.css("option")
      );

      for (const option of options) {
        const value = await option.getAttribute("value");
        const text = (
          await option.getText()
        ).trim().toLowerCase();

        if (value && text && !text.includes("select")) {
          await option.click();
          break;
        }
      }
    }
  }

  // Try the supported save selectors.
  await clickFirst(S.saveTask, WAIT);

  await pause(1500);

  log(`Task creation submitted: ${createdTaskTitle}`);
}

// TC-026: Manager logout and employee login

async function test026() {
  if (!managerLoginPassed) {
    throw new Error("Manager login prerequisite failed");
  }

  log("PROCESS: Logging out manager");

  // Click the manager's logout button.
  await clickFirst(S.logout, WAIT);

  // Wait for logout navigation or redirect.
  await pause(1500);

  // Navigate explicitly to the login page if needed.
  const currentUrl = (await driver.getCurrentUrl()).toLowerCase();

  if (!currentUrl.includes("login")) {
    await driver.get(BASE_URL);
  }

  await driver.wait(
    until.elementLocated(By.css("body")),
    WAIT
  );

  // Verify that the login form is available.
  await firstVisible(S.email, WAIT);
  await firstVisible(S.password, WAIT);

  log("PROCESS: Manager logged out; login page is visible");

  managerLoginPassed = false;

  // Log in with the employee's credentials.
  await loginEmployee();

  employeeLoginPassed = true;

  log("PROCESS COMPLETE: Employee login verified");
}


// TC-027: Employee dashboard is accessible
async function test027() {
  if (!employeeLoginPassed) {
    throw new Error("Employee login prerequisite failed");
  }

  const url = (await driver.getCurrentUrl()).toLowerCase();

  if (url.includes("login")) {
    throw new Error("Employee dashboard is not accessible");
  }
}

// TC-028: Employee task list can be opened
async function test028() {
  if (!employeeLoginPassed) {
    throw new Error("Employee login prerequisite failed");
  }

  await openEmployeeTasks();
}

// TC-029: Employee progress control exists
async function test029() {
  if (!employeeLoginPassed) {
    throw new Error("Employee login prerequisite failed");
  }

  await openEmployeeTasks();
  await openUpdateForm();

  await assertVisible(
    S.progress,
    "Employee progress control"
  );
}

// TC-030: Employee status control exists
async function test030() {
  if (!employeeLoginPassed) {
    throw new Error("Employee login prerequisite failed");
  }

  await assertVisible(
    S.status,
    "Employee status control"
  );
}


/* ============================================================
   TC-031 TO TC-040
   ============================================================ */

// TC-031: Progress control has a usable input type
async function test031() {
  await assertVisible(S.progress, "Progress control");

  const element = await firstVisible(S.progress);
  const tag = (await element.getTagName()).toLowerCase();
  const type = (await element.getAttribute("type") || "").toLowerCase();

  if (
    !["input", "select", "textarea"].includes(tag)
  ) {
    throw new Error(`Unsupported progress control: ${tag}`);
  }

  if (
    tag === "input" &&
    !["number", "range", "text"].includes(type)
  ) {
    throw new Error(`Unexpected progress input type: ${type}`);
  }
}

// TC-032: Status control is selectable or editable
async function test032() {
  await assertVisible(S.status, "Status control");

  const element = await firstVisible(S.status);
  const tag = (await element.getTagName()).toLowerCase();

  if (!["input", "select", "textarea"].includes(tag)) {
    throw new Error(`Unsupported status control: ${tag}`);
  }

  if (!(await element.isEnabled())) {
    throw new Error("Status control is disabled");
  }
}

// TC-033: Employee can submit progress/status update
async function test033() {
  await assertVisible(S.progress, "Progress control");
  await assertVisible(S.status, "Status control");

  const progress = await firstVisible(S.progress);
  const status = await firstVisible(S.status);

  const progressTag = (await progress.getTagName()).toLowerCase();
  const progressType = (
    await progress.getAttribute("type") || ""
  ).toLowerCase();

  if (progressTag === "select") {
    const options = await progress.findElements(By.css("option"));

    for (const option of options) {
      const value = await option.getAttribute("value");

      if (value) {
        await option.click();
        break;
      }
    }
  } else if (progressType === "range" || progressType === "number") {
    await progress.clear();
    await progress.sendKeys("50");
  } else {
    await progress.clear();
    await progress.sendKeys("50");
  }

  const statusTag = (await status.getTagName()).toLowerCase();

  if (statusTag === "select") {
    const options = await status.findElements(By.css("option"));

    for (const option of options) {
      const value = (
        await option.getAttribute("value") || ""
      ).toLowerCase();

      const text = (await option.getText()).toLowerCase();

      if (
        value === "in progress" ||
        value === "in-progress" ||
        value === "inprogress" ||
        text.includes("in progress")
      ) {
        await option.click();
        break;
      }
    }
  }

  await clickFirst(S.saveUpdate, WAIT);
}

// TC-034: Employee logout control is available
async function test034() {
  await assertVisible(S.logout, "Employee logout control");
}

// TC-035: Employee logout action
async function test035() {
  await logoutCurrentUser();
  employeeLoginPassed = false;

  const url = (await driver.getCurrentUrl()).toLowerCase();

  if (!url.includes("login")) {
    await openLogin();
  }

  await assertVisible(S.email, "Login email field");
}

// TC-036: Frontend remains reachable after logout
async function test036() {
  await openLogin();
  await assertVisible(S.email, "Login email field");
}

// TC-037: Login page can be refreshed
async function test037() {
  await openLogin();

  await driver.navigate().refresh();
  await driver.wait(until.elementLocated(By.css("body")), WAIT);

  await assertVisible(S.email, "Login email field");
}

// TC-038: Login page has no browser-level navigation error
async function test038() {
  await openLogin();

  const title = (await driver.getTitle()).toLowerCase();
  const body = (await textOf()).toLowerCase();

  if (
    title.includes("site can't be reached") ||
    body.includes("err_connection_refused") ||
    body.includes("this site can't be reached")
  ) {
    throw new Error("Browser displays a navigation error");
  }
}

// TC-039: Main login controls are enabled
async function test039() {
  await openLogin();

  await assertEnabled(S.email, "Email field");
  await assertEnabled(S.password, "Password field");
  await assertEnabled(S.loginButton, "Login button");
}

// TC-040: Test report directory is writable
async function test040() {
  const reportDirectory = __dirname;
  const testFile = path.join(
    reportDirectory,
    "write-test.tmp"
  );

  fs.writeFileSync(testFile, "test");
  fs.unlinkSync(testFile);

  if (fs.existsSync(testFile)) {
    throw new Error("Temporary test file was not removed");
  }
}

/* ============================================================
   FINAL TEST EXECUTION AND REPORT
   ============================================================ */

async function writeReports() {
  const reportDirectory = __dirname;

  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  const skipped = results.filter(r => r.status === "SKIP").length;

  const report = {
    project: "Employee Expert System",
    generatedAt: new Date().toISOString(),
    total: results.length,
    passed,
    failed,
    skipped,
    results
  };

  fs.writeFileSync(
    path.join(reportDirectory, "test-report.json"),
    JSON.stringify(report, null, 2)
  );

  const csvRows = [
    ["ID", "Description", "Status", "Error", "DurationMs"],
    ...results.map(r => [
      r.id,
      r.description,
      r.status,
      r.error,
      r.durationMs
    ])
  ];

  const csv = csvRows
    .map(row =>
      row.map(value =>
        `"${String(value ?? "").replace(/"/g, '""')}"`
      ).join(",")
    )
    .join("\n");

  fs.writeFileSync(
    path.join(reportDirectory, "test-report.csv"),
    csv
  );

  console.log("\n==============================================");
  console.log("EMPLOYEE EXPERT SYSTEM - FINAL TEST REPORT");
  console.log("==============================================");
  console.log(`Total:   ${results.length}`);
  console.log(`Passed:  ${passed}`);
  console.log(`Failed:  ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(
    `JSON: ${path.join(reportDirectory, "test-report.json")}`
  );
  console.log(
    `CSV:  ${path.join(reportDirectory, "test-report.csv")}`
  );
}

/* ============================================================
   MAIN
   ============================================================ */

async function main() {
  const options = new edge.Options();

  // Keep the browser visible during debugging.
  options.addArguments("--start-maximized");

  driver = await new Builder()
    .forBrowser("MicrosoftEdge")
    .setEdgeOptions(options)
    .build();

  try {
    await runTest("TC-001", "Login page opens", test001);
    await runTest("TC-002", "Login page title is present", test002);
    await runTest("TC-003", "Email field is visible", test003);
    await runTest("TC-004", "Password field is visible", test004);
    await runTest("TC-005", "Login button is visible", test005);
    await runTest("TC-006", "Email field accepts text", test006);
    await runTest("TC-007", "Password field masks input", test007);
    await runTest("TC-008", "Email input type is correct", test008);
    await runTest("TC-009", "Role control exists", test009);
    await runTest("TC-010", "Login page contains a body", test010);
    await runTest("TC-011", "Email field can be cleared", test011);
    await runTest("TC-012", "Password field can be cleared", test012);
    await runTest("TC-013", "Empty login form is rejected", test013);
    await runTest("TC-014", "Invalid email is rejected", test014);
    await runTest("TC-015", "Invalid login does not authenticate", test015);

    await runTest("TC-016", "Manager login", test016);
    await runTest("TC-017", "Manager dashboard is accessible", test017);
    await runTest("TC-018", "Manager logout control is visible", test018);
    await runTest("TC-019", "Manager can open task form", test019);
    await runTest("TC-020", "Task title field is visible", test020);
    await runTest("TC-021", "Task description field is visible", test021);
    await runTest("TC-022", "Task deadline field exists", test022);
    await runTest("TC-023", "Task priority field exists", test023);
    await runTest("TC-024", "Task tags field exists", test024);
    await runTest("TC-025", "Manager can create a task", test025);
    await runTest("TC-026", "Manager logout and employee login", test026);

    if (employeeLoginPassed) {
      await runTest("TC-027", "Employee dashboard is accessible", test027);
      await runTest("TC-028", "Employee task list can be opened", test028);
      await runTest("TC-029", "Employee progress control exists", test029);
      await runTest("TC-030", "Employee status control exists", test030);
      await runTest("TC-031", "Progress input type is usable", test031);
      await runTest("TC-032", "Status control is editable", test032);
      await runTest("TC-033", "Employee can submit progress update", test033);
      await runTest("TC-034", "Employee logout control is available", test034);
      await runTest("TC-035", "Employee logout action", test035);
    } else {
      for (const [id, description] of [
        ["TC-027", "Employee dashboard is accessible"],
        ["TC-028", "Employee task list can be opened"],
        ["TC-029", "Employee progress control exists"],
        ["TC-030", "Employee status control exists"],
        ["TC-031", "Progress input type is usable"],
        ["TC-032", "Status control is editable"],
        ["TC-033", "Employee can submit progress update"],
        ["TC-034", "Employee logout control is available"],
        ["TC-035", "Employee logout action"]
      ]) {
        await runSkippedTest(
          id,
          description,
          "Employee login prerequisite failed"
        );
      }
    }

    await runTest("TC-036", "Frontend reachable after logout", test036);
    await runTest("TC-037", "Login page can be refreshed", test037);
    await runTest("TC-038", "No browser-level navigation error", test038);
    await runTest("TC-039", "Main login controls are enabled", test039);
    await runTest("TC-040", "Test report directory is writable", test040);
  } finally {
    try {
      await writeReports();
    } catch (reportError) {
      log(`Report writing failed: ${errText(reportError)}`);
    }

    if (driver) {
      try {
        await driver.quit();
      } catch (quitError) {
        log(`Browser cleanup warning: ${errText(quitError)}`);
      }
    }
  }
}

main().catch(error => {
  console.error("Fatal test runner error:", errText(error));
  process.exitCode = 1;
});
