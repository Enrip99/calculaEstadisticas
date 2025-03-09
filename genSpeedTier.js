import fs from 'fs';
import {Dex} from '@pkmn/dex';
import {Sets} from '@pkmn/sets';
import {Generations} from '@pkmn/data';

const gens = new Generations(Dex);
let gen = gens.get(4);

let llistat = [];

let habilitats = ["Chlorophyll", "Unburden", "Swift Swim"];

let equips = fs.readFileSync("sets.txt").toString().split("\n\n\n");

for (let equip of equips){
    let nomEquip;
    let mons = equip.split("\n\n");
    for (let mon in mons){
        if (mon == 0){
            nomEquip = mons[mon].split("] ")[1].split(" =")[0];
        }
        else{
            const set = Sets.importSet(mons[mon]);
            let ivs = 31, evs = 0;
            if (set.ivs !== undefined) ivs = set.ivs.spe;
            if (set.evs !== undefined) evs = set.evs.spe;
            llistat.push({
                velocitat: gen.stats.calc('spe', gen.species.get(set.species).baseStats.spe, ivs, evs, set.level, gen.natures.get(set.nature)),
                nom: set.species,
                equip: nomEquip,
            })
            if (habilitats.includes(set.ability)){
                llistat.push({
                    velocitat: 2 * gen.stats.calc('spe', gen.species.get(set.species).baseStats.spe, ivs, evs, set.level, gen.natures.get(set.nature)),
                    nom: set.species + " (" + set.ability + ")",
                    equip: nomEquip,
                })
            }
        }
    }
}

console.log(llistat.sort((a,b) => b.velocitat - a.velocitat))