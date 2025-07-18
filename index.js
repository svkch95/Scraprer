const { searchLowesAndGetProductURL, fetchPageHTML } = require('./scraper');
const { extractProductInfo } = require('./gptExtractor');

const productName = process.argv.slice(2).join(" ");
if (!productName) {
  console.error("❌ Please provide a product name.");
  process.exit(1);
}

(async () => {
  console.log(`🔍 Searching Lowe's for "${productName}"...`);
  const productUrl = await searchLowesAndGetProductURL(productName);
  console.log(`✅ Found product: ${productUrl}`);

  console.log(`🧠 Fetching product page...`);
  const html = await fetchPageHTML(productUrl);

  console.log(`💬 Extracting product info using GPT...`);
  const result = await extractProductInfo(html);

  console.log(`✅ Product Info:\n${result}`);
})();
