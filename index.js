const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

async function getProductURLAndHTML(site, query) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  let searchUrl, selector;

  switch (site) {
    case 'lowes':
      searchUrl = `https://www.lowes.com/search?searchTerm=${encodeURIComponent(query)}`;
      selector = 'a[data-testid="product-title-link"]';
      break;
    case 'homedepot':
      searchUrl = `https://www.homedepot.com/s/${encodeURIComponent(query)}`;
      selector = 'a[data-pod-type="pr"]';
      break;
    case 'amazon':
      searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
      selector = 'h2 a';
      break;
    case 'walmart':
      searchUrl = `https://www.walmart.com/search?q=${encodeURIComponent(query)}`;
      selector = 'a[data-testid="product-title-link"], a.css-1ewxw0j';
      break;
    case 'bestbuy':
      searchUrl = `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(query)}`;
      selector = '.sku-title a';
      break;
    default:
      throw new Error('Unsupported site');
  }

  await page.goto(searchUrl, { waitUntil: 'networkidle2' });

  const productUrl = await page.evaluate((sel) => {
    const link = document.querySelector(sel);
    return link ? (link.href.startsWith("http") ? link.href : "https://www." + location.hostname + link.getAttribute('href')) : null;
  }, selector);

  if (!productUrl) {
    await browser.close();
    throw new Error("Product not found.");
  }

  await page.goto(productUrl, { waitUntil: 'networkidle2' });
  const html = await page.content();
  await browser.close();

  return { url: productUrl, html: html.slice(0, 15000) };
}

app.post('/scrape', async (req, res) => {
  const { query, site } = req.body;
  if (!query || !site) return res.status(400).json({ error: "Missing 'query' or 'site'" });

  try {
    const result = await getProductURLAndHTML(site.toLowerCase(), query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => res.send('Universal Product Scraper is running!'));
app.listen(process.env.PORT || 3000, () => console.log("✅ Server running on port 3000"));
