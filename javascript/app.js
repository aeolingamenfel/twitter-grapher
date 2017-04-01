google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(function() {});

(function() {
    var TwitterGrapher = function() {
        this.topics = {
            "AHCA": /(obamacare)|(repealandreplace)|(healthcare)|(health)|(ahca)/,
            "Fake News": /(fake news)|(#fakenews)|(fakenews)/,
            "Fox News": /(foxnews)|(fox news)|(fox)/
        };

        this.buildTopicsList();
    };

    TwitterGrapher.prototype.buildTopicsList = function() {
        for(var name in this.topics) {
            this.createTopicView(name, this.topics[name]);
        }
    };

    TwitterGrapher.prototype.createTopicView = function(name, regex) {
        var parent = document.getElementById("custom-topics-list");
        var wrapper = document.createElement("div");
        wrapper.className = "topic";

        var nameElm = document.createElement("span");
        var patternElm = document.createElement("code");

        nameElm.className = "name";
        patternElm.className = "pattern";

        nameElm.innerHTML = name;
        patternElm.innerHTML = regex + "";

        wrapper.appendChild(nameElm);
        wrapper.appendChild(patternElm);
        
        parent.appendChild(wrapper);
    };

    TwitterGrapher.prototype.addTopic = function(name, regexString) {
        this.topics[name] = new RegExp(regexString);
    }

    TwitterGrapher.prototype.addTopicFromForm = function() {
        var topicNameInput = document.getElementById("topic-name");
        var topicPatternInput = document.getElementById("topic-pattern");

        var topicName = topicNameInput.value;
        var topicPattern = topicPatternInput.value;

        if(topicName === "" || topicPattern === "") {
            return;
        }

        this.addTopic(topicName, topicPattern);

        topicNameInput.value = "";
        topicPatternInput.value = "";
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

    TwitterGrapher.prototype.showPinVerify = function() {
        var pinWrapper = document.querySelector(".pin-wrapper");
        var pinVerifyWrapper = document.querySelector(".pin-verify-wrapper");

        pinWrapper.style.display = "none";
        pinVerifyWrapper.style.display = "block";
    };

    TwitterGrapher.prototype.verifyPin = function() {
        var self = this;
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
                    self.showPinVerify();
                }

                // if you need to persist the login after page reload,
                // consider storing the token in a cookie or HTML5 local storage
            }
        );
    };

    TwitterGrapher.prototype.getTweets = function(callback, fromCache) {
        if(fromCache && this.tweets && this.tweets.length > 0) {
            callback(this.tweets);
        } else {
            var chunk = new TweetChunk(10, callback);

            chunk.get();
        }
    };

    TwitterGrapher.prototype.sortTweets = function() {
        var self = this, topics = this.topics;

        this.getTweets(function(tweets) {
            var x, tweet, topicName, topicKeywords, k, keyword, sorted = {};

            self.tweets = tweets;
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
        }, true);
    };

    TwitterGrapher.prototype.createButtons = function() {
        if(!this.sorted) {
            return;
        }

        var parent = document.getElementById("actions-container");
        parent.innerHTML = "";

        this.createButton();

        for(var topicName in this.sorted) {
            this.createButton(topicName);
        }
    };

    TwitterGrapher.prototype.createButton = function(topicName) {
        var self = this;
        var parent = document.getElementById("actions-container");
        var button = document.createElement("button");
        button.className = "btn topic-btn";
        button.innerHTML = topicName ? "Show " + topicName : "Show All";

        if(topicName) {
            button.onclick = function() {
                self.buildGraph(topicName);
            };
        } else {
            button.onclick = function() {
                self.buildGraph();
            };
        }
        

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

    TwitterGrapher.prototype.allTweetsToGraphData = function(doCombine) {
        var output = [];

        // build headers
        var headers = ["Date"];
        var totalIndexes = 0;

        for(var index in this.sorted) {
            if(!doCombine) {
                headers.push(index + " Likes");
                headers.push(index + " Retweets");
            } else {
                headers.push(index + " Combined");
            }

            totalIndexes += 1;
        }

        output.push(headers);

        // build data
        var counter = 0;

        for(var index in this.sorted) {
            var tweetList = this.sorted[index];

            for(var x = 0; x < tweetList.length; x++) {
                var tweet = tweetList[x];
                var row = [new Date(tweet.created_at)];

                for(var y = 0; y < counter; y++) {
                    if(doCombine) {
                        row.push(null);
                    } else {
                        row.push(null);
                        row.push(null);
                    }
                }

                if(doCombine) {
                    row.push(tweet.favorite_count + tweet.retweet_count);
                } else {
                    row.push(tweet.favorite_count);
                    row.push(tweet.retweet_count);
                }

                for(var y = counter + 1; y < totalIndexes; y++) {
                    if(doCombine) {
                        row.push(null);
                    } else {
                        row.push(null);
                        row.push(null);
                    }
                }

                output.push(row);
            }

            counter += 1;
        }

        return output;
    };

    TwitterGrapher.prototype.buildGraph = function(topicName) {
        var dataArray = null;

        if(!topicName) {
            dataArray = this.allTweetsToGraphData(true);
        } else {
            dataArray = this.tweetsToData(this.sorted[topicName]);
        }

        var data = google.visualization.arrayToDataTable(dataArray);

        var options = {
            title: topicName ? topicName : 'General' + ' Tweets Popularity',
            legend: {
                position: 'bottom' 
            },
            chartArea: {
                width: '90%',
                height: '75%'
            }
        };

        var chart = new google.visualization.LineChart(document.getElementById('chart_div'));

        chart.draw(data, options);
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

        this.setLoadingBar();
        this.showLoadingBar();

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

        this.setLoadingBar();

        if(this.chunks >= this.limit) {
            this.hideLoadingBar();
            this.callback(this.tweets);
        } else {
            this.get(tweets[tweets.length - 1].id);
        }
    };

    TweetChunk.prototype.setLoadingBar = function() {
        var loadingBar = document.querySelector(".loading-bar");
        var percentage = (this.chunks / this.limit) * 100;

        requestAnimationFrame(function() {
            loadingBar.style.width = percentage + "%";
        });
    };

    TweetChunk.prototype.showLoadingBar = function() {
        var loadingBar = document.querySelector(".loading-bar-wrapper");

        requestAnimationFrame(function() {
            loadingBar.className = "loading-bar-wrapper open";
        });
    };

    TweetChunk.prototype.hideLoadingBar = function() {
        var loadingBar = document.querySelector(".loading-bar-wrapper");

        requestAnimationFrame(function() {
            loadingBar.className = "loading-bar-wrapper";
        });
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