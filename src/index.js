"use strict";

// query          = sentence, { separator, [ "OR", separator ] , sentence };
// sentence       = factor | clause;
// clause         = [ "-" ], (phrase | word );
// phrase         = '"', all characters - '"' , '"';
// word           = all characters - white space
// factor         = ( "(", query, ")" );
// separator      = white space+;
// white space    = ? white space characters ? ;
// all characters = ? all visible characters ? ;

export const parse = target => {
  const as = new AdvancedSearch();
  const result = as.query.exec(new Source(target));

  return result.match;
};

class AdvancedSearch {
  constructor() {
    this.whitespace = Parser.char("　 ");
    this.separator = Parser.map(
      Parser.seq(this.whitespace, Parser.many(this.whitespace)),
      parsed => {
        return null;
      }
    );
    this.phrase = Parser.map(
      Parser.seq(Parser.char('"'), Parser.regex(/[^"]+/), Parser.char('"')),
      parsed => {
        return parsed[1];
      }
    );
    this.word = Parser.regex(/[^ 　]+/);
    this.clause = Parser.map(
      Parser.seq(
        Parser.option(Parser.token("-")),
        Parser.choice(this.phrase, this.word)
      ),
      parsed => {
        return {
          not: parsed[0] === "-" ? true : false,
          phrase: parsed[1]
        };
      }
    );
    this.factor = Parser.lazy(() => {
      const parser = Parser.seq(
        Parser.token("("),
        this.query,
        Parser.token(")")
      );

      return Parser.map(parser, parsed => {
        return parsed[1];
      });
    });
    this.sentence = Parser.choice(this.factor, this.clause);
    this.query = Parser.map(
      Parser.seq(
        this.sentence,
        Parser.many(
          Parser.seq(
            this.separator,
            Parser.option(Parser.seq(Parser.token("OR"), this.separator)),
            this.sentence
          )
        )
      ),
      parsed => {
        let res = [[parsed[0]]];
        let index = 0;
        for (let i = 0; i < parsed[1].length; i++) {
          if (parsed[1][i][1] !== null) {
            res.push([parsed[1][i][2]]);
            index++;
          } else {
            res[index] = res[index].concat([parsed[1][i][2]]);
          }
        }
        return res;
      }
    );
  }
}

const Source = (function() {
  const string = Symbol("string");
  const position = Symbol("position");
  class Source {
    constructor(target) {
      this[string] = target.trim();
      this[position] = 0;
    }
    get string() {
      return this[string];
    }
    get position() {
      return this[position];
    }
    set position(value) {
      this[position] = value;
    }
  }
  return Source;
})();

class Result {
  constructor(status, match, source) {
    this.status = status;
    this.match = match;
    this.source = source;
  }
}

class Parser {
  constructor(parser) {
    this.parser = parser;
  }

  exec(source) {
    return this.parser(source);
  }

  static token(str) {
    const len = str.length;

    return new Parser(source => {
      if (source.string.substr(source.position, len) === str) {
        source.position += len;
        return new Result(true, str, source);
      } else {
        return new Result(false, null, source);
      }
    });
  }

  static char(str) {
    const dict = new Map();
    for (const c of [...str]) {
      dict.set(c, c);
    }

    return new Parser(source => {
      const char = source.string.substr(source.position, 1);
      if (dict.has(char)) {
        source.position += 1;
        return new Result(true, char, source);
      } else {
        return new Result(false, null, source);
      }
    });
  }

  static many(parser) {
    return new Parser(source => {
      const results = [];

      while (true) {
        const result = parser.exec(source);
        if (result.status) {
          results.push(result.match);
          source = result.source;
        } else {
          break;
        }
      }

      return new Result(true, results, source);
    });
  }

  static choice(...parsers) {
    return new Parser(source => {
      for (let parser of parsers) {
        const result = parser.exec(source);
        if (result.status) {
          return result;
        }
      }

      return new Result(false, null, source);
    });
  }

  static seq(...parsers) {
    return new Parser(source => {
      const results = [];
      for (let parser of parsers) {
        const result = parser.exec(source);

        if (result.status) {
          results.push(result.match);
          source = result.source;
        } else {
          return result;
        }
      }
      return new Result(true, results, source);
    });
  }

  static option(parser) {
    return new Parser(source => {
      const result = parser.exec(source);
      if (result.status) {
        return result;
      } else {
        return new Result(true, null, source);
      }
    });
  }

  static regex(regexp) {
    regexp = new RegExp(
      "^(?:" + regexp.source + ")",
      // (regexp.global ? "g" : "") +
      //   (regexp.multiline ? "m" : "") +
      regexp.ignoreCase ? "i" : ""
    );

    return new Parser(source => {
      regexp.lastIndex = 0;
      const regexResult = regexp.exec(source.string.slice(source.position));

      if (regexResult) {
        source.position += regexResult[0].length;
        return new Result(true, regexResult[0], source);
      } else {
        return new Result(false, null, source);
      }
    });
  }

  static lazy(callback) {
    let parse = null;
    return new Parser(source => {
      if (!parse) {
        parse = callback();
      }
      return parse.exec(source);
    });
  }

  static map(parser, shape) {
    return new Parser(source => {
      const result = parser.exec(source);
      if (result.status) {
        return new Result(result.status, shape(result.match), result.source);
      } else {
        return result;
      }
    });
  }
}
