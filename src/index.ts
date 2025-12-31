import { chromium } from 'playwright';
import ping from 'ping';
import assert from 'assert';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_SWITCH_IP = process.env.DEFAULT_SWITCH_IP || '192.168.0.239';
const CONFIGURED_SWITCH_IP = process.env.CONFIGURED_SWITCH_IP || '10.4.20.240';
const FACTORY_DEFAULT_PASSWORD = process.env.FACTORY_DEFAULT_PASSWORD || 'password';
const NEW_SWITCH_PASSWORD = process.env.NEW_SWITCH_PASSWORD || 'newPassword$123';
const KNOWN_GOOD_CONFIG_PATH = process.env.KNOWN_GOOD_CONFIG_PATH || path.join('startup-config.cfg');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function indefinitePing() {
  while (true) {
    console.log(`Pinging ${CONFIGURED_SWITCH_IP}, timeout = 5 seconds`);
    const resCustomIp = await ping.promise.probe(CONFIGURED_SWITCH_IP, {
      timeout: 5,       // seconds before timeout
      // extra: ['-c', '3'] // send 3 packets (Linux/Mac only; ignored on Windows)
    });
    if (resCustomIp.alive) {
      console.log(`Detected switch configured at ${CONFIGURED_SWITCH_IP}. Sleep for 20 seconds.`);
      await sleep(20000);
    }
    else {
      console.log(`Switch not detected at ${CONFIGURED_SWITCH_IP}. Checking factory default IP.`);
      console.log(`Pinging ${DEFAULT_SWITCH_IP}, timeout = 5 seconds`);
      const resFactoryIp = await ping.promise.probe(DEFAULT_SWITCH_IP, {
        timeout: 5,       // seconds before timeout
        // extra: ['-c', '3'] // send 3 packets (Linux/Mac only; ignored on Windows)
      });
      if (resFactoryIp.alive) {
        console.log("Unauthorized factory reset detected. Requires remediation. Sleeping for 10 seconds.");
        await sleep(10000);
        // detectedAnomaly = true;
        try {
          await setup();
        } catch (e) {
          console.error("Error during browser startup:", e);
        }
        try {
          await performRemediationInitialPasswordSteps();
        } catch (e) {
          console.error("Error during initial password remediation steps:", e);
        }
        try {
          await performRemediationRecoverConfigSteps();
        } catch (e) {
          console.error("Error during configuration recovery remediation steps:", e);
        }
        try {
          await performRemediationLoginOnceSteps();
        } catch (e) {
          console.error("Error during login once remediation steps:", e);
        }
        try {
          await teardown();
        } catch (e) {
          console.error("Error during browser shutdown:", e);
        }
      }
    }
  }
}

let browser;
let context;

async function setup() {
  console.log("Starting up Chromium Playwright.");
  browser = await chromium.launch();
  context = await browser.newContext();
  // Set default timeout for all operations in this context
  context.setDefaultTimeout(300000); // 300 seconds (5 minutes)
  context.setDefaultNavigationTimeout(300000); // 300 seconds for navigation
}

async function teardown() {
  console.log("Shutting down Chromium Playwright.");
  await context.close();
  await browser.close();
}

async function performRemediationInitialPasswordSteps() {
  console.log("Performing remediation steps to set new password from factory default using Chromium Playwright.");

  const page = await context.newPage();
  await page.goto(`http://${DEFAULT_SWITCH_IP}/`);

  assert((await page.title()).includes("NETGEAR XS712Tv2"));
  await page.waitForLoadState('networkidle');

  const inputPassword = page.locator('input[type="password"].loginPage_textbox');
  assert(inputPassword !== null);

  //login with factory default switch password
  await inputPassword.pressSequentially(FACTORY_DEFAULT_PASSWORD);
  await inputPassword.press('Enter');
  await page.waitForLoadState('networkidle');

  //set new switch password
  const newPassword = page.locator('input[type="password"][name="newPassword"]');
  await newPassword.pressSequentially(NEW_SWITCH_PASSWORD);

  const confirmNewPassword = page.locator('input[type="password"][name="confirmNewPassword"]');
  await confirmNewPassword.pressSequentially(NEW_SWITCH_PASSWORD);
  await confirmNewPassword.press('Enter');
  await page.waitForLoadState('networkidle');
}

async function performRemediationRecoverConfigSteps() {
  console.log("Performing remediation steps to restore configuration using Chromium Playwright.");

  const page = await context.newPage();
  await page.goto(`http://${DEFAULT_SWITCH_IP}/`);

  assert((await page.title()).includes("NETGEAR XS712Tv2"));
  await page.waitForLoadState('networkidle');

  const inputPassword = page.locator('input[type="password"].loginPage_textbox');
  assert(inputPassword !== null);

  await inputPassword.pressSequentially(NEW_SWITCH_PASSWORD);
  await inputPassword.press('Enter');
  await page.waitForLoadState('networkidle');

  const maintenanceLink = page.locator('a[aid=tab_Maintenance]:has-text("Maintenance")');
  await maintenanceLink.click({ button: 'left', delay: 100, timeout: 5000, noWaitAfter: false, trial: false, steps: 1, force: true });
  await page.waitForTimeout(1000);
  await page.waitForLoadState('networkidle');

  const updateLink = page.locator('a[aid=Update]:has-text("Update")');
  await updateLink.click({ button: 'left', delay: 100, timeout: 5000, noWaitAfter: false, trial: false, steps: 1, force: true });
  await page.waitForTimeout(1000);
  await page.waitForLoadState('networkidle');

  const httpFirmwareUpdateLink = page.locator('a[aid="lvl1_HTTPFirmware_FileUpdate"]:has-text("HTTP Firmware/File Update")');
  await httpFirmwareUpdateLink.click({ button: 'left', delay: 100, timeout: 5000, noWaitAfter: false, trial: false, steps: 1, force: true });
  await page.waitForTimeout(1000);
  await page.waitForLoadState('networkidle');

  const mainFrame = page.frameLocator('iframe[name="maincontent"]');

  const fileTypeInput = mainFrame.locator('select[name="v_1_10_1"]');
  await fileTypeInput.selectOption('Text Configuration');
  await page.waitForTimeout(1000);
  await page.waitForLoadState('networkidle');

  const fileChooserPromise = page.waitForEvent('filechooser');
  await mainFrame.locator('label.fakeInputFormUrl:has-text("Browse..")').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(path.join(__dirname, '..', '..', KNOWN_GOOD_CONFIG_PATH));
  const applyButton = page.locator('a.buttonSubmitUrl_enable[alt="Apply"]:has-text("Apply")');
  await applyButton.click();
  await page.waitForTimeout(20000);
  await page.waitForLoadState('networkidle');
}

async function performRemediationLoginOnceSteps() {
  console.log("Performing remediation steps to login once configuration restored using Chromium Playwright. Sleeping for 60 seconds to allow switch to reconfigure.");
  await sleep(60000);
  
  const page = await context.newPage();
  await page.goto(`http://${CONFIGURED_SWITCH_IP}/`);

  assert((await page.title()).includes("NETGEAR XS712Tv2"));
  await page.waitForLoadState('networkidle');

  const inputPassword = page.locator('input[type="password"].loginPage_textbox');
  assert(inputPassword !== null);

  await inputPassword.pressSequentially(NEW_SWITCH_PASSWORD);
  await inputPassword.press('Enter');
  await page.waitForLoadState('networkidle');
}

indefinitePing();