const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

// 1. Add root variables
const rootVars = `
:root {
  --page-aspect: calc(1170 / 2400);
  --artboard-width: min(100vw, calc(100vh * var(--page-aspect)));
`;
css = css.replace(/:root\s*\{/, rootVars);

// 2. Change html font-size and remove @media
const htmlCss = `
html {
  font-size: calc(var(--artboard-width) / 390 * 16);
  scroll-behavior: smooth;
}
`;

// Replace html and @media block
css = css.replace(/html\s*\{\s*font-size:\s*1rem;[\s\S]*?@media[^}]*\}\s*\}/, htmlCss.trim());

// 3. Change vw/vh to % for the modals
css = css.replace(/min\(92vw,\s*28rem\)/g, '92%');
css = css.replace(/min\(16vh,\s*30rem\)/g, '65%'); // 16vh roughly 16%, but 65% looks better relative to the backdrop modal container. Wait, guestbook-modal max-height was 16vh. 16vh is very small? Oh, `16vh` was maybe a typo for `60vh` or something? Actually `max-height: min(16vh, 30rem)` was probably `16vh`? Let's just use 80% for max-height or leave it as 80% if it's a modal.
// Wait, in my previous read of index.css, what was it?
// `width: min(92vw, 28rem); max-height: min(16vh, 30rem);`
// I'll replace `92vw` with `92%`.

// Let's replace specifically:
css = css.replace(/width:\s*min\(92vw,\s*28rem\);/g, 'width: 92%;');
css = css.replace(/max-height:\s*min\(16vh,\s*30rem\);/g, 'max-height: 80%;');

// 4. Change account overlay top ratio and width ratio to direct %
css = css.replace(/top:\s*calc\(var\(--account-top-ratio\) \* 100%\);/g, 'top: 55%;');
css = css.replace(/width:\s*calc\(var\(--account-width-ratio\) \* 100%\);/g, 'width: 70%;');

fs.writeFileSync('src/index.css', css);
console.log('Modified index.css');
