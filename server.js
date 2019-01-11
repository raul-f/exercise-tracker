const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const cors = require('cors');

const mongoose = require('mongoose');
mongoose.connect(process.env.MLAB_URI || 'mongodb://admin:83K740v%26t@ds243344.mlab.com:43344/raulf-projectdb', { useNewUrlParser: true });

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Schemas

const Schema = mongoose.Schema;

let exerciseSchema = new Schema({
	description: String,
	duration: Number,
	date: Date
});

let userSchema = new Schema({
	username: String,
	exercises: [exerciseSchema]
});

let User = mongoose.model('User', userSchema);

/* Route handlers */

// Create new user

app.post('/api/exercise/new-user', (req, res) => {
	console.log(`\n${req.method} request to ${req.url} has been successfully received!`);
	console.log(`The body of the request to ${req.url} is ${JSON.stringify(req.body)}`);
	check(req.body.username).then(result => {
		console.log(`The check function has returned ${JSON.stringify(result)}`);
		if (!result.existence) {
			res.json(result.user);
		} else {
			res.json({message: "This user already exists!", user: result.user});
		}
	});
});

// get user list

app.get('/api/exercise/users', (req, res) => {
	console.log(`\n${req.method} request to ${req.url} has been successfully received!`);
	//console.log(`\n`);
	User.find().then(result => {
		// console.log(`The result of the search is ${JSON.stringify(result)}`);
		// console.log(`The length of said array is ${result.length}`);
		if (result.length > 0) {
			// console.log('Entered if statement');
			let outputArray = [];
			for (let index = 0; index < result.length; index++) {
				// console.log(`Looped ${index} times.`);
				// console.log(`The entry at index ${index} is ${JSON.stringify(result[index])}`);
				outputArray.push({username: result[index].username, _id: result[index]._id});
				// console.log(`The output array at index ${index} is ${JSON.stringify(outputArray)}`);
			}
			console.log(`The array of users found is ${JSON.stringify(outputArray)}`);
			res.json(outputArray);
		} else {
			console.log('No users found.');
			res.json({message : 'No users have been found', context: 'no-users'});
		}
	})
});

// add exercise

app.post('/api/exercise/add', (req, res) => {
	console.log(`\n${req.method} request to ${req.url} has been successfully received!`);
	console.log(`The body of the request is ${JSON.stringify(req.body)}`);
	User.find({_id: req.body.userId}).then(result => {
		console.log(`The result of the search was ${JSON.stringify(result)}`);
		let exerciseDate = new Date(req.body.date);
		if (exerciseDate.getTime()) {
			result[0].exercises.push({
				description: req.body.description,
				duration: req.body.duration,
				date: exerciseDate
			});
		} else {
			result[0].exercises.push({
				description: req.body.description,
				duration: req.body.duration,
				date: new Date()
			});
		}
		let updatedUser = result[0];
		console.log(`The updated user is now ${JSON.stringify(updatedUser, null, 4)}`);
		updatedUser.save().then(data => {
			console.log(`The save function has been successful and the returned data is ${JSON.stringify(data)}`);
		}).catch(err => console.log(err));
	});
});

// get user's exercise log

app.get('/api/exercise/log', (req, res) => {

	// initial route logs

	console.log(`\n${req.method} request to ${req.url} has been successfully received!`);
	console.log(`The query in the request is ${JSON.stringify(req.query)}`);

	// check if there is a userId

	if (req.query.userId) {

		// req.query.userId is a truthy value => it's a non-empty string

		console.log('A userId has been provided.');
		console.log(`The userId in the query is ${req.query.userId}`);

		// check if there are additional query parameters

		if (req.query.from || req.query.to || req.query.limit) {

			// there are additional parameters

			console.log('Additional parameters have been provided.');

			// try to find a user with the provided id

			User.find({_id: req.query.userId}).then(result => {

				if (result.length === 0) {

					// User.find has returned [] => there are no users with such id.

					console.log('Error: invalid ID');
					res.json({error: 'no user with matching ID has been found'});

				} else {

					// User.find is a non-empty array! Its only item is a User document with _id = req.query.userId.

					console.log(`The user with ID ${req.query.userId} is ${result[0]}`);

					// set up the output object.

					let output = {
						user: {username: result[0].username, _id: result[0]._id}, 
						exercises: result[0].exercises, 
						exerciseCount: result[0].exercises.length
					};

					// check for the 'from' parameter

					if ((new Date(req.query.from)).getTime()) {

						// req.query.from is in the 'yyyy-mm-dd' format

						// make it a new Date

						let fromDate = new Date(req.query.from);

						// log req.query.from and the Date formed by it

						console.log(`The value of 'from' provided, ${req.query.from}, is valid, and the associated date is ${fromDate}`);

						// define auxiliary array

						let fromArray = [];

						// treat the output object so that no exercises with a date preceding fromDate remains.

						for (let index = 0; index < output.exercises.length; index++) {

							// Log so that it is clear that the 'for' loop is going correctly.

							console.log(`Spinning: So far this has looped ${index} times.`);

							// if an exercise has a date preceding 'fromDate', remove it from 'output.exercises'

							if (output.exercises[index].date.getTime() < fromDate.getTime()) {
								console.log(`The exercise ${JSON.stringify(output.exercises[index])} has a date below the specified 'from' value.`);
								output.exerciseCount--;
							} else {
								fromArray.push(output.exercises[index]);
							}

						}

						// set output.exercises to fromArray

						output.exercises = fromArray;
						console.log(`After the 'from' treatment, output.exercises has been set to ${JSON.stringify(output.exercises)}`);

					} else if ((new Date(parseInt(req.query.from))).getTime()) {

						// req.query.from is in the 'milliseconds' format

						// make it a new Date

						let fromDate = new Date(parseInt(req.query.from));

						// log req.query.from and the Date formed by it

						console.log(`The value of 'from' provided, ${req.query.from}, is valid, the parsed value is ${parseInt(req.query.from)} and the associated date is ${fromDate}`);

						// define auxiliary array

						let fromArray = [];

						// treat the output object so that no exercises with a date preceding fromDate remains.

						for (let index = 0; index < output.exercises.length; index++) {

							// Log so that it is clear that the 'for' loop is going correctly.

							console.log(`Spinning: So far this has looped ${index} times.`);

							// if an exercise has a date preceding 'fromDate', remove it from 'output.exercises'

							if (output.exercises[index].date.getTime() < fromDate.getTime()) {
								console.log(`The exercise ${JSON.stringify(output.exercises[index])} has a date below the specified 'from' value.`);
								output.exerciseCount--;
							} else {
								fromArray.push(output.exercises[index]);
							}
						}

						// set output.exercises to fromArray

						output.exercises = fromArray;
						console.log(`After the 'from' treatment, output.exercises has been set to ${JSON.stringify(output.exercises)}`);

					} else {

						// req.query.from is either absent or in an invalid format.

						console.log(`The value of 'from' provided, ${req.query.from}, is not valid`);
					}

					// check for the 'to' parameter

					if ((new Date(req.query.to)).getTime()) {

						// req.query.to is in the 'yyyy-mm-dd' format

						// make it a new Date

						let toDate = new Date(req.query.to);

						// log req.query.to and the Date formed by it

						console.log(`The value of 'to' provided, ${req.query.to}, is valid, and the associated date is ${toDate}`);

						// define auxiliary array

						let toArray = [];

						// treat the output object so that no exercises with a date preceding toDate remains.

						for (let index = 0; index < output.exercises.length; index++) {

							// Log so that it is clear that the 'for' loop is going correctly.

							console.log(`Spinning: So far this has looped ${index} times.`);

							// if an exercise has a date preceding 'toDate', remove it from 'output.exercises'

							if (output.exercises[index].date.getTime() > toDate.getTime()) {
								console.log(`The exercise ${JSON.stringify(output.exercises[index])} has a date above the specified 'to' value.`);
								output.exerciseCount--;
							} else {
								toArray.push(output.exercises[index]);
							}

						}

						// set output.exercises to toArray

						output.exercises = toArray;
						console.log(`After the 'to' treatment, output.exercises has been set to ${JSON.stringify(output.exercises)}`);

					} else if ((new Date(parseInt(req.query.to))).getTime()) {

						// req.query.to is in the 'milliseconds' format

						// make it a new Date

						let toDate = new Date(parseInt(req.query.to));

						// log req.query.to and the Date formed by it

						console.log(`The value of 'to' provided, ${req.query.to}, is valid, the parsed value is ${parseInt(req.query.to)} and the associated date is ${toDate}`);

						// define auxiliary array

						let toArray = [];

						// treat the output object so that no exercises with a date preceding toDate remains.

						for (let index = 0; index < output.exercises.length; index++) {

							// Log so that it is clear that the 'for' loop is going correctly.

							console.log(`Spinning: So far this has looped ${index} times.`);

							// if an exercise has a date preceding 'toDate', remove it from 'output.exercises'

							if (output.exercises[index].date.getTime() > toDate.getTime()) {
								console.log(`The exercise ${JSON.stringify(output.exercises[index])} has a date above the specified 'to' value.`);
								output.exerciseCount--;
							} else {
								toArray.push(output.exercises[index]);
							}
						}

						// set output.exercises to toArray

						output.exercises = toArray;
						console.log(`After the 'to' treatment, output.exercises has been set to ${JSON.stringify(output.exercises)}`);

					} else {

						// req.query.to is either absent or in an invalid format.

						console.log(`The value of 'to' provided, ${req.query.to}, is not valid`);
					}

					// check for the 'limit' parameter

					if (parseInt(req.query.limit) && parseInt(req.query.limit) > 0) {

						// limit is in the 'int' format and is bigger than zero

						console.log(`The value of 'limit' provided, ${req.query.limit}, is valid`);

						// define helper variables.

						let finalExList = [];

						// check which is bigger: output.exercises.length or parseInt(req.query.limit) - and set 'forLength' to the smallest of the two

						if (output.exercises.length > parseInt(req.query.limit)) {

							output.exerciseCount = parseInt(req.query.limit);

							// treat the output object so that no more exercises that parseInt(req.query.limit) remain.

							for (let index = 0; index < parseInt(req.query.limit); index++) {
								finalExList.push(output.exercises[index]);
							}
	
							// set output.exercises to finalExList
	
							output.exercises = finalExList;
							console.log(`After the 'limit' treatment, output.exercises has been set to ${JSON.stringify(output.exercises)}`);

						} else {
							console.log('The provided value of \'limit\' exceeds output.exercises.length');
						}

					} else {

						// req.query.limit is either absent, in an invalid format, or less than or equal to zero.

						console.log(`The value of 'limit' provided, ${req.query.limit}, is not valid`);
					}

					console.log(`The output that is about to be sent is ${JSON.stringify(output)}`);
					res.json(output);
				}
			});
		} else {

			// there are no additional params. Get the user's entire exercise log

			console.log('No additional parameters have been provided.');

			// try to find a user with the provided id

			User.find({_id: req.query.userId}).then(result => {

				if (result.length === 0) {

					// User.find has returned [] => there are no users with such id.

					console.log('Error: invalid ID');
					res.json({error: 'no user with matching ID has been found'});

				} else {

					// User.find is a non-empty array! Its only item is a User document with _id = req.query.userId.
					
					console.log(`The user with ID ${req.query.userId} is ${result[0]}`);
					res.json(
						{
							user: {username: result[0].username,  _id: result[0]._id},
							exercises: result[0].exercises,
							exerciseCount: result[0].exercises.length
						}
					);
				}
			});
		}
	} else {

		// req.query.userId is not a truthy value => either there is no req.query.userId, or req.query.userId === ""

		console.log('No userId has been provided.');
		res.json({'error': 'invalid user ID'});

	}
});

/* Not found middleware */

app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
});

// Error Handling middleware

app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
});

// DB functions

function check(name) {
	return User.find({username: name}).then(result => {
		if (result.length === 0) {
			console.log(`No user with name ${name} has been found.`);
			return create(name);
		} else {
			return {user: {'username': result[0].username, '_id': result[0]._id}, existence: true};
		}
	});
}

function create(name) {
	let newUser = new User({username: name});
	return newUser.save().then(data => {
		console.log(`New user with name ${name} has been created.`);
		return {user: {'username': data.username, '_id': data._id}, existence: false};
	});
}

// Listener

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});