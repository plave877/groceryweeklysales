const fs = require('fs');
const path = require('path');

async function updateFlyers() {
  await updateHMart();
  await updateLotte();
}

async function updateHMart() {
  console.log('Fetching live H Mart weekly ads page...');
  try {
    const res = await fetch('https://www.hmart.com/weekly-ads/new-york-new-jersey');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const html = await res.text();
    console.log('H Mart page fetched successfully. Extracting flyer URLs...');

    const patterns = {
      englishKorean: 'ENGLISH(?:\\\\u002F|/)KOREAN',
      chineseNY: 'CHINESE\\(NY\\)',
      chineseNJ: 'CHINESE\\(NJ\\)',
      houseware: 'HOUSEWARE\\s+SALE',
      anniversary: '40th\\s+Anniversary\\s+Sale'
    };

    const urls = {};
    for (const [key, pattern] of Object.entries(patterns)) {
      const regex = new RegExp(`"tabName"\\s*:\\s*"${pattern}"[^}]+?"imageSrc"\\s*:\\s*"([^"]+)"`, 'i');
      const match = html.match(regex);
      if (match) {
        let url = match[1];
        url = url.replace(/\\u002F/gi, '/');
        url = url.replace(/\\u002f/gi, '/');
        url = url.replace(/\\/g, '');
        urls[key] = url;
      } else {
        console.warn(`Warning: Could not find flyer URL for pattern "${pattern}"`);
      }
    }

    console.log('H Mart extracted URLs:', urls);

    // Path to hmart.html
    const hmartPath = path.join(__dirname, '..', 'hmart.html');
    if (!fs.existsSync(hmartPath)) {
      throw new Error(`hmart.html not found at path: ${hmartPath}`);
    }

    let hmartContent = fs.readFileSync(hmartPath, 'utf8');

    // Let's replace the data-src for buttons
    const buttonReplacements = [
      { key: 'englishKorean', label: 'English/Korean' },
      { key: 'chineseNY', label: 'Chinese (NY)' },
      { key: 'chineseNJ', label: 'Chinese (NJ)' },
      { key: 'houseware', label: 'Houseware Sale' },
      { key: 'anniversary', label: '40th Anniversary' }
    ];

    buttonReplacements.forEach(({ key, label }) => {
      if (urls[key]) {
        const btnRegex = new RegExp(`(<button[^>]+class="[^"]*flyer-tab-btn[^"]*"[^>]*data-src=")[^"]*("[^>]*>\\s*${label.replace('(', '\\(').replace(')', '\\)')}\\s*</button>)`, 'i');
        if (hmartContent.match(btnRegex)) {
          hmartContent = hmartContent.replace(btnRegex, `$1${urls[key]}$2`);
        }
      }
    });

    if (urls.englishKorean) {
      const imgRegex = /(<img[^>]+id="active-flyer-image"[^>]*src=")[^"]*("[^>]*>)/i;
      if (hmartContent.match(imgRegex)) {
        hmartContent = hmartContent.replace(imgRegex, `$1${urls.englishKorean}$2`);
      }
      const hrefRegex = /(<a[^>]+id="view-full-btn"[^>]*href=")[^"]*("[^>]*>)/i;
      if (hmartContent.match(hrefRegex)) {
        hmartContent = hmartContent.replace(hrefRegex, `$1${urls.englishKorean}$2`);
      }
    }

    fs.writeFileSync(hmartPath, hmartContent, 'utf8');
    console.log('hmart.html updated.');
  } catch (error) {
    console.error('Error updating H Mart flyers:', error.message);
  }
}

async function updateLotte() {
  console.log('Fetching live Lotte Plaza weekly ads data...');
  try {
    // location 4 is NJ
    const res = await fetch('https://api.lotteplaza.com/sale/?location=4');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    console.log('Lotte data fetched successfully.');

    const urls = {
      korean: data.file_korean,
      chinese: data.file_chinese,
      indian: data.file_indian
    };

    console.log('Lotte extracted URLs:', urls);

    const lottePath = path.join(__dirname, '..', 'lotte.html');
    if (!fs.existsSync(lottePath)) {
      console.warn('lotte.html not found, skipping update.');
      return;
    }

    let lotteContent = fs.readFileSync(lottePath, 'utf8');

    const buttonReplacements = [
      { key: 'korean', label: 'Korean/English' },
      { key: 'chinese', label: 'Chinese' },
      { key: 'indian', label: 'Indian' }
    ];

    buttonReplacements.forEach(({ key, label }) => {
      if (urls[key]) {
        const btnRegex = new RegExp(`(<button[^>]+class="[^"]*flyer-tab-btn[^"]*"[^>]*data-src=")[^"]*("[^>]*>\\s*${label}\\s*</button>)`, 'i');
        if (lotteContent.match(btnRegex)) {
          lotteContent = lotteContent.replace(btnRegex, `$1${urls[key]}$2`);
        }
      }
    });

    if (urls.korean) {
      const imgRegex = /(<img[^>]+id="active-flyer-image"[^>]*src=")[^"]*("[^>]*>)/i;
      if (lotteContent.match(imgRegex)) {
        lotteContent = lotteContent.replace(imgRegex, `$1${urls.korean}$2`);
      }
      const hrefRegex = /(<a[^>]+id="view-full-btn"[^>]*href=")[^"]*("[^>]*>)/i;
      if (lotteContent.match(hrefRegex)) {
        lotteContent = lotteContent.replace(hrefRegex, `$1${urls.korean}$2`);
      }
    }

    fs.writeFileSync(lottePath, lotteContent, 'utf8');
    console.log('lotte.html updated.');
  } catch (error) {
    console.error('Error updating Lotte flyers:', error.message);
  }
}

// If run directly
if (require.main === module) {
  updateFlyers();
}

module.exports = { updateFlyers };
