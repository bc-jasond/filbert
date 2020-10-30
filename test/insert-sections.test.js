const path = require('path');
const { By, Key, until } = require('selenium-webdriver');

const {
  cleanupClient,
  getChromedriverClient,
  getUrl,
  ensureSignedIn,
} = require('./selenium-utils');
const {
  EDITOR_CONTAINER_ID,
  INSERT_SECTION_MENU_ID,
  INSERT_SECTION_MENU_BUTTON_ID,
  INSERT_SECTION_MENU_CONTAINER_ID,
  INSERT_SECTION_MENU_ITEM_ID_PREFIX,
  EDIT_IMAGE_MENU_CAPTION_INPUT_ID,
  EDIT_IMAGE_HIDDEN_FILE_INPUT_ID,
  EDIT_QUOTE_MENU_ID,
} = require('./constants');

let driver;
let actions;
let postId;

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

describe('filbert - Insert Menu', () => {
  test('user types a title and hits enter to create a new post', async (done) => {
    try {
      await ensureSignedIn(driver);
      await driver.get(getUrl('/edit/new'));
      const placeholderTitle = await driver.wait(
        until.elementLocated(By.css(`#${EDITOR_CONTAINER_ID} h1`))
      );
      await placeholderTitle.sendKeys('Insert Menu Tests\n');
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
  test('user sees Insert Menu on empty Paragraph, can open and close menu with keyboard and mouse', async (done) => {
    // TODO: depends on create post test above
    try {
      await driver.get(getUrl(`/edit/${postId}`));
      const contentEditable = await driver.wait(
        until.elementLocated(By.id(EDITOR_CONTAINER_ID))
      );
      const firstParagraph = await contentEditable.findElement(By.css('p'));
      await firstParagraph.click();
      // user should see insert menu button when caret is on empty paragraph
      let insertMenu = await driver.wait(
        until.elementLocated(By.id(INSERT_SECTION_MENU_ID))
      );
      // MOUSE: user should be able to click on the insert menu button to open the menu
      const insertMenuToggleButton = await insertMenu.findElement(
        By.id(INSERT_SECTION_MENU_BUTTON_ID)
      );
      await insertMenuToggleButton.click();
      await driver.wait(
        until.elementLocated(By.id(INSERT_SECTION_MENU_CONTAINER_ID))
      );
      let insertSectionMenuContainer = await driver.findElement(
        By.id(INSERT_SECTION_MENU_CONTAINER_ID)
      );
      // click again to close
      await insertMenuToggleButton.click();
      await driver.wait(until.elementIsNotVisible(insertSectionMenuContainer));
      // KEYBOARD: user should be able to double-tap CONTROL to open the menu
      await firstParagraph.sendKeys(Key.CONTROL, Key.CONTROL);
      insertSectionMenuContainer = await driver.wait(
        until.elementLocated(By.id(INSERT_SECTION_MENU_CONTAINER_ID))
      );
      await firstParagraph.sendKeys(Key.ESCAPE);
      await driver.wait(until.elementIsNotVisible(insertSectionMenuContainer));
      done();
    } catch (err) {
      done(err);
    }
  });
  test('user can insert Heading, Small Heading, Paragraph, List, Code, Image & Quote sections', async (done) => {
    async function insertHelper(type, isSpecialCaseForImage = false) {
      const contentEditable = await driver.wait(
        until.elementLocated(By.id(EDITOR_CONTAINER_ID))
      );
      const allParagraphs = await contentEditable.findElements(By.css('p'));
      const lastParagraph = allParagraphs.pop();
      const lastParagraphId = await lastParagraph.getAttribute('name');
      await lastParagraph.click();
      const insertMenu = await driver.wait(
        until.elementLocated(By.id(INSERT_SECTION_MENU_ID))
      );
      const insertMenuToggleButton = await insertMenu.findElement(
        By.id(INSERT_SECTION_MENU_BUTTON_ID)
      );
      await insertMenuToggleButton.click();
      const insertButton = await driver.wait(
        until.elementLocated(
          By.id(`${INSERT_SECTION_MENU_ITEM_ID_PREFIX}${type}`)
        )
      );
      if (isSpecialCaseForImage) {
        // override click handler for input[type="file"] so system filepicker dialog doesn't open
        // https://stackoverflow.com/a/39500300/1991322
        await driver.executeScript(() => {
          HTMLInputElement.prototype.click = () => {
            // allow all other input types to pass through
            if (this.type !== 'file') {
              HTMLElement.prototype.click.call(this);
            }
          };
        });
      }
      await insertButton.click();
      if (isSpecialCaseForImage) {
        return lastParagraphId;
      }
      // p -> {type} by changing type - mutable!
      const newSection = await driver.findElement(
        By.css(`[name="${lastParagraphId}"]`)
      );
      return newSection;
    }
    // TODO: depends on create post test above
    try {
      await driver.get(getUrl(`/edit/${postId}`));

      // h1
      let newSection = await insertHelper('h1');
      expect(await newSection.getTagName()).toBe('h1');
      await newSection.sendKeys('Another Title\n');

      // h2
      newSection = await insertHelper('h2');
      expect(await newSection.getTagName()).toBe('h2');
      await newSection.sendKeys('Small Title\n');

      // code
      newSection = await insertHelper('pre');
      expect(await newSection.getTagName()).toBe('pre');
      await newSection.sendKeys(
        'function hey() {\n  console.log("hey");\n}\nhey();\n\n'
      );

      // list
      newSection = await insertHelper('li');
      expect(await newSection.getTagName()).toBe('li');
      await newSection.sendKeys(
        "one o'clock\ntwo o'clock\nthree o'clock rock\n\n"
      );

      // spacer
      newSection = await insertHelper('spacer');
      expect(await newSection.getTagName()).toBe('section');
      expect(await newSection.getAttribute('data-type')).toBe('spacer');
      await newSection.sendKeys(Key.ENTER);

      // photo
      const lastParagraphId = await insertHelper('image', true);
      const editImageFileInput = await driver.wait(
        until.elementLocated(By.id(EDIT_IMAGE_HIDDEN_FILE_INPUT_ID))
      );
      await editImageFileInput.sendKeys(path.resolve('./testimage.jpg'));
      newSection = await driver.wait(
        until.elementLocated(By.css(`section[name="${lastParagraphId}"]`))
      );
      expect(await newSection.getTagName()).toBe('section');
      expect(await newSection.getAttribute('data-type')).toBe('image');
      const editImageMenuCaptionInput = await driver.wait(
        until.elementLocated(By.id(EDIT_IMAGE_MENU_CAPTION_INPUT_ID))
      );
      await editImageMenuCaptionInput.sendKeys(Key.ESCAPE);
      await newSection.sendKeys(Key.ENTER);

      // quote
      newSection = await insertHelper('quote');
      expect(await newSection.getTagName()).toBe('section');
      expect(await newSection.getAttribute('data-type')).toBe('quote');
      const editQuoteMenu = await driver.wait(
        until.elementLocated(By.id(EDIT_QUOTE_MENU_ID))
      );
      const [firstInput] = await editQuoteMenu.findElements(By.css('input'));
      await firstInput.sendKeys(
        // TODO: why doesn't this first line appear?
        'Simple things should be simple. Complex things should be possible.\tAlan Kay\tneeds citation\thttps://en.wikipedia.org/wiki/Alan_Kay\n\n'
      );

      done();
    } catch (err) {
      done(err);
    }
  });
});
