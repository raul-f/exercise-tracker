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

// Route handlers

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
			console.log('\nNo users found.');
			res.json({message : 'No users have been found', context: 'no-users'});
		}
	})
});

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

// Not found middleware

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
