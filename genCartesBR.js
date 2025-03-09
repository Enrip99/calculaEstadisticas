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
            console.log(err.message);
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
            console.log(err.message);
            reject(err.message);
        });
    });
}

let bufferHabs = [], bufferAtacs = [];

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


for (let [i, equipo] of equips.entries()){
//for (let i = 0; i < equips.length; ++i){
    const mons = equips[i].split("\n\n");

    let canvas = createCanvas(805, 487);
    let ctx = canvas.getContext('2d')

    let promesesTrads = [];
    let sets = [];

    for (let j = 0; j <= j && j < mons.length - 1; ++j){
        sets[j] = Sets.importSet(mons[j+1]);
        promesesTrads[j*5 + 0] = tradueixAtac(sets[j].moves[0]);
        promesesTrads[j*5 + 1] = tradueixAtac(sets[j].moves[1]);
        promesesTrads[j*5 + 2] = tradueixAtac(sets[j].moves[2]);
        promesesTrads[j*5 + 3] = tradueixAtac(sets[j].moves[3]);
        promesesTrads[j*5 + 4] = tradueixHabilitat(sets[j].ability);
    }

    let traduccions = await Promise.all (promesesTrads);
    //console.log(traduccions);

    for (let j = 0; j <= j && j < mons.length - 1; ++j){
        // Nom pokémon
        ctx.font = '65px roa_m_bold_loc21';
        ctx.fillStyle = 'black';
        ctx.fillText(sets[j].species, posicions[j*2], posicions[j*2 + 1]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white';
        ctx.strokeText(sets[j].species, posicions[j*2], posicions[j*2 + 1]);

        // Atacs i Habilitat
        let atacsHab = "";
        for (let k = 0; k < 4; ++k){
            if (traduccions[j*5 + k] !== '') atacsHab += "- " + traduccions[j*5 + k];
            atacsHab += "\n";
        }
        atacsHab += "Habilidad: " + traduccions[j*5 + 4];

        ctx.font = '26px roa_m_bold_loc21';
        ctx.lineWidth = 1;
        ctx.fillText(atacsHab, posicions[j*2] + difPosMoviments[0], posicions[j*2 + 1] + difPosMoviments[1]);
        ctx.strokeText(atacsHab, posicions[j*2] + difPosMoviments[0], posicions[j*2 + 1] + difPosMoviments[1]);
        // Objecte

    }

    // Fons
    let fitxer, nomEquip = mons[0].split("] ")[1].split(" =")[0];
    if (i > fitxers.length) fitxer = fitxers[0];
    else fitxer = fitxers[i];
    loadImage(dirFons + "/" + fitxer).then((bg) => {
        ctx.globalCompositeOperation = "destination-over";
        ctx.drawImage(bg, 0, 0);
        let stream = canvas.createPNGStream();
        let out = fs.createWriteStream(dirDest + '/' + nomEquip + '.png');
        stream.pipe(out);
    })
}