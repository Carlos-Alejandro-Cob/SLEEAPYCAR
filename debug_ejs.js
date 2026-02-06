const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'views', 'public', 'dashboard.ejs');
const fileContent = fs.readFileSync(filePath, 'utf8');

try {
    const fn = ejs.compile(fileContent, {
        filename: filePath,
        client: true, // Esto genera el cuerpo de la función
        compileDebug: true
    });
    console.log("Compilación exitosa (esto es inesperado si hay error).");
} catch (err) {
    console.log("Error de compilación capturado:");
    console.log(err.message);
    if (err.name === 'SyntaxError') {
        console.log("\n--- Intento de mostrar contexto ---");
        // A veces el error tiene info extra, pero mejor intentamos compilar sin 'client: true' para ver si EJS nos da más info, 
        // o inspeccionamos el stack.
    }
}

// Para ver el código generado, usamos una opción interna si es posible, o simplemente intentamos reproducir lo que hace EJS.
// EJS genera un string de JS.
try {
    const tmpl = new ejs.Template(fileContent, {
        filename: filePath
    });
    tmpl.generateSource();
    console.log("\n--- Source Generado (Primeros 1000 caracteres) ---");
    console.log(tmpl.source.substring(0, 1000));
    console.log("\n... (Buscando 'try' en el source generado) ...");

    if (tmpl.source.includes('try')) {
        console.log("¡ENCONTRADO 'try' en el código generado!");
        const idx = tmpl.source.indexOf('try');
        console.log(tmpl.source.substring(idx - 50, idx + 100));
    } else {
        console.log("No se encontró 'try' en el código generado.");
    }
} catch (e) {
    console.log("Error al generar source: " + e.message);
}
