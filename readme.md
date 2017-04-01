# Twitter Popularity Grapher

Inspired by [this tweet by Hank Green](https://twitter.com/hankgreen/status/845659536681766912)
this is the Twitter Popularity Grapher. Its role is to graph the relative likes
and retweets of particular "topics" over time for a specific user on Twitter.

Right now,
[Donald Trump's main Twitter account](https://twitter.com/realDonaldTrump) is
the hardcoded account that this loads from, but that will eventually change.

The latest version of this app is available at
[twittergrapher.ivanmattie.com](https://twittergrapher.ivanmattie.com/) at the 
moment.

## Building

To build this project, you'll need [Node.js](https://nodejs.org/en/) and 
[Gulp](http://gulpjs.com/) to build/work on the project. 

First, get and install NPM and Node.js from the [main site](http://gulpjs.com/).

Once that's installed, you'll need to globally install Gulp; do so by opening
your terminal/command line of choice and then typing:

```
npm i -g gulp
```

Then finally, from project root, run the following to install all project
dependencies:

```
npm install
```

## Build Commands

To build the project, you can run one of the following build commands from 
project root:

---
```
gulp
```

Builds both the Javascript and CSS/SASS files (to the `/public` folder).

---
```
gulp watch
```

Continuously watches (until you cancel the command) the SASS and JS source files
for changes, and re-builds them as needed. 

---
```
gulp build-css
```

Just builds the CSS files from the SASS source files.

---
```
gulp build-js
```

Just builds the JS files from the SASS source files.