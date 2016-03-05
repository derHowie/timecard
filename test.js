import test from 'ava';
import Timecard from './dist/index.js';
import path from 'path';
import rm from 'rimraf';
import pify from 'pify';
import fs from 'fs';
import wait from 'wait-p';

let timecard;
const timecardPath = path.join(__dirname, '.timecard.json');

test.beforeEach(() => {
	rm.sync(timecardPath);
	timecard = new Timecard({filepath: __dirname});
});

test('expose a constructor', t => {
	t.is(typeof Timecard, 'function');
});

test('creates a new timecard', async t => {
	await timecard.create();

	const data = await pify(fs.readFile)(timecardPath, 'utf8');
	t.is(data, '[]');
});

test('sets project name', async t => {
	const tc = new Timecard({name: 'awesome-project'});
	t.is(tc.name, 'awesome-project');
});

test('sets filepath', async t => {
	const tc = new Timecard({filepath: 'some/path'});
	t.is(tc.filepath, 'some/path/.timecard.json');
});

test('clockin', async t => {
	await timecard.create();
	await timecard.clockin();

	let data = await pify(fs.readFile)(timecardPath, 'utf8');
	data = JSON.parse(data);
	t.is(data.length, 1);
	t.true(data[0].hasOwnProperty('id'));
	t.true(data[0].hasOwnProperty('date'));
	t.true(data[0].hasOwnProperty('startTime'));
	t.is(typeof data[0].id, 'number');
	t.is(typeof data[0].date, 'string');
	t.is(typeof data[0].startTime, 'string');
});

test('clockout', async t => {
	await timecard.create();
	await timecard.clockin();
	await timecard.clockout();

	let data = await pify(fs.readFile)(timecardPath, 'utf8');
	const shift = JSON.parse(data)[0];
	t.is(typeof shift, 'object');
	t.true(shift.hasOwnProperty('id'));
	t.true(shift.hasOwnProperty('date'));
	t.true(shift.hasOwnProperty('startTime'));
	t.true(shift.hasOwnProperty('endTime'));
	t.is(typeof shift.id, 'number');
	t.is(typeof shift.date, 'string');
	t.is(typeof shift.startTime, 'string');
	t.is(typeof shift.endTime, 'string');
});

test('records total seconds', async t => {
	await timecard.create();
	await timecard.clockin();

	await wait(3000);
	await timecard.clockout();

	t.true(timecard.totalSeconds >= 3);
});

test.serial('utils.getTimeCardData', async t => {
	await timecard.create();
	await timecard.clockin();
	timecard.getTimeCardData().then(data => {
		t.true(data);
		t.is(typeof data, 'object');
		t.is(data[0].id, 0);
	});
});

test.serial('utils.writeTimeCard', async t => {
	await timecard.writeTimeCard('HEY!');

	let data = await pify(fs.readFile)(timecardPath, 'utf8');
	t.is(data, 'HEY!');
});

test.serial('prints output', async t => {
	await timecard.create();
	await timecard.clockin();
	await wait(3000);
	await timecard.clockout();
	const output = await timecard.printTimecard();

	t.is(typeof output, 'string');
	t.true(output.length > 400);
});
