
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Extension = sequelize.define("Extension", {
  number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  extension: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Extension;
