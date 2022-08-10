/*
command line usage: `node n-clique.js [OPTIONS]`

OPTIONS:
no-anagrams          : if present in args, will remove all anagrams, but this doesn't meaningfully impact runtime complexity, so you'd be silly to not
guessoffset <offset> : specify the amount of extra seed letters to use above the minimum
wordsize <size>      : the size of the word to use, default is 5
wordcount <count>    : the number of words to use
outfile <filename>   : the file to write results to. Writes in csv, so it is reccommended to provide a csv file.
 */

//begin imports
const fs = require('fs'); // for file I/O
//end imports

/* ---------- BEGIN CREATING GLOBAL VARS ----------------*/

/**
 * Number of output lines
 *
 * @type {number}
 */
let totalCombinationsFound = 0;

/**
 * This is the count of **all words being considered**. Not to be confused with the length of the [data]{@link data}, for that does not have anagrams included
 *
 * @see {@link anagramMappings} for more on anagrams
 *
 * @type {number}
 */
let wordCount = 0;

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
 * @type {{wordcount: number, includeanagrams: boolean, wordsize: number, outfile: string, guessoffset: number}}
 */
let globalOptions = {
    "includeanagrams": true,
    "wordsize": 5,
    "wordcount": 5,
    "guessoffset": 2
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
            case "guessoffset":
                if (i + 1 === args.length)
                    console.error("No option supplied for guessoffset");
                else
                    globalOptions.guessoffset = Number.parseInt(args[i + 1]);
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
/**
 * @type {number}
 */
const numbersRequired = globalOptions.wordcount * globalOptions.wordsize;
if (numbersRequired > 26) {
    console.error("This program was not designed to handle overlap. Please use less words or smaller words");
    process.exit(-1);
}
if (globalOptions.wordcount < 2 || globalOptions.wordsize < 2) {
    console.error("invalid args");
    process.exit(-1);
}

//print options
console.log("Running with settings:");
for (const [globalOptionsKey, globalOptionsValue] of Object.entries(globalOptions)) {
    console.log(globalOptionsKey, globalOptionsValue);
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
 * @see https://stackoverflow.com/questions/53311809/all-possible-combinations-of-a-2d-array-in-javascript
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
 *
 * @deprecated Async isnt very good for constant appending, as it causes memory leakage
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
        let recurses = recursiveCombinations(res.map(windex => anagramMappings[data[windex].dictIndex]));
        fs.appendFileSync(globalOptions.outfile,
            recurses
                .reduce((previousValue, currentValue) => {
                    return previousValue + currentValue.join(",") + "\n";
                }, ""));
        return recurses.length;
    } else {
        fs.appendFileSync(globalOptions.outfile, res.reduce((previousValue, currentValue, currentIndex, array) => {
            return previousValue + anagramMappings[data[currentValue].dictIndex][0] + (currentIndex !== array.length - 1 ? "," : "");
        }, "") + "\n");
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
 * This array will have objects for each of the letters, and will be sorted later, so we include the original char as an anchor
 *
 * @type {{char: String, val: Number}[]}
 */
let letterDistributions = [];

//init it
for (let i = 'a'.charCodeAt(0); i <= 'z'.charCodeAt(0); i++) {
    letterDistributions.push({char: String.fromCharCode(i), val: 0});
}

/**
 * The real deal. Here comes the data! Read in the data and store it for later
 *
 * @type {[{neighbors: number[], word: String, chars: String[], winnersection: number, dictIndex: String}]}
 */
const data = fs.readFileSync("words_alpha.txt").toString().split(/\r?\n/).reduce((prev, line) => {
    if (line.length === globalOptions.wordsize) {
        let myAlph = line.split("").sort().join("");
        if (line.split("").every((char, windex, arr) => arr.indexOf(char) === windex)) {
            if (!anagramMappings[myAlph]) {
                wordCount++;

                prev.push({
                    word: line,
                    chars: line.split("").sort(),
                    dictIndex: myAlph,
                    neighbors: [],
                });

                //increment the buckets so we know which is the least frequent
                for (let i = 0; i < globalOptions.wordsize; i++) {
                    letterDistributions[line.charCodeAt(i) - "a".charCodeAt(0)].val++;
                }

                anagramMappings[myAlph] = [line];
            } else if (globalOptions.includeanagrams) {
                wordCount++;

                anagramMappings[myAlph].push(line);
            }
        }
    }
    return prev;
}, []);

process.stdout.write("Sorting data        \r");

/**
 * These are the resolved problem characters that are least frequently found in our word base
 *
 * @type {String[]}
 */
let targetChars = letterDistributions
    //most frequent letters go last
    .sort((a, b) => a.val - b.val)
    //we will simultaneously perform .slice(0, 27 + globalOptions.guessoffset - (globalOptions.wordcount * globalOptions.wordsize))
    //alongside .map(val => val.char)
    .reduce((previousValue, currentValue, currentIndex) => {
        if (currentIndex < globalOptions.guessoffset + (27 - numbersRequired))
            previousValue.push(currentValue.char);
        return previousValue;
    }, [])
    //just for giggles and maybe speed not sure how smart includes is?
    .sort();

//Take all our data, and sort it so that the words with the most targetChars come first (low indicies). Also cache this value under the objects themselves
data.sort((a, b) => {
    return (b.winnersection ? b.winnersection : b.winnersection = targetChars.filter(char => b.chars.includes(char)).length) - (a.winnersection ? a.winnersection : a.winnersection = targetChars.filter(char => a.chars.includes(char)).length);
});

process.stdout.write(`Connecting ${data.length} nodes for ${wordCount} words and running with it. Initialized in ${getTime()}ms\n`);

/**
 * This is the workhorse recurser. It will keep going down the chain it was started on, and when it finds a result, it
 * [outputs]{@link outputResult} it to save memory.
 *
 * @param {number} startingIndex
 * @param {number[]} acceptableNeighbors
 * @param {number} depth
 * @param {number[]} previousIndicies
 * @param {number} problemLetterCount
 */
function findDeepConnections(startingIndex, acceptableNeighbors, depth = 1, previousIndicies = [startingIndex], problemLetterCount = data[startingIndex].winnersection) {
    let needsMoreLetters = problemLetterCount < targetChars.length - (26 - numbersRequired);
    for (const newNeighbor of acceptableNeighbors) {
        //if we need more problem letters, and this one has none, then we have nothing left to scan for, the next ones wont help
        if (needsMoreLetters && !data[newNeighbor].winnersection)
            break;
        //have we got to the holy grail?
        if (depth === globalOptions.wordcount - 1) {
            //Yes! Now phone home and tell them what we found (tell them the indicies in order)
            totalCombinationsFound += outputResult(...previousIndicies, newNeighbor);
        } else {
            //No, but we have a clue, lets find who to talk to
            let newNeighbors = intersection(acceptableNeighbors, data[newNeighbor].neighbors);
            if (newNeighbors.length)
                findDeepConnections(newNeighbor, newNeighbors, depth + 1, [...previousIndicies, newNeighbor], problemLetterCount + data[newNeighbor].winnersection);
        }
    }
    //delete previousIndicies;
}

//this is the little block you were waiting for. It is optimized into one loop, sorry about that.
for (let i = data.length - 1; i >= 0; --i) {
    //first we have to locate our friends which all happen to be at indicies above ours and -- coincidentally -- all have their friends figured out
    for (let j = i + 1; j < data.length; j++) {
        if (data[i].chars.every(char => !data[j].chars.includes(char))) {
            data[i].neighbors.push(j);
        }
    }

    //if we have neighbors and at least 1 problem letter
    if (data[i].neighbors.length && data[i].winnersection) {
        process.stdout.write(`${data.length - i - 1} ${(100 * (data.length - i - 1) / data.length).toFixed(2)}% ${totalCombinationsFound} ${getTime()}ms               \r`);
        findDeepConnections(i, data[i].neighbors);
    }
}

console.log("\nFound", totalCombinationsFound, "results");
//all done
