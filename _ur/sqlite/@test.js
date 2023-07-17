/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Server Database

  A simple sqlite3 implementation of an authentication database.

  To test the datbase, set `DBG` to `true`.  This will insert dummy
  data and run assertion tests.  NOTE after running tests, the database
  needs to be cleared of the dummy data.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const assert = require('node:assert/strict');
const sqlite3 = require('sqlite3').verbose();
const files = require('../_util/files');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DB = new sqlite3.Database(':memory:'); // use 'auth.sqlite3' for file
const TERM = require('../_util/prompts').makeTerminalOut(' SQL', 'TagYellow');
const DBG = true; // Runs Tests if true

/// INITIALIZE DATABASE ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
(async () => {
  // read SQL file
  const filename = `_ur/sqlite/db-create-tables.sql`;
  const sql = await files.ReadFile(filename);
  const stms = sql.trim().split(';');
  DB.serialize(async () => {
    // convert file to statements because db.run() only works one statement
    // at a time
    stms.forEach(stm => {
      if (!stm) return;
      console.log(stm);
      DB.run(stm, err => {
        if (err) throw err;
      });
    });
    defineBuiltInRolesAndPermissions(DB); // create basic roles and privs tables
    if (DBG) testDB(DB); // assertion tests
    DB.close();
  });
})();

/// NEW DATABASE METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_IsValuesArray(array) {
  if (!Array.isArray(array)) {
    return false; // Not an array
  }
  for (const value of array) {
    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      return false; // Subarray contains non-primitive value
    }
  }
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_IsArrayOfValueArrays(array) {
  if (!Array.isArray(arr)) {
    return false; // Not an array
  }
  for (const subArr of arr) {
    if (!m_IsValuesArray(subarr)) return false;
  }
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a record spec of list of fields and values to fill with records
 *  of the array values
 */
function InsertValues(tableName, fields, records) {
  if (!Array.isArray(fields)) fields = [fields];
  if (!Array.isArray(records)) records = [records];
  records = records.map(record => {
    if (!Array.isArray(record)) {
      if (typeof record === 'object') {
        TERM(`InsertValues: bad arg3 type ${record}`);
        throw Error(`InsertValues: arg3 must be array of arrays of values`);
      }
      // otherwise it's a primitive, so wrap in array to handle single-value case
      return [record];
    }
    return record;
  });
  records.forEach(record => {
    if (record.length !== fields.length)
      throw Error(
        `InsertValues: record (${record.join()}) under/overflow ${fields.join()}`
      );
  });
  const pf = `${fields.map(fn => fn).join(', ')}`;
  const pv = fields.map(() => '?').join(', ');
  const sql = `INSERT INTO ${tableName} (${pf}) VALUES (${pv})`;
  const stmt = DB.prepare(sql);
  TERM('InsertValues:', sql);
  records.forEach(record => {
    if (!Array.isArray(record)) record = [record];
    TERM(`InsertValues: (${fields.join()}) add ${record.join()}`);
    stmt.run(...record);
  });
  stmt.finalize();
}

/// DATABASE METHODS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Add an array of user names to the database.
 *  @param {Array} names [ strings ]
 */
function usersAdd(names) {
  const stmt = DB.prepare('INSERT INTO users (user_name) VALUES (?)');
  names.forEach(name => stmt.run(name));
  stmt.finalize();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Add user_id to group_id
 *  @param {integer} user_id
 *  @param {integer} group_id
 */
function userAddGroup(user_id, group_id) {
  const stmt = DB.prepare(
    'INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)'
  );
  stmt.run(user_id, group_id);
  stmt.finalize();
}
/**
 * Add user_id to subgroup_id
 * @param {integer} user_id
 * @param {integer} subgroup_id
 */
function userAddSubgroup(user_id, subgroup_id) {
  const stmt = DB.prepare(
    'INSERT INTO user_subgroups (user_id, subgroup_id) VALUES (?, ?)'
  );
  stmt.run(user_id, subgroup_id);
  stmt.finalize();
}
/**
 * Add user_id to role_id
 * @param {integer} user_id
 * @param {integer} role_id
 */
function userAddRole(user_id, role_id) {
  const stmt = DB.prepare(
    'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)'
  );
  stmt.run(user_id, role_id);
  stmt.finalize();
}
/**
 * Get user info
 * @param {integer} user_id
 * @param {function} cb Callback function [ ...{ id, user_name}]
 */
function userGet(user_id, cb) {
  if (typeof cb !== 'function')
    throw new Error(`userGet called with bad callback: ${cb}`);
  const query = `
SELECT users.*
FROM users
WHERE users.id = ${user_id}
    `;
  DB.all(query, (error, rows) => {
    if (error) throw new Error(`Error retrieving user data: ${error}`);
    cb(rows);
  });
}
/**
 * Get user info for ALL users
 * @param {function} cb Callback function [ ...{ id, user_name}]
 */
function usersGet(cb) {
  if (typeof cb !== 'function')
    throw new Error(`userGetSubgroup called with bad callback: ${cb}`);
  const query = `SELECT users.* FROM users`;
  DB.all(query, (error, rows) => {
    if (error) throw new Error(`Error retrieving usersGet data: ${error}`);
    cb(rows);
  });
}
/**
 * Get user and group info for all users
 * @param {function} cb Callback function [ ...{ id, user_name, group_name}]
 */
function usersAndGroupsGet(cb) {
  if (typeof cb !== 'function')
    throw new Error(`usersAndGroupsGet called with bad callback: ${cb}`);
  const query = `
SELECT users.*, groups.group_name
FROM users
JOIN user_groups ON users.id = user_groups.user_id
JOIN groups ON user_groups.group_id = groups.id
    `;
  DB.all(query, (error, rows) => {
    if (error)
      throw new Error(`Error retrieving usersAndGroupsGet data: ${error}`);
    cb(rows);
  });
}
/**
 * Get user group
 * @param {integer} user_id
 * @param {function} cb Callback function [ ...{ id, group_name }]
 */
function userGetGroups(user_id, cb) {
  if (typeof cb !== 'function')
    throw new Error(`userGetGroups called with bad callback: ${cb}`);
  const query = `
SELECT groups.*
FROM users
JOIN user_groups ON users.id = user_groups.user_id
JOIN groups ON user_groups.group_id = groups.id
WHERE users.id = ${user_id}
    `;
  DB.all(query, (error, rows) => {
    if (error) throw new Error(`Error retrieving user group data: ${error}`);
    cb(rows);
  });
}
/**
 *
 * @param {integer} user_id
 * @param {function} cb Callback function [ ...{id, subgroup_name} ]
 */
function userGetSubgroups(user_id, cb) {
  if (typeof cb !== 'function')
    throw new Error(`userGetSubgroup called with bad callback: ${cb}`);
  const query = `
SELECT subgroups.*
FROM users
JOIN user_subgroups ON users.id = user_subgroups.user_id
JOIN subgroups ON user_subgroups.subgroup_id = subgroups.id
WHERE users.id = ${user_id}
    `;
  DB.all(query, (error, rows) => {
    if (error) throw new Error(`Error retrieving user subgroup data: ${error}`);
    cb(rows);
  });
}
/**
 *
 * @param {integer} user_id
 * @param {function} cb Callback function with result = [...{id, role_name}]
 */
function userGetRoles(user_id, cb) {
  if (typeof cb !== 'function')
    throw new Error(`userGetRoles called with bad callback: ${cb}`);
  const query = `
SELECT roles.*
FROM users
JOIN user_roles ON users.id = user_roles.user_id
JOIN roles ON user_roles.role_id = roles.id
WHERE users.id = ${user_id}
    `;
  DB.all(query, (error, rows) => {
    if (error) throw new Error(`Error retrieving user role data: ${error}`);
    cb(rows);
  });
}
/**
 *
 * @param {integer} user_id
 * @param {function} cb Callback function with array of `priv_name`
 */
function userGetPermissions(user_id, cb) {
  if (typeof cb !== 'function')
    throw new Error(`userGetPermissions called with bad callback: ${cb}`);
  const query = `
SELECT privs.priv_name
FROM users
JOIN user_roles ON users.id = user_roles.user_id
JOIN roles ON user_roles.role_id = roles.id
JOIN role_privs ON user_roles.role_id = role_privs.role_id
JOIN privs ON role_privs.priv_id = privs.id
WHERE users.id = ${user_id}
    `;
  DB.all(query, (error, rows) => {
    if (error)
      throw new Error(`Error retrieving users permission data: ${error}`);
    // Remove duplicates
    const results = [];
    rows.forEach(r => {
      if (!results.includes(r.priv_name)) results.push(r.priv_name);
    });
    cb(results);
  });
}
/**
 *
 * @param {integer} user_id
 * @param {function} cb Callback function
 */
function userHasPermissions(user_id, priv_id, cb) {}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// GROUPS
/**
 * Add an array of group names to the database.
 * @param {Array} names [ strings ]
 */
function groupsAdd(names) {
  const stmt = DB.prepare('INSERT INTO groups (group_name) VALUES (?)');
  names.forEach(name => stmt.run(name));
  stmt.finalize();
}
/**
 * Get all users in a group
 * @param {function} cb Callback function [ ...{id, group_name} ]
 */
function groupsGet(cb) {
  if (typeof cb !== 'function')
    throw new Error(`groupsGet called with bad callback: ${cb}`);
  const query = `SELECT groups.* FROM groups`;
  DB.all(query, (error, rows) => {
    if (error) throw new Error(`Error retrieving groups data: ${error}`);
    cb(rows);
  });
}
/**
 * Get all users in a group
 * @param {integer} group_id
 * @param {function} cb Callback function [ ...{id, user_name} ]
 */
function groupGetUsers(group_id, cb) {
  if (typeof cb !== 'function')
    throw new Error(`groupGetUsers called with bad callback: ${cb}`);
  const query = `
SELECT users.*
FROM users
JOIN user_groups ON users.id = user_groups.user_id
JOIN groups ON user_groups.group_id = groups.id
WHERE groups.id = ${group_id};
    `;
  DB.all(query, (error, rows) => {
    if (error) throw new Error(`Error retrieving group\`s user data: ${error}`);
    cb(rows);
  });
}
/**
 * Get a Group's SubGroups
 * @param {integer} group_id Pass `undefined` to get ALL groups
 * @param {function} cb Callback function [ ...subgroup_name ]
 */
function groupGetSubgroups(group_id, cb) {
  if (typeof cb !== 'function')
    throw new Error(`groupGetSubgroups called with bad callback: ${cb}`);
  const query = `
SELECT subgroups.subgroup_name
FROM subgroups
JOIN subgroup_groups ON subgroups.id = subgroup_groups.subgroup_id
JOIN groups ON subgroup_groups.group_id = groups.id
WHERE groups.id = ${group_id}
    `;
  DB.all(query, (error, rows) => {
    if (error)
      throw new Error(`Error retrieving group\`s subgroup data: ${error}`);
    cb(rows.map(r => r.subgroup_name));
  });
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// SUBGROUPS
/**
 * Add an array of subgroup names to the database.
 * @param {Array} names [ strings ]
 */
function subgroupsAdd(names) {
  const stmt = DB.prepare('INSERT INTO subgroups (subgroup_name) VALUES (?)');
  names.forEach(name => stmt.run(name));
  stmt.finalize();
}
/**
 * Add subgroup to a group
 * @param {integer} subgroup_id
 * @param {integer} group_id
 */
function subgroupAddGroup(subgroup_id, group_id) {
  const stmt = DB.prepare(
    'INSERT INTO subgroup_groups (subgroup_id, group_id) VALUES (?, ?)'
  );
  stmt.run(subgroup_id, group_id);
  stmt.finalize();
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// ROLES
/**
 * Add mutliple role names via an array of role names.
 * @param {Array} names [ strings ]
 */
function rolesAdd(names) {
  const stmt = DB.prepare('INSERT INTO roles (role_name) VALUES (?)');
  names.forEach(name => stmt.run(name));
  stmt.finalize();
}
/**
 * Set multiple privs for a role
 * by adding an array of permission ids to a role.
 * @param {integer} role_id
 * @param {Array} privs [ priv_id ]
 */
function roleAddPermissions(role_id, privs) {
  const stmt = DB.prepare(
    'INSERT INTO role_privs (role_id, priv_id) VALUES (?, ?)'
  );
  privs.forEach(permission => stmt.run(role_id, permission));
  stmt.finalize();
}
/**
 *
 * @param {integer} role_id
 * @param {function} cb Callback function with `privs` passed as
 *                      [ ...{id, priv_name}]
 */
function roleGetPermissions(role_id, cb) {
  if (typeof cb !== 'function')
    throw new Error(`roleGetPermissions called with bad callback: ${cb}`);
  const query = `
SELECT privs.*
FROM privs
JOIN role_privs ON privs.id = role_privs.priv_id
JOIN roles ON role_privs.role_id = roles.id
WHERE roles.id = ${role_id}
    `;
  DB.all(query, (error, rows) => {
    if (error)
      throw new Error(`Error retrieving role permission data: ${error}`);
    cb(rows);
  });
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// PERMISSIONS
/**
 * Add an array of privs to the database.
 * @param {Array} privs [ {id, name} ]
 */
function permissionsAdd(privs) {
  const stmt = DB.prepare('INSERT INTO privs (id, priv_name) VALUES (?, ?)');
  privs.forEach(priv => stmt.run(priv.id, priv.name));
  stmt.finalize();
}

// ============================================================================
// BUILT-IN TABLES
//
// DB Tables that most projects will want to share.
// Apps will wanto define their own
async function defineBuiltInRolesAndPermissions(DB) {
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // ROLES
  // Standard pre-defined roles.  Uncomment a reduced set, or default to ALL.
  //
  // Option: Classroom Set
  // const roles = ['Student', 'Teacher', 'Researcher', 'Admin'];
  //
  // Option: Research Team Set
  // const roles = ['User', 'Researcher', 'Admin'];
  //
  // Option: ALL Set
  const roles = ['Guest', 'Student', 'User', 'Teacher', 'Researcher', 'Admin'];
  rolesAdd(roles);
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // PERMISSIONS
  // Define Permissions
  const privs = [
    { id: 10, name: 'graphView' },
    { id: 11, name: 'graphEdit' },
    { id: 20, name: 'templateView' },
    { id: 21, name: 'templateEdit' }
  ];
  permissionsAdd(privs);
  // Set Permissions for Roles
  let permissionsToAdd = [10];
  roleAddPermissions(1, permissionsToAdd); // Guest
  permissionsToAdd = [10, 11];
  roleAddPermissions(2, permissionsToAdd); // Student
  permissionsToAdd = [10, 11];
  roleAddPermissions(3, permissionsToAdd); // User
  permissionsToAdd = [10, 11, 20];
  roleAddPermissions(4, permissionsToAdd); // Teacher
  permissionsToAdd = [10, 11, 20, 21];
  roleAddPermissions(5, permissionsToAdd); // Researcher
  permissionsToAdd = [10, 11, 20, 21];
  roleAddPermissions(6, permissionsToAdd); // Admin
}

// NOTE: These tests modify the database.  Be sure to reset the database after
//       testing.
function testDB(db) {
  db.serialize(() => {
    TERM('testing db...');
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // USERS
    const users = ['Ben', 'Sri', 'Joshua', 'Kalani'];
    usersAdd(users);
    // ...test
    userGet(2, results => assert.strictEqual(results[0].user_name, 'Sri'));

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // GROUPS
    const groups = ['Inquirium', 'IU'];
    groupsAdd(groups);
    // -- ASSIGN USERS to GROUPS
    const ugroups = [
      { user_id: 1, group_id: 1 }, // Ben Inq
      { user_id: 2, group_id: 1 }, // Sri Inq
      { user_id: 3, group_id: 2 }, // Joshua IU
      { user_id: 4, group_id: 2 } // Kalani IU
    ];
    ugroups.forEach(u => {
      userAddGroup(u.user_id, u.group_id);
    });
    // ...test
    groupsGet(results => {
      assert.strictEqual(results[0].group_name, 'Inquirium');
      assert.strictEqual(results[1].group_name, 'IU');
    });
    groupGetUsers(2, results => {
      assert.strictEqual(results[0].user_name, 'Joshua');
      assert.strictEqual(results[1].user_name, 'Kalani');
    });
    userGetGroups(2, results =>
      assert.strictEqual(results[0].group_name, 'Inquirium')
    );
    usersAndGroupsGet(results => {
      assert.deepEqual(results[0], {
        id: 1,
        user_name: 'Ben',
        group_name: 'Inquirium'
      });
      assert.deepEqual(results[2], {
        id: 3,
        user_name: 'Joshua',
        group_name: 'IU'
      });
    });

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // SUBGROUPS
    const subgroups = ['Blue', 'Green'];
    subgroupsAdd(subgroups);
    // -- ASSIGN SUBROUPS to GROUPS
    const subgroupGroups = [
      { subgroup_id: 1, group_id: 1 }, // Inq Blue
      { subgroup_id: 2, group_id: 1 } // Inq Green
    ];
    subgroupGroups.forEach(g => {
      subgroupAddGroup(g.subgroup_id, g.group_id);
    });
    // -- ASSIGN USERS TO SUBGROUPS
    const userSubgroups = [
      { user_id: 1, subgroup_id: 2 }, // Ben Green
      { user_id: 2, subgroup_id: 2 }, // Sri Green
      { user_id: 3, subgroup_id: 1 }, // Joshua Blue
      { user_id: 4, subgroup_id: 1 } // Kalani Blue
    ];
    userSubgroups.forEach(ug => {
      userAddSubgroup(ug.user_id, ug.subgroup_id);
    });
    // ...test
    groupGetSubgroups(1, results =>
      assert.deepEqual(results, ['Blue', 'Green'])
    );
    groupGetSubgroups(2, results => assert.deepEqual(results, []));
    userGetSubgroups(1, results =>
      assert.strictEqual(results[0].subgroup_name, 'Green')
    );
    userGetSubgroups(3, results =>
      assert.strictEqual(results[0].subgroup_name, 'Blue')
    );

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // ROLES
    const uroles = [
      { user_id: 1, role_id: 2 }, // Ben Student
      { user_id: 2, role_id: 2 }, // Ben Student
      { user_id: 3, role_id: 4 }, // Joshua Teacher
      { user_id: 3, role_id: 5 }, // Joshua Researcher
      { user_id: 3, role_id: 6 }, // Joshua Admin
      { user_id: 4, role_id: 3 } // Kalani Teacher
    ];
    uroles.forEach(u => {
      userAddRole(u.user_id, u.role_id);
    });
    // ...test
    userGetRoles(3, results => {
      assert.strictEqual(results[0].role_name, 'Teacher');
      assert.strictEqual(results[1].role_name, 'Researcher');
      assert.strictEqual(results[2].role_name, 'Admin');
    });

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // PERMISSIONS
    roleGetPermissions(6, results =>
      assert.deepEqual(results, [
        { id: 10, priv_name: 'graphView' },
        { id: 11, priv_name: 'graphEdit' },
        { id: 20, priv_name: 'templateView' },
        { id: 21, priv_name: 'templateEdit' }
      ])
    );
    userGetPermissions(1, results =>
      assert.deepEqual(results, ['graphView', 'graphEdit'])
    );
    userGetPermissions(3, results =>
      assert.deepEqual(results, [
        'graphView',
        'graphEdit',
        'templateView',
        'templateEdit'
      ])
    );

    TERM('...testing db completed!');
  });
}
