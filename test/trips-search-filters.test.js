import test from "node:test";
import assert from "node:assert/strict";
import {
  createGetAllTrips,
  MAX_SEARCH_LENGTH,
  parseTripFilters,
  TRIPS_PER_PAGE,
} from "../src/controllers/trips.js";
import {
  getTripFilterOptions,
  getTripsPage,
} from "../src/models/trips.js";

const sampleTrips = [
  {
    id: "trip-01",
    name: "Alpine Sunrise",
    description: "Mountain views and traditional villages.",
    region: "central",
    bestSeason: "autumn",
  },
  {
    id: "trip-02",
    name: "Coastal Breeze",
    description: "Ocean sunsets along the northern coast.",
    region: "northern",
    bestSeason: "summer",
  },
  {
    id: "trip-03",
    name: "Sakura Valley",
    description: "Cherry blossoms through historic towns.",
    region: "kansai",
    bestSeason: "spring",
  },
  {
    id: "trip-04",
    name: "Kansa Heritage",
    description: "A historic route with temple views.",
    region: "kansa",
    bestSeason: "autumn",
  },
  {
    id: "trip-05",
    name: "Snow Train",
    description: "A journey through WINTER wetlands.",
    region: "hokkaido",
    bestSeason: "winter",
  },
  {
    id: "trip-06",
    name: "Literal Symbols",
    description: "See the .* characters carved in stone.",
    region: "central",
    bestSeason: "summer",
  },
];

function matchesQuery(trip, query) {
  if (query.region && trip.region !== query.region) {
    return false;
  }

  if (query.bestSeason && trip.bestSeason !== query.bestSeason) {
    return false;
  }

  if (query.$or) {
    return query.$or.some((condition) => {
      const [field, regexQuery] = Object.entries(condition)[0];
      const regex = new RegExp(regexQuery.$regex, regexQuery.$options);
      return regex.test(trip[field]);
    });
  }

  return true;
}

function createFakeTripModel(trips) {
  return {
    find(query) {
      let results = trips.filter((trip) => matchesQuery(trip, query));

      return {
        sort(sortFields) {
          const fields = Object.keys(sortFields);
          results.sort((left, right) => {
            for (const field of fields) {
              const comparison = String(left[field]).localeCompare(String(right[field]));
              if (comparison !== 0) {
                return comparison * sortFields[field];
              }
            }
            return 0;
          });
          return this;
        },
        skip(amount) {
          results = results.slice(amount);
          return this;
        },
        limit(amount) {
          results = results.slice(0, amount);
          return this;
        },
        async lean() {
          return results;
        },
      };
    },
    async countDocuments(query) {
      return trips.filter((trip) => matchesQuery(trip, query)).length;
    },
    async distinct(field) {
      return [...new Set(trips.map((trip) => trip[field]))];
    },
  };
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("parseTripFilters trims search and treats blank search as absent", () => {
  assert.deepEqual(parseTripFilters({ search: "  alpine  ", region: "kansa" }), {
    filters: { search: "alpine", region: "kansa", season: null },
    errors: [],
  });
  assert.deepEqual(parseTripFilters({ search: "   " }).filters, {
    search: null,
    region: null,
    season: null,
  });
});

test("filter options include every exact stored region and season", async () => {
  const options = await getTripFilterOptions(createFakeTripModel(sampleTrips));

  assert.deepEqual(options.regions, ["central", "hokkaido", "kansa", "kansai", "northern"]);
  assert.deepEqual(options.seasons, ["autumn", "spring", "summer", "winter"]);
});

test("region filtering is exact and keeps kansa separate from kansai", async () => {
  const page = await getTripsPage(
    1,
    TRIPS_PER_PAGE,
    { region: "kansa" },
    createFakeTripModel(sampleTrips),
  );

  assert.deepEqual(page.results.map((trip) => trip.id), ["trip-04"]);
});

test("season filters the stored bestSeason field", async () => {
  const page = await getTripsPage(
    1,
    TRIPS_PER_PAGE,
    { season: "summer" },
    createFakeTripModel(sampleTrips),
  );

  assert.deepEqual(page.results.map((trip) => trip.id), ["trip-02", "trip-06"]);
});

test("search matches partial names and descriptions without case sensitivity", async () => {
  const model = createFakeTripModel(sampleTrips);
  const nameMatch = await getTripsPage(1, TRIPS_PER_PAGE, { search: "SUNRISE" }, model);
  const descriptionMatch = await getTripsPage(1, TRIPS_PER_PAGE, { search: "winter WET" }, model);

  assert.deepEqual(nameMatch.results.map((trip) => trip.id), ["trip-01"]);
  assert.deepEqual(descriptionMatch.results.map((trip) => trip.id), ["trip-05"]);
});

test("region, season, and search combine with AND", async () => {
  const page = await getTripsPage(
    1,
    TRIPS_PER_PAGE,
    { region: "central", season: "autumn", search: "mountain" },
    createFakeTripModel(sampleTrips),
  );

  assert.deepEqual(page.results.map((trip) => trip.id), ["trip-01"]);
});

test("search escapes regular expression characters", async () => {
  const page = await getTripsPage(
    1,
    TRIPS_PER_PAGE,
    { search: ".*" },
    createFakeTripModel(sampleTrips),
  );

  assert.deepEqual(page.results.map((trip) => trip.id), ["trip-06"]);
});

test("combined criteria can return an empty result", async () => {
  const page = await getTripsPage(
    1,
    TRIPS_PER_PAGE,
    { region: "northern", season: "winter" },
    createFakeTripModel(sampleTrips),
  );

  assert.equal(page.totalItems, 0);
  assert.deepEqual(page.results, []);
});

test("filtered results remain paginated at ten items", async () => {
  const trips = Array.from({ length: 11 }, (_, index) => ({
    id: `central-${String(index + 1).padStart(2, "0")}`,
    name: `Central route ${index + 1}`,
    description: "Mountain journey",
    region: "central",
    bestSeason: "autumn",
  }));
  trips.push({
    id: "northern-01",
    name: "Northern route",
    description: "Coastal journey",
    region: "northern",
    bestSeason: "summer",
  });
  const model = createFakeTripModel(trips);

  const firstPage = await getTripsPage(1, TRIPS_PER_PAGE, { region: "central" }, model);
  const secondPage = await getTripsPage(2, TRIPS_PER_PAGE, { region: "central" }, model);

  assert.equal(firstPage.results.length, 10);
  assert.equal(secondPage.results.length, 1);
  assert.equal(secondPage.totalItems, 11);
});

test("controller returns applied filters, global options, and pagination metadata", async () => {
  const model = createFakeTripModel(sampleTrips);
  const handler = createGetAllTrips(
    (page, perPage, filters) => getTripsPage(page, perPage, filters, model),
    () => getTripFilterOptions(model),
  );
  const response = createResponse();

  await handler({
    query: {
      page: "1",
      region: "central",
      season: "autumn",
      search: "  mountain  ",
    },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.results.map((trip) => trip.id), ["trip-01"]);
  assert.deepEqual(response.body.meta.filters, {
    search: "mountain",
    region: "central",
    season: "autumn",
  });
  assert.deepEqual(response.body.meta.availableFilters.regions, [
    "central",
    "hokkaido",
    "kansa",
    "kansai",
    "northern",
  ]);
  assert.equal(response.body.meta.perPage, 10);
  assert.equal(response.body.meta.totalItems, 1);
});

test("controller rejects unknown region and season values before querying trips", async () => {
  let pageWasQueried = false;
  const handler = createGetAllTrips(
    async () => {
      pageWasQueried = true;
      return { results: [], totalItems: 0 };
    },
    async () => ({ regions: ["central"], seasons: ["autumn"] }),
  );
  const response = createResponse();

  await handler({
    query: { region: "Central", season: "monsoon" },
  }, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body.details.map((detail) => detail.field), ["region", "season"]);
  assert.equal(pageWasQueried, false);
});

test("controller rejects unsafe filter shapes and overlong searches", () => {
  assert.deepEqual(parseTripFilters({ region: ["central", "kansai"] }).errors, [
    {
      field: "region",
      message: "region must be a single, non-empty string",
    },
  ]);
  assert.deepEqual(parseTripFilters({ search: ["mountain"] }).errors, [
    {
      field: "search",
      message: "search must be a single string",
    },
  ]);
  assert.deepEqual(parseTripFilters({ search: "x".repeat(MAX_SEARCH_LENGTH + 1) }).errors, [
    {
      field: "search",
      message: `search must be ${MAX_SEARCH_LENGTH} characters or fewer`,
    },
  ]);
});
