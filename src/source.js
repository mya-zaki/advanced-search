"use strict";

export const Source = (function() {
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

export class ParseResult {
  constructor(status, match, source) {
    this.status = status;
    this.match = match;
    this.source = source;
  }
}
