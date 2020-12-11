const { By, until } from 'selenium-webdriver');

const {
  cleanupClient,
  getChromedriverClient,
  getUrl,
  ensureSignedIn,
  selectRangeOfText,
} from './selenium-utils');
const {
  EDITOR_CONTAINER_ID,
  FORMAT_SELECTION_MENU_ID,
} from './constants');

let driver;
let actions;
let postId;
const testName = 'Format Selection Menu';

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

describe(`filbert - ${testName}`, () => {
  test('user types a title and hits enter to create a new post', async (done) => {
    try {
      await ensureSignedIn(driver);
      await driver.get(getUrl('/edit/new'));
      const placeholderTitle = await driver.wait(
        until.elementLocated(By.css(`#${EDITOR_CONTAINER_ID} h1`))
      );
      await placeholderTitle.sendKeys(`${testName} Tests\n`);
      await driver.wait(async () => {
        const currentUrl = await driver.getCurrentUrl();
        postId = parseInt(currentUrl.split('/').pop(), 10);
        //console.log(postId, Number.isInteger(postId));
        return Number.isInteger(postId);
      });
      done();
    } catch (err) {
      done(err);
    }
  });
  test(`user can highlight a range of text with the mouse to open the ${testName}`, async (done) => {
    try {
      const contentEditable = await driver.wait(
        until.elementLocated(By.id(EDITOR_CONTAINER_ID))
      );
      const firstParagraph = await contentEditable.findElement(By.css('p'));
      await firstParagraph.click();
      const testText = 'A sweltering, muggy midday. Not a cloud in the sky...';
      await firstParagraph.sendKeys(testText);
      // start text select helper
      const paragraphText = await firstParagraph.getText();
      expect(paragraphText).toEqual(testText);
      await selectRangeOfText(driver, actions, firstParagraph, 14, 28);
      await driver.wait(until.elementLocated(By.id(FORMAT_SELECTION_MENU_ID)));
      done();
    } catch (err) {
      done(err);
    }
  });
});
