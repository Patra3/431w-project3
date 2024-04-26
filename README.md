

# CMPSC 431W Project - Database CLI

This repository includes the source code of the CLI interface for the project.
A demo video of the CLI usage is available: 
https://youtu.be/FouQKvwleB8
   

## Setup  
This project requires Node.js; the testing environment uses Node v20.12.0, and must run `npm install` in order to install the `pg` library that is needed in order to run this project.

After `npm install`, running `node main.js` should work appropriately.

Prerequisite db setup is needed. Before running this project, the following must manually be set up.
Postgresql must be installed, and the `psql` command line interface should be working. The database `p3` should be created and use default user 'postgres` and password left blank.  

In database `p3`, the following tables and their columns must be created  (they do not have to be populated):
```
p3=# create table if not exists Country (
p3(# name text primary key
p3(# );
CREATE TABLE
p3=# create table if not exists HappinessRank (
p3(# name text references Country,
p3(# rank int
p3(# );
CREATE TABLE
p3=# create table if not exists HappinessScore (
p3(# name text references Country,
p3(# score numeric
p3(# );
CREATE TABLE
p3=# create table if not exists Whiskers (
name text references Country,
low numeric,
high numeric
);
CREATE TABLE
p3=# create table if not exists Economy (
p3(# name text references Country,
p3(# economy numeric
p3(# );
CREATE TABLE
p3=# create table if not exists Family (
p3(# name text references Country,
p3(# family numeric
p3(# );
CREATE TABLE
p3=# create table if not exists Health (
p3(# name text references Country,
p3(# health numeric
p3(# );
CREATE TABLE
p3=# create table if not exists Freedom (
p3(# name text references Country,
p3(# freedom numeric
p3(# );
CREATE TABLE
p3=# create table if not exists Generosity (
p3(# name text references Country,
p3(# generosity numeric
p3(# );
CREATE TABLE
p3=# create table if not exists Trust (
p3(# name text references Country,
p3(# trust numeric
p3(# );
CREATE TABLE
p3=# create table if not exists Dystopia (
p3(# name text references Country,
p3(# dystopia numeric
p3(# );
CREATE TABLE
```

Afterwards, `node main.js` should work without any problems!

## Usage

You will be presented with a list of possible commands 1-12, and prompted to type a number to select an operation. Here we will go over how to input and use each of these operations.

1. After being prompted to select a table to insert data into, you must enter values into the columns in order, comma separated, and in single quotes. For example, `'United States', 6.8095847` into `Economy` table would work.
2. After being prompted to select a table to delete data from, you must input the deletion condition exactly as you would into a `DELETE` statement.
3. After being prompted to select a table to update data from, you must input the set and where conditions exactly as you would into the following statement: `UPDATE <table> SET <cond> WHERE <cond>`.
4. You must first enter the columns you wish to `SELECT`, comma separated as needed. Then, you select the table you wish to select from. Then, you enter the `WHERE` condition as you would into a `SELECT` query.
5. Enter an aggregate select operation, such as `COUNT(name)`. It will ask you to select the table to apply this aggregate selector to.
6. Enter columns (comma separated) which you want to pick for ASC/DESC select here. Then, select the table accordingly. Enter a `WHERE` condition as you would for this `SELECT` statement, and finally enter `column_name ASC` or `column_name DESC` in the final prompt to sort the selections.
7. This one should be fairly straightfoward. After being prompted for the select columns and table, it will ask you for the type of join, and the table to join, as well as to enter the `JOIN ON` clause exactly as you would in the associated join statement.
8. This one is pretty straightforward too, after specifying columns, table, you enter the `WHERE` condition for this select statement, and specify the `GROUP BY` clause as you would syntactically for an psql query.
9. It will seem like a `SELECT` statement builder like #4, however you can stack additional `SELECT` statements. If you want to stack multiple, let's say like 4 different subqueries, just keep picking #9 until you get to the last one, then you can pick #4.
10. The transaction picker is pretty nice. You will go into a "transaction" mode, which basically allows you to build a transaction continually. You are allowed to insert, delete, or update data, as well as #4 to commit the transaction or #5 to rollback the last transaction made. The flow of this otherwise is the same as the main program, but it's like a separate mode. It's very intuitive to use otherwise.
11. The exception builder is quite unaccomodating, so it will prompt you to enter declarations at first. This is akin to the lines you enter following `DECLARE` keyboard. Do not put the `;` following any line as the CLI will automatically add those for you.
Afterwards, you will enter the lines following the `BEGIN` keyboard in the same way (where it says "Enter statements"), but this time you must put `;` where necessary. 
Then, you will enter the "exception condition", this is basically what you put into the following:
`EXCEPTION WHERE <clause> THEN`, and you're basically inputting the clause. You can do things like `OR` and whatnot as you wish. It will then prompt you for the "handler statements", which are basically the lines you put following the `THEN`.
12. Exits the program.

What is very nice about this CLI is, after every of these commands you will get a query. It says "Attempting query" and you can see exactly the command that's being sent to the database to process. So, if you entered something invalidly, you can see it and make adjustments to the command. It will also provide helpful error outputs if a command is incorrect.