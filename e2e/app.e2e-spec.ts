import { CryptoWatchGuiPage } from './app.po';

describe('crypto-watch-gui App', function() {
  let page: CryptoWatchGuiPage;

  beforeEach(() => {
    page = new CryptoWatchGuiPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
