'use strict';

// Native
const fs = require('fs');
const path = require('path');

function validateWriteCall(t, spy, files, filter) {
	const callCount = spy.callCount;
	if (callCount !== files.length) {
		t.fail('Spy was not called correct number of times');
		return;
	}

	for (let i = 0; i < callCount; i++) {
		let data = readFixtureJSON(files[i]);
		if (filter) {
			data = filter(data);
		}
		t.deepEqual(spy.getCall(i).args[0], data);
	}
}

function readFixtureJSON(fileName) {
	const filePath = path.resolve(__dirname, '../fixtures', fileName);
	const fileData = fs.readFileSync(filePath);
	return JSON.parse(fileData);
}

module.exports = {
	validateWriteCall,
	readFixtureJSON
};
