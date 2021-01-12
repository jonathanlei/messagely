"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const { SECRET_KEY } = require("../config");



describe("User Routes Test", function () {
  // Creating token for Username `test1`, to be used in tests
  const token = jwt.sign({ username: "test1" }, SECRET_KEY);
  const _token = { "_token": token };

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    const u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });
  });

  describe("GET /", function () {
    test("can get list of users", async function () {
      let response = await request(app)
        .get("/users")
        .send(_token);

      // console.log(response);

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        "users": [
          {
            username: "test1",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000"
          }]
      });
    });
  });
});

afterAll(async function () {
  await db.end();
});
