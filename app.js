const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const databasePath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());
let database = null;
const initializeDbAndServer = async () => {
    try {
        database = await open({
            filename: databasePath,
            driver: sqlite3.Database,
        });
        app.listen(3000, () =>
            console.log("Server Running at http://localhost:3000/")
        );
    } catch (error) {
        console.log(`DB Error:${error.message}`);
        process.exit(1);
    }
};
initializeDbAndServer();
const convertDbObjectToResponseObject=(dbObject)=>{
    return{
        id:dbObject.id,
        todo:dbObject.todo,
        priority:dbObject.priority,
        status:dbObject.status,
        category:dbObject.category,
        dueDate:dbObject.due_date        

    }
}


const hasPriorityAndStatusProperties = (requestQuery) => {
    return (
        requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
};

const hasPriorityProperty = (requestQuery) => {
    return ( requestQuery.priority !== undefined)
     

};

const hasStatusProperty = (requestQuery) => {
    return requestQuery.status !== undefined;
};
const hasCategoryProperty = (requestQuery) => {
    return requestQuery.category !== undefined;
};
const hasCategoryAndStatus = (requestQuery) => {
    return (
        requestQuery.category !== undefined && requestQuery.status !== undefined
    );
};
const hasCategoryAndPriority = (requestQuery) => {
    return (
        requestQuery.category !== undefined && requestQuery.priority !== undefined
    );
};
const hasSearchTodo = (requestQuery) => {
    return requestQuery.search_q !== undefined;
};
let invalidColumn=""

  const possibleStatusValues = ["TO DO", "IN PROGRESS","DONE"];
  const possiblePriorityValues=["HIGH","MEDIUM","LOW"]
  const possibleCategoryValues=["WORK","HOME","LEARNING"]

 const checkInvalid=(requestQuery)=>{
  
  switch (true) {
      case requestQuery.status!==undefined:
          
       if (possibleStatusValues.includes(requestQuery.status)) {
           invalidColumn=""
        
        } else{
      invalidColumn="Status"
      
         }           
        break;
    case requestQuery.priority!==undefined:
      
    if ( possiblePriorityValues.includes(requestQuery.priority)){
            invalidColumn=""
       }else{
           invalidColumn="Priority"
        
       }
          break
         case requestQuery.category!==undefined:

           if (possibleCategoryValues.includes(requestQuery.category)){
    invalidColumn=""
        }else{
              invalidColumn="Category"
        }
             break; 
  }
   
       
 return invalidColumn!==""
    }

app.get("/todos/", async (request, response) => {
    let data = null;
    let getTodosQuery = "";
    const { search_q = "", priority, status, category } = request.query;


    
if(checkInvalid(request.query)){
response.status(400)
response.send(`Invalid Todo ${invalidColumn}`)

}else{  
    switch (true) {
      
        case hasPriorityProperty(request.query):
            getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
            break;
        case hasStatusProperty(request.query):
            getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
            break;
        case hasCategoryProperty(request.query):
            getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`;
            break;
        case hasPriorityAndStatusProperties(request.query):
            getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
            break;            
        case hasCategoryAndStatus(request.query):
            getTodosQuery = `
       SELECT
        * 
        FROM 
        todo 
        WHERE 
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND category = '${category}';`;
            break;
        case hasCategoryAndPriority(request.query):
            getTodosQuery = `
       SELECT
        * 
        FROM 
        todo 
        WHERE 
        todo LIKE '%${search_q}%'
        AND priority = '${priority}'
        AND category = '${category}';`;
            break;
        case hasSearchTodo(request.query):
            getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
            break;
    }

    data = await database.all(getTodosQuery);
    response.send(data.map((each)=>convertDbObjectToResponseObject(each)));
}
});
app.get("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params;
    const getTodoQuery = `
    SELECT * FROM todo
    WHERE id='${todoId}'`;
    const todo = await database.get(getTodoQuery);
    response.send(convertDbObjectToResponseObject(todo));
});
app.get("/agenda/", async (request, response) => {
    const { date } = request.query;
    const validDate = isValid(new Date(date));
    if (validDate) {
        const formatDate = format(new Date(date), "yyyy-MM-dd");
        const getAgendaQuery = `
          SELECT * FROM todo WHERE due_date='${formatDate}'`;
        const todo = await database.all(getAgendaQuery);
        response.send(todo.map((each)=>convertDbObjectToResponseObject(each)));
    } else {
        response.status(400);
        response.send("Invalid Due Date");
    }
});
app.post("/todos/", async (request, response) => {
    const { id, todo, priority, status, category, dueDate } = request.body;
  try{
    if(checkInvalid(request.body)){
response.status(400)
response.send(`Invalid Todo ${invalidColumn}`)
  }else{
   
    const todoPostQuery = `
INSERT INTO 
todo (id,todo,priority,status,category,due_date)
VALUES
 (${id},'${todo}','${priority}','${status}','${category}','${dueDate}')`;
    await database.run(todoPostQuery);
    response.send("Todo Successfully Added");
  }    
}catch(error){
console.log(`DB Error:${error.message}`)
  }
});
app.put("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params;
     const requestBody = request.body;
if(checkInvalid(requestBody)){
 response.status(400)
response.send(`Invalid Todo ${invalidColumn}`)

}else{
     let updateColumn = "";
    switch (true) {
        case requestBody.status !== undefined:
            updateColumn = "Status";
            break;
        case requestBody.priority !== undefined:
            updateColumn = "Priority";
            break;
        case requestBody.todo !== undefined:
            updateColumn = "Todo";
            break;
        case requestBody.category !== undefined:
            updateColumn = "Category";
            break;
         case requestBody.due_date!==undefined:
            updateColumn="Due Date";
            break;
    }
    const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
    const previousTodo = await database.get(previousTodoQuery);

    const {
        todo = previousTodo.todo,
        priority = previousTodo.priority,
        status = previousTodo.status,
        category = previousTodo.category,

    } = request.body;

    const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}'

    WHERE
      id = ${todoId};`;

    await database.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
}
});

app.delete("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params;
    const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

    await database.run(deleteTodoQuery);
    response.send("Todo Deleted");
});

module.exports = app;
