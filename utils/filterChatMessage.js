const moment = require("moment");

const filterMsg = (data, filter) => {
  if (filter === "user") {
    msg = {
      agentname: data.agentname,
      agentid: data.agentid,
      userid: data.userid,
      message: data.msg,
      date: moment().format("YYYY-MM-DD"),
      time: moment().format("hh:mm a"),
    };
    return msg;
  } else {
    msg = {
      username: data.username,
      agentid: data.agentid,
      userid: data.userid,
      message: data.msg,
      date: moment().format("YYYY-MM-DD"),
      time: moment().format("hh:mm a"),
    };
    return msg;
  }
};

module.exports = filterMsg;
