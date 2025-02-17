const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Call = sequelize.define("Call", {
  from: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  to: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  extension: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  callSid: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  recordingUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Call;
