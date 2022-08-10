import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileWriter
import java.util.*
import java.util.concurrent.atomic.AtomicInteger

val startTime = System.nanoTime()

lateinit var settings: Settings
lateinit var words: List<Word>

val results = mutableSetOf<Array<Int>>()

const val extras = 2

val letterCounts = Array<Helper>(26) { windex -> Helper('a' + windex, AtomicInteger(0)) }

class Helper(val character: Char, val count: AtomicInteger)

fun main(args: Array<String>) {
    settings = Settings.fromArgs(args)
    words =
        if (settings.includeanagrams)
            File("words_alpha.txt")
                .readLines()                                            // load ALL THE WORDS
                .filter { it.length == settings.wordsize && it.toSet().size == settings.wordsize }      // only keep words with five distinct letters
                .mapIndexed { i, str -> Word(str, i, ArrayList<Int>()) }
        else
            File("words_alpha.txt")
                .readLines()                                            // load ALL THE WORDS
                .filter { it.length == settings.wordsize && it.toSet().size == settings.wordsize }      // only keep words with five distinct letters
                .distinctBy { it.toSortedSet() }                        // remove anagrams
                .mapIndexed { i, str -> Word(str, i, ArrayList<Int>()) }

    println("Processing ${words.size} ${settings.wordsize} letter words...")

    words.forEach { word ->
        word.letters.forEach { char ->
            letterCounts[char - 'a'].count.incrementAndGet()
        }
    }

    letterCounts.sortBy { it.count.toInt() }

    val letterSet = letterCounts.map { it.character }.subList(0, 2 + extras).toSet()

    words.forEach {
        it.numRarities = it.letters.intersect(letterSet).size
    }

    words = words.sortedBy { -it.numRarities }

    println(String.format(Locale.ENGLISH, "100.0%%, %5.1f secs", (System.nanoTime() - startTime) / 1e9))

    findWordSets(words)

    // And we are done
    println(String.format(Locale.ENGLISH, "100.0%%, %5.1f secs", (System.nanoTime() - startTime) / 1e9))
    FileWriter(settings.outfile).use { writer ->
        results.forEach {
            writer.write("${it.joinToString(",") { value -> words[value].word }}\n")
        }
    }
    println("Wrote ${settings.outfile} containing ${results.size} ${settings.wordcount}-word sets")
}

fun unionByFloor(setA: ArrayList<Int>, setB: ArrayList<Int>): ArrayList<Int> {
    var aDex = 0
    var bDex = 0

    val localOut = ArrayList<Int>(setA.size.coerceAtMost(setB.size))

    while (aDex < setA.size && bDex < setB.size) {
        if (setA[aDex] < setB[bDex])
            aDex++;
        else if (setA[aDex] > setB[bDex])
            bDex++;
        else {
            localOut.add(setA[aDex++]);
            bDex++;
        }
    }
    return localOut
}

fun recursiveFunction(
    startingIndex: Int,
    previousIndicies: Array<Int>,
    acceptableNeighbors: ArrayList<Int>,
    depth: Int = 1
) {
    val needsMoreRarities =
        previousIndicies.foldIndexed(0) { index, acc, i -> acc + if (index < depth) {
            words[i].numRarities
        } else 0 } < 1 + extras
    for (newNeighbor in acceptableNeighbors) {
        if (needsMoreRarities && words[newNeighbor].numRarities == 0)
            break;
        previousIndicies[depth] = newNeighbor
        if (depth == settings.wordcount - 1) {
            results.add(previousIndicies.clone());
        } else {
            val newNeighbors = unionByFloor(acceptableNeighbors, words[newNeighbor].neighbors);
            recursiveFunction(newNeighbor, previousIndicies, newNeighbors, depth + 1);
        }
    }
}

/**
 * Main task: Search for sets of five words containing no duplicate letters. Uses coroutines to split the work
 * across all available CPU cores.
 * Result sets are returned as a list of comma-separated strings containing one five-word set per line.
 */
fun findWordSets(words: List<Word>) = runBlocking {
    val progressCount = AtomicInteger()
    withContext(Dispatchers.Default) {
        for (i in words.size - 1 downTo 0) {
            for (j in i + 1 until words.size) {
                if (words[i].letters.intersect(words[j].letters.asIterable().toSet()).isEmpty())
                    words[i].neighbors.add(j)
            }
            if (words[i].numRarities > 0) {
                async {
                    val arr = Array<Int>(settings.wordcount) { windex -> if (windex == 0) i else -1 }
                    recursiveFunction(i, arr, words[i].neighbors)
                    if (progressCount.incrementAndGet() % 100 == 0)
                        print(
                            "${progressCount.toInt()} ${("%.2f").format(100 * progressCount.toDouble() / words.size)}% ${results.size}\r"
                        )
                }
            } else progressCount.incrementAndGet()
        }
    }
}

/**
 * From time to time, prints progress info to the console.
 */
fun printProgress(progress: Int, size: Int) {
    if (progress % 10 == 0) {
        println(
            String.format(
                Locale.ENGLISH, "%5.1f%%, %5.1f secs...",
                100f * progress / size, (System.nanoTime() - startTime) / 1e9
            )
        )
    }
}

/**
 * Wrapper class containing a single word and a few other properties for faster compare operations.
 */
class Word(val word: String, val createdIndex: Int, val neighbors: ArrayList<Int>) : Comparable<Word> {
    lateinit var numneighbors: Number
    var numRarities = -1
    val letters = word.toCharArray()
    override fun compareTo(other: Word): Int = createdIndex.compareTo(other.createdIndex)
    override fun equals(other: Any?): Boolean = this === other
    override fun hashCode(): Int = createdIndex
}

class Settings(var wordsize: Int, var wordcount: Int, var includeanagrams: Boolean, var outfile: String) {
    companion object {
        fun fromArgs(args: Array<String>): Settings {
            var wordsize = 5
            var wordcount = 5
            var includeanagrams = false
            var outfile = ""
            for (i in args.indices step 2) {
                when (args[i].lowercase(Locale.getDefault())) {
                    "include-anagrams" -> {
                        includeanagrams = true
                    }

                    "wordsize" -> {
                        if (i + 1 == args.size)
                            error("No option supplied for wordsize")
                        else
                            wordsize = Integer.parseInt(args[i + 1])
                    }

                    "wordcount" -> {
                        if (i + 1 == args.size)
                            error("No option supplied for wordcount")
                        else
                            wordcount = Integer.parseInt(args[i + 1])
                    }

                    "outfile" -> {
                        if (i + 1 == args.size)
                            error("No option supplied for outfile")
                        else
                            outfile = args[i + 1]
                    }
                }
            }
            if (outfile.isEmpty()) {
                outfile =
                    wordsize.toString() + "x" + wordcount.toString() + "," + (if (includeanagrams) "anagrams" else "no_anagrams") + ".csv"
            }
            return Settings(wordsize, wordcount, includeanagrams, outfile)
        }
    }
}
