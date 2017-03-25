google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(function() {
    console.log("Charts ready!");
});

(function() {
    var TwitterGrapher = function() {
        this.topics = {
            "AHCA": /(obamacare)|(repealandreplace)|(healthcare)|(ahca)/,
            "Fake News": /(fake news)/
        };
    };

    TwitterGrapher.prototype.signIn = function() {
        var self = this;

        cb.__call(
            "oauth_requestToken",
            {oauth_callback: "oob"},
            function (reply,rate,err) {
                if (err) {
                    console.log("error response or timeout exceeded" + err.error);
                }
                if (reply) {
                    // stores it
                    cb.setToken(reply.oauth_token, reply.oauth_token_secret);

                    self.showPinInput();

                    // gets the authorize screen URL
                    cb.__call(
                        "oauth_authorize",
                        {},
                        function (auth_url) {
                            window.codebird_auth = window.open(auth_url);
                        }
                    );
                }
            }
        );
    };

    TwitterGrapher.prototype.showPinInput = function() {
        var signInWrapper = document.querySelector(".sign-in-wrapper");
        var pinWrapper = document.querySelector(".pin-wrapper");

        signInWrapper.style.display = "none";
        pinWrapper.style.display = "block";
    };

    TwitterGrapher.prototype.verifyPin = function() {
        var pinInput = document.getElementById("pin");
        var pinNumber = pinInput.value;

        cb.__call(
            "oauth_accessToken",
            {oauth_verifier: pinNumber},
            function (reply,rate,err) {
                if (err) {
                    console.log("error response or timeout exceeded" + err.error);
                }
                if (reply) {
                    // store the authenticated token, which may be different from the request token (!)
                    cb.setToken(reply.oauth_token, reply.oauth_token_secret);
                }

                // if you need to persist the login after page reload,
                // consider storing the token in a cookie or HTML5 local storage
            }
        );
    };

    TwitterGrapher.prototype.getTweets = function(callback) {
        var chunk = new TweetChunk(10, callback);

        chunk.get();
    };

    var TweetChunk = function(limit, callback) {
        this.tweets = [];
        this.chunks = 0;
        this.limit = limit;
        this.callback = callback;
    };

    TweetChunk.prototype.get = function(startingPoint) {
        var self = this, data = {
            "screen_name": "realDonaldTrump",
            "count": 200
        };

        if(startingPoint) {
            data["max_id"] = startingPoint;
        }

        cb.__call(
            "statuses_userTimeline",
            data,
            function (reply, rate, err) {
                if(err) {
                    console.log(err);
                } else {
                    self.tweetsRecieved(reply);
                }
            }
        );
    };

    TweetChunk.prototype.tweetsRecieved = function(tweets) {
        this.tweets.push.apply(this.tweets, tweets);
        this.chunks += 1;

        if(this.chunks >= this.limit) {
            this.callback(this.tweets);
        } else {
            this.get(tweets[tweets.length - 1].id);
        }
    };

    TwitterGrapher.prototype.sortTweets = function() {
        var self = this, topics = this.topics;

        this.getTweets(function(tweets) {
            var x, tweet, topicName, topicKeywords, k, keyword, sorted = {};

            console.log("Total Tweets: " + tweets.length);

            for(x = 0; x < tweets.length; x++) {
                tweet = tweets[x];
                var matches = {}, bestMatchName, bestMatchValue = 0;
                
                for(topicName in topics) {
                    topicRegex = topics[topicName];

                    var _result = tweet.text.toLowerCase().match(topicRegex);

                    if(_result) {
                        matches[topicName] = _result.length;

                        if(_result.length > bestMatchValue) {
                            bestMatchValue = _result.length;
                            bestMatchName = topicName;
                        }
                    } else {
                        matches[topicName] = 0;
                    }
                }

                if(bestMatchValue < 1) {
                    if(!sorted["No Topic"]) {
                        sorted["No Topic"] = [];
                    }

                    sorted["No Topic"].push(tweet);
                } else {
                    if(!sorted[bestMatchName]) {
                        sorted[bestMatchName] = [];
                    }

                    sorted[bestMatchName].push(tweet);
                }
            }

            self.sorted = sorted;
            self.createButtons();
        });
    };

    TwitterGrapher.prototype.createButtons = function() {
        if(!this.sorted) {
            return;
        }

        for(var topicName in this.sorted) {
            this.createButton(topicName);
        }
    };

    TwitterGrapher.prototype.createButton = function(topicName) {
        var self = this;
        var parent = document.getElementById("actions-container");
        var button = document.createElement("button");
        button.innerHTML = "Show " + topicName;
        button.onclick = function() {
            self.buildGraph(topicName);
        };

        parent.appendChild(button);
    };

    TwitterGrapher.prototype.tweetsToData = function(tweetList) {
        var output = [["Tweet Index", "Likes", "Retweets"]];

        for(var x = 0; x < tweetList.length; x++) {
            var tweet = tweetList[x];
            var date = new Date(tweet.created_at);

            output.push([
                date,
                tweet.favorite_count,
                tweet.retweet_count
            ]);
        }

        return output;
    };

    TwitterGrapher.prototype.buildGraph = function(topicName) {
        var dataArray = this.tweetsToData(this.sorted[topicName]);

        var data = google.visualization.arrayToDataTable(dataArray);

        var options = {
            title: topicName + ' Tweets Popularity',
            legend: { position: 'bottom' }
        };

        var chart = new google.visualization.LineChart(document.getElementById('chart_div'));

        chart.draw(data, options);
    };

    window.TwitterGrapher = new TwitterGrapher();

    function get(url, callback, progressCallback) {
        var xmlhttp = new XMLHttpRequest();

        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
                if (xmlhttp.status == 200) {
                    callback(xmlhttp.responseText, xmlhttp);
                } else if (xmlhttp.status == 400) {
                    console.warn("Request for " + url + " 404'd");
                } else {
                    console.warn("Request for " + url + " errored");
                }
            }
        };

        xmlhttp.onprogress = function(e) {
            if(e.lengthComputable) {
                var percentComplete = (e.loaded / e.total) * 100;

                if(progressCallback) {
                    progressCallback(percentComplete);
                }
            }
        };

        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    }
})();