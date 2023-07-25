db.createUser({
  user: 'root',
  pwd: 'nft1234',
  roles: [
    {role: 'userAdminAnyDatabase', db: 'admin'},
    {role: 'readWriteAnyDatabase', db: 'admin'},
  ],
});

db.createUser({
  user: 'uTester2',
  pwd: 'brocal',
  roles: [{role: 'readWrite', db: 'externalnft'}],
});
