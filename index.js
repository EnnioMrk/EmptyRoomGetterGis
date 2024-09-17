import inquirer from 'inquirer';

let payload = {
    formatName: 'Klassen-Monitor-Pip',
    schoolName: 'Gymnasium im Schloss',
    date: 20240917,
    dateOffset: 0,
    strikethrough: true,
    mergeBlocks: true,
    showOnlyFutureSub: true,
    showBreakSupervisions: true,
    showTeacher: true,
    showClass: true,
    showHour: true,
    showInfo: true,
    showRoom: true,
    showSubject: true,
    groupBy: 1,
    hideAbsent: true,
    departmentIds: [],
    departmentElementType: -1,
    hideCancelWithSubstitution: true,
    hideCancelCausedByEvent: false,
    showTime: false,
    showSubstText: true,
    showAbsentElements: [1],
    showAffectedElements: [1, 2],
    showUnitTime: false,
    showMessages: true,
    showStudentgroup: false,
    enableSubstitutionFrom: false,
    showSubstitutionFrom: 0,
    showTeacherOnEvent: false,
    showAbsentTeacher: true,
    strikethroughAbsentTeacher: true,
    activityTypeIds: [],
    showEvent: true,
    showCancel: true,
    showOnlyCancel: false,
    showSubstTypeColor: false,
    showExamSupervision: false,
    showUnheraldedExams: false,
};

const dayOfWeekMap = new Map([
    ['Monday', 1],
    ['Tuesday', 2],
    ['Wednesday', 3],
    ['Thursday', 4],
    ['Friday', 5],
]);

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception thrown:', err);
});

//prompt user to enter a period. (1-8)
const period = (
    await inquirer.prompt([
        {
            type: 'input',
            name: 'period',
            message: 'Please enter a period (1-8):',
            validate: (input) => {
                const num = parseInt(input);
                return num >= 1 && num <= 8
                    ? true
                    : 'Please enter a number between 1 and 8.';
            },
        },
    ])
).period;
//ask for day of the week (monday-friday)

const dayOfWeek = (
    await inquirer.prompt([
        {
            type: 'list',
            name: 'day',
            message: 'Please select a day of the week:',
            choices: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
    ])
).day;

//calculate offset to current day of week (e.g. if today is wendsday and user selects monday, offset = -2)
const today = new Date();
const todayDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
const selectedDayOfWeek = dayOfWeekMap.get(dayOfWeek);
const offset = selectedDayOfWeek - todayDayOfWeek;

payload.dateOffset = offset;

fetch(
    'https://perseus.webuntis.com/WebUntis/monitor/substitution/data?school=Gymnasium%20im%20Schloss',
    {
        'headers': { 'content-type': 'application/json' },
        'referrer':
            'https://perseus.webuntis.com/WebUntis/monitor?school=Gymnasium%20im%20Schloss&monitorType=subst&format=Klassen-Monitor-Pip',
        'body': JSON.stringify(payload),
        'method': 'POST',
    }
)
    .then((response) => response.json())
    .then(async (data) => {
        let movedRooms = new Set();
        data.payload.rows.forEach((item) => {
            if (
                item.data[0] == period &&
                !item.cellClasses['4']?.includes('cancelStyle')
            ) {
                if (item.data[3].startsWith('<span')) {
                    movedRooms.add(item.data[3].split('>')[1].split('<')[0]);
                } else {
                    movedRooms.add(item.data[3]);
                }
            }
        });
        let emptyRooms = new Set();
        const filteredData = data.payload.rows.forEach((item) => {
            if (
                item.data[0] == period &&
                item.cellClasses['4']?.includes('cancelStyle')
            ) {
                emptyRooms.add(item.data[3]);
            }
        });

        movedRooms.forEach((room) => {
            if (emptyRooms.has(room)) {
                emptyRooms.delete(room);
            }
        });

        if (emptyRooms.size === 0) {
            return console.log(
                `No empty rooms for period ${period} on ${dayOfWeek}.`
            );
        }

        console.log(`Empty rooms for period ${period} on ${dayOfWeek}:`);
        console.log(Array.from(emptyRooms).join(', '));
    });
