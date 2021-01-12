"use strict";

const Router = require("express").Router;
const router = new Router();

const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** POST /login: {username, password} => {token} */
router.post("/login", async function (req, res, next) {
  const { username, password } = req.body;
// check true instead of truthy 
  if (await User.authenticate(username, password)) {
    const token = jwt.sign({ username }, SECRET_KEY);
    User.updateLoginTimestamp(username);

    return res.json({ token });
  }

  throw new UnauthorizedError("Invalid username/password");
});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post("/register", async function (req, res, next) {
  const { username, password, first_name, last_name, phone } = req.body;
  const user = await User.register({ username, password, first_name, last_name, phone });

  const token = jwt.sign({ username }, SECRET_KEY);
  // determine where to have this line
  User.updateLoginTimestamp(username);
  
  return res.json({ token });
});

module.exports = router;