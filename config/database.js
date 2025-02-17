const { Sequelize } = require("sequelize");

// Initialize SQLite Database
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
});

module.exports = sequelize;
