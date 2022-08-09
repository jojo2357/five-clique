# five-clique

Improvement on https://gitlab.com/bpaassen/five_clique that sticks with the spirit of graph theory, but in a faster
environment

To run (after on local machine)

* Download data file: `curl https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt>words_alpha.txt`
* If your wordfile is downloaded already, you may want to make a symbolic link `ln -s words_alpha.txt <file location>`
  That way you dont have to copy it
* Run parser: `node n-clique.js`

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

Here lies the results of some quick unscientific testing that I did. Lower word sizes seem to exceed the heap so I will
go back and fix that. I would like to draw the reader's attention to the fact that **none** of these tests overran the
one-minute barrier, let alone the one month barrier.

| Word Size | Word Count | Anagrams? | Pool Size | Winners | Runtime (ms) |
|:---------:|:----------:|:---------:|:---------:|:-------:|:------------:|
|     5     |     5      |     y     |   5977    |   831   |    49177     |
|     5     |     5      |     n     |   5977    |   538   |    48400     |
|     6     |     4      |     y     |   8988    |    5    |    10538     |
|     6     |     4      |     n     |   8988    |    5    |    10515     |
|     7     |     3      |     y     |   10024   |  1877   |     7890     |
|     7     |     3      |     n     |   10024   |  1593   |     8203     |
|     8     |     3      |     y     |   8452    |    0    |     5157     |
|     8     |     3      |     n     |   8452    |  ~~~~   |     ~~~~     |
|     8     |     2      |     y     |   8452    |  53013  |     5730     |
|     8     |     2      |     n     |   8452    |  45214  |     5694     |
