function runTests() {
  node n-clique.js wordsize $1 wordcount $2 guessoffset 0 no-anagrams
  node n-clique.js wordsize $1 wordcount $2 guessoffset 1 no-anagrams
  node n-clique.js wordsize $1 wordcount $2 guessoffset 2 no-anagrams
  node n-clique.js wordsize $1 wordcount $2 guessoffset 0
  node n-clique.js wordsize $1 wordcount $2 guessoffset 1
  node n-clique.js wordsize $1 wordcount $2 guessoffset 2
}

runTests 4 6
runTests 5 5
runTests 5 4
runTests 6 4
runTests 7 3
runTests 8 2
