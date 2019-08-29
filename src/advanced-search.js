"use strict";

import Parser from "./parser";
import { Source } from "./source";

// query          = sentence, { separator, [ "OR", separator ] , sentence };
// sentence       = factor | clause;
// clause         = [ "-" ], ( phrase | word );
// phrase         = '"', all characters - '"' , '"';
// word           = all characters - white space
// factor         = ( "(", query, ")" );
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
