# DataCleaner

### Approach

The data is hard to use, as many of the needed fields contained extra characters--leftovers from wikipedia's citations and footnotes.  I made heavy use of regex replacements to clean it up. I also used regexes to convert the budget information into a usable format so I could calculate an average, e.g. converting strings like "1.2 million" into `1200000`.

Note also that some data is in GBP. Accounting for this on a one-off basis is likely the weakest point of the implementation given that larger data sets could possibly include other currencies.  Also, the nested `if-else` clauses are a bit hard to follow. In a subsequent refactor I'd probably extract more of the regex subs into methods.

The cleaner is run by instantiating the 'DataCleaner' class, and running a series of instance methods that ultimately print the desired information to `STDOUT`.

For more implementation details, please see the comments in the script itself.

### Required technologies

1.  Ruby v 2.3.1
2.  httparty (0.14.0)
3.  Terminal or a similar terminal emulator

### Directions

Within the script's directory:

- Install ruby if not already installed on your machine.  For a version manager, I recommend the very simple [chruby](https://github.com/postmodern/chruby).

- Install [httparty](https://github.com/jnunemaker/httparty):

```sh
gem install httparty
```

Once finished, simply invoke the script:

```sh
ruby oscars.rb
```

Note that because the script makes a separate API call for *every* year's winning film (87), the script does take a bit to complete.
