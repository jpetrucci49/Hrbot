const request = require("request");
const moment = require("moment");
const paymoProjectUrl = "https://app.paymoapp.com/api/projects";
const paymoTaskUrl = "https://app.paymoapp.com/api/tasks";
const apiKey = process.env.PAYMO_API_KEY;
const authObj = {
  auth: {
    user: apiKey,
  },
  headers: {
    Accept: "application/json",
  },
};

const today = moment().format("YYYY-MM-DD");

async function requestPaymo(username, pub, channel) {
  request.get(paymoProjectUrl, authObj, (error, response, body) => {
    if (error) {
      console.log(`Error in paymo request. Error: ${error}`);
    }
    JSON.parse(body).projects.forEach((project) => {
      request.get(
        `${paymoTaskUrl}?where=project_id=${project.id}`,
        authObj,
        (error, response, body) => {
          if (error) {
            console.log(error);
          }
          JSON.parse(body).tasks.forEach((task) => {
            if (task.name.includes(username)) {
              pub(
                channel,
                `Project: ${project.name} - ${task.name} - taskId: ${task.id}`
              );
            }
          });
        }
      );
    });
  });
}

async function requestTimesheet(username, task_id, pub, channel) {
  const postData = {
    task_id,
    start_time: `${today}T14:00:00Z`,
    end_time: `${today}T22:00:00Z`,
    description: "Time entry created by Slackbot.",
  };
  request.post(
    {
      url: "https://app.paymoapp.com/api/entries",
      body: JSON.stringify(postData),
      headers: {
        "Content-type": "application/json",
        Accept: "application/json",
      },
      auth: {
        user: process.env.PAYMO_API_KEY,
      },
    },
    (error, response, body) => {
      if (error) {
        console.log(
          `There is an error with your timesheet request. Error: ${error}`
        );
      }
      console.log("Hours response: ", JSON.parse(body));
      JSON.parse(body).message
        ? pub(channel, `${JSON.parse(body).message}`)
        : pub(channel, `${JSON.parse(body).entries[0].description}`);
    }
  );
}

module.exports = {
  requestTimesheet,
  requestPaymo,
};
