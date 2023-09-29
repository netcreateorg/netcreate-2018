## Server Database

A simple sqlite3 implementation of an authentication database.

To test the datbase, set `DBG` to `true`.  This will insert dummy
data and run assertion tests.  NOTE after running tests, the database
needs to be cleared of the dummy data.

### The main tables:

  * users
  * groups
  * subgroups
  * roles
  * permissions

### Join tables:

  * user_groups
  * user_subgroups
  * subgroup_groups
  * user_roles
  * role_permissions

## GROUPS and SUBGROUPS

* Users can belong to one or more groups, or no groups.
* Users can belong to one or more subgroups, or no subgroups.

Subgroups are a secondary grouping category.  Users are directly assigned to a
subgroup.  Subgroups are in turn assigned to a Group.

## DB SCHEMA

```
TABLE             PK            FIELDS
users             id:           user_name
groups            id:           group_name
user_groups       group_id:     user_id
subgroups         id:           subgroup_name
subgroup_groups   subgroup_id:  group_id
user_subgroups    subgroup_id:  user_id
roles             id:           role_name
user_roles        role_id:      user_id
privs             id:           priv_name
role_privs        priv_id:      rold_id
```
