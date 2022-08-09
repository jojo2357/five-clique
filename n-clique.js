/*
command line usage: `node n-clique.js [OPTIONS]`

OPTIONS:
no-anagrams       : if present in args, will remove all anagrams, but this doesn't meaningfully impact runtime complexity, so you'd be silly to not
wordsize <size>   : the size of the word to use, default is 5
wordcount <count> : the number of words to use
outfile <filename>: the file to write results to. Writes in csv, so it is reccommended to provide a csv file.
 */

let args = process.argv.slice(2);

let options = {
    "includeanagrams": true,
    "wordsize": 5,
    "wordcount": 5
};

for (let i = 0; i < args.length; i += 2) {
    switch (args[i].toLowerCase()) {
        case "no-anagrams":
            i--;
            options.includeanagrams = false;
            break;
        case "wordsize":
            if (i + 1 === args.length)
                console.error("No option supplied for wordsize");
            else
                options.wordsize = Number.parseInt(args[i + 1]);
            break;
        case "wordcount":
            if (i + 1 === args.length)
                console.error("No option supplied for wordcount");
            else
                options.wordcount = Number.parseInt(args[i + 1]);
            break;
        case "outfile":
            if (i + 1 === args.length)
                console.error("No option supplied for outfile");
            else
                options.outfile = args[i + 1];
            break;
    }
}

/**
 * @type {Object.<string, string[]>}
 */
let indexMapping = {};

if (!options.outfile)
    options["outfile"] = `${options.wordsize}x${options.wordcount},${options.includeanagrams ? "anagrams" : "no_anagrams"}.csv`;

if (options.wordcount * options.wordsize > 26) {
    console.error("This program was not designed to handle overlap. Please use less words or smaller words");
    process.exit(-1);
}
if (options.wordcount < 2 || options.wordsize < 2) {
    console.error("invalid args");
    process.exit(-1);
}

const fs = require('fs');

const start = Date.now();

function getTime() {
    return Date.now() - start;
}

process.on('exit', () => console.log("Completed in", getTime(), "ms"));

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

process.stdout.write("Reading in data        \r");

/**
 * @type {[{neighbors: number[], word: String, alph: string, chars: String[], numneighbors: number}]}
 */
const data = fs.readFileSync("words_alpha.txt").toString().split(/\r?\n/).reduce((prev, line) => {
    if (line.length === options.wordsize) {
        let myAlph = line.split("").sort().join("");
        if (line.split("").every((char, windex, arr) => arr.indexOf(char) === windex)) {
            if (!indexMapping[myAlph]) {
                prev.push({
                    word: line,
                    chars: line.split("").sort(),
                    alph: myAlph,
                    neighbors: [],
                    numneighbors: 0
                });
                indexMapping[myAlph] = [line];
            } else if (options.includeanagrams) {
                indexMapping[myAlph].push(line);
            }
        }
    }
    return prev;
}, []);

process.stdout.write("Sorting data        \r");

/*for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data.length; j++) {
        if (i !== j && data[i].chars.every(char => !data[j].chars.includes(char))) {
            ++data[i].numneighbors;
        }
    }
}

data.sort((a, b) => a.numneighbors - b.numneighbors);*/

process.stdout.write("Connecting nodes        \r");

for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
        if (data[i].chars.every(char => !data[j].chars.includes(char))) {
            data[i].neighbors.push(j);
        }
    }
}

console.log("Created graph with", data.length, "entries.", `Took ${getTime()}ms`);

fs.writeFileSync(options.outfile, "");

let finds = 0;

function recursiveCombinations(list, n = 0, result = [], current = []) {
    if (n === list.length) result.push(current);
    else list[n].forEach(item => recursiveCombinations(list, n + 1, result, [...current, item]));

    return result;
}

function outputResult(...res) {
    if (options.includeanagrams) {
        let recurses = recursiveCombinations(res.map(windex => indexMapping[data[windex].alph]));
        fs.appendFileSync(options.outfile,
            recurses
                .reduce((previousValue, currentValue, currentIndex, array) => {
                    return previousValue + currentValue.join(",") + "\n";
                }, ""));
        finds += recurses.length;
    } else {
        fs.appendFileSync(options.outfile, res.reduce((previousValue, currentValue, currentIndex, array) => {
            return previousValue + indexMapping[data[currentValue].alph][0] + (currentIndex !== array.length - 1 ? "," : "");
        }, "") + "\n");
        ++finds;
    }
}

function recursiveFunction(startingIndex, acceptableNeighbors, depth, targetDepth, previousIndicies) {
    let newNeighbors = unionByFloor(acceptableNeighbors, data[startingIndex].neighbors);
    for (const newNeighbor of newNeighbors) {
        if (depth === targetDepth - 1) {
            outputResult(...previousIndicies, newNeighbor);
        } else {
            recursiveFunction(newNeighbor, newNeighbors, depth + 1, targetDepth, [...previousIndicies, newNeighbor]);
        }
    }
}

for (let i = 0; i < data.length; i++) {
    if (!(i % 100))
        console.log(i, (100 * i / data.length).toFixed(2) + "%", finds);
    let i_sNeighbors = data[i].neighbors;
    recursiveFunction(i, i_sNeighbors, 1, options.wordcount, [i]);
}

console.log("Found", finds, "results");
