"use strict";

const Router = require("express").Router;
const router = new Router();
const Message = require("../models/message.js");
const {UnauthorizedError} = require("../expressError.js");
const { ensureLoggedIn } = require("../middleware/auth");
 
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id",
  ensureLoggedIn,
  async function(req,res, next){
    const id = req.params.id;
    const message = await Message.get(id);
    const currentUsername = res.locals.user.username;
    if (message.to_user.username === currentUsername 
        || message.from_user.username === currentUsername){
          return res.json({message});
        }
    throw new UnauthorizedError(`${currentUsername} is not authorized to see this message`);
  })



/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/",
  ensureLoggedIn,
  async function(req,res, next){
    const from_username = res.locals.user.username;
    const {to_username, body} = req.body;

    const message = await Message.create({from_username,to_username,body});
    return res.json({message});
  })



/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read",
  ensureLoggedIn,
  async function(req,res, next){
    const {id} = req.params;
    // change the naming to according to doc string
    const message = await Message.get(id);
    const currentUsername = res.locals.user.username;

    if (message.to_user.username === res.locals.user.username){
      const readMessage = await Message.markRead(id);
      return res.json({readMessage});
    }
    throw new UnauthorizedError(`${currentUsername} is not authorized to make this change`);
  })


module.exports = router;