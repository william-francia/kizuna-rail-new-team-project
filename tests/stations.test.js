import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../server.js";

describe("Stations API", () => {
  describe("GET /api/stations", () => {
    it("should return all stations with their expected fields", async () => {
      const response = await request(app).get("/api/stations");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const nagoya = response.body.find((station) => station.id === "nagoya");

      expect(nagoya).toBeDefined();
      expect(nagoya.name).toBe("Nagoya Station");
      expect(nagoya.prefecture).toBe("Aichi");
      expect(nagoya.region).toBe("central");
      expect(Array.isArray(nagoya.facilities)).toBe(true);
      expect(typeof nagoya.description).toBe("string");
    });
  });

  describe("GET /api/stations/:id", () => {
    it("should return a station when its ID exists", async () => {
      const response = await request(app).get("/api/stations/nagoya");

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("nagoya");
      expect(response.body.name).toBe("Nagoya Station");
      expect(response.body.region).toBe("central");
      expect(response.body.facilities).toContain("restaurant");
    });

    it("should return 404 when the station does not exist", async () => {
      const response = await request(app).get(
        "/api/stations/station-that-does-not-exist",
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: "Station not found",
      });
    });
  });
});
