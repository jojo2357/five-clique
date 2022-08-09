/*
command line usage: `node n-clique.js [OPTIONS]`

OPTIONS:
no-anagrams       : if present in args, will remove all anagrams, but this doesn't meaningfully impact runtime complexity, so you'd be silly to not
wordsize <size>   : the size of the word to use, default is 5
wordcount <count> : the number of words to use
outfile <filename>: the file to write results to. Writes in csv, so it is reccommended to provide a csv file.
 */

//begin imports
const fs = require('fs'); // for file I/O
//end imports

/* ---------- BEGIN CREATING GLOBAL VARS ----------------*/

let totalCombinationsFound = 0;

/**
 * This is a Dictionary that the alpabetically sorted word as the key (aka "".split("").sort().join()),
 * and the value is an array containing all the found words that have those same letters
 *
 * @type {Object.<string, string[]>}
 */
let anagramMappings = {};

/* ---------- FINISH CREATING GLOBAL VARS ----------------*/


/* ---------- BEGIN PARSING COMMAND LINE ----------------*/

/**
 * @type {{wordcount: number, includeanagrams: boolean, wordsize: number, outfile: string}}
 */
let globalOptions = {
    "includeanagrams": true,
    "wordsize": 5,
    "wordcount": 5
};

handleArgs: {
    //remove node location and file location
    let args = process.argv.slice(2);

    for (let i = 0; i < args.length; i += 2) {
        switch (args[i].toLowerCase()) {
            case "no-anagrams":
                i--;
                globalOptions.includeanagrams = false;
                break;
            case "wordsize":
                if (i + 1 === args.length)
                    console.error("No option supplied for wordsize");
                else
                    globalOptions.wordsize = Number.parseInt(args[i + 1]);
                break;
            case "wordcount":
                if (i + 1 === args.length)
                    console.error("No option supplied for wordcount");
                else
                    globalOptions.wordcount = Number.parseInt(args[i + 1]);
                break;
            case "outfile":
                if (i + 1 === args.length)
                    console.error("No option supplied for outfile");
                else
                    globalOptions.outfile = args[i + 1];
                break;
            default:
                i--;
        }
    }
    //default outfile is dynamic
    if (!globalOptions.outfile)
        globalOptions["outfile"] = `${globalOptions.wordsize}x${globalOptions.wordcount},${globalOptions.includeanagrams ? "anagrams" : "no_anagrams"}.csv`;
    //clear outfile and make sure it exists
    fs.writeFile(globalOptions.outfile, "", fsCallback);
}

/* ---------- FINISH PARSING COMMAND LINE ----------------*/

if (globalOptions.wordcount * globalOptions.wordsize > 26) {
    console.error("This program was not designed to handle overlap. Please use less words or smaller words");
    process.exit(-1);
}
if (globalOptions.wordcount < 2 || globalOptions.wordsize < 2) {
    console.error("invalid args");
    process.exit(-1);
}

/* ---------- BEGIN PURE UTILITY FUNCTIONS ----------------*/
//these functions can be put in a seperate file and not really care at all

/**
 * This function will return the intersection of two arrays without callbacks. This is the fastest way I have seen
 * this function done, and I tried it in python and that didnt go well likely because Set is better, but using the
 * default intersection doesnt get to abuse some assumptions we know
 *
 * @param setA {number[]} THIS MUST BE SORTED IN ASCENDING ORDER
 * @param setB {number[]} THIS MUST BE SORTED IN ASCENDING ORDER
 * @return {number[]} The intersection of the two arrays
 */
function intersection(setA, setB) {
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
 * @param {T[][]} list
 * @param {number} n
 * @param {T[][]} result
 * @param {T[][]} current
 *
 * @return T[][]
 *
 * @template T
 */
function recursiveCombinations(list, n = 0, result = [], current = []) {
    if (n === list.length) result.push(current);
    else list[n].forEach(item => recursiveCombinations(list, n + 1, result, [...current, item]));

    return result;
}

//these functions can be put in a seperate file and not really care at all
/* ---------- FINISH PURE UTILITY FUNCTIONS ----------------*/

/* ---------- BEGIN SETTINGS-DEPENDENT FUNCTIONS ----------------*/
//these functions only rely on what the settings are to function properly, and must be retooled or go along
// with the settings if the were to migrate to a different file

/**
 * Just the default async callback to detect an I/O error and tell you all about it
 *
 * @param {NodeJS.ErrnoException|number} err
 */
function fsCallback(err) {
    if (err) {
        console.error(`Something went wrong writing to ${globalOptions.outfile}`);
        process.exit(err);
    }
}

/**
 * Writes the submitted solution to the [output file]{@link globalOptions}. If anagrams are requested, will also interpolate anagrams
 *
 * @param res {number[]}
 *
 * @return {number} The number of lines output by the function (useful to count number of anagram combinations)
 */
function outputResult(...res) {
    if (globalOptions.includeanagrams) {
        let recurses = recursiveCombinations(res.map(windex => anagramMappings[data[windex].chars.join("")]));
        fs.appendFileSync(globalOptions.outfile,
            recurses
                .reduce((previousValue, currentValue) => {
                    return previousValue + currentValue.join(",") + "\n";
                }, "")/*, fsCallback*/);
        return recurses.length
    } else {
        fs.appendFileSync(globalOptions.outfile, res.reduce((previousValue, currentValue, currentIndex, array) => {
            return previousValue + anagramMappings[data[currentValue].chars.join("")][0] + (currentIndex !== array.length - 1 ? "," : "");
        }, "") + "\n"/*, fsCallback*/);
        return 1;
    }
}
//these functions only rely on what the settings are to function properly, and must be retooled or go along
// with the settings if they were to migrate to a different file
/* ---------- FINISH SETTINGS-DEPENDENT FUNCTIONS ----------------*/

/**
 * I consider this to be the official start
 *
 * @type {number}
 */
const start = Date.now();

/**
 * Quick, clean way to get time elapsed
 *
 * @return {number} milliseconds since start
 */
function getTime() {
    return Date.now() - start;
}

//This way, if we error out, we still get a message
process.on('exit', () => console.log("Completed in", getTime(), "ms"));

process.stdout.write("Reading in data        \r");

/**
 * The real deal. Here comes the data!
 *
 * @type {[{neighbors: number[], word: String, chars: String[], numneighbors: number}]}
 */
const data = fs.readFileSync("words_alpha.txt").toString().split(/\r?\n/).reduce((prev, line) => {
    if (line.length === globalOptions.wordsize) {
        let myAlph = line.split("").sort().join("");
        if (line.split("").every((char, windex, arr) => arr.indexOf(char) === windex)) {
            if (!anagramMappings[myAlph]) {
                prev.push({
                    word: line,
                    chars: line.split("").sort(),
                    neighbors: [],
                    numneighbors: 0
                });
                anagramMappings[myAlph] = [line];
            } else if (globalOptions.includeanagrams) {
                anagramMappings[myAlph].push(line);
            }
        }
    }
    return prev;
}, []);

process.stdout.write("Sorting data        \r");

/**
 * Ok this might seem odd, but trust me when I say that by sorting the data in ascending order by who has the fewest to most
 * compatible words actaully saves more time than it takes. To do the sort
 *
 * (xyzqv would go last since they have a LOT of connections, rstle would likely go first because a lot of words share those letters)
 */
sortData: {
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data.length; j++) {
            if (i !== j && data[i].chars.every(char => !data[j].chars.includes(char))) {
                ++data[i].numneighbors;
            }
        }
    }

    data.sort((a, b) => a.numneighbors - b.numneighbors);
}

process.stdout.write(`Connecting ${data.length} nodes and running  \n`);

/**
 * This is the workhorse recurser. It will keep going down the chain it was started on, and when it finds a result, it
 * [outputs]{@link outputResult} it to save memory.
 *
 * @param {number} startingIndex
 * @param {number[]} acceptableNeighbors
 * @param {number} depth
 * @param {number[]} previousIndicies
 */
function findDeepConnections(startingIndex, acceptableNeighbors, depth = 1, previousIndicies = [startingIndex]) {
    for (const newNeighbor of acceptableNeighbors) {
        //have we got to the holy grail?
        if (depth === globalOptions.wordcount - 1) {
            //Yes! Now phone home and tell them what we found (tell them the indicies in order)
            totalCombinationsFound += outputResult(...previousIndicies, newNeighbor);
        } else {
            //No, but we have a clue, lets find who to talk to
            let newNeighbors = intersection(acceptableNeighbors, data[newNeighbor].neighbors);
            if (newNeighbors.length)
                findDeepConnections(newNeighbor, newNeighbors, depth + 1, [...previousIndicies, newNeighbor]);
        }
    }
    delete previousIndicies;
}

//this is the little block you were waiting for. It is optimized into one loop, sorry about that.
for (let i = data.length - 1; i >= 0; --i) {
    //first we have to locate our friends which all happen to be at indicies above ours and -- coincidentally -- all have their friends figured out
    let i_sNeighbors = data[i].neighbors;
    for (let j = i + 1; j < data.length; j++) {
        if (data[i].chars.every(char => !data[j].chars.includes(char))) {
            i_sNeighbors.push(j);
        }
    }

    //let the world know we aren't dead yet!
    //if (!((data.length - i - 1) % 100))
        process.stdout.write(`${data.length - i - 1} ${(100 * (data.length - i - 1) / data.length).toFixed(2)}% ${totalCombinationsFound} ${getTime()}ms               \r`);
    //if we have friends, lets go ask them for some mutual friends
    if (i_sNeighbors.length)
        findDeepConnections(i, i_sNeighbors);
}

console.log("Found", totalCombinationsFound, "results");
//all done
