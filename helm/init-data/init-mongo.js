db.createUser({
  user: "causelist",
  pwd: "causelist",
  roles: [
    {
      role: "readWrite",
      db: "causelist",
    },
  ],
});
