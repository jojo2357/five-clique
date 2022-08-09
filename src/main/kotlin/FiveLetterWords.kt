import kotlinx.coroutines.*
import java.io.File
import java.io.FileWriter
import java.lang.Integer.parseInt
import java.util.*
import java.util.concurrent.atomic.AtomicInteger

val startTime = System.nanoTime()
val letterFrequencies = mutableMapOf<Char, AtomicInteger>()
val wordsByChars = mutableMapOf<Char, MutableSet<Word>>()

lateinit var settings: Settings

fun main(args: Array<String>) {
    settings= Settings.fromArgs(args)
    val words = File("words_alpha.txt")
        .readLines()                                            // load ALL THE WORDS
        .filter { it.length == settings.wordsize && it.toSet().size == settings.wordsize }      // only keep words with five distinct letters
        .distinctBy { it.toSortedSet() }                        // remove anagrams
        .mapIndexed { i, str -> Word(str, i) }.toSet()

    println("Processing ${words.size} unique ${settings.wordsize} letter words...")

    // Build a dictionary with lists of all words containing a given letter:
    //   'a' -> set of all words containing an 'a'
    //   'b' -> set of all words containing a 'b'
    //   and so on...
    words.forEach { word ->
        word.letters.forEach { char ->
            // Add current word to the list for the current letter
            wordsByChars.getOrPut(char) { mutableSetOf() } += word
            // Also count the frequencies of each letter
            letterFrequencies.getOrPut(char) { AtomicInteger() }.incrementAndGet()
        }
    }

    // Optionally: printLetterFrequencies()

    // Do all the work!
    val wordSets = findWordSets(words)

    // And we are done
    println(String.format(Locale.ENGLISH, "100.0%%, %5.1f secs", (System.nanoTime() - startTime) / 1e9))
    FileWriter(settings.outfile).use { writer ->
        wordSets.forEach {
            writer.write("$it\n")
        }
    }
    println("Wrote result.txt containing ${wordSets.size} ${settings.wordcount}-word sets")
}

/**
 * Main task: Search for sets of five words containing no duplicate letters. Uses coroutines to split the work
 * across all available CPU cores.
 * Result sets are returned as a list of comma-separated strings containing one five-word set per line.
 */
fun findWordSets(words: Set<Word>): Set<String> = runBlocking {
    // Intelligently select words to begin with:
    // Since valid sets of five words will use 25 letters, there can't be a set which contains neither an 'x' nor a
    // 'q'. By selecting all words containing an 'x' or a 'q' as seeds and then searching for four more words per seed
    // word we can't miss a set.
    // Instead of 'x' and 'q' we could choose two arbitrary letters here, but 'x' and 'q' are used for being the two
    // least frequent ones, which minimizes the size of the list of seed words. This reduces processing time by quite
    // a bit.
    // As an additional minor optimization we sort the seed words, so that seeds containing more low frequency letters
    // are tested first. This isn't strictly necessary but helps in better utilizing all CPU cores until the end.
    val neededSeeds = 27 - (settings.wordsize * settings.wordcount)
    val seedWords = wordsByChars.map { item -> item.value }
        .sortedBy { set -> set.size }
        .subList(0, neededSeeds)
        .reduceRight { word, acc -> (acc + word).toMutableSet() }

    val wordResults = mutableListOf<Deferred<Set<Set<Word>>>>()
    val progressCount = AtomicInteger()
    withContext(Dispatchers.Default) {
        seedWords.forEach { seed ->
            // Use coroutines to process each word in parallel
            wordResults += async {
                // Collect all valid sets of five words for the current seed word
                val result = findWords(words, seed, 0)
                // Update progress after we are done with the current word
                printProgress(progressCount.incrementAndGet(), seedWords.size)
                // Return result
                result
            }
        }
    }

    // Collect all coroutine / seed word results and return them as the final result
    wordResults
        .flatMap { deferred -> deferred.await() }
        .map { setOfFiveWords -> setOfFiveWords.sorted().joinToString { it.word } }
        .toSortedSet()
}

/**
 * This is where the magic happens:
 * Recursively collect words (not sharing any letters with [addWord]) from the given set of word [candidates]. If we
 * reach a recursion [depth] of 4, we found a valid set five words with only distinct letters and return it.
 */
fun findWords(candidates: Set<Word>, addWord: Word, depth: Int): Set<Set<Word>> {
    if (depth == settings.wordcount - 1) {
        // We reached the maximum recursion depth, i.e. we found a valid five-word set!
        // Return addWord, which will be combined with the other words of the set in the higher recursion levels.
        return setOf(setOf(addWord))

    } else {
        // Filter candidate words: Remove all words containing letters of our current addWord. We can do this
        // relatively fast because of the words-by-character lists we built in the beginning.
        val remainingWords = candidates.toMutableSet()
        addWord.letters.forEach { remainingWords -= wordsByChars[it]!! }

        val result = mutableSetOf<Set<Word>>()
        remainingWords.filter { depth == 0 || it.index > addWord.index }.forEach { candidate ->
            // Iterate over remaining candidate words and recursively select additional words not sharing any letters
            // with the current candidate word. If we are deeper than level 0 we can skip words, which have a lower
            // index than our current addWord, because these combinations where already checked in previous  iterations.
            // On level 0 this does not work, because we use a reduced set of seed words.
            findWords(remainingWords, candidate, depth + 1).forEach { subSet ->
                // If we get here, the deeper recursion levels found valid words. Combine them with the current addWord
                // to a sorted set and add it to the result. We use a sorted set here, so that different combinations
                // of the same words will result in equal sets and therefore only appear once in the result.
                result += subSet + addWord
            }
        }

        // Return the result of this iteration. It will be either empty or contain sets of words of size (5 - depth),
        // i.e. at depth 3, result will contain two word sets up to depth 0, where result contains five word sets.
        return result
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
 * Helper function to print the frequencies of all letters in the given collection of words.
 */
fun printLetterFrequencies() {
    letterFrequencies.map { it.key to it.value }
        .sortedBy { (_, freq) -> freq.get() }
        .forEach { (char, freq) ->
            println("$char: $freq")
        }
}

/**
 * Wrapper class containing a single word and a few other properties for faster compare operations.
 */
class Word(val word: String, val index: Int) : Comparable<Word> {
    val letters = word.toCharArray()
    override fun compareTo(other: Word): Int = index.compareTo(other.index)
    override fun equals(other: Any?): Boolean = this === other
    override fun hashCode(): Int = index
}

class Settings(var wordsize: Int, var wordcount: Int, var includeanagrams: Boolean, var outfile: String) {
    companion object {
        fun fromArgs(args: Array<String>): Settings {
            var wordsize = 5
            var wordcount = 5
            var includeanagrams = false
            var outfile = ""
            for (i in 0 until args.size step 2) {
                when (args[i].lowercase(Locale.getDefault())) {
                    "include-anagrams" -> {

                        includeanagrams = true
                    }

                    "wordsize" -> {
                        if (i + 1 == args.size)
                            error("No option supplied for wordsize")
                        else
                            wordsize = parseInt(args[i + 1])
                    }

                    "wordcount" -> {
                        if (i + 1 == args.size)
                            error("No option supplied for wordcount")
                        else
                            wordcount = parseInt(args[i + 1])
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