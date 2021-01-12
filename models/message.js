"use strict";

/** Message class for message.ly */

const { NotFoundError, BadRequestError } = require("../expressError");
const db = require("../db");
/* Twilio setup */

// console.log("process env", process.env);
const accountSid = process.env.TWILIO_ACCOUNT_SID;
// console.log("account id",accountSid);
const authToken = process.env.TWILIO_AUTH_TOKEN;
// console.log("account token",authToken);
const client = require('twilio')(accountSid, authToken);

/** Message on the site. */

class Message {

  /** Register new message -- returns
   *    {id, from_username, to_username, body, sent_at}
   */

  static async create({ from_username, to_username, body }) {

    const fromPhoneResult = await db.query(
      `SELECT phone
           FROM users
            WHERE username = $1`,
      [from_username]);
    const fromPhoneNum = fromPhoneResult.rows[0].phone;
    if (!fromPhoneNum) throw new NotFoundError(`${from_username} is not found in the db`);

    const toPhoneResult = await db.query(
      `SELECT phone
        FROM users
        WHERE username = $1`,
      [to_username]);
    const toPhoneNum = toPhoneResult.rows[0].phone;

    if (!toPhoneNum) throw new NotFoundError(`${to_username} is not found in the db`);

    const details = { from: fromPhoneNum, to: toPhoneNum, body };
    const sent_at = await Message._sendTwilioMessage(details);
    // transactional problem
    const result = await db.query(
      `INSERT INTO messages (
        from_username,
        to_username,
        body,
        sent_at)
        VALUES
        ($1, $2, $3, $4)
        RETURNING 
        id, 
        from_username,
        to_username,
        body,
        sent_at`,
      [from_username, to_username, body, sent_at]);
    return result.rows[0];
  }
// subclass - SMS messages, as a class method

  /* Takes {from: "+12345678", to: "+12345678", body}
  makes twilio api call and send a text message
  return sent_at date string*/
  static async _sendTwilioMessage({ from, to, body }) {
    // console.log("to phone number", to);
    let message;
    try {
      message = await client.messages
        .create({
          body,
          from,
          to
        });
    } catch (err) {
      console.log("failed to connect to twilio API");
      throw err;
    }
    let sent_at;
    console.log(message);
    if (message.status === "sent") {
      sent_at = messsage.date_sent;
      return sent_at;
    }
    throw new BadRequestError(`Error: ${message.error_message},error_code: ${message.error_code} `)
  }
//ngrok - free - given portnumber, return the IP address for twillio to make the request to 
  /** Update read_at for message */

  static async markRead(id) {
    const result = await db.query(
      `UPDATE messages
           SET read_at = current_timestamp
             WHERE id = $1
             RETURNING id, read_at`,
      [id]);
    const message = result.rows[0];

    if (!message) throw new NotFoundError(`No such message: ${id}`);

    return message;
  }

  /** Get: get message by id
   *
   * returns {id, from_user, to_user, body, sent_at, read_at}
   *
   * both to_user and from_user = {username, first_name, last_name, phone}
   *
   */

  static async get(id) {
    const result = await db.query(
      `SELECT m.id,
                  m.from_username,
                  f.first_name AS from_first_name,
                  f.last_name AS from_last_name,
                  f.phone AS from_phone,
                  m.to_username,
                  t.first_name AS to_first_name,
                  t.last_name AS to_last_name,
                  t.phone AS to_phone,
                  m.body,
                  m.sent_at,
                  m.read_at
             FROM messages AS m
                    JOIN users AS f ON m.from_username = f.username
                    JOIN users AS t ON m.to_username = t.username
             WHERE m.id = $1`,
      [id]);

    let m = result.rows[0];

    if (!m) throw new NotFoundError(`No such message: ${id}`);

    return {
      id: m.id,
      from_user: {
        username: m.from_username,
        first_name: m.from_first_name,
        last_name: m.from_last_name,
        phone: m.from_phone,
      },
      to_user: {
        username: m.to_username,
        first_name: m.to_first_name,
        last_name: m.to_last_name,
        phone: m.to_phone,
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
    };
  }
}


module.exports = Message;