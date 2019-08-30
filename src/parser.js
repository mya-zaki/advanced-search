"use strict";

import { ParseResult } from "./source";

export default class Parser {
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
        return new ParseResult(true, str, source);
      } else {
        return new ParseResult(false, null, source);
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
        return new ParseResult(true, char, source);
      } else {
        return new ParseResult(false, null, source);
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

      return new ParseResult(true, results, source);
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

      return new ParseResult(false, null, source);
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
      return new ParseResult(true, results, source);
    });
  }

  static option(parser) {
    return new Parser(source => {
      const result = parser.exec(source);
      if (result.status) {
        return result;
      } else {
        return new ParseResult(true, null, source);
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
        return new ParseResult(true, regexResult[0], source);
      } else {
        return new ParseResult(false, null, source);
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
        return new ParseResult(
          result.status,
          shape(result.match),
          result.source
        );
      } else {
        return result;
      }
    });
  }
}
