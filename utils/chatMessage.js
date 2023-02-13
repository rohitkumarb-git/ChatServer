const moment = require("moment");

const formatMessage = (data) => {
  msg = {
    username: data.username,
    agentname: data.agentname,
    agentid: data.agentid,
    userid: data.userid,
    message: data.msg,
    date: moment().format("YYYY-MM-DD"),
    time: moment().format("hh:mm a"),
  };
  return msg;
};


module.exports = formatMessage;
