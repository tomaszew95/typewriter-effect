(function () {
    "use strict";
    var scriptTag = document.getElementById("type-writer"),
        speedBetweenLetter = scriptTag.getAttribute("speed-between-letter"),
        beforeErasePause = scriptTag.getAttribute("pause-time-before-erase-word"),
        beforeNewWordPause = scriptTag.getAttribute("pause-time-before-new-word"),
        // erase = scriptTag.getAttribute('erase') || "true",
        cursorColor = scriptTag.getAttribute("cursor-color"),
        cursorBlinking = scriptTag.getAttribute("cursor-blinking") || "yes",
        cursorBlinkingSpeed = scriptTag.getAttribute("cursor-blinking-speed");

    require.config({
        paths: {
            CerosSDK: "//sdk.ceros.com/standalone-player-sdk-v5.min",
        },
    });

    require(["CerosSDK"], function (CerosSDK) {
        CerosSDK.findExperience()
            .fail(function (error) {
                console.error(error);
            })
            .done(function (experience) {
                window.myExperience = experience;
                var animation = experience.findComponentsByTag("type-writer");
                var txtTypes = []

                experience.on(CerosSDK.EVENTS.PAGE_CHANGED, pageChangedCallbackText);
                function pageChangedCallbackText(){
                    animation.components.forEach(function (component) {
                        var id = "#" + component.id;
                        $(id).addClass("type-write");
                    });

                    setTimeout(function () {
                        var elements = document.getElementsByClassName("type-write");
                        for (var i = 0; i < elements.length; i++) {
                            var id = elements[i].id;
                            var component = myExperience.findComponentById(id);
                            var tags = component.getTags();
                            if (tags.indexOf("erase") !== -1) {
                                var erase = "true";
                            } else {
                                var erase = "false";
                            }
                            var wordRotate = component.payload;
    
                            var period = beforeErasePause || 2000;
                            if (wordRotate && ($(elements[i]).hasClass('added-effect') == false)) {
                                let newest = new TxtType(elements[i], JSON.parse(wordRotate), period, erase);
                                txtTypes.push(newest)
                                console.log(txtTypes)
                                elements[i].classList.add('added-effect')
                            }
                        }
                    }, 1000);

                    for(let txt of txtTypes){
                        clearTimeout(txt.cancelTimeout)
                        console.log(txt.cancelTimeout)
                        txt.tick()
                    }
    
                    var TxtType = function (el, wordRotate, period, erase) {
                        this.wordRotate = wordRotate;
                        this.el = el;
                        this.id = el.id;
                        this.component = myExperience.findComponentById(this.id);
                        this.loopNum = 0;
                        this.period = parseInt(period, 10) || 2000;
                        this.erase = erase;
                        this.txt = "";
                        this.tick();
                        this.isDeleting = false;
                        this.cursor = true;
                        this.cancelTimeout
                    };
    
                    TxtType.prototype.tick = function () {
                        var i = this.loopNum % this.wordRotate.length;
                        var fullTxt = this.wordRotate[i];
    
                        if (this.isDeleting) {
                            this.txt = fullTxt.substring(0, this.txt.length - 1);
                        } else {
                            this.txt = fullTxt.substring(0, this.txt.length + 1);
                        }
    
                        var color = cursorColor || this.el.style.color;
                        this.el.innerHTML = '<span class="wrap" style="border-right: 0.08em solid ' + color + ' !important">' + this.txt + "</span>";
    
                        var that = this;
                        // how fast between each letter
                        if (isEmpty(speedBetweenLetter) === false) {
                            var delta = speedBetweenLetter - Math.random() * 100;
                        } else {
                            var delta = speedBetweenLetter || 200 - Math.random() * 100;
                        }
    
                        if (this.isDeleting) {
                            delta /= 2;
                        }
                        if (!this.isDeleting && this.txt === fullTxt) {
                            // how long it takes before deleting the word
                            if (this.erase === "true") {
                                delta = this.period;
                                this.isDeleting = true;
                            } else {
                                if (cursorBlinking === "true") {
                                    if (this.cursor) {
                                        this.el.childNodes[0].style.borderRightColor = "transparent";
                                        this.cursor = false;
                                    } else {
                                        this.el.childNodes[0].style.borderRightColor = color;
                                        this.cursor = true;
                                    }
                                    delta = cursorBlinkingSpeed || 400;
                                } else {
                                    this.el.innerHTML = '<span class="wrap" style="border-right: none !important">' + this.txt + "</span>";
                                }
                            }
                        } else if (this.isDeleting && this.txt === "") {
                            this.isDeleting = false;
                            this.loopNum++;
                            // how long it takes before starting to type a new word
                            delta = beforeNewWordPause || 500;
                        }
    
                        this.cancelTimeout = setTimeout(function () {
                            that.tick();
                        }, delta);
                    };
    
                    function isEmpty(str) {
                        return !str || 0 === str.length;
                    }
                }
            });
    });
})();
