const { By, Key } = require('selenium-webdriver');

const {
  cleanupClient,
  getChromedriverClient,
  getUrl,
  ensureSignedIn,
  sendKeysOneAtATime,
} = require('./selenium-utils');

let driver;
let actions;

beforeAll(async (done) => {
  try {
    driver = await getChromedriverClient();
    actions = driver.actions({ async: true });

    done();
  } catch (err) {
    done(err);
  }
});

afterAll(() => {
  cleanupClient(driver);
});

describe('filbert - Create a new Post', () => {
  test('user types a title and hits enter to create a new post', async (done) => {
    try {
      await ensureSignedIn(driver);
      await driver.get(getUrl('/edit/new'));
      const placeholderTitle = await driver
        .findElement(By.id('filbert-edit-container'))
        .findElement(By.css('h1'));
      await placeholderTitle.click();
      await placeholderTitle.sendKeys('Title\n');
      await driver.wait(async () => {
        const currentUrl = await driver.getCurrentUrl();
        const lastUrlPiece = parseInt(currentUrl.split('/').pop(), 10);
        console.log(lastUrlPiece, Number.isInteger(lastUrlPiece));
        return Number.isInteger(lastUrlPiece);
      }, 10000);
      done();
    } catch (err) {
      done(err);
    }
  });
});
