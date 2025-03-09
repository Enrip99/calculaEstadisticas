import fs from 'fs';
import {Dex} from '@pkmn/dex';
import {Sets} from '@pkmn/sets';
import {createCanvas, loadImage} from 'canvas';
import * as https from 'node:https';


async function tradueixHabilitat(nom){
    return new Promise ((resolve, reject) => {
        if (bufferHabs[nom] !== undefined) resolve (bufferHabs[nom]);
        let nomFormat = nom.toLowerCase().replace(/ /g, '-');
        https.get("https://pokeapi.co/api/v2/ability/" + nomFormat, res => {
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
                let noms = JSON.parse(Buffer.concat(data)).names;
                for (let transl of noms){
                    if (transl.language.name === "es"){
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
                    if (transl.language.name === "es"){
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
        if (nom === undefined) resolve("")
        if (bufferImgs[nom] !== undefined) resolve (bufferImgs[nom]);
        let nomFormat = nom.toLowerCase().replace(/ /g, '-');
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
    

    // draw images at offsets from the array scaled by s
    for(let i = 0; i < dArr.length; i += 2) ctx.drawImage(imatge,
        posx + dArr[i]*OutlineObjete,
        posy + dArr[i+1]*OutlineObjete
    );
    // fill with color
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "green";
    ctx.fillRect(0,0,canvas.width, canvas.height);

    // draw original image in normal mode
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(imatge, posx, posy);
}


let bufferHabs = [], bufferAtacs = [], bufferImgs = [];

const dirFons = "FichasBR", dirDest = "Resultat";

const fitxers = fs.readdirSync(dirFons);

const equips = fs.readFileSync("sets.txt").toString().split("\n\n\n");

const posicions = [
    76, 124,
    426, 125,
    76, 325,
    426, 325
];
const difPosMoviments = [
    6, 25
];

const epm = 6; //Entrades Per Mon - 4 atacs + habilitat + objecte.

const outlineMon = 2, outlineAtacs = 1, OutlineObjete = 1;

for (let [i, equipo] of equips.entries()){
//for (let i = 0; i < equips.length; ++i){
    const mons = equips[i].split("\n\n");

    let canvas = createCanvas(805, 487);
    let ctx = canvas.getContext('2d')

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

    let traduccions = await Promise.all (promesesTrads);

    for (let j = 0; j <= j && j < mons.length - 1; ++j){
        // Nom pokémon
        ctx.globalCompositeOperation = "source-over";
        ctx.font = '65px roa_m_bold_loc21';
        ctx.fillStyle = 'black';
        ctx.fillText(sets[j].species, posicions[j*2], posicions[j*2 + 1]);
        ctx.lineWidth = outlineMon;
        ctx.strokeStyle = 'white';
        ctx.strokeText(sets[j].species, posicions[j*2], posicions[j*2 + 1]);
        let midanom = ctx.measureText(sets[j].species);

        // Atacs i Habilitat
        let atacsHab = "";
        for (let k = 0; k < 4; ++k){
            if (traduccions[j*epm + k] !== '') atacsHab += "- " + traduccions[j*epm + k];
            atacsHab += "\n";
        }
        atacsHab += "Habilidad: " + traduccions[j*epm + 4];

        ctx.font = '26px roa_m_bold_loc21';
        ctx.lineWidth = outlineAtacs;
        ctx.fillText(atacsHab, posicions[j*2] + difPosMoviments[0], posicions[j*2 + 1] + difPosMoviments[1]);
        ctx.strokeText(atacsHab, posicions[j*2] + difPosMoviments[0], posicions[j*2 + 1] + difPosMoviments[1]);
        
        // Objecte
        //loadImage(promesesTrads[j*epm + 5]).then( (icona) => {
        loadImage(obteObjecte("leftovers")).then( (icona) => {
            ctx.globalCompositeOperation = "source-over";
            //ctx.drawImage(icona, posicions[j*2] + midanom, posicions[j*2 + 1]);
            ctx.drawImage(icona, 100, 100);
            //imatgeOutline(icona, ctx, posicions[j*2] + midanom, posicions[j*2 + 1]);
        });
    }

    // Fons
    let fitxer, nomEquip = mons[0].split("] ")[1].split(" =")[0];
    if (i > fitxers.length) fitxer = fitxers[0];
    else fitxer = fitxers[i];
    loadImage(dirFons + "/" + fitxer).then((bg) => {
    //loadImage(algo).then((bg) => {
        ctx.globalCompositeOperation = "destination-over";
        //ctx.drawImage(bg, 0, 0);
        let stream = canvas.createPNGStream();
        let out = fs.createWriteStream(dirDest + '/' + nomEquip + '.png');
        stream.pipe(out);
    })
}