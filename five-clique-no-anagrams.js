const fs = require('fs');

const start = Date.now();

function getTime() {
    return Date.now() - start;
}

process.on('exit', () => console.log(getTime(), "ms"));

/**
 * @param setA {number[]}
 * @param setB {number[]}
 * @return {number[]}
 */
function unionByFloor(setA, setB) {
    let aDex = 0, bDex = 0;
    let localOut = [];

    while (aDex < setA.length && bDex < setB.length) {
        if (setA[aDex] < setB[bDex])
            aDex++;
        else if (setA[aDex] > setB[bDex])
            bDex++;
        else {
            localOut.push(setA[aDex++]);
            bDex++;
        }
    }
    return localOut;
}

/**
 * @type {[{neighbors: number[], word: String, chars: String[], numneighbors: number}]}
 */
const data = fs.readFileSync("words_alpha.txt").toString().split(/\r?\n/).reduce((prev, line) => {
    if (line.length === 5) {
        let myAlph = line.split("").sort().join("");
        if (prev.every(word => word.alph !== myAlph) && line.split("").every((char, windex, arr) => arr.indexOf(char) === windex)) prev.push({
            word: line,
            chars: line.split("").sort(),
            alph: myAlph,
            neighbors: [],
            numneighbors: 0
        });
    }
    return prev;
}, []);

for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data.length; j++) {
        if (i !== j && data[i].chars.every(char => !data[j].chars.includes(char))) {
            ++data[i].numneighbors;
        }
    }
}

data.sort((a,b) => a.numneighbors - b.numneighbors);

for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
        if (data[i].chars.every(char => !data[j].chars.includes(char))) {
            data[i].neighbors.push(j);
        }
    }
}

console.log("gen'd graph", data.length, getTime());

let out = [];

for (let i = 0; i < data.length; i++) {
    if (!(i % 100))
        console.log(i, (100 * i / data.length).toFixed(2) + "%", out.length);
    let i_sNeighbors = data[i].neighbors;//.filter(naybur => naybur > i);
    for (const iNeighbor of i_sNeighbors) {
        let j_sNeighbors = unionByFloor(i_sNeighbors, data[iNeighbor].neighbors);
        for (const jNeighbor of j_sNeighbors) {
            let k_sNeighbors = unionByFloor(j_sNeighbors, data[jNeighbor].neighbors);
            for (const kNeighbor of k_sNeighbors) {
                let l_sNeighbors = unionByFloor(k_sNeighbors, data[kNeighbor].neighbors);
                for (const lNeighbors of l_sNeighbors)
                    out.push([i, iNeighbor, jNeighbor, kNeighbor, lNeighbors]);
            }
        }
    }
}

console.log(out.length);