const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

let app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000/");
    });
  } catch (error) {
    console.log(`ERROR: ${error.message}`);
  }
};

initializeDbAndServer();

let isValidFunc = (request, response, next) => {};

// API 1 scenario 1 - 7   Sample API /todos/?status=TO%20DO

app.get("/todos/", async (request, response) => {
  let { status, priority, category, search_q = "" } = request.query;

  let hasStatusPriorityCategory = () => {
    return (
      status !== undefined && priority !== undefined && category !== undefined
    );
  };

  let hasStatusPriority = () => {
    return status !== undefined && priority !== undefined;
  };

  let hasStatusCategory = () => {
    return status !== undefined && category !== undefined;
  };

  let hasPriorityCategory = () => {
    return priority !== undefined && category !== undefined;
  };

  let hasStatus = () => {
    return status !== undefined;
  };

  let hasPriority = () => {
    return priority !== undefined;
  };

  let hasCategory = () => {
    return category !== undefined;
  };

  let sqlQuery;
  switch (true) {
    case hasStatusPriorityCategory():
      sqlQuery = `SELECT * FROM todo 
      WHERE todo LIKE '%${search_q}%' 
      AND status LIKE '${status}'
      AND priority LIKE '${priority}'
      AND category LIKE '${category}';`;
      break;

    case hasStatusPriority():
      sqlQuery = `SELECT * FROM todo 
      WHERE todo LIKE '%${search_q}%'
      AND status LIKE '${status}'
      AND priority LIKE '${priority}';`;
      break;
    case hasStatusCategory():
      sqlQuery = `SELECT * FROM todo 
      WHERE todo LIKE '%${search_q}%' 
      AND status LIKE '${status}'
      AND category LIKE '${category}';`;
      break;

    case hasPriorityCategory():
      sqlQuery = `SELECT * FROM todo 
      WHERE todo LIKE '%${search_q}%' 
      AND priority LIKE '${priority}'
      AND category LIKE '${category}';`;
      break;

    case hasStatus():
      sqlQuery = `SELECT * FROM todo 
      WHERE todo LIKE '%${search_q}%' 
      AND status LIKE '${status}';`;
      break;

    case hasPriority():
      sqlQuery = `SELECT * FROM todo 
      WHERE todo LIKE '%${search_q}%' 
      AND priority LIKE '${priority}';`;
      break;

    case hasCategory():
      sqlQuery = `SELECT * FROM todo 
      WHERE todo LIKE '%${search_q}%' 
      AND category LIKE '${category}';`;
      break;

    default:
      sqlQuery = `SELECT * FROM todo
        WHERE todo LIKE '%${search_q}%';`;
      break;
  }

  let invalid = false;
  let statusInvalid = false;
  let priorityInvalid = false;
  let categoryInvalid = false;

  if (hasStatus()) {
    if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
      statusInvalid = true;
      invalid = true;
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }

  if (hasPriority()) {
    if (statusInvalid === false) {
      if (priority !== "HIGH" && priority !== "MEDIUM" && priority !== "LOW") {
        invalid = true;
        priorityInvalid = true;
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    }
  }

  if (hasCategory()) {
    if (priorityInvalid === false) {
      if (
        category !== "WORK" &&
        category !== "HOME" &&
        category !== "LEARNING"
      ) {
        invalid = true;
        response.status(400);
        response.send("Invalid Todo Category");
      }
    }
  }

  let funcObjToSnakeCase = (eachObj) => {
    return {
      id: eachObj.id,
      todo: eachObj.todo,
      priority: eachObj.priority,
      status: eachObj.status,
      category: eachObj.category,
      dueDate: eachObj.due_date,
    };
  };
  let camelCaseArr = [];
  if (invalid === false) {
    let resArr = await db.all(sqlQuery);
    for (let eachObj of resArr) {
      let newObj = funcObjToSnakeCase(eachObj);
      camelCaseArr.push(newObj);
    }
    response.send(camelCaseArr);
  }
});

// API 2 Path: /todos/:todoId/

app.get("/todos/:todoId/", async (request, response) => {
  let { todoId } = request.params;
  let sqlQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  let res = await db.get(sqlQuery);
  response.send({
    id: res.id,
    todo: res.todo,
    priority: res.priority,
    status: res.status,
    category: res.category,
    dueDate: res.due_date,
  });
});

// API 3 Path: /agenda/

app.get("/agenda/", async (request, response) => {
  let { date } = request.query;
  const d = new Date(date);

  if (isValid(d)) {
    let result = format(d, "yyyy-MM-dd");
    let sqlQuery = `SELECT * FROM todo WHERE due_date LIKE '${result}';`;
    let todoArr = await db.all(sqlQuery);

    let funcObjToSnakeCase = (eachObj) => {
      return {
        id: eachObj.id,
        todo: eachObj.todo,
        priority: eachObj.priority,
        status: eachObj.status,
        category: eachObj.category,
        dueDate: eachObj.due_date,
      };
    };

    let newCamelArr = [];
    for (let eachObj of todoArr) {
      let camelObj = funcObjToSnakeCase(eachObj);
      newCamelArr.push(camelObj);
    }
    response.send(newCamelArr);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API 4 POST Path: /todos/

app.post("/todos/", async (request, response) => {
  let userNewData = request.body;

  let date = new Date(userNewData.dueDate);

  if (
    userNewData.status !== "TO DO" &&
    userNewData.status !== "IN PROGRESS" &&
    userNewData.status !== "DONE"
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    userNewData.priority !== "HIGH" &&
    userNewData.priority !== "MEDIUM" &&
    userNewData.priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    userNewData.category !== "WORK" &&
    userNewData.category !== "HOME" &&
    userNewData.category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isValid(date) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    let newDate = format(date, "yyyy-MM-dd");
    let sqlQuery = `INSERT INTO 
  todo (id, 
    todo, 
    category, 
    priority, 
    status, 
    due_date)
  VALUES (${userNewData.id},
    '${userNewData.todo}',
    '${userNewData.category}',
    '${userNewData.priority}',
    '${userNewData.status}',
    '${newDate}');`;

    let postData = await db.run(sqlQuery);

    response.send("Todo Successfully Added");
  }
});

// API  PUT  5 Path: /todos/:todoId/
app.put("/todos/:todoId/", async (request, response) => {
  let { todoId } = request.params;
  let userContent = request.body;
  let userKey = Object.keys(userContent)[0];

  let hasStatus = () => {
    return userKey === "status";
  };

  let hasPriority = () => {
    return userKey === "priority";
  };

  let hasTodo = () => {
    return userKey === "todo";
  };

  let hasCategory = () => {
    return userKey === "category";
  };

  let hasDueDate = () => {
    return userKey == "dueDate";
  };
  let userQuery;
  let userResponse;
  switch (true) {
    case hasStatus():
      if (
        userContent.status === "TO DO" ||
        userContent.status === "IN PROGRESS" ||
        userContent.status === "DONE"
      ) {
        userQuery = `UPDATE todo
            SET status = '${userContent.status}'
            WHERE id = ${todoId};`;
        userResponse = "Status Updated";
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasPriority():
      if (
        userContent.priority === "HIGH" ||
        userContent.priority === "MEDIUM" ||
        userContent.priority === "LOW"
      ) {
        userQuery = `UPDATE todo
            SET priority = '${userContent.priority}'
            WHERE id = ${todoId};`;
        userResponse = "Priority Updated";
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case hasTodo():
      userQuery = `UPDATE todo
            SET todo = '${userContent.todo}'
            WHERE id = ${todoId};`;
      userResponse = "Todo Updated";
      break;
    case hasCategory():
      if (
        userContent.category === "WORK" ||
        userContent.category === "HOME" ||
        userContent.category === "LEARNING"
      ) {
        userQuery = `UPDATE todo
            SET category = '${userContent.category}'
            WHERE id = ${todoId};`;
        userResponse = "Category Updated";
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    case hasDueDate():
      let d = new Date(userContent.dueDate);
      if (isValid(d)) {
        userQuery = `UPDATE todo
            SET due_date = '${userContent.dueDate}'
            WHERE id = ${todoId};`;
        userResponse = "Due Date Updated";
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }

      break;
  }

  if (userQuery !== undefined) {
    let updatedData = await db.run(userQuery);
    response.send(userResponse);
  }
});

// API 6 DELETE  Path: /todos/:todoId/

app.delete("/todos/:todoId/", async (request, response) => {
  let { todoId } = request.params;
  let sqlQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(sqlQuery);
  response.send("Todo Deleted");
});

module.exports = app;
