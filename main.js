// CLI prompt
import { input } from '@inquirer/prompts';

// postgres lib
import pg from 'pg';
const {Client}  = pg;
const client = new Client({
  user: 'postgres',
  port: 5432,
  database: 'p3',
  host: 'localhost'
});

// connect to psql server
await client.connect();

// meta
let session = true;
let listTables = [
  'country', 'dystopia', 'economy', 'family', 'freedom', 'generosity', 'happinessrank', 'happinessscore', 'health', 'trust', 'whiskers'
];
let queryBuilder = []; // all lines end with (
let subQueryMode = false;
let transactions = [];
let transactionMode = false;
let errorCheckingMode = false;
let declarations = [];
let begins = [];
let exceptions = {};

/**
 * Ask the user for the table for query.
 * @returns string
 */
async function askTable(){
  listTables.forEach((i, index) => {
    console.log( (index + 1) + ". " + i);
  });
  let table = await input({message: 'Which table for the query (1-11)?'});
  let v = listTables[parseInt(table - 1)]
  console.log('selected table: ' + v); 
  return v;
}

/**
 *  execute psql query
 * @param {string} query 
 * @returns 
 */
async function executeSafe(query){
  if (subQueryMode){
    //console.log(queryBuilder)
    subQueryMode = false;
    query = query.substring(0, query.length - 1);
    query = queryBuilder.join("") + query;
    // add ending brackets.
    query = query + ")".repeat(queryBuilder.length) + ";"
  }
  if (transactionMode){
    transactions.push(query);
    console.log('Query added to transaction.');
    return;
  }
  console.log('\n* Resolved all ' + queryBuilder.length + ' subqueries.\n');
  queryBuilder = [];
  console.log('\n\n--- ATTEMPTING QUERY ---');
  console.log('Attempting query: ');
  console.log(query);
  console.log('\n');
  try {
    let res = await client.query(query);
    console.log('Operation successful.\n\n');
    return res;
  }
  catch(e){
    console.log('There was an error. Please check your query and try again.');
    console.log(e);
    console.log('\n\n');
    return false;
  }
}

async function insertData(){
  let table = await askTable();
  let columns = '';
  if (table === 'country'){
    columns = 'name';
  }
  else{
    columns = 'name,' + table +'';
  }
  console.log('has columns: ' + columns);
  let values = await input({message: "Enter values as comma separated in the column order (!ensure ALL values have '' quotes): "});
  //console.log(values);
  await executeSafe("INSERT INTO " + table + " (" + columns + ") VALUES (" + values + ");");
}

async function deleteData(){
  let table = await askTable();
  let cond = await input({message: "Enter condition for deletion: "});
  await executeSafe("DELETE FROM " + table + " WHERE " + cond + ';');
}

async function updateData(){
  let table = await askTable();
  let set = await input({message: "Enter SET condition: "});
  let cond = await input({message: "Enter WHERE condition: "});
  await executeSafe("UPDATE " + table + " SET " + set + " WHERE " + cond + ";");
}

async function searchData(ordered, isSubquery, isGrouped){
  let select = await input({message: "Enter SELECT columns: "});
  let table = await askTable();
  let cond = await input({message: "Enter WHERE condition (or leave blank for NO where cond): "});
  let whereTrait = '';
  if (cond.length != 0){
    whereTrait = ' WHERE ' + cond;
  }
  if (isSubquery){
    if (whereTrait.length == 0){
      console.log('Subquery operation failed. WHERE clause not specified.');
      return;
    }
    whereTrait += ' IN (';
    let mainQuery = "SELECT " + select + " FROM " + table + whereTrait;
    queryBuilder.push(mainQuery);
    subQueryMode = true;
    return;
  }
  let orderTrait = '';
  if (ordered){
    let orderBy = await input({message: "Enter column_name ASC or DESC: "});
    orderTrait = ' ORDER BY ' + orderBy;
  }
  let groupedTrait = '';
  if (isGrouped){
    let groupBy = await input({message: "Enter GROUP BY column: "});
    groupedTrait = ' ORDER BY ' + groupBy;
  }
  let res = await executeSafe("SELECT " + select + " FROM " + table + "" + whereTrait + "" + orderTrait + "" + groupedTrait + ";");
  if (res){
    console.log('returned ' + res.rows.length + ' rows: ');
    console.log(JSON.stringify(res.rows));
  }
}

async function aggregateFn(){
  let ag = await input({message: "Enter aggregate select operation (ex. SELECT <SUM(name)> ...): "});
  let table = await askTable();
  let res = await executeSafe("SELECT " + ag + " FROM " + table);
  if (res){
    console.log('returned ' + res.rows.length + ' rows: ');
    console.log(JSON.stringify(res.rows));
  }
}

async function join(){
  let select = await input({message: "Enter SELECT columns: "});
  console.log("Select FROM table: ");
  let fromtable = await askTable();
  let jointype = await input({message: "Enter type of join (INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL JOIN): "});
  console.log("Select join table: ");
  let jointable = await askTable();
  let onclause = await input({message: "Enter JOIN ON clause: "});
  let res = await executeSafe("SELECT " + select + " FROM " + fromtable + " " + jointype + " " + jointable + " ON " + onclause + ";");
  if (res){
    console.log('returned ' + res.rows.length + ' rows: ');
    console.log(JSON.stringify(res.rows));
  }
}

async function transact(){
  if (subQueryMode){
    subQueryMode = false;
    console.log('* Subquery mode terminated.');
  }
  transactionMode = true;
  console.log('\n\n --- TRANSACTION MODE BEGIN --- ');
  while (transactionMode){
    let t = [
      "Please select an option: ",
      "1. Insert Data",
      "2. Delete Data",
      "3. Update Data",
      '4. Commit',
      '5. Rollback'
    ];
    t.forEach(i => console.log(i));
    let msg = await input({message: '\nEnter your choice (1-5):'});
    if (msg == '1'){
      await insertData();
    }
    else if (msg == '2'){
      await deleteData();
    }
    else if (msg == '3'){
      await updateData();
    }
    else if (msg == '4'){
      transactionMode = false;
      console.log('Finalizing all transaction queries...');
      transactions.forEach(i => {
        executeSafe(i);
      });
      console.log('--- TRANSACTION MODE END --- \n\n');
      transactions = [];
    }
    else if (msg == '5'){
      transactions.pop();
      console.log('Rolled back last query.');
    }
  }
}

async function error(){
  if (errorCheckingMode){
    errorCheckingMode = false;
    console.log('* Error catch mode terminated.');
  }
  errorCheckingMode = true;
  console.log('\n\n --- EC MODE BEGIN --- ');
  let status = 0;
  while (status === 0){
    let i = await input({message: 'Enter declaration line (or type "END" to finish): '});
    if (i === "END"){
      status = 1;
    }
    else{
      declarations.push(i);
      console.log('Declaration inserted..');
    }
  }
  while (status === 1){
    let i = await input({message: 'Enter statements (or type "END" to finish): '});
    if (i === "END"){
      status = 2;
    }
    else{
      begins.push(i);
      console.log('Statement inserted..');
    }
  }
  while (status === 2){
    let i = await input({message: 'Enter exception condition (or type "END" to finish): '});
    if (i === "END"){
      status = 3;
    }
    else{
      let take = true;
      let actions = [];
      while (take){
        let input2 = await input({message: 'Enter handler statement (or type "END" to finish): '});
        if (input2 === "END"){
          take = false;
        }
        else{
          actions.push(input2);
        }
      }
      exceptions[i] = actions;
      console.log('Exception inserted with ' + actions.length + ' handler lines..');
    }
  }
  let instruction = [];
  instruction.push('DECLARE ');
  declarations.forEach(line => {
    instruction.push(line + '; ');
  });
  instruction.push('BEGIN ');
  begins.forEach(line => {
    instruction.push(line + ' ');
  });
  instruction.push('EXCEPTION ');
  Object.keys(exceptions).forEach(key => {
    instruction.push('WHEN ' + key + ' THEN ');
    exceptions[key].forEach(action => {
      instruction.push(action + ' ');
    });
  });
  executeSafe(instruction.join(''));
  console.log('--- EC MODE END --- \n\n');
  exceptions = {};
  begins = [];
  declarations = [];
  errorCheckingMode = false;
}

async function main(){
  // Ask for user input here.
  while (session) {
    let t = [
      "Welcome to the Database CLI Interface!",
      "\n\nPlease select an option: ",
      "1. Insert Data",
      "2. Delete Data",
      "3. Update Data",
      "4. Search Data",
      "5. Aggregate Functions",
      "6. Sorting",
      "7. Joins",
      "8. Grouping",
      "9. Subqueries",
      "10. Transactions",
      "11. Error Handling",
      "12. Exit"
    ]
    if (subQueryMode){
      console.log('* You are currently building a subquery for a prior query.');
    }
    t.forEach(i => console.log(i));
    let msg = await input({message: '\nEnter your choice (1-12):'});
    if (msg == '12'){
      process.exit();
    }
    else if (msg == '1'){
      // insert data into the database
      await insertData();
    }
    else if (msg == '2'){
      await deleteData();
    }
    else if (msg == '3'){
      await updateData();
    }
    else if (msg == '4'){
      await searchData(false, false, false);
    }
    else if (msg == '5'){
      await aggregateFn();
    }
    else if (msg == '6'){
      await searchData(true, false, false);
    }
    else if (msg == '7'){
      await join();
    }
    else if (msg == '8'){
      await searchData(false, false, true);
    }
    else if (msg == '9'){
      await searchData(false, true, false);
    }
    else if (msg == '10'){
      await transact();
    }
    else if (msg == '11'){
      await error();
    }
  }
}

main();