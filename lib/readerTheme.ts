export const READER_THEME_KEY = "reader-theme";

// Runs inline before the article paints on a full page load, so a saved light
// preference never flashes dark. Client-side navigations are covered by the
// layout effect in ReaderChrome.
export const readerThemeScript = `try{if(localStorage.getItem("${READER_THEME_KEY}")==="light")document.documentElement.dataset.reader="light"}catch(e){}`;
