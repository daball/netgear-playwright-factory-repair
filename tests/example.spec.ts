import { test, expect } from '@playwright/test';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_SWITCH_IP = process.env.DEFAULT_SWITCH_IP || '192.168.0.239';
const CONFIGURED_SWITCH_IP = process.env.CONFIGURED_SWITCH_IP || '10.4.20.240';
const FACTORY_DEFAULT_PASSWORD = process.env.FACTORY_DEFAULT_PASSWORD || 'password';
const NEW_SWITCH_PASSWORD = process.env.NEW_SWITCH_PASSWORD || 'newPassword$123';
const KNOWN_GOOD_CONFIG_PATH = process.env.KNOWN_GOOD_CONFIG_PATH || path.join('startup-config.cfg');

test(`XS712Tv2 is up at http://${DEFAULT_SWITCH_IP}, login and set new password`, async ({ page }) => {
  await page.goto(`http://${DEFAULT_SWITCH_IP}/`);

  await expect(page).toHaveTitle(/NETGEAR XS712Tv2/);
  await page.waitForLoadState('networkidle');
  const inputPassword = page.locator('input[type="password"].loginPage_textbox');
  expect(inputPassword).not.toBeNull();

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
});

test(`XS712Tv2 is up at http://${DEFAULT_SWITCH_IP}, login and restore configuration`, async ({ page }) => {
  await page.goto(`http://${DEFAULT_SWITCH_IP}/`);

  await expect(page).toHaveTitle(/NETGEAR XS712Tv2/);
  await page.waitForLoadState('networkidle');

  const inputPassword = page.locator('input[type="password"].loginPage_textbox');
  expect(inputPassword).not.toBeNull();

  await inputPassword.pressSequentially(NEW_SWITCH_PASSWORD);
  await inputPassword.press('Enter');
  await page.waitForLoadState('networkidle');
  await page.evaluate((val) => {
    console.log(val);
  }, await (await page.$('body')).innerText());

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
  await fileChooser.setFiles(path.join(__dirname, '..', KNOWN_GOOD_CONFIG_PATH));
  const applyButton = page.locator('a.buttonSubmitUrl_enable[alt="Apply"]:has-text("Apply")');
  await applyButton.click();
  await page.waitForTimeout(20000);
  await page.waitForLoadState('networkidle');
});

test(`XS712Tv2 is up at http://${CONFIGURED_SWITCH_IP}, login one more time`, async ({ page }) => {
  await page.goto(`http://${CONFIGURED_SWITCH_IP}/`);

  await expect(page).toHaveTitle(/NETGEAR XS712Tv2/);
  await page.waitForLoadState('networkidle');

  const inputPassword = page.locator('input[type="password"].loginPage_textbox');
  expect(inputPassword).not.toBeNull();

  await inputPassword.pressSequentially(NEW_SWITCH_PASSWORD);
  await inputPassword.press('Enter');
  await page.waitForLoadState('networkidle');
});