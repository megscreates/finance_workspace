function doGet() {
  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Crystal Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Helper to include partials (Styles, Scripts)
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

