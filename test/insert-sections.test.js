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
  EDIT_IMAGE_MENU_ID,
  EDIT_IMAGE_MENU_CAPTION_INPUT_ID,
  EDIT_IMAGE_HIDDEN_FILE_INPUT_ID,
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

describe('filbert - Create a new Post', () => {
  test('user types a title and hits enter to create a new post', async (done) => {
    try {
      await ensureSignedIn(driver);
      await driver.get(getUrl('/edit/new'));
      const placeholderTitle = await driver
        .findElement(By.id(EDITOR_CONTAINER_ID))
        .findElement(By.css('h1'));
      await placeholderTitle.sendKeys('Title\n');
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
      await firstParagraph.sendKeys(...[Key.CONTROL, Key.CONTROL]);
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
  test('user can add Heading, Small Heading, Paragraph, List, Code, Image & Quote sections', async (done) => {
    try {
      await driver.get(getUrl(`/edit/${postId}`));
      const contentEditable = await driver.wait(
        until.elementLocated(By.id(EDITOR_CONTAINER_ID))
      );
      // START section LOOP - do for all sections - H1
      let allParagraphs = await contentEditable.findElements(By.css('p'));
      let lastParagraph = allParagraphs.pop();
      let lastParagraphId = await lastParagraph.getAttribute('name');
      await lastParagraph.click();
      let insertMenu = await driver.wait(
        until.elementLocated(By.id(INSERT_SECTION_MENU_ID))
      );
      let insertMenuToggleButton = await insertMenu.findElement(
        By.id(INSERT_SECTION_MENU_BUTTON_ID)
      );
      insertMenuToggleButton.click();
      let insertButton = driver.wait(
        until.elementLocated(By.id(`${INSERT_SECTION_MENU_ITEM_ID_PREFIX}h1`))
      );
      await insertButton.click();
      // p -> h1 by changing type - mutable!
      let newSection = await driver.findElement(
        By.css(`[name="${lastParagraphId}"]`)
      );
      expect(await newSection.getTagName()).toBe('h1');
      await newSection.sendKeys('Another Title\n');
      // END LOOP

      // H2
      allParagraphs = await contentEditable.findElements(By.css('p'));
      lastParagraph = allParagraphs.pop();
      lastParagraphId = await lastParagraph.getAttribute('name');
      await lastParagraph.click();
      insertMenu = await driver.wait(
        until.elementLocated(By.id(INSERT_SECTION_MENU_ID))
      );
      insertMenuToggleButton = await insertMenu.findElement(
        By.id(INSERT_SECTION_MENU_BUTTON_ID)
      );
      insertMenuToggleButton.click();
      insertButton = driver.wait(
        until.elementLocated(By.id(`${INSERT_SECTION_MENU_ITEM_ID_PREFIX}h2`))
      );
      await insertButton.click();
      newSection = await driver.findElement(
        By.css(`[name="${lastParagraphId}"]`)
      );
      expect(await newSection.getTagName()).toBe('h2');
      await newSection.sendKeys('Small Title\n');

      // code
      allParagraphs = await contentEditable.findElements(By.css('p'));
      lastParagraph = allParagraphs.pop();
      lastParagraphId = await lastParagraph.getAttribute('name');
      await lastParagraph.click();
      insertMenu = await driver.wait(
        until.elementLocated(By.id(INSERT_SECTION_MENU_ID))
      );
      insertMenuToggleButton = await insertMenu.findElement(
        By.id(INSERT_SECTION_MENU_BUTTON_ID)
      );
      insertMenuToggleButton.click();
      insertButton = driver.wait(
        until.elementLocated(By.id(`${INSERT_SECTION_MENU_ITEM_ID_PREFIX}pre`))
      );
      await insertButton.click();
      newSection = await driver.findElement(
        By.css(`[name="${lastParagraphId}"]`)
      );
      expect(await newSection.getTagName()).toBe('pre');
      await newSection.sendKeys(
        'var wat = undefined;\nfunction hey() {\n  console.log("hey");\n}\nhey();\n\n'
      );

      // list
      allParagraphs = await contentEditable.findElements(By.css('p'));
      lastParagraph = allParagraphs.pop();
      lastParagraphId = await lastParagraph.getAttribute('name');
      await lastParagraph.click();
      insertMenu = await driver.wait(
        until.elementLocated(By.id(INSERT_SECTION_MENU_ID))
      );
      insertMenuToggleButton = await insertMenu.findElement(
        By.id(INSERT_SECTION_MENU_BUTTON_ID)
      );
      insertMenuToggleButton.click();
      insertButton = driver.wait(
        until.elementLocated(By.id(`${INSERT_SECTION_MENU_ITEM_ID_PREFIX}li`))
      );
      await insertButton.click();
      newSection = await driver.findElement(
        By.css(`[name="${lastParagraphId}"]`)
      );
      expect(await newSection.getTagName()).toBe('li');
      await newSection.sendKeys(
        "one o'clock\ntwo o'clock\nthree o'clock rock\n\n"
      );

      // spacer
      allParagraphs = await contentEditable.findElements(By.css('p'));
      lastParagraph = allParagraphs.pop();
      lastParagraphId = await lastParagraph.getAttribute('name');
      await lastParagraph.click();
      insertMenu = await driver.wait(
        until.elementLocated(By.id(INSERT_SECTION_MENU_ID))
      );
      insertMenuToggleButton = await insertMenu.findElement(
        By.id(INSERT_SECTION_MENU_BUTTON_ID)
      );
      insertMenuToggleButton.click();
      insertButton = driver.wait(
        until.elementLocated(
          By.id(`${INSERT_SECTION_MENU_ITEM_ID_PREFIX}spacer`)
        )
      );
      await insertButton.click();
      newSection = await driver.findElement(
        By.css(`[name="${lastParagraphId}"]`)
      );
      expect(await newSection.getTagName()).toBe('section');
      expect(await newSection.getAttribute('data-type')).toBe('spacer');
      await newSection.sendKeys(Key.ENTER);

      done();
      return;

      // TODO: photo
      allParagraphs = await contentEditable.findElements(By.css('p'));
      lastParagraph = allParagraphs.pop();
      lastParagraphId = await lastParagraph.getAttribute('name');
      await lastParagraph.click();
      insertMenu = await driver.wait(
        until.elementLocated(By.id(INSERT_SECTION_MENU_ID))
      );
      insertMenuToggleButton = await insertMenu.findElement(
        By.id(INSERT_SECTION_MENU_BUTTON_ID)
      );
      insertMenuToggleButton.click();
      insertButton = driver.wait(
        until.elementLocated(
          By.id(`${INSERT_SECTION_MENU_ITEM_ID_PREFIX}image`)
        )
      );
      // override click handler for input[type="file"] so system dialog doesn't open
      // https://stackoverflow.com/a/39500300/1991322
      await driver.executeScript(() => {
        HTMLInputElement.prototype.click = () => {
          if (this.type !== 'file') {
            HTMLElement.prototype.click.call(this);
          }
        };
      });
      await insertButton.click();
      const editImageFileInput = await driver.wait(
        until.elementLocated(By.id(EDIT_IMAGE_HIDDEN_FILE_INPUT_ID))
      );
      await editImageFileInput.sendKeys('~/testimage.jpg');
      newSection = await driver.wait(
        until.elementLocated(By.css(`[name="${lastParagraphId}"]`))
      );
      expect(await newSection.getTagName()).toBe('section');
      expect(await newSection.getAttribute('data-type')).toBe('photo');

      // quote TODO
    } catch (err) {
      done(err);
    }
  });
});
