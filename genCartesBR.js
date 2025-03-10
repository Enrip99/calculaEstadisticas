import fs from 'fs';
import {Sets} from '@pkmn/sets';
import {createCanvas, loadImage} from 'canvas';
import * as https from 'node:https';

// Configuració

// Idioma al que traduir.
const idioma = "es";

// Camins a...
// (serveix tant camí relatiu com camí absolut)
// Fitxer amb els sets de Smogon:
const fitxerSets = "sets.txt";
// Directori on hi ha els fons:
const dirFons = "FichasBR";
// Directori on desar les fitxes generades:
const dirDest = "Resultat";

// Font pels noms dels pokémon:
const fontMon = "bold 60px Power Clear";
// Font pels noms dels atacs i habilitat:
const fontAtq = "bold 32px Power Clear";
// Mida en píxels de les vores dels textos i objectes:
const outlineMon = 4, outlineAtacs = 3, outlineObjeteDesitjat = 2;

// Factor pel qual es vol reescalar els objectes:
const escalaObjecte = 2;
// Mida de les imatges de fons:
// Afecta a la mida de les imatges resuiltants.
const midaImatgeFons = {
    x: 805,
    y: 487
};
// Mida de les icones obtingudes dels objectes:
// 30x30 px correspon a les obtingudes de PokeAPI.
const midaSpriteObjecte = {
    x: 30,
    y: 30
};
// Posicions en píxels a les quals es vol colocar cada set:
const posicions = [
    { x: 50,  y: 110 },
    { x: 420, y: 110 },
    { x: 50,  y: 320 },
    { x: 420, y: 320 }
];
// Desplaçament dels moviments respecte al nom del pokémon:
const difPosMoviments = {
    x: 6,
    y: 30
};
// Desplaçament vertical de les icones dels objectes respecte al nom del pokémon:
const offsetObjecteDesitjat = -25;
// Distància entre linies de texte dels atacs i habilitat.
const espaiatAtacs = 4;

// Rep el nom d'una habilitat en anglès. Retorna el nom traduit a l'idioma configurat.
async function tradueixHabilitat(nom){
    return new Promise ((resolve, reject) => {
        // Si no es rep res, es retorna string buit.
        if (nom === undefined || nom === "") resolve ("");

        // Si la trobem a la cau, la tornem aviat.
        if (bufferHabs[nom] !== undefined) resolve (bufferHabs[nom]);

        // Modifiquem l'input per que l'accepti PokeAPI.
        // Tot en minúscules. Espais a guions. Sense cap altre caracter no alfanumeric.
        let nomFormat = nom.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');

        // Fem la petició HTTPS.
        https.get("https://pokeapi.co/api/v2/ability/" + nomFormat, res => {
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
                let noms = JSON.parse(Buffer.concat(data)).names;

                // Un cop tenim el JSON tractat, cerquem el camp que té el nom en el nostre idioma.
                for (let transl of noms){
                    if (transl.language.name === idioma){
                        bufferHabs[nom] = transl.name;
                        resolve (transl.name);
                    }
                }
            });
        }).on('error', err => {
            console.error(err.message);
            reject(err.message);
        });
    });
}

// Rep el nom d'un atac en anglès. Retorna el nom traduit a l'idioma configurat.
async function tradueixAtac(nom){
    return new Promise ((resolve, reject) => {
        // Si no es rep res, es retorna string buit.
        if (nom === undefined || nom === "") resolve ("");

        // Si el trobem a la cau, el tornem aviat.
        if (bufferAtacs[nom] !== undefined) resolve (bufferAtacs[nom]);

        // Modifiquem l'input per que l'accepti PokeAPI.
        // Tot en minúscules. Espais a guions. Sense cap altre caracter no alfanumeric.
        let nomFormat = nom.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');

        // Si tenim Poder Amagat, traiem el tipus.
        if (nomFormat.includes("hidden-power")) {
            nomFormat = nomFormat.substring(0, nomFormat.lastIndexOf('-'));
        }

        // Fem la petició HTTPS.
        https.get("https://pokeapi.co/api/v2/move/" + nomFormat, res => {
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
                let noms = JSON.parse(Buffer.concat(data)).names;

                // Un cop tenim el JSON tractat, cerquem el camp que té el nom en el nostre idioma.
                for (let transl of noms){
                    if (transl.language.name === idioma){
                        bufferAtacs[nom] = transl.name;
                        resolve (transl.name);
                    }
                }
            });
        }).on('error', err => {
            console.error(err.message);
            reject(err.message);
        });
    });
}

// Rep el nom d'un atac en anglès. Retorna el binari de la imatge.
async function obteObjecte(nom){
    return new Promise ((resolve, reject) => {
        // Si no es rep res, es retorna undefined.
        if (nom === undefined) resolve(undefined);

        // Si la trobem a la cau, la tornem aviat.
        if (bufferImgs[nom] !== undefined) resolve (bufferImgs[nom]);

        // Modifiquem l'input per que l'accepti PokeAPI.
        // Tot en minúscules. Espais a guions. Sense cap altre caracter no alfanumeric.
        let nomFormat = nom.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');

        // Fem la petició HTTPS.
        https.get("https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/" + nomFormat + ".png", res => {
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
                // Retornem la imatge sencera.
                let imatge = Buffer.concat(data);
                bufferImgs[nom] = imatge;
                resolve (imatge);
            });
        }).on('error', err => {
            console.error(err.message);
            reject(err.message);
        });
    });
}

function imatgeOutline(imatge, ctx, posx, posy){
    // Array amb les 8 direccions cardinals
    var dArr = [
        -1,-1,
         0,-1,
         1,-1,
        -1, 0,
         1, 0,
        -1, 1,
         0, 1,
         1, 1
    ];

    // Creem un nou canvas amb les mides de l'objecte.
    let canvasaux = createCanvas(
        (midaSpriteObjecte.x + outlineObjete * 2) * escalaObjecte,
        (midaSpriteObjecte.y + outlineObjete * 2) * escalaObjecte
    );
    let auxctx = canvasaux.getContext('2d');

    // Activem el reescalat, per veí més proper.
    auxctx.imageSmoothingEnabled = false;
    auxctx.scale(escalaObjecte, escalaObjecte);

    // Dibuixem la imatge 8 cops, desplaçada en les 8 direccions cardinals, a outlineObjete de distància.
    for(let i = 0; i < dArr.length; i += 2) auxctx.drawImage(
        imatge,
        outlineObjete + dArr[i]*outlineObjete,
        outlineObjete + dArr[i+1]*outlineObjete
    );

    // Omplim les 8 còpies de blanc.
    auxctx.globalCompositeOperation = "source-in";
    auxctx.fillStyle = "white";
    auxctx.fillRect(0,0,canvasaux.width, canvasaux.height);

    // Dibuixem l'objecte de normal.
    auxctx.globalCompositeOperation = "source-over";
    auxctx.drawImage(imatge, outlineObjete, outlineObjete);

    // Estampem aquest canvas al principal abans de tornar.
    ctx.drawImage(canvasaux, posx, posy);
}

// Buffer / cau on desem els atacs i habilitats traduits, i les imatges descarregades.
let bufferHabs = [], bufferAtacs = [], bufferImgs = [];
// Dividim per tenir la vora desitjada. Es necessita degut al rescalat.
const outlineObjete = outlineObjeteDesitjat / escalaObjecte;
// Multipliquem per obtenir l'offset desitjat. Es necessita degut al rescalat.
const offsetObjecte = offsetObjecteDesitjat * escalaObjecte;
// Entrades Per Mon : Constant per alguns bucles. Donat per 4 atacs + 1 habilitat + 1 objecte : 6
const epm = 6;

// Carreguem tots els fitxers del directori d'on agafar les plantilles.
const fitxers = fs.readdirSync(dirFons);
// Carreguem el fitxer amb els sets d'Smogon, i el separem per equips.
const equips = fs.readFileSync(fitxerSets).toString().split("\n\n\n");

// Iteerm per tots els equips
for (let [i, equip] of equips.entries()){

    // Separem els pokémon de l'equip.
    const mons = equip.split("\n\n");
    // Array amb els sets dels pokémon.
    let sets = [];

    // Canvas i context principal sobre el que treballarem.
    let canvas = createCanvas(midaImatgeFons.x, midaImatgeFons.y);
    let ctx = canvas.getContext('2d');

    // Preparem les traduccions i les imatges per després.
    let promesesTrads = [], promesesImg = [];

    // Obtenim el nom de l'equip:
    // === [${format}] ${nom equip} ===
    let fitxer, nomEquip = mons[0].split("] ")[1].split(" =")[0];

    // Carreguem una imatge de fons de les agafades del directori indicat.
    // Es fan en ordre. Ciclen, si hi ha més equips que no pas fons.
    fitxer = fitxers[i % fitxers.length];
    promesesImg[4] = loadImage(dirFons + "/" + fitxer);

    // Formatem els sets dels pokémon de cada equip, i per cadascun,
    // traduïm els noms dels atacs, habilitat i obtenim imatge de l'objecte.
    for (let j = 0; j <= j && j < mons.length - 1; ++j){
        sets[j] = Sets.importSet(mons[j+1]);
        promesesTrads[j*epm + 0] = tradueixAtac(sets[j].moves[0]);
        promesesTrads[j*epm + 1] = tradueixAtac(sets[j].moves[1]);
        promesesTrads[j*epm + 2] = tradueixAtac(sets[j].moves[2]);
        promesesTrads[j*epm + 3] = tradueixAtac(sets[j].moves[3]);
        promesesTrads[j*epm + 4] = tradueixHabilitat(sets[j].ability);
        promesesTrads[j*epm + 5] = obteObjecte(sets[j].item);
    }

    // Un cop hem rebut les (fins a) 5 traduccions i l'objecte, seguim:
    Promise.all(promesesTrads).then((traduccions) => {

        // Array on ens guardem la llargària en pixels del nom de cada Pokémon.
        let midanom = [];

        // Preparem les imatges dels objectes dels pokémon per després.
        for (let j = 0; j < 4 && j < mons.length - 1; ++j){
            promesesImg[j] = loadImage(traduccions[j*epm + 5]);
        }

        // Iterem sobre cada pokémon.
        for (let j = 0; j < 4 && j < mons.length - 1; ++j){

            // Dibuixem la vora al text del nom.
            // Hem de dibuixar la vora paraula per paraula, o algunes fonts ficaran
            // brossa on no volem.
            ctx.globalCompositeOperation = "source-over";
            ctx.font = fontMon;

            ctx.lineWidth = outlineMon;
            ctx.strokeStyle = 'white';
            // Dibuixem les vores de les paraules una a una.
            // De forma pràctica, afecta només a...
            //  Mr. Mime, Mime Jr., Mr. Rime, Codi Zero,
            //  Tapu Bulu, Tapu Fini, Tapu Lele i Tapu Koko.
            //  I potser les formes regionals.
            let sencer = "";
            for (let paraula of sets[j].species.split(' ')){
                ctx.strokeText(
                    paraula, 
                    posicions[j].x + ctx.measureText(sencer).width, 
                    posicions[j].y
                );
                sencer += " " + paraula;
            }

            // Escrivim per sobre el nom del pokémon.
            ctx.fillStyle = 'black';
            ctx.fillText(sets[j].species, posicions[j].x, posicions[j].y);

            // Desem la llargària del text del nom.
            midanom[j] = ctx.measureText(sets[j].species).width;

            // Atacs i Habilitat

            ctx.font = fontAtq;
            ctx.lineWidth = outlineAtacs;

            // Calculem l'alçada del text, per poder escriure linia per linia.
            let alcada = ctx.measureText("F").actualBoundingBoxAscent;

            // Dibuixem un a un, els noms dels atacs i l'habilitat del pokémon.
            // Primer fent la vora i després el texte.
            // Hem de dibuixar la vora paraula per paraula, o algunes fonts ficaran
            // brossa on no volem.
            for (let k = 0; k < 5; ++k){
                // Per a cada atac/habilitat, si no és buit...
                if (traduccions[j*epm + k] !== ''){
                    let texteReal;
                    if (k < 4) texteReal = "- " + traduccions[j*epm + k];
                    else texteReal = "Habilidad: " + traduccions[j*epm + k];
                    
                    // Dibuixem primer les vores de cada paraula una a una.
                    sencer = "";
                    for (let paraula of texteReal.split(' ')){
                        ctx.strokeText(
                            paraula, 
                            posicions[j].x + difPosMoviments.x + ctx.measureText(sencer).width, 
                            posicions[j].y + difPosMoviments.y + k * (alcada + espaiatAtacs)
                        );
                        sencer += " " + paraula;
                    }

                    // Escrivim per sobre el texte.
                    ctx.fillText(
                        texteReal, 
                        posicions[j].x + difPosMoviments.x, 
                        posicions[j].y + difPosMoviments.y + k * (alcada + espaiatAtacs)
                    );
                }
            }
        }

        // Imatges
        
        // Un cop han acabat de carregar les (fins a) 5 imatges, seguim:
        Promise.all(promesesImg).then((imatges) => {

            // Dibuixem els (fins a) 4 objectes, amb la vora blanca.
            for (let j = 0; j < 4 && j < mons.length - 1; ++j){
                if (imatges[j] !== undefined) imatgeOutline(
                    imatges[j], 
                    ctx, 
                    posicions[j].x + midanom[j], 
                    posicions[j].y + offsetObjecte
                );
            }

            // Dibuixem el fons darrere de tot.
            ctx.globalCompositeOperation = "destination-over";
            ctx.drawImage(imatges[4], 0, 0);

            // I finalment, desem a disc.
            let stream = canvas.createPNGStream();
            let out = fs.createWriteStream(dirDest + '/' + nomEquip + '.png');
            stream.pipe(out);
        });
    });
}