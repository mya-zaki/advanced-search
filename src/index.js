"use strict";

import AdvancedSearch from "./advanced-search";

export default {
  parse: target => {
    const as = new AdvancedSearch();
    const result = as.exec(target);

    return result.match;
  }
};
