import test from "node:test";
import assert from "node:assert/strict";
import {
  createGetAllTrips,
  parseTripPage,
  TRIPS_PER_PAGE,
} from "../src/controllers/trips.js";
import { getTripsPage } from "../src/models/trips.js";

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

function createFakeTripModel(trips) {
  return {
    find() {
      let results = [...trips];

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
    async countDocuments() {
      return trips.length;
    },
  };
}

test("parseTripPage accepts the default and positive integers", () => {
  assert.equal(parseTripPage(undefined), 1);
  assert.equal(parseTripPage("1"), 1);
  assert.equal(parseTripPage("12"), 12);
});

test("parseTripPage rejects invalid page values", () => {
  for (const value of ["0", "-1", "1.5", "abc", "", ["1", "2"]]) {
    assert.equal(parseTripPage(value), null);
  }
});

test("getTripsPage returns a deterministic second page from 11 records", async () => {
  const trips = Array.from({ length: 11 }, (_, index) => ({
    id: `trip-${String(11 - index).padStart(2, "0")}`,
  }));
  const fakeTripModel = createFakeTripModel(trips);

  const firstPage = await getTripsPage(1, TRIPS_PER_PAGE, {}, fakeTripModel);
  const secondPage = await getTripsPage(2, TRIPS_PER_PAGE, {}, fakeTripModel);

  assert.equal(firstPage.results.length, 10);
  assert.deepEqual(firstPage.results[0], { id: "trip-01" });
  assert.equal(secondPage.totalItems, 11);
  assert.deepEqual(secondPage.results, [{ id: "trip-11" }]);
});

test("paginated trips controller returns results and metadata for page 2", async () => {
  const findPage = async (page, perPage) => ({
    results: [{ id: "trip-11" }],
    totalItems: 11,
    page,
    perPage,
  });
  const findFilterOptions = async () => ({
    regions: ["central"],
    seasons: ["autumn"],
  });
  const handler = createGetAllTrips(findPage, findFilterOptions);
  const response = createResponse();

  await handler({ query: { page: "2" } }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    results: [{ id: "trip-11" }],
    meta: {
      page: 2,
      perPage: 10,
      totalItems: 11,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
      filters: {
        search: null,
        region: null,
        season: null,
      },
      availableFilters: {
        regions: ["central"],
        seasons: ["autumn"],
      },
    },
  });
});

test("paginated trips controller rejects a non-positive page", async () => {
  let queryWasCalled = false;
  const handler = createGetAllTrips(async () => {
    queryWasCalled = true;
    return { results: [], totalItems: 0 };
  });
  const response = createResponse();

  await handler({ query: { page: "0" } }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "Invalid page parameter");
  assert.equal(queryWasCalled, false);
});
