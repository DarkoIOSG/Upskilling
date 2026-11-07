export const schema = [
  {
    name: 'employees',
    columns: [
      'id INTEGER · PK',
      'name TEXT',
      'department_id INTEGER · FK',
      'salary INTEGER',
      'manager_id INTEGER · FK',
      'hired_at TEXT',
    ],
  },
  { name: 'departments', columns: ['id INTEGER · PK', 'name TEXT'] },
  { name: 'customers', columns: ['id INTEGER · PK', 'name TEXT', 'city TEXT'] },
  {
    name: 'orders',
    columns: [
      'id INTEGER · PK',
      'customer_id INTEGER · FK',
      'amount INTEGER',
      'status TEXT',
      'ordered_at TEXT',
    ],
  },
];
export const seed = `
CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT NOT NULL, department_id INTEGER REFERENCES departments(id), salary INTEGER, manager_id INTEGER REFERENCES employees(id), hired_at TEXT);
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id), amount INTEGER, status TEXT, ordered_at TEXT);
INSERT INTO departments VALUES (1,'Engineering'),(2,'Design'),(3,'Marketing'),(4,'Operations');
INSERT INTO employees VALUES
(1,'Alex',1,95000,NULL,'2021-01-15'),(2,'Sam',1,80000,1,'2022-06-01'),(3,'Jordan',2,85000,NULL,'2021-03-10'),
(4,'Taylor',2,70000,3,'2023-02-20'),(5,'Morgan',3,75000,NULL,'2022-08-15'),(6,'Casey',1,80000,1,'2023-05-01'),
(7,'Riley',3,65000,5,'2024-01-10'),(8,'Quinn',NULL,60000,NULL,'2024-04-01');
INSERT INTO customers VALUES (1,'Ava','London'),(2,'Noah','Berlin'),(3,'Mia','London'),(4,'Leo','Paris'),(5,'Zoe',NULL);
INSERT INTO orders VALUES
(1,1,120,'completed','2024-01-05'),(2,2,200,'completed','2024-01-10'),(3,1,80,'completed','2024-02-05'),
(4,3,150,'pending','2024-02-08'),(5,2,50,'cancelled','2024-02-15'),(6,4,300,'completed','2024-03-01'),
(7,1,200,'completed','2024-03-05'),(8,3,90,'completed','2024-03-10');
CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);
`;
// Additional rows catch hardcoded answers, accidental tie breaking, NULL errors and missing joins.
export const hiddenSeed = `
INSERT INTO employees VALUES (9,'Drew',1,95000,1,'2024-05-01'),(10,'Sky',4,105000,NULL,'2024-06-01'),(11,'Ellis',2,NULL,3,'2024-06-02'),(12,'Robin',NULL,55000,NULL,'2024-07-01');
INSERT INTO customers VALUES (6,'Ivy','London'),(7,'Kai',NULL);
INSERT INTO orders VALUES (9,6,450,'completed','2024-03-10'),(10,NULL,70,'completed','2024-04-01'),(11,2,125,'completed','2024-04-01'),(12,6,50,'pending','2024-04-05');
`;
