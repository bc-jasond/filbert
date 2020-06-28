const { By } = require('selenium-webdriver');

const {
  cleanupClient,
  getChromedriverClient,
  getUrl,
} = require('./selenium-utils');

let driver;

beforeAll(async (done) => {
  try {
    driver = await getChromedriverClient();
    done();
  } catch (err) {
    done(err);
  }
});

afterAll(() => {
  cleanupClient(driver);
});

describe('filbert - When signed out', () => {
  test("user gets 'homepage' when visiting /", async (done) => {
    try {
      await driver.get(getUrl());
      const url = await driver.getCurrentUrl();
      expect(url.includes('homepage')).toBeTruthy();
      done();
    } catch (err) {
      done(err);
    }
  });
  test("user can't view /private", async (done) => {
    try {
      await driver.get(getUrl('/private'));
      const errorMessage = driver.findElement(By.id('error-message'));
      expect(await errorMessage.getText()).toContain('404');
      done();
    } catch (err) {
      done(err);
    }
  });
  test("user can't edit or create", async (done) => {
    try {
      await driver.get(getUrl('/edit/new'));
      let errorMessage = driver.findElement(By.id('error-message'));
      expect(await errorMessage.getText()).toContain('404');
      await driver.get(getUrl('/edit/new'));
      errorMessage = driver.findElement(By.id('error-message'));
      expect(await errorMessage.getText()).toContain('404');
      await driver.get(getUrl('/edit'));
      errorMessage = driver.findElement(By.id('error-message'));
      expect(await errorMessage.getText()).toContain('404');
      done();
    } catch (err) {
      done(err);
    }
  });
  test("user can't manage", async (done) => {
    try {
      await driver.get(getUrl('/manage'));
      const errorMessage = driver.findElement(By.id('error-message'));
      expect(await errorMessage.getText()).toContain('404');
      done();
    } catch (err) {
      done(err);
    }
  });
});
