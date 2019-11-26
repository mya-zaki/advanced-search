# advanced-search

[![CircleCI](https://circleci.com/gh/mya-zaki/advanced-search.svg?style=svg)](https://circleci.com/gh/mya-zaki/advanced-search)

Parse search words.

## Execute examples

```
npm run examples
```

## search query syntax

Separator is Half-width space or Full-width space.

- OR
  - Any of these words.
- \-
  - None of these words.
- " "
  - Exact word or phrase.
- ( )
  - Grouping this query.

## Usage

```javascript
import AdvancedSearch from "@mya-zaki/advanced-search";

// query = 'foo bar OR baz'
const result = AdvancedSearch.parse(query);
```
