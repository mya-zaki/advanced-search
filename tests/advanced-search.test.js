"use strict";

import AdvancedSearch from "../src/advanced-search";

test("single", () => {
  const as = new AdvancedSearch();

  expect(as.exec("foo").match).toEqual({
    query: {
      phrase: "foo",
      not: false
    }
  });
});

test("not", () => {
  const as = new AdvancedSearch();

  expect(as.exec("-foo").match).toEqual({
    query: {
      phrase: "foo",
      not: true
    }
  });
});

test("phrase", () => {
  const as = new AdvancedSearch();

  expect(as.exec('"-foo"').match).toEqual({
    query: {
      phrase: "-foo",
      not: false
    }
  });
  expect(as.exec('"foo bar"').match).toEqual({
    query: {
      phrase: "foo bar",
      not: false
    }
  });
  expect(as.exec('""""').match).toEqual({
    query: {
      phrase: '"',
      not: false
    }
  });
});

test("and", () => {
  const as = new AdvancedSearch();

  expect(as.exec("foo bar").match).toEqual({
    query: {
      must: [
        {
          phrase: "foo",
          not: false
        },
        {
          phrase: "bar",
          not: false
        }
      ]
    }
  });
});

test("or", () => {
  const as = new AdvancedSearch();

  expect(as.exec("foo OR bar OR baz").match).toEqual({
    query: {
      should: [
        {
          phrase: "foo",
          not: false
        },
        {
          phrase: "bar",
          not: false
        },
        {
          phrase: "baz",
          not: false
        }
      ]
    }
  });
});

test("and-or", () => {
  const as = new AdvancedSearch();

  expect(as.exec("foo bar OR -baz").match).toEqual({
    query: {
      should: [
        {
          must: [
            {
              phrase: "foo",
              not: false
            },
            {
              phrase: "bar",
              not: false
            }
          ]
        },
        {
          phrase: "baz",
          not: true
        }
      ]
    }
  });
});

test("or-and", () => {
  const as = new AdvancedSearch();

  expect(as.exec("foo OR bar -baz").match).toEqual({
    query: {
      should: [
        {
          phrase: "foo",
          not: false
        },
        {
          must: [
            {
              phrase: "bar",
              not: false
            },
            {
              phrase: "baz",
              not: true
            }
          ]
        }
      ]
    }
  });
});

test("group", () => {
  const as = new AdvancedSearch();

  expect(as.exec("foo ( bar OR baz )").match).toEqual({
    query: {
      must: [
        {
          phrase: "foo",
          not: false
        },
        {
          query: {
            should: [
              {
                phrase: "bar",
                not: false
              },
              {
                phrase: "baz",
                not: false
              }
            ]
          }
        }
      ]
    }
  });

  expect(as.exec("(foo)").match).toEqual({
    query: {
      query: {
        phrase: "foo",
        not: false
      }
    }
  });
  expect(as.exec("(foo)()").match).toEqual({
    query: {
      query: {
        phrase: "foo)(",
        not: false
      }
    }
  });
});

test("multiple", () => {
  const as = new AdvancedSearch();

  expect(
    as.exec(
      'Lorem -ipsum (dolor OR -"sit amet") (( consectetur "(adipiscing OR elit)" ) OR sed) do'
    ).match
  ).toEqual({
    query: {
      must: [
        {
          phrase: "Lorem",
          not: false
        },
        {
          phrase: "ipsum",
          not: true
        },
        {
          query: {
            should: [
              {
                phrase: "dolor",
                not: false
              },
              {
                phrase: "sit amet",
                not: true
              }
            ]
          }
        },
        {
          query: {
            should: [
              {
                query: {
                  must: [
                    {
                      phrase: "consectetur",
                      not: false
                    },
                    {
                      phrase: "(adipiscing OR elit)",
                      not: false
                    }
                  ]
                }
              },
              {
                phrase: "sed",
                not: false
              }
            ]
          }
        },
        {
          phrase: "do",
          not: false
        }
      ]
    }
  });
});

test("irregular", () => {
  const as = new AdvancedSearch();

  expect(as.exec('"""').match).toBeNull();
  expect(as.exec("-(foo)").match).toBeNull();
  expect(as.exec("()").match).toBeNull();
  expect(as.exec(")(").match).toBeNull();
  expect(as.exec(")foo").match).toBeNull();
  expect(as.exec("(foo").match).toBeNull();
  expect(as.exec("(foo)(").match).toBeNull();
});
