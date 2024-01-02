// const catchAsync = require('../utils/catchAsync');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const apagarCupons = async (context, iframe, page) => {
  // console.log(context);
  const dotsbtn = await context.$('button[data-type="button"]');

  console.log(dotsbtn);

  await dotsbtn.click();

  await page.waitForTimeout(1000);

  await context.evaluate(() => {
    const button = document.querySelector('button[data-test-id="remove-action"]');
    button.click();
  });

  await page.waitForTimeout(1300);

  await iframe.evaluate(() => {
    const button = document.querySelector('[data-test-id="modal-confirm"]');
    button.click();
  });

  await page.waitForTimeout(13000);

  // const innerHTML = await remove.evaluate((element) => element.outerHTML);

  // console.log(innerHTML);

  // <div class="s-alert-box s-alert-success s-alert-top-right s-alert-is-effect s-alert-effect-stackslide s-alert-show" id="T4DMgw6TFH3P299ck" style="top: 65px; right: px;">
  //           <div class="s-alert-box-inner">
  //               <p>Feito!</p>
  //           </div>
  //           <span class="s-alert-close"></span>
  //       </div>

  // <a href="#" class="hot-btn hot-btn--outline-secondary js-load-more" data-test-id="load-more">
  //         <svg class="svg-inline--fa fa-spinner-third fa-w-16 hot-btn__loading-indicator fa-spin" aria-hidden="true" focusable="false" data-prefix="far" data-icon="spinner-third" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M460.116 373.846l-20.823-12.022c-5.541-3.199-7.54-10.159-4.663-15.874 30.137-59.886 28.343-131.652-5.386-189.946-33.641-58.394-94.896-95.833-161.827-99.676C261.028 55.961 256 50.751 256 44.352V20.309c0-6.904 5.808-12.337 12.703-11.982 83.556 4.306 160.163 50.864 202.11 123.677 42.063 72.696 44.079 162.316 6.031 236.832-3.14 6.148-10.75 8.461-16.728 5.01z"></path></svg><!-- <i class="hot-btn__loading-indicator far fa-spinner-third fa-spin"></i> Font Awesome fontawesome.com -->
  //         Carregar Mais
  //       </a>
};

const hotmart = async (req, res) => {
  const { productId, email, pass } = req.body;

  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-features=site-per-process'],
    });
    const [page] = await browser.pages();

    // abre o navegador e navega pra hotmart

    await page.goto('https://app.hotmart.com');

    // login
    // await page.locator('#username').fill('ensinointensivo@gmail.com');

    // await page.locator('#password').fill('TETR@loGIA5437!!');

    await page.locator('#username').fill(email);

    await page.locator('#password').fill(pass);

    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(5000);

    await page.goto(`https://app.hotmart.com/products/manage/${productId}/coupons`);

    await page.waitForTimeout(6000);

    await page.waitForSelector('iframe[src="https://app-vlc.hotmart.com/products/manage/3664484/coupons"]');

    const iframeHandle = await page.waitForSelector(
      `iframe[src="https://app-vlc.hotmart.com/products/manage/${productId}/coupons"]`
    );

    const frame = await iframeHandle.contentFrame();

    await frame.waitForSelector('table');

    const couponRows = await frame.$$('tbody tr');

    couponRows.forEach(async (row) => {
      await apagarCupons(row, frame, page);
    });

    const data = await page.evaluate(
      () => document.querySelector('iframe[src="https://app-vlc.hotmart.com/products/manage/3664484/coupons"]').outerHTML
    );

    // const couponRows = await iframeHandle.$$('tbody tr');

    // console.log(couponRows);

    // await browser.close();
    res.send(data);
  } catch (err) {
    console.error(err);
    res.send(err);
  }
};

module.exports = {
  hotmart,
};
