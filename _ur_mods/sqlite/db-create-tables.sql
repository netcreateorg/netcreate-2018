CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name VARCHAR(50) NOT NULL
);
CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_name VARCHAR(50) NOT NULL
);
CREATE TABLE IF NOT EXISTS user_groups (
  user_id INTEGER,
  group_id INTEGER,
  PRIMARY KEY (user_id, group_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (group_id) REFERENCES groups(id)
);
CREATE TABLE IF NOT EXISTS user_subgroups (
  user_id INTEGER,
  subgroup_id INTEGER,
  PRIMARY KEY (user_id, subgroup_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (subgroup_id) REFERENCES subgroups(id)
);
CREATE TABLE IF NOT EXISTS subgroups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subgroup_name VARCHAR(50) NOT NULL
);
CREATE TABLE IF NOT EXISTS subgroup_groups (
  group_id INTEGER,
  subgroup_id INTEGER,
  PRIMARY KEY (group_id, subgroup_id),
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (subgroup_id) REFERENCES subgroups(id)
);
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_name VARCHAR(50) NOT NULL
);
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER,
  role_id INTEGER,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);
CREATE TABLE IF NOT EXISTS privs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  priv_name VARCHAR(50) NOT NULL
);
CREATE TABLE IF NOT EXISTS role_privs (
  role_id INTEGER,
  priv_id INTEGER,
  PRIMARY KEY (role_id, priv_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (priv_id) REFERENCES privs(id)
);