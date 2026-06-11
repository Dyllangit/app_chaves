// Copia arquivos do Bootstrap e Bootstrap Icons de node_modules para public/
// Execute com: npm run setup

const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function copiar(origem, destino) {
    const dir = path.dirname(destino);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(origem, destino);
    const rel = path.relative(root, destino);
    console.log(`  ✔  ${rel}`);
}

console.log('\nCopiando Bootstrap 5...');
copiar(
    path.join(root, 'node_modules/bootstrap/dist/css/bootstrap.min.css'),
    path.join(root, 'public/css/bootstrap.min.css')
);
copiar(
    path.join(root, 'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'),
    path.join(root, 'public/js/bootstrap.bundle.min.js')
);

console.log('\nCopiando Bootstrap Icons...');
const iconsFont = path.join(root, 'node_modules/bootstrap-icons/font');
copiar(
    path.join(iconsFont, 'bootstrap-icons.css'),
    path.join(root, 'public/css/bootstrap-icons.css')
);

// Copia pasta fonts/ (arquivos .woff e .woff2)
const fontsOrig = path.join(iconsFont, 'fonts');
const fontsDest = path.join(root, 'public/css/fonts');
if (fs.existsSync(fontsOrig)) {
    fs.readdirSync(fontsOrig).forEach(f => {
        copiar(path.join(fontsOrig, f), path.join(fontsDest, f));
    });
}

console.log('\n✔  Setup concluído. Arquivos copiados para public/\n');