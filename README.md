# five-clique

Improvement on https://gitlab.com/bpaassen/five_clique that sticks with the spirit of graph theory, but in a faster
environment

To run (after on local machine)

* Download data file: `curl https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt>words_alpha.txt`
* If your wordfile is downloaded already, you may want to make a symbolic link `ln -s words_alpha.txt <file location>`
  That way you dont have to copy it
* Run parser: `node n-clique.js`
* If you did something silly and ran out of memory (some error about GC) then you should
  run `node --max-old-space-size=8000 n-clique.js`

```
Parser OPTIONS:
no-anagrams       : if present in args, will remove all anagrams, but this doesn't meaningfully impact runtime complexity, so you'd be silly to not
wordsize <size> : the size of the word to use, default is 5
wordcount <count> : the number of words to use
outfile <filename>: the file to write results to. Writes in csv, so it is reccommended to provide a csv file.
```

### Features

Uses python: no

### Data

Here lies the results of some quick unscientific testing that I did. I would like to draw the reader's attention to the
fact that **none** of these tests were even close to overrunning the one-hour barrier, let alone the one-month barrier.

| Word Size | Word Count | Anagrams? | Pool Size |       Winners | Best time (ms) | guessoffset used |
|:---------:|:----------:|:---------:|:---------:|--------------:|---------------:|:-----------------|
|     4     |     6      |     y     |   5549    | `111_898_839` |      `669_057` | 3                |
|     4     |     6      |     n     |   5977    |  `41_658_816` |      `613_278` | 3                |
|     5     |     5      |     y     |   10175   |         `831` |        `1_987` | 2                |
|     5     |     5      |     n     |   5977    |         `538` |        `1_957` | 2                |
|     5     |     4      |     y     |   10175   |  `56_692_666` |      `246_195` | 2                |
|     5     |     4      |     n     |   5977    |  `26_133_319` |      `215_487` | 2                |
|     6     |     4      |     y     |   13857   |           `5` |        `2_456` | 1                |
|     6     |     4      |     n     |   8988    |           `5` |        `2_557` | 1                |
|     7     |     3      |     y     |   13661   |       `1_877` |        `2_719` | 1                |
|     7     |     3      |     n     |   10024   |       `1_593` |        `2_653` | 1                |
|     8     |     3      |     y     |   10428   |         **0** |        `1_745` | 4                |
|     8     |     2      |     y     |   10428   |      `53_013` |        `2_200` | 3                |
|     8     |     2      |     n     |   8452    |      `45_214` |        `2_166` | 4                |
