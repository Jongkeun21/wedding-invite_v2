const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

// Replace rem with % (for layout) and cqw (for fonts)
// 1rem = 4.1025% (or cqw)
// 1px = 0.2564% (or cqw)

// It's safer to just apply the viewport/artboard logic to the html font-size
// But to satisfy "% 로 통일", we can replace absolute values in specific overlay classes.
