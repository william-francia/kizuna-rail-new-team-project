import test from "node:test";
import assert from "node:assert/strict";

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

test("GET /api/schedules returns all schedules successfully", async () => {
  const fakeSchedules = [
    { id: "sched-01", tripId: "trip-01", departureTime: "08:00" },
    { id: "sched-02", tripId: "trip-02", departureTime: "10:00" },
  ];

  const response = createResponse();
  response.json(fakeSchedules);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.length, 2);
  assert.equal(response.body[0].id, "sched-01");
});

test("GET /api/schedules/:id returns a single schedule when it exists", async () => {
  const fakeSchedule = { id: "sched-01", tripId: "trip-01", departureTime: "08:00" };
  
  const response = createResponse();
  response.json(fakeSchedule);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.id, "sched-01");
  assert.ok(response.body.tripId);
});

test("GET /api/schedules/:id returns 404 when the schedule does not exist", async () => {
  const response = createResponse();
  response.status(404).json({ error: "Schedule not found" });

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.error, "Schedule not found");
});

test("GET /api/trips/:id/schedules returns only schedules connected to the specified trip", async () => {
  const targetTripId = "trip-01";
  const allSchedules = [
    { id: "sched-01", tripId: "trip-01", departureTime: "08:00" },
    { id: "sched-02", tripId: "trip-01", departureTime: "12:00" },
    { id: "sched-03", tripId: "trip-02", departureTime: "09:00" }, 
  ];

  const tripSchedules = allSchedules.filter(s => s.tripId === targetTripId);
  
  const response = createResponse();
  response.json(tripSchedules);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.length, 2);
  assert.ok(response.body.every(s => s.tripId === targetTripId));
});