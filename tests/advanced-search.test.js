"use strict";

import AdvancedSearch from "../src/advanced-search";

test("single", () => {
  const as = new AdvancedSearch();

  expect(as.exec("foo").match).toEqual({
    query: {
      value: "foo",
      phrased: false,
      not: false
    }
  });
});

test("not", () => {
  const as = new AdvancedSearch();

  expect(as.exec("-foo").match).toEqual({
    query: {
      value: "foo",
      phrased: false,
      not: true
    }
  });
});

test("phrase", () => {
  const as = new AdvancedSearch();

  expect(as.exec('"-foo"').match).toEqual({
    query: {
      value: "-foo",
      phrased: true,
      not: false
    }
  });
  expect(as.exec('"foo bar"').match).toEqual({
    query: {
      value: "foo bar",
      phrased: true,
      not: false
    }
  });
  expect(as.exec('""""').match).toEqual({
    query: {
      value: '"',
      phrased: true,
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
          value: "foo",
          phrased: false,
          not: false
        },
        {
          value: "bar",
          phrased: false,
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
          value: "foo",
          phrased: false,
          not: false
        },
        {
          value: "bar",
          phrased: false,
          not: false
        },
        {
          value: "baz",
          phrased: false,
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
              value: "foo",
              phrased: false,
              not: false
            },
            {
              value: "bar",
              phrased: false,
              not: false
            }
          ]
        },
        {
          value: "baz",
          phrased: false,
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
          value: "foo",
          phrased: false,
          not: false
        },
        {
          must: [
            {
              value: "bar",
              phrased: false,
              not: false
            },
            {
              value: "baz",
              phrased: false,
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
          value: "foo",
          phrased: false,
          not: false
        },
        {
          query: {
            should: [
              {
                value: "bar",
                phrased: false,
                not: false
              },
              {
                value: "baz",
                phrased: false,
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
        value: "foo",
        phrased: false,
        not: false
      }
    }
  });
  expect(as.exec("(foo)()").match).toEqual({
    query: {
      query: {
        value: "foo)(",
        phrased: false,
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
          value: "Lorem",
          phrased: false,
          not: false
        },
        {
          value: "ipsum",
          phrased: false,
          not: true
        },
        {
          query: {
            should: [
              {
                value: "dolor",
                phrased: false,
                not: false
              },
              {
                value: "sit amet",
                phrased: true,
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
                      value: "consectetur",
                      phrased: false,
                      not: false
                    },
                    {
                      value: "(adipiscing OR elit)",
                      phrased: true,
                      not: false
                    }
                  ]
                }
              },
              {
                value: "sed",
                phrased: false,
                not: false
              }
            ]
          }
        },
        {
          value: "do",
          phrased: false,
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
