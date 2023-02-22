const moment = require("moment");

exports.filterMsg = (data, filter) => {
  if (filter === "user") {
    msg = {
      agentname: data.agentname,
      uname:data.username,
      msgFrom:filter,
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
      aname: data.agentname,
      msgFrom:filter,
      agentid: data.agentid,
      userid: data.userid,
      message: data.msg,
      date: moment().format("YYYY-MM-DD"),
      time: moment().format("hh:mm a"),
    };
    return msg;
  }
};

exports.userChatMessage = (data,filter) => {
  if (filter === "user") {
    msg = {
      username: data.username,
      aname:data.agentname,
      msgFrom:filter,
      agentid: data.agentid,
      userid: data.userid,
      message: data.msg,
      date: moment().format("YYYY-MM-DD"),
      time: moment().format("hh:mm a"),
    };
    return msg;
  } else {
    msg = {
      agentname: data.agentname,
      uname:data.username,
      msgFrom:filter,
      agentid: data.agentid,
      userid: data.userid,
      message: data.msg,
      date: moment().format("YYYY-MM-DD"),
      time: moment().format("hh:mm a"),
    };
    return msg;
  }
}

