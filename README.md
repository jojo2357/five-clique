# five-clique
Improvement on https://gitlab.com/bpaassen/five_clique that sticks with the spirit of graph theory, but in a faster environment

To run (after on local machine)
* Download data file: `curl https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt>words_alpha.txt`
* Run parser: `node n-clique.js`

```
Parser OPTIONS:
no-anagrams       : if present in args, will remove all anagrams, but this doesn't meaningfully impact runtime complexity, so you'd be silly to not
wordsize <size> : the size of the word to use, default is 5
wordcount <count> : the number of words to use
outfile <filename>: the file to write results to. Writes in csv, so it is reccommended to provide a csv file.
```

Anagrams time: ~135s

No anagrams time: ~50s

Uses python: no
