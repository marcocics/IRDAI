// Build a portable HTML from the editable source. No dependencies required.
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace('<link rel="stylesheet" href="styles.css">', () => '<style>\n' + fs.readFileSync(path.join(root, 'styles.css'), 'utf8') + '</style>');
html = html.replace(/<script defer src="([^"]+)"><\/script>/g, (_, file) => '<script>\n' + fs.readFileSync(path.join(root, file), 'utf8') + '</script>');
html = html.replace(/src="(assets[/][^"\n]+\.png)"/g, (_, file) => 'src="data:image/png;base64,' + fs.readFileSync(path.join(root, file)).toString('base64') + '"');
const output = path.join(root, 'dist');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'yolox-explorer.html'), html);
console.log(path.join(output, 'yolox-explorer.html'));
