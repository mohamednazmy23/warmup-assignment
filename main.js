const fs = require("fs");

function time12ToSeconds(time){
    let [t, period] = time.split(" ");
    let [h, m, s] = t.split(":").map(Number);

    if(period === "pm" && h !== 12) h += 12;
    if(period === "am" && h === 12) h = 0;

    return h*3600 + m*60 + s;
}

function timeToSeconds(time){
    let [h,m,s] = time.split(":").map(Number);
    return h*3600 + m*60 + s;
}

function secondsToTime(sec){

    let h = Math.floor(sec/3600);
    sec %= 3600;

    let m = Math.floor(sec/60);
    let s = sec%60;

    return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}


// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    // TODO: Implement this function
let start = time12ToSeconds(startTime);
    let end = time12ToSeconds(endTime);

    return secondsToTime(end-start);
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    // TODO: Implement this function
     let start = time12ToSeconds(startTime);
    let end = time12ToSeconds(endTime);

    let deliveryStart = 8*3600;
    let deliveryEnd = 22*3600;

    let idle = 0;

    if(start < deliveryStart){
        idle += Math.min(end,deliveryStart) - start;
    }

    if(end > deliveryEnd){
        idle += end - Math.max(start,deliveryEnd);
    }

    return secondsToTime(idle);
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    // TODO: Implement this function

    let shift = timeToSeconds(shiftDuration);
    let idle = timeToSeconds(idleTime);

    return secondsToTime(shift-idle);
}


// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    // TODO: Implement this function
    let active = timeToSeconds(activeTime);

    let normalQuota = 8*3600 + 24*60;
    let eidQuota = 6*3600;

    let d = new Date(date);

    let eidStart = new Date("2025-04-10");
    let eidEnd = new Date("2025-04-30");

    let quota = (d>=eidStart && d<=eidEnd) ? eidQuota : normalQuota;

    return active >= quota;
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    // TODO: Implement this function


    let data = fs.readFileSync(textFile,"utf8").trim();
    let rows = data ? data.split("\n") : [];

    for(let row of rows){

        let cols = row.split(",");

        if(cols[0]===shiftObj.driverID && cols[2]===shiftObj.date){
            return {};
        }
    }

    let shiftDuration = getShiftDuration(shiftObj.startTime,shiftObj.endTime);
    let idleTime = getIdleTime(shiftObj.startTime,shiftObj.endTime);
    let activeTime = getActiveTime(shiftDuration,idleTime);
    let quota = metQuota(shiftObj.date,activeTime);

    let newRow = [
        shiftObj.driverID,
        shiftObj.driverName,
        shiftObj.date,
        shiftObj.startTime,
        shiftObj.endTime,
        shiftDuration,
        idleTime,
        activeTime,
        quota,
        false
    ].join(",");

    rows.push(newRow);

    fs.writeFileSync(textFile,rows.join("\n"));

    return {
        ...shiftObj,
        shiftDuration,
        idleTime,
        activeTime,
        metQuota: quota,
        hasBonus:false
    };
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    // TODO: Implement this function
    let rows = fs.readFileSync(textFile,"utf8").trim().split("\n");

    rows = rows.map(row=>{

        let cols = row.split(",");

        if(cols[0]===driverID && cols[2]===date){
            cols[9] = String(newValue);
        }

        return cols.join(",");
    });

    fs.writeFileSync(textFile,rows.join("\n"));
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================

function countBonusPerMonth(textFile, driverID, month) {

    let lines = fs.readFileSync(textFile, "utf8").trim().split("\n");

    let count = 0;
    let found = false;

    for (let i = 0; i < lines.length; i++) {

    let parts = lines[i].split(",");

    let id = parts[0].trim();
    let date = parts[2].trim();

    let bonus = parts[9] ? parts[9].trim().toLowerCase() : "";

    let m = Number(date.split("-")[1]);

    if (id === driverID) {

        found = true;

        if (m === Number(month) && bonus === "true") {
            count++;
        }
    }
}

    if (!found) return -1;

    return count;
}


// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
    let rows = fs.readFileSync(textFile,"utf8").trim().split("\n");

    let total = 0;

    for(let row of rows){

        let cols = row.split(",");

        if(cols[0]===driverID){

            let m = Number(cols[2].split("-")[1]);

            if(m===month){
                total += timeToSeconds(cols[7]);
            }
        }
    }

    return secondsToTime(total);
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // TODO: Implement this function
    let rows = fs.readFileSync(textFile,"utf8").trim().split("\n");
    let rateRows = fs.readFileSync(rateFile,"utf8").trim().split("\n");

    let dayOff = "";

    for(let r of rateRows){

        let cols = r.split(",");

        if(cols[0]===driverID){
            dayOff = cols[1];
        }
    }

    let total = 0;

    for(let row of rows){

        let cols = row.split(",");

        if(cols[0]===driverID){

            let date = new Date(cols[2]);
            let m = date.getMonth()+1;

            if(m===month){

                let weekday = date.toLocaleDateString("en-US",{weekday:"long"});

                if(weekday !== dayOff){

                    let eidStart = new Date("2025-04-10");
                    let eidEnd = new Date("2025-04-30");

                    let quota = (date>=eidStart && date<=eidEnd) ? 6*3600 : (8*3600+24*60);

                    total += quota;
                }
            }
        }
    }

    total -= bonusCount*2*3600;

    return secondsToTime(total);
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function

    let rows = fs.readFileSync(rateFile,"utf8").trim().split("\n");

    let basePay = 0;
    let tier = 0;

    for(let r of rows){

        let cols = r.split(",");

        if(cols[0]===driverID){
            basePay = Number(cols[2]);
            tier = Number(cols[3]);
        }
    }

    let allowance = {1:50,2:20,3:10,4:3};

    let actual = timeToSeconds(actualHours);
    let required = timeToSeconds(requiredHours);

    if(actual >= required) return basePay;

    let missing = required - actual;

    missing -= allowance[tier]*3600;

    if(missing <= 0) return basePay;

    let billableHours = Math.floor(missing/3600);

    let deductionRate = Math.floor(basePay/185);

    let deduction = billableHours * deductionRate;

    return basePay - deduction;
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
