const {
  cleanupClient,
  getChromedriverClient,
  getEnv,
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

describe('filbert - logged out tests', () => {
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
      const url = await driver.getCurrentUrl();
      expect(url.includes('404')).toBeTruthy();
      done();
    } catch (err) {
      done(err);
    }
  });
});
