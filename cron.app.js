var cron = require('node-cron');
var bPromise = require('bluebird');
var VehicleServices = require('./src/services/vehicleServices');
var AuthServices = require('./src/services/authServices');
var moment = require('moment');

module.exports = {
    vehicleEveryDay: function () {
        //cron.schedule('*/10 * * * *', function (res) {
        cron.schedule(' 0 0 * * *', function (res) {
            console.log("sdsadsd 1")
            var vehicleData = [];
            var finalData = [];
            var nameList = [];
            var isMonthEnd = false;
			var isWeekEnd = false;
            return AuthServices.GetAllLoginLog().then(function (LogData) {
                return bPromise.all(LogData).each(function (item) {
					if (vehicleData.indexOf("" + item.vehicleid) == -1) {
                        vehicleData.push("" + item.vehicleid);
                    }
                    return VehicleServices.GetTodaysVehicleData({
                        vehicleids: vehicleData
                    }).then(function(Vdata){
                        if(moment().utc().endOf("month").format("DD") == moment().utc().format("DD")){
                            isMonthEnd = true;
                        }
                        
                        var getDayIndex = moment().utc().format("DD");
                        if(getDayIndex == 6){
                            isWeekEnd = true;
                        }
                        
                        return bPromise.all(Vdata).each(function(item){
                            var jsonData = JSON.parse(item.json);
                            var nameListIndexOf = nameList.indexOf("" + item.vehicleid);
                            if (nameListIndexOf == -1) {
                                finalData.push({
                                    "vehicleid": item.vehicleid,
                                    "isMonthEnd": isMonthEnd,
                                    "isWeekEnd": isWeekEnd,
                                    "time": item.time,
                                    "tdt": (jsonData.TDT) ? parseFloat(jsonData.TDT) : 0,
                                    "revenue": 0
                                })
                                nameList.push(""+item.vehicleid);
                            } else {
                                finalData[nameListIndexOf] = {
                                    "vehicleid": item.vehicleid,
                                    "isMonthEnd": isMonthEnd,
                                    "isWeekEnd": isWeekEnd,
                                    "time": item.time,
                                    "tdt": (jsonData.TDT) ? parseFloat(jsonData.TDT) : 0,
                                    "revenue": 0
                                };
                                nameList[nameListIndexOf] = ""+item.vehicleid;
                            }
                        })
                    }).then(function(){
                        return VehicleServices.GetTodaysVehicleRevanueData({
                            vehicleids: vehicleData
                        }).then(function(RData){
                            return bPromise.all(RData).each(function(item){
                                var nameListIndexOf = nameList.indexOf("" + item.vehicleid);
                                if (nameListIndexOf > -1) {
                                    finalData[nameListIndexOf].revenue = item.vehiclerevenue;
                                }
                            });
                        });
                    }).then(function(){
						console.log(finalData)
                        // return VehicleServices.VehiclechartAddData(finalData).then(function(insertdata){
                            // console.log("data inserted...")
                        // })
                    });
                })
            });
        });
    },
    init: function () {
        this.vehicleEveryDay();
    }
}