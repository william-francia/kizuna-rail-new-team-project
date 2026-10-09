import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../server.js";

describe("Trip and station relationships", () => {
  it("should return the correct origin and destination for a trip", async () => {
    const tripResponse = await request(app).get("/api/trips/alpine-panorama");

    expect(tripResponse.status).toBe(200);
    expect(tripResponse.body.id).toBe("alpine-panorama");

    expect(tripResponse.body.startStation).toBe("nagoya");
    expect(tripResponse.body.endStation).toBe("toyama");

    const originResponse = await request(app).get(
      `/api/stations/${tripResponse.body.startStation}`,
    );

    const destinationResponse = await request(app).get(
      `/api/stations/${tripResponse.body.endStation}`,
    );

    expect(originResponse.status).toBe(200);
    expect(destinationResponse.status).toBe(200);

    expect(originResponse.body.id).toBe("nagoya");
    expect(originResponse.body.name).toBe("Nagoya Station");

    expect(destinationResponse.body.id).toBe("toyama");
    expect(destinationResponse.body.name).toBe("Toyama Station");
  });
});
