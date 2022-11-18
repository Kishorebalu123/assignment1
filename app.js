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
const hasPriorityProperty=(requestQuery)=>{
return requestQuery.priority !== undefined
}
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
let invalidColumn1=""
let invalidColumn2=""
let invalidColumn3=""
let invalidColumn4=""

  const possibleStatusValues = ["TO DO", "IN PROGRESS","DONE"];
  const possiblePriorityValues=["HIGH","MEDIUM","LOW"]
  const possibleCategoryValues=["WORK","HOME","LEARNING"]

 const checkInvalid=(requestQuery)=>{
     let invalidTodo=true
       if (possibleStatusValues.includes(requestQuery.status)) {
           invalidColumn1=true

        } else{
      invalidColumn1="Status"
             }

    if ( possiblePriorityValues.includes(requestQuery.priority)){
            invalidColumn2=true
       }else{
           invalidColumn2="Priority"

       }
    
           if (possibleCategoryValues.includes(requestQuery.category)){
    invalidColumn3=true
        }else{
              invalidColumn3="Category"
        }
        if( isValid(new Date(requestQuery.dueDate))){
        invalidColumn4=true
        }else{
       invalidColumn4="Due Date"
        }
    
  switch (true) {
      case invalidColumn1!==true:
invalidColumn="Todo Status"
          break;
          case invalidColumn2!==true:
invalidColumn="Todo Priority"
          break;
          case invalidColumn3!==true:
invalidColumn="Todo Category"
          break;
  
      case invalidColumn4!==true:
          invalidColumn="Due Date"
          break;
          default:
              invalidTodo=false
              break
  }


 return invalidTodo
    }

  updateColumn=""
const checkInvalidForPut=(requestBody)=>{
    let invalidTodo=""
 switch (true) {
        case requestBody.status !== undefined:
            if(possibleStatusValues.includes(requestBody.status)){
            updateColumn = "Status";
            invalidTodo=false
            }else{
                invalidColumn="Todo Status"
                invalidTodo=true
            }
            break;
        case requestBody.priority !== undefined:
             if(possiblePriorityValues.includes(requestBody.priority)){
            updateColumn = "Priority";
            invalidTodo=false
            }else{
                invalidColumn="Todo Priority"
                invalidTodo=true
            }
            break;
     
        case requestBody.category !== undefined:
             if(possibleCategoryValues.includes(requestBody.category)){
            updateColumn = "Category";
            invalidTodo=false
            }else{
                invalidColumn="Todo Category"
                invalidTodo=true
            }
            break;
            case requestBody.dueDate!==undefined:
                const validDate = isValid(new Date(requestBody.dueDate));
               if(validDate){
                   updateColumn="Due Date"
                   invalidTodo=false
               }else{
                 invalidColumn="Due Date"
                 invalidTodo=true
               }
       break
       default:
            updateColumn="Todo"
            invalidTodo=false
    }
    return invalidTodo
}  

app.get("/todos/", async (request, response) => {
    let data = null;
    let getTodosQuery = "";
    const { search_q = "", priority, status, category } = request.query;

if(checkInvalidForPut(request.query)){
response.status(400)
response.send(`Invalid ${invalidColumn}`)

}else{  
   switch (true) {
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
       
      
        case hasSearchTodo(request.query):
            getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`
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
    if(checkInvalid(request.body)){
response.status(400)
response.send(`Invalid ${invalidColumn}`)
  }else{
 const formatDate = format(new Date(dueDate), "yyyy-MM-dd");
    const todoPostQuery = `
INSERT INTO 
todo (id,todo,priority,status,category,due_date)
VALUES
 (${id},'${todo}','${priority}','${status}','${category}','${formatDate}')`;
    await database.run(todoPostQuery);
    response.send("Todo Successfully Added");
  }    

});


app.put("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params;
  //  let updateColumn = "";
     const requestBody = request.body;
 if(checkInvalidForPut(requestBody)){
 response.status(400)
response.send(`Invalid ${invalidColumn}`)

}else{
    
    const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = '${todoId}';`;
    const previousTodo = await database.get(previousTodoQuery);
    const {
        todo = previousTodo.todo,
        priority = previousTodo.priority,
        status = previousTodo.status,
        category = previousTodo.category,
        dueDate=previousTodo.due_date 
         } = request.body;

    const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='${dueDate}'

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