"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");
const { SECRET_KEY } = require("../config");

describe("Message Routes Test", function () {
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
      phone: "+12513519439",
    });

    const u2 = await User.register({
      username: "test2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14088024820",
    });
    
    const u3 = await User.register({
      username: "test3badphone",
      password: "password",
      first_name: "Test3",
      last_name: "bad phone",
      phone: "+12",
    });
    

  });

  describe("POST /", function () {
    test("can successfully post a message", async function () {
      
      const m1 = {
        to_username: "test2",
        body: "Test Message from test1 to test2",
        _token: token
      };

      let response = await request(app)
        .post("/messages")
        // .unset('User-Agent')
        .send(m1);

      // console.log(response);

      expect(response.statusCode).toEqual(201);
      expect(response.body).toEqual({ message: {
        id: expect.any(Number),
        from_username: "test1",
        to_username: "test2",
        body: "Test Message from test1 to test2",
        sent_at: expect.any(String)}});
      
      // TODO: write test that sent_at string converted to Date is True
    });   
  });

  test("fails if bad recipient phone number", function() {

  });
});

afterAll(async function () {
  await db.end();
});
