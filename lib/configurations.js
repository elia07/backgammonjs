module.exports = {
  DefaultLanguage: "fa",
  CallBackAddress: "",
  CallBackPassword: "",
  ApiPassword: "123456",
  ApiAddress: "/Api/",
  RequireSessionKey: false,
  BindAddress: "0.0.0.0",
  Port: 8080,
  secret: "12124",
  connectionString:
    "mongodb://admin_ParsVegasBackgammon:12124@localhost:27017/PArsVegasBackgammon",
  databaseName: "PArsVegasBackgammon",
  sessionName: "ParsVegas_Backgammon_Session",
  timeBank: 360,
  turnTime: 30,
  rake: 20,
  idleTimoutforPlayers: 60,
  url: "http://localhost:8080/",
  tablesInfo: [
    {
      name: "Free",
      league: "Free",
      id: 1,
      buyIns: [0],
      length: [1, 3, 5, 7],
      menuIconAddress: "",
      gameItemBoarderColor: "",
      logoAddress: "",
      bannerImageAddress: "",
      createTableColors: ["", "", ""],
      menuColors: ["", "", "", "", ""],
      createTableColors: "",
    },
    {
      name: "WarmUp",
      league: "WarmUp",
      id: 2,
      buyIns: [1000, 2000, 5000, 10000],
      length: [1],
      menuIconAddress: "",
      gameItemBoarderColor: "",
      logoAddress: "",
      bannerImageAddress: "",
      createTableColors: ["", "", ""],
      menuColors: ["", "", "", "", ""],
      createTableColors: "",
    },
    {
      name: "Starter",
      league: "Starter",
      id: 3,
      buyIns: [20000, 30000, 40000, 50000],
      length: [1],
      menuIconAddress: "",
      gameItemBoarderColor: "",
      logoAddress: "",
      bannerImageAddress: "",
      createTableColors: ["", "", ""],
      menuColors: ["", "", "", "", ""],
      createTableColors: "",
    },
    {
      name: "Pro",
      league: "Pro",
      id: 4,
      buyIns: [100000, 125000, 150000, 200000],
      length: [1, 3],
      menuIconAddress: "",
      gameItemBoarderColor: "",
      logoAddress: "",
      bannerImageAddress: "",
      createTableColors: ["", "", ""],
      menuColors: ["", "", "", "", ""],
      createTableColors: "",
    },
    {
      name: "DiceMaster",
      league: "DiceMaster",
      id: 5,
      buyIns: [250000, 500000, 750000, 1000000],
      length: [1, 3, 5],
      menuIconAddress: "",
      gameItemBoarderColor: "",
      logoAddress: "",
      bannerImageAddress: "",
      createTableColors: ["", "", ""],
      menuColors: ["", "", "", "", ""],
      createTableColors: "",
    },
    {
      name: "GodsAreana",
      league: "GodsAreana",
      id: 6,
      buyIns: [1500000, 2500000, 3500000, 5000000],
      length: [1, 3, 5, 7],
      menuIconAddress: "",
      gameItemBoarderColor: "",
      logoAddress: "",
      bannerImageAddress: "",
      createTableColors: ["", "", ""],
      menuColors: ["", "", "", "", ""],
      createTableColors: "",
    },
  ],
  GetLeague: function (leagueName) {
    var tableInfo = null;
    for (var i = 0; i < this.tablesInfo.length; i++) {
      if (this.tablesInfo[i].league == leagueName) {
        tableInfo = this.tablesInfo[i];
      }
    }
    return tableInfo;
  },
  GetTableInfoByName: function (tableName) {
    var tableInfo = null;
    for (var i = 0; i < this.tablesInfo.length; i++) {
      if (this.tablesInfo[i].name == tableName) {
        tableInfo = this.tablesInfo[i];
      }
    }
    return tableInfo;
  },
  GetTableInfoByID: function (id) {
    var tableInfo = null;
    for (var i = 0; i < this.tablesInfo.length; i++) {
      if (this.tablesInfo[i].id == id) {
        tableInfo = this.tablesInfo[i];
      }
    }
    return tableInfo;
  },
};
