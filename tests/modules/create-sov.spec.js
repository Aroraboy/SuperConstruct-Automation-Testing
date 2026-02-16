/**
 * GC Creates an SOV (Schedule of Values)
 *
 * Flow (from codegen v2):
 *   1. Navigate to app → company → project
 *   2. Click SOV link (5th nav link, index 4)
 *   3. Create New SOV → OK Got it
 *   4. Add Division (first) → select "0 - Costs & Fees"
 *   5. For each of 3 sub-divisions:
 *      - Expand (click .w-5 chevron)
 *      - + Add Task (nth based on index)
 *      - Fill task name (serialized: "Foundation Work 62")
 *      - Save → Check checkbox (name: "- TaskName")
 *   6. Click Select
 *   7. Fill amounts for each task row
 *   8. Set start/end dates (mm/dd/yyyy + Required * textboxes)
 *   9. Submit → select approver (.select-input-container) → Express Payapp → Submit
 *
 * Task names are serialized with run number to avoid duplicates.
 *
 * Prerequisites: GC login state (.auth/gc-login-state.json)
 * Usage: npm run test:sov-create
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SOV_DATA_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-sov-data.json');
const SOV_COUNTER_PATH = path.join(__dirname, '..', '..', '.auth', 'sov-counter.json');

function getAndIncrementSOVRun() {
  let sovRun = 63; // starting value
  if (fs.existsSync(SOV_COUNTER_PATH)) {
    sovRun = JSON.parse(fs.readFileSync(SOV_COUNTER_PATH, 'utf-8')).nextRun || 63;
  }
  // Save incremented value for next run
  const dir = path.dirname(SOV_COUNTER_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SOV_COUNTER_PATH, JSON.stringify({ nextRun: sovRun + 1, lastUsed: sovRun, updatedAt: new Date().toISOString() }, null, 2));
  return sovRun;
}

test.describe.serial('GC Creates SOV', () => {

  test('GC creates a new SOV and submits for approval', async ({ page }) => {
    test.setTimeout(240000); // 4 minutes

    const runNumber = getAndIncrementSOVRun();
    console.log(`\n[SOV RUN] Using SOV run number: ${runNumber}`);

    // Serialized task definitions — unique per run
    const SOV_TASKS = [
      { name: `Foundation Work ${runNumber}`, amount: '45' },
      { name: `Structural Framing ${runNumber}`, amount: '56' },
      { name: `Electrical Wiring ${runNumber}`, amount: '89' },
    ];

    // ---- STEP 1: Navigate to app ----
    console.log('\n[STEP 1] Navigating to app...');
    await page.goto('https://beta.superconstruct.io/app', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);
    console.log(`   URL: ${page.url()}`);

    // ---- STEP 2: Navigate to company → project ----
    console.log('\n[STEP 2] Navigating to company → project...');
    const companyImg = page.getByRole('img', { name: /GC Construction/i });
    await companyImg.waitFor({ state: 'visible', timeout: 15000 });
    await companyImg.click();
    console.log('   [DONE] Company clicked');
    await page.waitForTimeout(3000);

    const projectImg = page.getByRole('img', { name: /TestProject/i });
    await projectImg.waitFor({ state: 'visible', timeout: 15000 });
    await projectImg.click();
    console.log('   [DONE] Project clicked');
    await page.waitForTimeout(3000);
    console.log(`   URL: ${page.url()}`);

    // ---- STEP 3: Navigate to SOV page (5th link, index 4) ----
    console.log('\n[STEP 3] Navigating to SOV page...');
    await page.getByRole('link').nth(4).click();
    console.log('   [DONE] SOV link clicked');
    await page.waitForTimeout(3000);
    console.log(`   URL: ${page.url()}`);

    // ---- STEP 4: Create New SOV ----
    console.log('\n[STEP 4] Creating new SOV...');
    await page.getByRole('button', { name: 'Create New SOV' }).click();
    console.log('   [DONE] Create New SOV clicked');
    await page.waitForTimeout(2000);

    // Dismiss intro dialog
    await page.getByRole('button', { name: 'OK, Got it!' }).click();
    console.log('   [DONE] OK Got it dismissed');
    await page.waitForTimeout(2000);

    // ---- STEP 5: Add Division (0 - Costs & Fees) ----
    console.log('\n[STEP 5] Adding division...');
    await page.getByRole('button', { name: 'Add Division' }).first().click();
    console.log('   [DONE] Add Division clicked');
    await page.waitForTimeout(2000);

    await page.locator('div').filter({ hasText: /^0 - Costs & Fees$/ }).click();
    console.log('   [DONE] 0 - Costs & Fees selected');
    await page.waitForTimeout(2000);

    // ---- STEP 6: Expand sub-divisions and add tasks ----
    console.log('\n[STEP 6] Adding tasks to sub-divisions...');

    for (let i = 0; i < SOV_TASKS.length; i++) {
      const task = SOV_TASKS[i];
      console.log(`\n   [TASK ${i + 1}] ${task.name}`);

      // Expand the sub-division chevron
      if (i === 0) {
        await page.locator('.flex > .w-5').first().click();
      } else {
        await page.locator(`div:nth-child(${i + 1}) > .flex.flex-col > .flex > .w-5`).click();
      }
      console.log('   [DONE] Sub-division expanded');
      await page.waitForTimeout(1000);

      // Click + Add Task
      await page.getByRole('button', { name: '+ Add Task' }).nth(i).click();
      console.log('   [DONE] + Add Task clicked');
      await page.waitForTimeout(1000);

      // Fill task name
      await page.getByRole('textbox', { name: 'Create Task' }).click();
      await page.getByRole('textbox', { name: 'Create Task' }).fill(task.name);
      console.log(`   [DONE] Task name: ${task.name}`);

      // Save
      await page.getByRole('button', { name: 'Save' }).click();
      console.log('   [DONE] Task saved');
      await page.waitForTimeout(1500);

      // Check the checkbox — codegen shows name as "- TaskName"
      await page.getByRole('checkbox', { name: `- ${task.name}` }).check();
      console.log(`   [DONE] Checkbox checked: - ${task.name}`);
      await page.waitForTimeout(500);
    }

    // ---- STEP 7: Click Select to confirm ----
    console.log('\n[STEP 7] Confirming task selection...');
    await page.getByRole('button', { name: 'Select' }).click();
    console.log('   [DONE] Select clicked');
    await page.waitForTimeout(3000);

    // ---- STEP 8: Fill amounts for each task ----
    console.log('\n[STEP 8] Filling task amounts...');

    for (const task of SOV_TASKS) {
      const row = page.getByRole('row', { name: new RegExp(task.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });
      await row.getByPlaceholder('0.00').click();
      await row.getByPlaceholder('0.00').fill(task.amount);
      console.log(`   [DONE] ${task.name}: $${task.amount}`);
      await page.waitForTimeout(500);
    }

    // ---- STEP 9: Set start/end dates for each task ----
    console.log('\n[STEP 9] Setting dates for each task...');

    // Date pattern from codegen:
    // Start date: getByRole('textbox', { name: 'mm/dd/yyyy' }).first() → click day button
    // End date: getByRole('textbox', { name: 'Required *' }).nth(1/3/5) → click day button
    const today = new Date();
    const startDay = today.getDate().toString();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 7);
    const endDay = endDate.getDate().toString();

    for (let i = 0; i < SOV_TASKS.length; i++) {
      // Start date
      await page.getByRole('textbox', { name: 'mm/dd/yyyy' }).first().click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: startDay, exact: true }).click();
      console.log(`   [DONE] ${SOV_TASKS[i].name} start date: ${startDay}`);
      await page.waitForTimeout(500);

      // End date — pattern: nth(1), nth(3), nth(5)
      await page.getByRole('textbox', { name: 'Required *' }).nth(i * 2 + 1).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: endDay, exact: true }).click();
      console.log(`   [DONE] ${SOV_TASKS[i].name} end date: ${endDay}`);
      await page.waitForTimeout(500);
    }

    // ---- STEP 10: Submit SOV ----
    console.log('\n[STEP 10] Submitting SOV...');
    await page.getByRole('button', { name: 'Submit' }).click();
    console.log('   [DONE] Submit clicked');
    await page.waitForTimeout(2000);

    // Select approver — Owner (using .select-input-container)
    await page.locator('.select-input-container').click();
    await page.waitForTimeout(1000);
    await page.getByText('Project Owner (Owner)').click();
    console.log('   [DONE] Approver selected: Project Owner (Owner)');
    await page.waitForTimeout(1000);

    // Select Express Payapp
    await page.getByRole('radio', { name: 'Express Payapp Express Payapp' }).check();
    console.log('   [DONE] Express Payapp selected');
    await page.waitForTimeout(1000);

    // Confirm submit
    await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
    console.log('   [DONE] SOV submitted for approval');
    await page.waitForTimeout(5000);

    console.log(`   Final URL: ${page.url()}`);
    await page.screenshot({ path: `test-results/gc-sov-submitted-${Date.now()}.png` }).catch(() => {});

    // ---- Save SOV data ----
    const sovData = {
      runNumber,
      tasks: SOV_TASKS,
      submittedAt: new Date().toISOString(),
      approver: 'Project Owner',
    };

    const authDir = path.dirname(SOV_DATA_PATH);
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
    fs.writeFileSync(SOV_DATA_PATH, JSON.stringify(sovData, null, 2));
    console.log('\n[SAVED] SOV data -> .auth/gc-sov-data.json');
    console.log('\n[COMPLETE] SOV created and submitted for Owner approval!\n');
  });
});
