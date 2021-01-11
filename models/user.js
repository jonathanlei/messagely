"use strict";

/** User class for message.ly */

const { NotFoundError } = require("../expressError");
const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config.js");
/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashPw = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users (username,
                              password,
                              first_name,
                              last_name,
                              phone,
                              join_at,
                              last_login_at)
            VALUES
              ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
            RETURNING username, password, first_name, last_name, phone`,
      [username, hashPw, first_name, last_name, phone]);
    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {

    const result = await db.query(
      `SELECT username, password
            FROM users 
            WHERE username = $1`,
      [username]);

    const user = result.rows[0];
    if (!user) return false;

    const isPwCorrect = await bcrypt.compare(password, user.password) === true;
    return isPwCorrect;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
           SET last_login_at = current_timestamp
            WHERE username = $1
            RETURNING username, last_login_at`,
      [username]);

    const user = result.rows[0];
    if (!user) throw new NotFoundError(`no user found: ${username}`);
    
    return user;
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone
            FROM users
            ORDER BY username`);
    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      ` SELECT username, first_name, last_name, phone, join_at, last_login_at
            FROM users
            WHERE username = $1`,
      [username]);
    
    const user = result.rows[0];
    if (!user) throw new NotFoundError(`no user found: ${username}`);
    
    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT m.id, 
                m.to_username, 
                u.first_name,
                u.last_name,
                u.phone,
                m.body,
                m.sent_at,
                m.read_at
            FROM messages as m
            JOIN users as u ON m.to_username = u.username
            WHERE m.from_username = $1`,
      [username]);

    const messagesFrom = result.rows.map(m => ({
      id: m.id,
      to_user: {
        username: m.to_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));
    return messagesFrom;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      // TODO: put each select column on its own line
      `SELECT m.id, 
                m.from_username, 
                u.first_name,
                u.last_name,
                u.phone,
                m.body,
                m.sent_at,
                m.read_at
        FROM messages as m
        JOIN users as u ON m.from_username = u.username
        WHERE m.to_username = $1`,
      [username]);

    const messagesTo = result.rows.map(m => ({
      id: m.id,
      from_user: {
        username: m.from_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));
    return messagesTo;
  }
}


module.exports = User;
