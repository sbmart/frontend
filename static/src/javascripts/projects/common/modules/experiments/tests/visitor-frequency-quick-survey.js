define([
    'bean',
    'fastdom',
    'lodash/functions/debounce',
    'common/utils/config'
], function (
    bean,
    fastdom,
    debounce,
    config
) {
    return function () {
        this.id = 'VisitorFrequencyQuickSurvey';
        this.start = '2016-06-13';
        this.expiry = '2016-06-18';
        this.author = 'Kate Whalen';
        this.description = 'Add a single question survey to the submeta section of article pages';
        this.audience = 1;
        this.audienceOffset = 0;
        this.successMeasure = 'Obtain a data-set on how often users visit the Guardian';
        this.audienceCriteria = 'All users';
        this.dataLinkNames = 'impressions frequency survey';
        this.idealOutcome = '';

        this.canRun = function () {
            // only run on articles, for users that have not seen the survey before
            return config.page.contentType == 'Article' && document.cookie.indexOf('GU_FI') == -1;
        };

        function renderQuickSurvey() {
            // this cannot be wrapped in a fastdom function; the disable function breaks
            var submeta = document.getElementsByClassName('submeta')[0];
            var surveyHeading = document.createElement('div');
            var surveyBody = document.createElement('div');
            var surveyThanks = document.createElement('div');
            mutateSurveyHeading(surveyHeading);
            mutateSurveyBody(surveyBody);
            mutateSurveyThanks(surveyThanks);
            submeta.appendChild(surveyHeading);
            submeta.appendChild(surveyBody);
            surveyBody.appendChild(surveyThanks);
        }

        function mutateSurveyHeading(domElement) {
            domElement.className += 'impressions-survey__heading';
            domElement.style.cssText += 'color:#fff;margin-top:20px;padding: 1em 1em 1em 3em;font-size:0.8em;background-color:#AAD7E4;';
            domElement.innerHTML = '<h2 style="color:#333;font-family:Guardian Text Sans Web,Helvetica Neue,Helvetica,Arial,Lucida Grande,sans-serif;font-weight:bold;margin-left:-1em;">Quick Survey</h2>';
        }

        function mutateSurveyBody(domElement) {
            var heading = '<h3 style="font-weight:bold;margin-left:-1em;">How often do you read the Guardian in a digital format?</h3>';
            var options = '<label><input type="radio" class="fi-survey__button" data-link-name="frequency_5" value="frequency_5">Every day/most days</label><br><label><input type="radio" class="fi-survey__button" data-link-name="frequency_4" value="frequency_4">Weekly</label><br><label><input type="radio" class="fi-survey__button" data-link-name="frequency_3" value="frequency_3">Fortnightly</label><br><label><input type="radio" class="fi-survey__button" data-link-name="frequency_2" value="frequency_2">Monthly or less</label><br><label><input type="radio" class="fi-survey__button" data-link-name="frequency_1" value="frequency_1">This is my first visit</label>';
            domElement.className += 'impressions-survey__body';
            domElement.setAttribute('data-link-name', 'impressions-frequency-survey');
            domElement.style.cssText += 'color:#fff;padding: 1em 1em 1em 3em;font-size:0.8em;background-color:#005689;opacity:1;position:relative';
            domElement.innerHTML = '<div id="surveyTextbox">' + heading + '<div id="impressions-survey__select">' + options + '</div></div>';
        }

        function mutateSurveyThanks(domElement) {
            domElement.className += 'impressions-survey__thanks';
            domElement.style.cssText += 'color:#fff;font-size:2em;font-weight:bold;position:absolute;top:20%;opacity:0';
            domElement.innerHTML = '<h1>Thank you</h1>';
        }

        function disableRadioButtons(buttonClassName) {
            var radioButtons = document.getElementsByClassName(buttonClassName);
            for (var i = 0; i < radioButtons.length; i++) {
                    radioButtons[i].disabled=true;
                }
        }

        function surveyFadeOut() {
            var surveyTextbox = document.getElementById('surveyTextbox');
            fastdom.write(function () {
                surveyTextbox.style.cssText += 'visibility:hidden;opacity:0;transition:visibility 0s ease-in 0.5s,opacity 0.5s linear';
            });
        }

        function thankyouFadeIn() {
            var surveyThanks = document.getElementsByClassName('impressions-survey__thanks');
            fastdom.write(function () {
                surveyThanks[0].style.cssText += 'visibility:visible;opacity:1;transition:visibility 0s ease-in 0.5s,opacity 0.8s linear';
            });
        }

        function handleSurveyResponse(buttonClassName) {
            var surveyQuestion = document.getElementById('impressions-survey__select');
            bean.on(surveyQuestion, 'click', function () {
                fastdom.write(function () {
                    disableRadioButtons(buttonClassName);
                    surveyFadeOut();
                    thankyouFadeIn();
                });
            });
        }

        function checkPrivateBrowsingMode() {
            function addBrowserData(boolValue) {
                var dataLinkName = 'private-browsing-' + boolValue;
                var surveySelect = document.getElementById('impressions-survey__select');
                surveySelect.setAttribute('data-link-name', dataLinkName);
            }

            var browserCheck = new Promise(function (resolve) {
                var db;
                var on = function () {
                    resolve(true);
                };
                var off = function () {
                     resolve(false);
                };
                var tryLocalStorage = function () {
                    try {
                        localStorage.length ? off() : (localStorage.x = 1, localStorage.removeItem('x'), off());
                    } catch (e) {
                        on();
                    }
                };

                // Blink
                window.webkitRequestFileSystem ?
                    webkitRequestFileSystem(window.TEMPORARY, 1, off, on)

                // Firefox
                : 'MozAppearance' in document.documentElement.style ?
                    (db = indexedDB.open('test'), db.onerror = on, db.onsuccess = off)

                // Safari
                : /constructor/i.test(window.HTMLElement) ? tryLocalStorage()

                // IE10+ and edge
                : !window.indexedDB && (window.PointerEvent || window.MSPointerEvent) ? on()

                // Rest
                : off();
            });

            browserCheck.then(function (success) {
                addBrowserData(success);
            });
        }

        function checkVisible(domElement) {
            var rect = domElement.getBoundingClientRect();
            var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
            return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
        }

        function setCookieForSurvey() {
            // give user a cookie to say that they have seen the survey
            // alternatively, only set the cookie on click or interaction (show until answered)?
            window.onscroll = debounce(function () {
                if (checkVisible(document.getElementById('surveyTextbox'))) {
                    document.cookie = 'GU_FI=quick question seen; expires=Fri, 24 Jun 2016 10:30:00 UTC; path=/';
                }
            }, 100);
        }

        this.variants = [
            {
                id: 'variant',
                test: function () {
                    renderQuickSurvey();
                    setCookieForSurvey();
                    handleSurveyResponse('fi-survey__button');
                    checkPrivateBrowsingMode();
                }
            }
        ];
    };
});