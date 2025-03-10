import fs from 'fs';
import {Dex} from '@pkmn/dex';
import {Sets} from '@pkmn/sets';
import {createCanvas, loadImage} from 'canvas';
import * as https from 'node:https';

let bufferHabs = [], bufferAtacs = [], bufferImgs = [];

const idioma = "es";
const fitxerSets = "sets.txt", dirFons = "FichasBR", dirDest = "Resultat";

const fontMon = "bold 60px Power Clear";
const fontAtq = "bold 32px Power Clear"
const outlineMon = 2, outlineAtacs = 1.5, OutlineObjete = 1;

const escalaObjecte = 2;
const midaImatgeFons = {
    x: 805,
    y: 487
};
const midaSpriteObjecte = {
    x: 30,
    y: 30
};
const posicions = [
    { x: 50,  y: 110 },
    { x: 420, y: 110 },
    { x: 50,  y: 310 },
    { x: 420, y: 310 }
];
const difPosMoviments = {
    x: 6,
    y: 30
};
const offsetObjecte = -25 * escalaObjecte;
const espaiatAtacs = 4;


async function tradueixHabilitat(nom){
    return new Promise ((resolve, reject) => {
        if (bufferHabs[nom] !== undefined) resolve (bufferHabs[nom]);
        let nomFormat = nom.toLowerCase().replace(/ /g, '-').replace(/[']/g, '');
        https.get("https://pokeapi.co/api/v2/ability/" + nomFormat, res => {
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
                let noms = JSON.parse(Buffer.concat(data)).names;
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

async function tradueixAtac(nom){
    return new Promise ((resolve, reject) => {
        if (nom === undefined || nom === "") resolve ("");
        if (bufferAtacs[nom] !== undefined) resolve (bufferAtacs[nom]);
        let nomFormat = nom.toLowerCase().replace(/ /g, '-');
        if (nomFormat.includes("hidden-power")) {
            nomFormat = nomFormat.substring(0, nomFormat.lastIndexOf('-'));
        }
        https.get("https://pokeapi.co/api/v2/move/" + nomFormat, res => {
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
                let noms = JSON.parse(Buffer.concat(data)).names;
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

async function obteObjecte(nom){
    return new Promise ((resolve, reject) => {
        if (nom === undefined) resolve(undefined);
        if (bufferImgs[nom] !== undefined) resolve (bufferImgs[nom]);
        let nomFormat = nom.toLowerCase().replace(/ /g, '-').replace(/'/g, '');
        https.get("https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/" + nomFormat + ".png", res => {
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
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
    var dArr = [-1,-1, 0,-1, 1,-1, -1,0, 1,0, -1,1, 0,1, 1,1]; // offset array

    let canvasaux = createCanvas((midaSpriteObjecte.x + OutlineObjete * 2) * escalaObjecte, (midaSpriteObjecte.y + OutlineObjete * 2) * escalaObjecte);
    let auxctx = canvasaux.getContext('2d');

    auxctx.imageSmoothingEnabled = false;

    auxctx.scale(escalaObjecte, escalaObjecte);

    // draw images at offsets from the array scaled by s
    for(let i = 0; i < dArr.length; i += 2) auxctx.drawImage(imatge,
        OutlineObjete + dArr[i]*OutlineObjete,
        OutlineObjete + dArr[i+1]*OutlineObjete
    );
    // fill with color
    auxctx.globalCompositeOperation = "source-in";
    auxctx.fillStyle = "white";
    auxctx.fillRect(0,0,canvasaux.width, canvasaux.height);

    // draw original image in normal mode
    auxctx.globalCompositeOperation = "source-over";
    auxctx.drawImage(imatge, OutlineObjete, OutlineObjete);


    ctx.drawImage(canvasaux, posx, posy);
}

const epm = 6; //Entrades Per Mon - 4 atacs + habilitat + objecte.
const fitxers = fs.readdirSync(dirFons);
const equips = fs.readFileSync(fitxerSets).toString().split("\n\n\n");


for (let [i, equipo] of equips.entries()){
//for (let i = 0; i < equips.length; ++i){
    const mons = equipo.split("\n\n");

    let canvas = createCanvas(midaImatgeFons.x, midaImatgeFons.y);
    let ctx = canvas.getContext('2d');

    let promesesTrads = [];
    let sets = [];

    for (let j = 0; j <= j && j < mons.length - 1; ++j){
        sets[j] = Sets.importSet(mons[j+1]);
        promesesTrads[j*epm + 0] = tradueixAtac(sets[j].moves[0]);
        promesesTrads[j*epm + 1] = tradueixAtac(sets[j].moves[1]);
        promesesTrads[j*epm + 2] = tradueixAtac(sets[j].moves[2]);
        promesesTrads[j*epm + 3] = tradueixAtac(sets[j].moves[3]);
        promesesTrads[j*epm + 4] = tradueixHabilitat(sets[j].ability);
        promesesTrads[j*epm + 5] = obteObjecte(sets[j].item);
    }

    //let traduccions = await Promise.all (promesesTrads);

    Promise.all(promesesTrads).then((traduccions) => {
        let midanom = [];

        let promesesImg = [];
        let fitxer, nomEquip = mons[0].split("] ")[1].split(" =")[0];
        if (i > fitxers.length) fitxer = fitxers[0];
        else fitxer = fitxers[i];
        promesesImg[4] = loadImage(dirFons + "/" + fitxer);

        for (let j = 0; j < 4 && j < mons.length - 1; ++j){
            promesesImg[j] = loadImage(traduccions[j*epm + 5]);
        }

        for (let j = 0; j < 4 && j < mons.length - 1; ++j){
            // Nom pokémon
            ctx.globalCompositeOperation = "source-over";
            ctx.font = fontMon;
            ctx.fillStyle = 'black';
            ctx.fillText(sets[j].species, posicions[j].x, posicions[j].y);
            ctx.lineWidth = outlineMon;
            ctx.strokeStyle = 'white';
            
            // Stroke

            // Hem de dibuixar la vora paraula per paraula, o algunes fonts ficaran
            // brossa on no volem
            let sencer = "";
            for (let paraula of sets[j].species.split(' ')){
                ctx.strokeText(
                    paraula, 
                    posicions[j].x + ctx.measureText(sencer).width, 
                    posicions[j].y
                );
                sencer += " " + paraula;
            }

            midanom[j] = ctx.measureText(sets[j].species).width;

            // Atacs i Habilitat

            ctx.font = fontAtq;
            ctx.lineWidth = outlineAtacs;

            let alcada = ctx.measureText("F").actualBoundingBoxAscent;

            // Hem de dibuixar la vora paraula per paraula, o algunes fonts ficaran
            // brossa on no volem
            for (let k = 0; k < 5; ++k){
                if (traduccions[j*epm + k] !== ''){
                    let texteReal;
                    if (k < 4) texteReal = "- " + traduccions[j*epm + k];
                    else texteReal = "Habilidad: " + traduccions[j*epm + k];
                    ctx.fillText(
                        texteReal, 
                        posicions[j].x + difPosMoviments.x, 
                        posicions[j].y + difPosMoviments.y + k * (alcada + espaiatAtacs)
                    );
                    sencer = "";
                    for (let paraula of texteReal.split(' ')){
                        ctx.strokeText(
                            paraula, 
                            posicions[j].x + difPosMoviments.x + ctx.measureText(sencer).width, 
                            posicions[j].y + difPosMoviments.y + k * (alcada + espaiatAtacs
                        ));
                        sencer += " " + paraula;
                    }
                }
            }
        }

        // Fons
        
        Promise.all(promesesImg).then((imatges) => {

            for (let j = 0; j < 4 && j < mons.length - 1; ++j){
                if (imatges[j] !== undefined){
                    ctx.globalCompositeOperation = "source-over";
                    imatgeOutline(
                        imatges[j], 
                        ctx, 
                        posicions[j].x + midanom[j], 
                        posicions[j].y + offsetObjecte
                    );
                }
            }

            ctx.globalCompositeOperation = "destination-over";
            ctx.drawImage(imatges[4], 0, 0);
            let stream = canvas.createPNGStream();
            let out = fs.createWriteStream(dirDest + '/' + nomEquip + '.png');
            stream.pipe(out);
        });
    });
}