"use strict";

import Parser from "./parser";
import { Source } from "./source";

// query          = sentence, { separator, [ "OR", separator ] , sentence };
// sentence       = factor | clause;
// clause         = [ "-" ], ( phrase | word );
// phrase         = '"', { all characters - '"' | '""' } , '"';
// word           = all characters - ( white space | '"' | "(" | ")" ), { { all characters - white space }, all characters - ( white space | ")" ) }
// factor         = "(", { separator }, query, { separator }, ")";
// separator      = white space+;
// white space    = ? white space characters ? ;
// all characters = ? all visible characters ? ;

export default class AdvancedSearch {
  exec(target) {
    return this.query.exec(new Source(target));
  }

  constructor() {
    this.whitespace = Parser.char("　 ");
    this.separator = Parser.map(
      Parser.seq(this.whitespace, Parser.many(this.whitespace)),
      parsed => {
        return null;
      }
    );
    this.phrase = Parser.map(
      Parser.seq(
        Parser.token('"'),
        Parser.regex(/([^"]|"")+/),
        Parser.token('"')
      ),
      parsed => {
        return {
          value: parsed[1].replace('""', '"'),
          phrased: true
        };
      }
    );
    this.word = Parser.map(
      Parser.regex(/[^ 　\"\(\)]([^ 　]*[^ 　\)])*/),
      parsed => {
        return {
          value: parsed,
          phrased: false
        };
      }
    );
    this.clause = Parser.map(
      Parser.seq(
        Parser.option(Parser.token("-")),
        Parser.choice(this.phrase, this.word)
      ),
      parsed => {
        parsed[1].not = parsed[0] === "-" ? true : false;
        return parsed[1];
      }
    );
    this.factor = Parser.lazy(() => {
      const parser = Parser.seq(
        Parser.token("("),
        Parser.option(this.separator),
        this.query,
        Parser.option(this.separator),
        Parser.token(")")
      );

      return Parser.map(parser, parsed => {
        return parsed[2];
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
        let res = new Result(parsed[0]);
        for (let i = 0; i < parsed[1].length; i++) {
          if (isOrQuery(parsed[1][i][1])) {
            res.pushOr(parsed[1][i][2]);
          } else {
            res.pushAnd(parsed[1][i][2]);
          }
        }
        return res.getQuery();
      }
    );

    const isOrQuery = parsed => {
      return parsed !== null && parsed[0] === "OR";
    };
  }
}

class Result {
  constructor(parsed) {
    this.tmp = [parsed];
    this.query = parsed;
  }

  getQuery() {
    return { query: this.query };
  }

  pushOr(parsed) {
    if (this.query.should) {
      this.query.should.push(parsed);
    } else {
      if (this.tmp.length === 1) {
        this.tmp = this.tmp.pop();
      }
      this.query = {
        should: [this.tmp, parsed]
      };
    }
    this.tmp = [parsed];
  }

  pushAnd(parsed) {
    if (this.tmp.must) {
      this.tmp.must.push(parsed);
    } else {
      this.tmp = this.tmp.pop();
      this.tmp = {
        must: [this.tmp, parsed]
      };
    }
    if (this.query.should) {
      this.query.should.pop();
      this.query.should.push(this.tmp);
    } else {
      this.query = this.tmp;
    }
  }
}
